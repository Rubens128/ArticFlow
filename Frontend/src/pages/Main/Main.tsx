import styles from "./Main.module.css"
import { Logo } from "../../components/logo/logo"
import { SideBar } from "../../components/sideBar/sideBar"
import { useEffect, useState, useCallback, useRef } from "react";
import { askAI } from "../../api/ai";
import { CallPanel } from "../../components/callPanel/callPanel";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../api/socket";
import { Chats } from "../../components/chats/chats"
import { ChatMessages } from "../../components/chatMessages/chatMessages";
import { Friends } from "../../components/friends/friends";

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

export type friendType = {
  friends_chat_id: number | null;
  friend_id: number;
  nick: string;
  status: "accepted" | "refused" | "waiting" | "pending";
  description: string;
  profile_image: string;
}

export default function Main() {

  const [input, setInput] = useState("");
  const [callPainel, setCallPainel] = useState<boolean>(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<number>(-1);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>([]);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [currentIcon, setCurrentIcon] = useState<number>(1);
  const [friends, setFriends] = useState<friendType[]>([]);
  const [pendingFriends, setPendingFriends] = useState<friendType[]>([]);
  const [waitingFriends, setWaitingFriends] = useState<friendType[]>([]);

  const navigate = useNavigate();

  function updateFriends(friend_id: number, status: string, friends_chat_id: number | null) {

    if(status !== "accepted"){
      setFriends((prev) => {

        const index = prev.findIndex(friend => friend.friend_id === friend_id)

        if (index === -1) return prev;

        const newList = [...prev]
        newList.splice(index, 1)[0];

        return newList
      })
    }
    
    setPendingFriends((prev) => {

      const index = prev.findIndex(friend => friend.friend_id === friend_id)

      if (index === -1) return prev;

      const newList = [...prev]
      const friend:friendType = newList.splice(index, 1)[0];

      if (status === "accepted"){
      
        setFriends((prev) => {

          const index = prev.findIndex(friend => friend.friend_id === friend_id)

          if(index !== -1) return prev;

          if(friends_chat_id){

            friend.friends_chat_id = friends_chat_id;

            const chat:Chat = {
              chat_id: friends_chat_id,
              chat_image: friend.profile_image,
              chat_name: friend.nick,
              chat_content: "",
              chat_sentAt: "",
              new_messages: 0
            };

            setChats((prev) => {

              if(prev.findIndex(chat => chat.chat_id === friends_chat_id) === -1) return [chat, ...prev];
              else return prev;

            });
          }
          
          return [friend, ...prev]
        })
      }

      return newList
    })

    setWaitingFriends((prev) => {

      const index = prev.findIndex(friend => friend.friend_id === friend_id)

      if (index === -1) return prev;

      const newList = [...prev]
      const friend:friendType = newList.splice(index, 1)[0];

      if (status === "accepted"){
   
        setFriends((prev) => {

          const index = prev.findIndex(friend => friend.friend_id === friend_id)

          if(index !== -1) return prev;

          if(friends_chat_id){

            friend.friends_chat_id = friends_chat_id;

            const chat:Chat = {
              chat_id: friends_chat_id,
              chat_image: friend.profile_image,
              chat_name: friend.nick,
              chat_content: "",
              chat_sentAt: "",
              new_messages: 0
            };

            setChats((prev) => {

              if(prev.findIndex(chat => chat.chat_id === friends_chat_id) === -1) return [chat, ...prev];
              else return prev;

            });
          }

          return [friend, ...prev]
        })
      }

      return newList
    })
  }

  useEffect(() => {

    const socket = getSocket();

    const onJoined = (data: { chat_ids: number[] }) => {
      console.log("entrei nas rooms:", data.chat_ids);
    };

    const messageConfirmed = (payload: {
      chat_id: number | string;
      last_message: {
        message_id: number;
        nick: string;
        content: string;
        timestamp: string;
      }
    }) => {

      console.log("enviou a mensagem");

      const message: Message = {
        index: payload.last_message.message_id,
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

        if (i === -1) return prev;

        const next = [...prev];
        next[i] = { ...next[i], chat_content: payload.last_message.content, chat_sentAt: payload.last_message.timestamp };

        return next;
      })

      setInput("")
    }

    const newMessage = (payload: {
      chat_id: number;
      last_message: {
        message_id: number;
        nick: string;
        content: string;
        timestamp: string;
      }
    }) => {

      console.log("chegou a mensagem");

      const message: Message = {
        index: payload.last_message.message_id,
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

        if (i === -1) return prev;

        const next = [...prev];
        next[i] = {
          ...next[i],
          chat_content: payload.last_message.content,
          chat_sentAt: payload.last_message.timestamp,
          new_messages: next[i].new_messages + 1
        };

        return next;
      });
    }

    const requestSent = (senderInfo: friendType) => {

      setWaitingFriends((prev) => [senderInfo, ...prev]);
    }

    const requestReceived = (receivedInfo: friendType) => {

      setPendingFriends((prev) => [receivedInfo, ...prev]);
    }

    const friendError = (payload: any) => {

      console.log(payload)

    }

    const updateFriendsError = (payload: any) => {

      console.log(payload)

    }

    const updateFriendSent = (payload: {
      friend_id: number,
      status: string,
      chatFriends_id: number | null
    }) => {

      socket.emit("join_room", { chat_id: payload.chatFriends_id })

      updateFriends(payload.friend_id, payload.status, payload.chatFriends_id);

    }

    const updateFriendReceived = (payload: {
      friend_id: number,
      status: string,
      chatFriends_id: number | null
    }) => {

      socket.emit("join_room", { chat_id: payload.chatFriends_id })

      updateFriends(payload.friend_id, payload.status, payload.chatFriends_id);

    }

    socket.on("chats_joined", onJoined);
    socket.on("message_confirmed", messageConfirmed);
    socket.on("new_message", newMessage);
    socket.on("request_sent", requestSent);
    socket.on("request_received", requestReceived);
    socket.on("friend_error", friendError);
    socket.on("update_status_friends_success_sent", updateFriendSent);
    socket.on("update_status_friends_success_received", updateFriendReceived);
    socket.on("update_friends_error", updateFriendsError);

    socket.connect();

    return () => {
      socket.off("chats_joined", onJoined);
      socket.off("message_confirmed", messageConfirmed);
      socket.off("new_message", newMessage);
      socket.off("request_sent", requestSent);
      socket.off("request_received", requestReceived);
      socket.off("friend_error", friendError);
      socket.off("update_status_friends_success_sent", updateFriendSent);
      socket.off("update_status_friends_success_received", updateFriendReceived);
      socket.off("update_friends_error", updateFriendsError);
      socket.disconnect();
    }

  }, [])

  const loadMessages = useCallback(async (chatIndex: number, last_message: number = -1) => {

    try {
      const res = await fetch(`/api/messagesGet?chat_id=${chatIndex}&message_id=${last_message}`, {

        credentials: "include",
      })

      if (res.status == 401) {

        navigate("/", { replace: true });
        return;

      }

      if (res.status == 400) {

        const error = await res.json();

        alert("Erro ao carregar messages, espere uns minutos e tente novamente");

        console.log(error);

        return;
      }

      const data = await res.json();

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
    if (!socket.connected) socket.connect();

    const i = chats.findIndex(c => c.chat_id === currentChat);
    if (i === -1) return;

    if ((chats[i]?.new_messages) > 0) {

      socket.emit("read_messages", { chat_id: currentChat });

      setChats(prev => {

        const i = prev.findIndex(c => c.chat_id === currentChat);

        if (i === -1) return prev;

        const next = [...prev];
        next[i] = {
          ...next[i],
          new_messages: 0
        };

        return next;
      });
    }
  }, [currentChat])

  return (
    <main className={styles.body}>

      <CallPanel active={callPainel} imageSrc="profileImages/Penguino.png"
        imageAlt="Imagem de perfil da IA, Penguino" onClickClose={() => setCallPainel(false)}></CallPanel>

      <div className={styles.header}>
        <Logo classNameImage={"w-[clamp(1rem,3dvw,4rem)]"} classNameDiv={"text-[clamp(1rem,1.5dvw,3rem)] font-bold gap-[10px]"}></Logo>
      </div>

      <div className={styles.content}>
        <SideBar currentIcon={currentIcon} setCurrentIcon={setCurrentIcon} setCurrentChat={setCurrentChat}></SideBar>

        <Chats chats={chats} setChats={setChats} setAuthChecked={setAuthChecked} currentChat={currentChat}
          setCurrentChat={setCurrentChat} loadMessages={loadMessages} setCurrentIcon={setCurrentIcon}
          friends={friends}></Chats>

          <div style={{display: currentIcon === 1? "block" : "none"}}>
            <ChatMessages chatMessages={chatMessages} currentChat={currentChat} loadMessages={loadMessages}
                input={input} setInput={setInput} setCallPainel={setCallPainel}></ChatMessages>
          </div>

          <div style={{display: currentIcon === 2? "block" : "none"}}>
            <Friends friends={friends} setFriends={setFriends} 
              waitingFriends={waitingFriends} setWaitingFriends={setWaitingFriends} 
              pendingFriends={pendingFriends} setPendingFriends={setPendingFriends}
              setCurrentChat={setCurrentChat} setCurrentIcon={setCurrentIcon}></Friends>
          </div>

      </div>
    </main>

  );

}