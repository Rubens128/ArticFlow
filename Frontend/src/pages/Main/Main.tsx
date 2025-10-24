import styles from "./Main.module.css"
import { Logo } from "../../components/logo/logo"
import { SideBar } from "../../components/sideBar/sideBar"
import { useEffect, useState, useCallback } from "react";
import { askAI } from "../../api/ai";
import { CallPanel } from "../../components/callPanel/callPanel";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../api/socket";
import { Chats } from "../../components/chats/chats"
import { ChatMessages } from "../../components/chatMessages/chatMessages";

type Msg = {
  role: "user" | "assistant";
  content: string;
  time: string
}

export type Message = {
  index: number;
  nick: string;
  content: string;
  sent_at: string;
  main: boolean;
}

export type Chat = {
  chat_id: number;
  chat_name: string;
  chat_image: string | null;
  chat_sentAt: string | null;
  chat_content: string | null;
  new_messages: number;
}

export default function Main() {
  
  const [input, setInput] = useState("");
  const [callPainel, setCallPainel] = useState<boolean>(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<number>(-1);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>([]);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() =>{
        
    const socket = getSocket();

    const onJoined = ( data: { chat_ids: number[] }) => {
      console.log("entrei nas rooms:", data.chat_ids);
    };

    const messageConfirmed = ( payload: {
      chat_id: number | string;
      last_message: {
        message_id: number;
        nick: string;
        content: string;
        timestamp: string;
      }
    }) => {

      const message: Message = {
          index : payload.last_message.message_id,
          nick: payload.last_message.nick,
          content: payload.last_message.content,
          sent_at: payload.last_message.timestamp,
          main: true
      }

      const chat_id = Number(payload.chat_id)

      setChatMessages((prev) => ({
          ...prev,
          [chat_id]: [
            ...(prev[chat_id] || []),
            message
          ]
        }));

      setChats(prev => {

        const i = prev.findIndex(c => c.chat_id === chat_id)

        if(i === -1) return prev;

        const next = [...prev];
        next[i] = { ...next[i], chat_content: payload.last_message.content, chat_sentAt: payload.last_message.timestamp };

        return next;
      })

      setInput("")
    }

    const newMessage = ( payload: {
      chat_id: number;
      last_message: {
        message_id: number;
        nick: string;
        content: string;
        timestamp: string;
      }
    }) => {

      const message: Message = {
          index : payload.last_message.message_id,
          nick: payload.last_message.nick,
          content: payload.last_message.content,
          sent_at: payload.last_message.timestamp,
          main: false
      }

      const chat_id = payload.chat_id

      setChatMessages((prev) => ({
          ...prev,
          [chat_id]: [
            ...(prev[chat_id] || []),
            message
          ]
        }));

      setChats(prev => {
        
        const i = prev.findIndex(c => c.chat_id === chat_id);
        
        if(i === -1) return prev;
        
        const next = [...prev];
        next[i] = { ...next[i], 
          chat_content: payload.last_message.content, 
          chat_sentAt: payload.last_message.timestamp,
          new_messages: next[i].new_messages + 1
        };

        return next;
      });
    }

    socket.on("chats_joined", onJoined);
    socket.on("message_confirmed", messageConfirmed);
    socket.on("new_message", newMessage);

    socket.connect();

    return () => {
      socket.off("chats_joined", onJoined);
      socket.off("message_confirmed", messageConfirmed);
      socket.off("new_message", newMessage);
      socket.disconnect();
    }

  }, [])

  const loadMessages = useCallback(async (chatIndex: number, last_message: number = -1) =>{

      try{
        const res = await fetch(`/api/messagesGet?chat_id=${chatIndex}&message_id=${last_message}`, {

            credentials: "include",
        })

        if(res.status == 401){

          navigate("/", { replace: true });
          return;

        }

        if (res.status == 400){

          const error = await res.json();
          
          alert("Erro ao carregar messages, espere uns minutos e tente novamente" );
          
          console.log(error);
          
          return;
        }

        const data = await res.json();

        console.log(data);

        setChatMessages((prev) => ({
          ...prev,
          [chatIndex]: [
            ...data,
            ...(prev[chatIndex] || [])
          ],
        }));

      } catch (error) {

        setCurrentChat(-1);
        alert("Erro ao carregar mensagens do chat" + error);
      }

    }, [navigate]);

  useEffect(() => {

    const socket = getSocket();
    if(!socket.connected) socket.connect();

    const i = chats.findIndex(c => c.chat_id === currentChat);
    if(i === -1) return;

    if((chats[i]?.new_messages) > 0){
       
      socket.emit("read_messages", { chat_id: currentChat});

      setChats(prev => {
        
        const i = prev.findIndex(c => c.chat_id === currentChat);
          
        if(i === -1) return prev;
          
        const next = [...prev];
        next[i] = { ...next[i], 
          new_messages: 0
        };

         return next;
      });
    }
  }, [currentChat])
  
  return(
    <main className={styles.body}>
      
      <CallPanel active={callPainel} imageSrc="profileImages/Penguino.png" 
      imageAlt="Imagem de perfil da IA, Penguino" onClickClose={() => setCallPainel(false)}></CallPanel>

      <div className={styles.header}>
        <Logo classNameImage={"w-[clamp(1rem,3dvw,4rem)]"} classNameDiv={"text-[clamp(1rem,1.5dvw,3rem)] font-bold gap-[10px]"}></Logo>
      </div>

      <div className={styles.content}>
        <SideBar currentIcon={1}></SideBar>

        <Chats chats={chats} setChats={setChats} setAuthChecked={setAuthChecked} currentChat={currentChat} 
        setCurrentChat={setCurrentChat} loadMessages={loadMessages}></Chats>

        <ChatMessages chatMessages={chatMessages} currentChat={currentChat} loadMessages={loadMessages}
        input={input} setInput={setInput} setCallPainel={setCallPainel}></ChatMessages>


      </div>
    </main>

  );

}