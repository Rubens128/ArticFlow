import styles from "./Chats.module.css"
import { Logo } from "../../components/logo/logo"

export default function Login() {

  return(
    <main className={styles.body}>
      <div className={styles.header}>
        <Logo></Logo>
      </div>
      <div className={styles.content}>
        <div className={styles.sideBar}>

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