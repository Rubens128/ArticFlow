import styles from "./Chats.module.css"
import { Logo } from "../../components/logo/logo"
import { SideBar } from "../../components/sideBar/sideBar"
import { Input } from "../../components/input/input"
import { IoSearchOutline } from "react-icons/io5";
import { FaCircleUser } from "react-icons/fa6";

export default function Login() {

  return(
    <main className={styles.body}>
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
              <FaCircleUser className="w-[clamp(2rem,3dvw,3rem)] h-auto"></FaCircleUser>
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
          </div>
          <div className={styles.chatInfoMessages}>
  
          </div>
          <div className={styles.chatInfoSendMessage}>

          </div>
        </div>
      </div>
    </main>

  );

}