import styles from "./chatMessages.module.css"
import { Input } from "../../components/input/input"
import { FaCode } from "react-icons/fa6";
import { IoVideocamOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { VscSearch } from "react-icons/vsc";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { FiPaperclip } from "react-icons/fi";
import { AiOutlineCode } from "react-icons/ai";
import { AiOutlineSend } from "react-icons/ai";
import { useRef, useState, useLayoutEffect} from "react";
import { ProfileImage } from "../../components/profileImage/profileImage"
import { getSocket } from "../../api/socket";
import { EmojiMenu } from "../emojiMenu/emojiMenu";
import type { Message } from "../../pages/Main/Main";

interface ChatMessageProps {
    chatMessages: Record<number, Message[]>;
    currentChat: number;
    loadMessages: (chatIndex: number, last_message?: number) => Promise<any>;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    setCallPainel: React.Dispatch<React.SetStateAction<boolean>>
}

export function ChatMessages({ chatMessages, currentChat, loadMessages, input, setInput, setCallPainel }: ChatMessageProps){

    const chatRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const needChangeScrollRef = useRef(false);
    const prevBottomRef = useRef(0);

    const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
    const [emojiMenu, setEmojiMenu] = useState<boolean>(false);
    const [inputSearchMessages, setInputSearchMessages] = useState<String>("");
    const [searchMessagesActivated, setSearchMessagesActivated] = useState<boolean>(false);

    const emojiDivRef = useRef<HTMLDivElement | null>(null);

    // const [isLoading, setIsLoading] = useState(false);
    // const [messages, setMessages] = useState<Msg[]>([]);
    // IA do chat (Penguino)
    

    function isNearBottom(element: HTMLElement, threshold = 150){
    
        return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    
    }

    useLayoutEffect(() =>{

        const refDiv = chatRef.current;
        if(!refDiv) return;

        if(isNearBottom(refDiv, 150)){
        
        chatEndRef.current?.scrollIntoView({ block: "end", behavior: "auto"});
        
        } else if (needChangeScrollRef.current){

        refDiv.scrollTop = refDiv.scrollHeight - prevBottomRef.current;

        needChangeScrollRef.current = false;
        }

    }, [chatMessages[currentChat]?.length])

    useLayoutEffect(() =>{

        const refDiv = chatRef.current;
        if(!refDiv) return;

        chatEndRef.current?.scrollIntoView({ block: "end", behavior: "auto"});

    }, [currentChat]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) =>{
        const element = e.currentTarget;
        const threshold = 20;

        if(!isLoadingMessages && (element.scrollTop) <= threshold && !needChangeScrollRef.current){
        
          needChangeScrollRef.current = true;

          prevBottomRef.current = element.scrollHeight - element.scrollTop;

          setIsLoadingMessages(true)

          if( chatMessages[currentChat] &&chatMessages[currentChat].length > 0){
              
              console.log(chatMessages[currentChat].at(-1)?.index);

              loadMessages(currentChat, chatMessages[currentChat][0].index);
      
          }

          setIsLoadingMessages(false)
        }
    }

    // async function handleSendIA(e?: React.FormEvent) {
    
    //     e?.preventDefault();

    //     const text = input;
        
    //     if (!text) return;

    //     const time = new Date()

    //     const hour = time.getHours().toString().padStart(2, "0");
    //     const minutes = time.getMinutes().toString().padStart(2, "0");
    //     const finalTime = `${hour}:${minutes}`

    //     setMessages(prev => [...prev, { role: "user", content: text, time: finalTime}]);

    //     setInput("");

    //     setIsLoading(true);

    //     try{
    //     const newMessage:Msg = { role: "user", content: text, time: finalTime}

    //     const history = [...messages, newMessage]
    //     .map(m => ({ role: m.role, content: m.content }));

    //     const { reply } = await askAI(text, history, { temperature: 0.2, max_tokens: 512});

    //     const now = new Date();
    //     const time2 = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;

    //     setMessages(prev => [...prev, { role: "assistant", content: reply, time: time2}])

    //     } catch(err: any){
    //     const msg = err?.message || "Erro ao falar com a IA.";
        
    //     const nowE = new Date();
    //     const timeE = `${nowE.getHours().toString().padStart(2,"0")}:${nowE.getMinutes().toString().padStart(2,"0")}`;
        
    //     setMessages(prev => [...prev, { role: "assistant", content: msg, time: timeE }]);

    //     } finally{

    //     setIsLoading(false);
    //     }
    // }

    async function HandleSend(e? : React.FormEvent){
        
        e?.preventDefault();

        if(currentChat === -1) return;

        const socket = getSocket();
        if(!socket.connected) socket.connect();
        
        const text = (input || "").trim();
        if(!text) return;

        socket.emit("send_message", { chat_id: currentChat, content: text})

    }  

    return (
        <div className={styles.chatInfo}>
          <div className={styles.chatInfoHeader}>
            <div className={styles.chatInfoHeaderProfile}>
              <ProfileImage src="profileImages/Penguino.png" alt="Imagem de perfil da IA, Penguino" 
              width="clamp(2rem, 2.5dvw, 3.5rem)"></ProfileImage>
              <div className={styles.chatInfoHeaderProfileInfo}>
                <h1>Penguino</h1>
                <p>Penguino, você</p>
              </div>
            </div>
            <div className={`${styles.chatInfoHeaderIcon} ${searchMessagesActivated? styles.searchIconActivated : ""}`} >
              <FaCode className="w-[clamp(1rem,1.35dvw,2rem)] h-auto"></FaCode>
              <IoVideocamOutline className="w-[clamp(1rem,1.7dvw,2rem)] h-auto"></IoVideocamOutline>
              <FiPhone className="w-[clamp(1rem,1.1dvw,2rem)] h-auto" onClick={() => setCallPainel(true)}></FiPhone>
              <VscSearch className="w-[clamp(1rem,0.95dvw,2rem)] h-auto"
               onClick={() => setSearchMessagesActivated(!searchMessagesActivated)}></VscSearch>

              {searchMessagesActivated? <Input text="Digite a mensagem para buscar" 
              customSize="!w-[70%] !h-[clamp(1rem,1.75dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"></Input> : ""}
            </div>
          </div>
          <div className={styles.chatInfoMessages} ref={chatRef} onScroll={handleScroll}>
            <div className={styles.chatInfoMessagesSpacer}> </div>

              {chatMessages[currentChat]?.map((m,i) => {
                if(m.main === true){
                  return (
                    <div key={i} className={styles.chatInfoMessagesMessageUser} 
                      style={{alignSelf:"flex-end"}}>
                      <div className={styles.chatInfoMessagesMessageContent}>
                        <p className={styles.messageText}> {m.content} <span className={styles.messageTime}>{m.sent_at} </span> </p>
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
                          </div>
                          <p className={styles.messageText}> {m.content} <span className={styles.messageTime}>{m.sent_at} </span> </p>
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
            
            <div style={{position: "relative"}} ref={emojiDivRef}>
              <HiOutlineEmojiHappy className="w-[clamp(1rem,1.4dvw,2rem)] h-auto" 
              onClick={() => setEmojiMenu(!emojiMenu)}></HiOutlineEmojiHappy>

              {emojiMenu? <EmojiMenu emojiDivRef={emojiDivRef} setInput={setInput}/> : ""}
            </div>

            <FiPaperclip className="w-[clamp(1rem,1.4dvw,2rem)] h-auto"></FiPaperclip>
            <AiOutlineCode className="w-[clamp(1rem,1.4dvw,2rem)] h-auto"></AiOutlineCode>
            <div className={styles.inputWrapperSendMessage}>
              {/* <form onSubmit={handleSend}>
                <Input text={isLoading? "Esperando resposta da IA" : "Message"} disabled= {isLoading} customSize="!w-[100%] !h-[clamp(1rem,2dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
                onChange={(e) => setInput(e.target.value)} value={input}></Input>
                <button type="submit">
                  <AiOutlineSend className={styles.inputWrapperSendMessageIcon}></AiOutlineSend>
                </button>
              </form> */}

              <form onSubmit={HandleSend}>
                <Input text={"Message"} customSize="!w-[100%] !h-[clamp(1rem,2dvw,2rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
                onChange={(e) => setInput(e.target.value)} value={input}></Input>
                <button type="submit">
                  <AiOutlineSend className={styles.inputWrapperSendMessageIcon}></AiOutlineSend>
                </button>
              </form>
            </div>
          </div>
        </div>
    )
}