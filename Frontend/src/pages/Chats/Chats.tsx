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
import { useEffect, useRef, useState } from "react";
import { askAI } from "../../api/ai";
import { ProfileImage } from "../../components/profileImage/profileImage"
import { CallPanel } from "../../components/callPanel/callPanel";

type Msg = {
  role: "user" | "assistant";
  content: string;
  time: string
}

export default function Chats() {
  
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [callPainel, setCallPainel] = useState<boolean>(true)
  const chatRef = useRef<HTMLDivElement>(null);

  function scrollToBottom(){

    if(chatRef.current){
      
     chatRef.current.scrollTop = chatRef.current.scrollHeight;
    
    }
   
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages])

  async function handleSend(e?: React.FormEvent) {
    
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
      scrollToBottom();
    }
  }

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
            <div className={styles.chatsDivChat}>
              <ProfileImage src="profileImages/Penguino.png" alt="Imagem de perfil da IA, Penguino" 
              width="clamp(2rem, 3dvw, 3.5rem)"></ProfileImage>
              <div className={styles.chatsDivChatInfo}>
                <div className={styles.chatsDivChatInfoNameDate}>
                  <h1>Penguino</h1>
                  <p>08/09/2025</p>
                </div>
                <p>Olá Penguino</p>
              </div>
            </div>
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
            <div className={styles.chatInfoMessagesSpacer}>
            </div>
            {messages.map((m,i) => {
                if(m.role === "user"){
                  return (
                    <div key={i} className={styles.chatInfoMessagesMessageUser} 
                      style={{alignSelf:"flex-end"}}>
                      <div className={styles.chatInfoMessagesMessageContent}>
                        <p className={styles.messageText}> {m.content} </p>
                        <p className={styles.messageTime}> {m.time} </p>
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
                            <p className={styles.messageName}>Penguino</p>
                            <p className={styles.messageText}> {m.content} </p>
                          </div>
                          <p className={styles.messageTime}> {m.time} </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
          </div>
          <div className={styles.chatInfoSendMessage}>
            <HiOutlineEmojiHappy className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></HiOutlineEmojiHappy>
            <FiPaperclip className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></FiPaperclip>
            <AiOutlineCode className="w-[clamp(1rem,1.5dvw,2rem)] h-auto"></AiOutlineCode>
            <div className={styles.inputWrapperSendMessage}>
              <form onSubmit={handleSend}>
                <Input text={isLoading? "Esperando resposta da IA" : "Message"} disabled= {isLoading} customSize="!w-[100%] !h-[clamp(1rem,2dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
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