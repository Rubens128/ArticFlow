import styles from "./Chats.module.css"
import { Logo } from "../../components/logo/logo"
import { LuMenu } from "react-icons/lu";
import { PiChats } from "react-icons/pi";
import { HiOutlineUsers } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";



export default function Login() {

  return(
    <main className={styles.body}>
      <div className={styles.header}>
        <Logo classNameImage={"w-[clamp(1rem,3dvw,4rem)]"} classNameDiv={"text-[clamp(1rem,1.5dvw,3rem)] font-bold gap-[10px]"}></Logo>
      </div>
      <div className={styles.content}>
        <div className={styles.sideBar}>
          <div className={styles.sideBarIcons}>
          <LuMenu size="2.5dvw" color="white"></LuMenu>
          <PiChats size="2.25dvw" color="white"></PiChats>
          <HiOutlineUsers size="2.25dvw" color="white"></HiOutlineUsers>
          </div>
          <div className={styles.sideBarIcons}>
          <IoSettingsOutline size="2.45dvw" color="white"></IoSettingsOutline>
          <PiUserCircleLight size="2.7dvw" color="white"></PiUserCircleLight>
          </div>

        </div>
        <div className={styles.backGroundColorChatsDiv}>
          <div className={styles.chatsDiv}>

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