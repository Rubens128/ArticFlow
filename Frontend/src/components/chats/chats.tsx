import styles from "./Chats.module.css"
import { Input } from "../../components/input/input"
import { IoSearchOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import { ProfileImage } from "../../components/profileImage/profileImage"
import { useNavigate } from "react-router-dom";
import type { Chat, friendType } from "../../pages/Main/Main";
import { useLocation } from "react-router-dom";

interface ChatProps {
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    setAuthChecked: React.Dispatch<React.SetStateAction<boolean>>;
    currentChat: number;
    setCurrentChat: React.Dispatch<React.SetStateAction<number>>;
    loadMessages: (chatIndex: number, last_message?: number) => Promise<any>;
    setCurrentIcon: React.Dispatch<React.SetStateAction<number>>;
    friends: friendType[];
}

export function Chats({ chats, setChats, setAuthChecked, currentChat, setCurrentChat, 
  loadMessages, setCurrentIcon }: ChatProps){

    const navigate = useNavigate();
    const location = useLocation();

    const [inputSearchChats, setInputSearchChats] = useState<string>("");

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
    
              const error = await res.json();
    
              alert("Erro ao carregar chats, espere uns minutos e tente novamente");
              
              console.log(error);
    
              return;
            }
    
            const data:Chat[] = await res.json();
    
            setChats(data);
    
            await data.map((chat:Chat) => loadMessages(chat.chat_id))
    
            setAuthChecked(true);
    
          } catch{
          
            navigate("/", {replace: true});
          }
    
        })();
      }, [] );

    return (
        <div className={styles.backGroundColorChatsDiv}>
          <div className={styles.chatsDiv}>
            <h1>Chats</h1>
            <div className={styles.inputWrapper}>
              <Input text="Search Chats" 
              customSize="!w-[100%] !h-[clamp(1rem,2.5dvw,3rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
              onChange={(e) => setInputSearchChats(e.target.value)} value={inputSearchChats}></Input>
              <IoSearchOutline className={styles.inputWrapperIcon}></IoSearchOutline>
            </div>
            <div className={currentChat == -1 ? styles.chatsDivChatSelected : styles.chatsDivChat}
            onClick={() => {setCurrentIcon(1); setCurrentChat(-1)}}>
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

            {chats?.map( (chat) => {

              if(!chat.chat_name.toLocaleLowerCase().startsWith(inputSearchChats.toLocaleLowerCase())) return;
              
              return (
              <div key={chat.chat_id} className={currentChat == chat.chat_id ? styles.chatsDivChatSelected : styles.chatsDivChat} 
                onClick={() =>{setCurrentIcon(1); setCurrentChat(chat.chat_id)}}>
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
                    <p className={styles.chatsDivChatInfoValuesContent}>{chat.chat_content ? chat.chat_content : ""}</p>
                    <p className={chat.new_messages >= 1 ? styles.chatsDivChatInfoValuesNewMessages : ""}>
                      { chat.new_messages >= 1 && chat.new_messages <= 99 ? chat.new_messages : ""}
                      { chat.new_messages >= 99 ? "99+" : ""}
                    </p>
                  </div>
                </div>
              </div>
              )
            })}

          </div>
        </div>
    )
}