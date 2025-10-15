import styles from "./Chats.module.css"
import { Logo } from "../../components/logo/logo"
import { SideBar } from "../../components/sideBar/sideBar"
import { Input } from "../../components/input/input"
import { IoSearchOutline } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";
import { FaCode } from "react-icons/fa6";
import { IoVideocamOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { VscSearch } from "react-icons/vsc";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { FiPaperclip } from "react-icons/fi";
import { AiOutlineCode } from "react-icons/ai";
import { AiOutlineSend } from "react-icons/ai";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { askAI } from "../../api/ai";
import { ProfileImage } from "../../components/profileImage/profileImage"
import { CallPanel } from "../../components/callPanel/callPanel";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../api/socket";

type Msg = {
  role: "user" | "assistant";
  content: string;
  time: string
}

type Message = {
  index: number;
  nick: string;
  content: string;
  sent_at: string;
  main: boolean;
}

type Chat = {
  chat_id: number;
  chat_name: string;
  chat_image: string | null;
  chat_sentAt: string | null;
  chat_content: string | null;
  new_messages: number;
}

export default function Chats() {
  
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callPainel, setCallPainel] = useState<boolean>(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<number>(-1);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>([]);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const navigate = useNavigate();
  const chatRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    (async () => {
      
      try{
        const res = await fetch("/api/chatsGet", {
          credentials: "include",
        })

        if (res.status == 401){

          navigate("/", { replace: true });
          return;
        }

        if (res.status == 400){

          alert("Erro ao carregar chats, espere uns minutos e tente novamente");
          return;
        }

        const data = await res.json();

        setChats(data);

        setAuthChecked(true);

      } catch{
      
        navigate("/", {replace: true});
      }

    })();
  }, [navigate] );

  useEffect (() => { 
    (async () => {

      if ((currentChat === -1) || (chatMessages[currentChat]?.length >= 50)){
        return;
      }
 
      try{
        const res = await fetch(`/api/messagesGet?chat_id=${currentChat}`, {

            credentials: "include",
        })

        if(res.status == 401){

          navigate("/", { replace: true });
          return;

        }

        if (res.status == 400){

          alert("Erro ao carregar messages, espere uns minutos e tente novamente" );
          return;
        }

        const data = await res.json();

        setChatMessages((prev) => ({
          ...prev,
          [currentChat]: data
        }));

      } catch (error) {

        setCurrentChat(-1);
        alert("Erro ao carregar mensagens do chat" + error);
      }

    })();
  }, [currentChat] );


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

  async function handleSendIA(e?: React.FormEvent) {
    
    e?.preventDefault();

    const text = input;
    
    if (!text) return;

    const time = new Date()

    const hour = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const finalTime = `${hour}:${minutes}`

    setMessages(prev => [...prev, { role: "user", content: text, time: finalTime}]);

    setInput("");

    setIsLoading(true);

    try{
      const newMessage:Msg = { role: "user", content: text, time: finalTime}

      const history = [...messages, newMessage]
      .map(m => ({ role: m.role, content: m.content }));

      const { reply } = await askAI(text, history, { temperature: 0.2, max_tokens: 512});

      const now = new Date();
      const time2 = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;

      setMessages(prev => [...prev, { role: "assistant", content: reply, time: time2}])

    } catch(err: any){
      const msg = err?.message || "Erro ao falar com a IA.";
      
      const nowE = new Date();
      const timeE = `${nowE.getHours().toString().padStart(2,"0")}:${nowE.getMinutes().toString().padStart(2,"0")}`;
      
      setMessages(prev => [...prev, { role: "assistant", content: msg, time: timeE }]);

    } finally{

      setIsLoading(false);
    }
  }

  async function HandleSend(e? : React.FormEvent){
    
    e?.preventDefault();

    if(currentChat === -1) return;

    const socket = getSocket();
    if(!socket.connected) socket.connect();
    
    const text = (input || "").trim();
    if(!text) return;

    socket.emit("send_message", { chat_id: currentChat, content: text})

  }

  function isNearBottom(element: HTMLElement, threshold = 150){
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }
  
  useLayoutEffect(() =>{
    const refDiv = chatRef.current;
    if(!refDiv) return;

    if(isNearBottom(refDiv, 150)){
      
      chatEndRef.current?.scrollIntoView({ block: "end", behavior: "auto"});
    }

  }, [chatMessages[currentChat]?.length])

  useLayoutEffect(() =>{

    const refDiv = chatRef.current;
    if(!refDiv) return;

    chatEndRef.current?.scrollIntoView({ block: "end", behavior: "auto"});

  }, [currentChat, chatMessages[currentChat]?.length]);
  
  return(
    <main className={styles.body}>
      
      <CallPanel active={callPainel} imageSrc="profileImages/Penguino.png" 
      imageAlt="Imagem de perfil da IA, Penguino" onClickClose={() => setCallPainel(false)}></CallPanel>

      <div className={styles.header}>
        <Logo classNameImage={"w-[clamp(1rem,3dvw,4rem)]"} classNameDiv={"text-[clamp(1rem,1.5dvw,3rem)] font-bold gap-[10px]"}></Logo>
      </div>

      <div className={styles.content}>
        <SideBar currentIcon={1}></SideBar>
        <div className={styles.backGroundColorChatsDiv}>
          <div className={styles.chatsDiv}>
            <h1>Chats</h1>
            <div className={styles.inputWrapper}>
              <Input text="Search Chats" customSize="!w-[100%] !h-[clamp(1rem,2.5dvw,3rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"></Input>
              <IoSearchOutline className={styles.inputWrapperIcon}></IoSearchOutline>
            </div>
            <div className={currentChat == -1 ? styles.chatsDivChatSelected : styles.chatsDivChat}
            onClick={() => setCurrentChat(-1)}>
              <ProfileImage src="profileImages/Penguino.png" alt="Imagem de perfil da IA, Penguino" 
              width="clamp(2rem, 3dvw, 3.5rem)"></ProfileImage>
              <div className={styles.chatsDivChatInfo}>
                <div className={styles.chatsDivChatInfoValues}>
                  <h1>Penguino</h1>
                  <p>08/09/2025</p>
                </div>
                <p>Olá Penguino</p>
              </div>
            </div>

            {chats?.map( (chat,i) => {
              
              return (
              <div key={chat.chat_id} className={currentChat == chat.chat_id ? styles.chatsDivChatSelected : styles.chatsDivChat} 
                onClick={() => setCurrentChat(chat.chat_id)}>
                <ProfileImage src={chat.chat_image ? chat.chat_image : "profileImages/Penguino.png"} alt="Imagem de perfil da IA, Penguino" 
                width="clamp(2rem, 3dvw, 3.5rem)"></ProfileImage>
                <div className={styles.chatsDivChatInfo}>
                  <div className={styles.chatsDivChatInfoValues}>
                    <h1>{chat.chat_name}</h1>
                    <p className={chat.new_messages >= 1 ? styles.chatsDivChatInfoValuesNewMessagesTime : ""}>
                      {chat.chat_sentAt ? chat.chat_sentAt : ""}
                    </p>
                  </div>
                  <div className={styles.chatsDivChatInfoValues}>
                    <p>{chat.chat_content ? chat.chat_content : ""}</p>
                    <p className={chat.new_messages >= 1 ? styles.chatsDivChatInfoValuesNewMessages : ""}>
                      { chat.new_messages >= 1 ? chat.new_messages : ""}
                    </p>
                  </div>
                </div>
              </div>
              )
            })}

          </div>
        </div>
        <div className={styles.chatInfo}>
          <div className={styles.chatInfoHeader}>
            <div className={styles.chatInfoHeaderProfile}>
              <ProfileImage src="profileImages/Penguino.png" alt="Imagem de perfil da IA, Penguino" 
              width="clamp(2rem, 3dvw, 3.5rem)"></ProfileImage>
              <div className={styles.chatInfoHeaderProfileInfo}>
                <h1>Penguino</h1>
                <p>Penguino, você</p>
              </div>
            </div>
            <div className={styles.chatInfoHeaderIcon}>
              <FaCode className="w-[clamp(1rem,2dvw,2rem)] h-auto"></FaCode>
              <IoVideocamOutline className="w-[clamp(1rem,2.25dvw,2rem)] h-auto"></IoVideocamOutline>
              <FiPhone className="w-[clamp(1rem,1.75dvw,2rem)] h-auto" onClick={() => setCallPainel(true)}></FiPhone>
              <VscSearch className="w-[clamp(1rem,1.6dvw,2rem)] h-auto"></VscSearch>
            </div>
          </div>
          <div className={styles.chatInfoMessages} ref={chatRef}>
            <div className={styles.chatInfoMessagesSpacer}> </div>

              {chatMessages[currentChat]?.map((m,i) => {
                if(m.main === true){
                  return (
                    <div key={i} className={styles.chatInfoMessagesMessageUser} 
                      style={{alignSelf:"flex-end"}}>
                      <div className={styles.chatInfoMessagesMessageContent}>
                        <p className={styles.messageText}> {m.content} </p>
                        <p className={styles.messageTime}> {m.sent_at} </p>
                      </div>
                    </div>
                  );
                } else{
                  return(
                    <div className={styles.chatInfoMessageImageText}>
                      <ProfileImage src="profileImages/Penguino.png" alt="Imagem de perfil da IA, Penguino" 
                        width="clamp(1rem, 2dvw, 2rem)"></ProfileImage>
                      <div key={i} className={styles.chatInfoMessagesMessageOther} 
                        style={{alignSelf:"flex-start"}}>
                        <div className={styles.chatInfoMessagesMessageContent}>
                          <div className={styles.chatInfoMessagesMessageContentWithName}>
                            <p className={styles.messageName}> {m.nick} </p>
                            <p className={styles.messageText}> {m.content} </p>
                          </div>
                          <p className={styles.messageTime}> {m.sent_at} </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
              }

            <div ref={chatEndRef} />

          </div>
          <div className={styles.chatInfoSendMessage}>
            <HiOutlineEmojiHappy className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></HiOutlineEmojiHappy>
            <FiPaperclip className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></FiPaperclip>
            <AiOutlineCode className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></AiOutlineCode>
            <div className={styles.inputWrapperSendMessage}>
              {/* <form onSubmit={handleSend}>
                <Input text={isLoading? "Esperando resposta da IA" : "Message"} disabled= {isLoading} customSize="!w-[100%] !h-[clamp(1rem,2dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
                onChange={(e) => setInput(e.target.value)} value={input}></Input>
                <button type="submit">
                  <AiOutlineSend className={styles.inputWrapperSendMessageIcon}></AiOutlineSend>
                </button>
              </form> */}

              <form onSubmit={HandleSend}>
                <Input text={"Message"} disabled= {isLoading} customSize="!w-[100%] !h-[clamp(1rem,2dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
                onChange={(e) => setInput(e.target.value)} value={input}></Input>
                <button type="submit">
                  <AiOutlineSend className={styles.inputWrapperSendMessageIcon}></AiOutlineSend>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>

  );

}