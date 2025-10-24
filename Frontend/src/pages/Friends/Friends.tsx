import styles from "./Friends.module.css"
import { Logo } from "../../components/logo/logo"
import { SideBar } from "../../components/sideBar/sideBar"
import { Input } from "../../components/input/input"
import { IoSearchOutline } from "react-icons/io5";


export default function Chats() {

  return(
    <main className={styles.body}>
      
      <div className={styles.header}>
        <Logo classNameImage={"w-[clamp(1rem,3dvw,4rem)]"} classNameDiv={"text-[clamp(1rem,1.5dvw,3rem)] font-bold gap-[10px]"}></Logo>
      </div>

      <div className={styles.content}>
        <SideBar currentIcon={2}></SideBar>
        <div className={styles.backGroundColorChatsDiv}>
          <div className={styles.friendsDiv}>
            <h1>Friends</h1>
            <div className={styles.inputWrapper}>
              <Input text="Search Chats" customSize="!w-[100%] !h-[clamp(1rem,2.5dvw,3rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"></Input>
              <IoSearchOutline className={styles.inputWrapperIcon}></IoSearchOutline>
            </div>
          </div>
        </div>
        <div className={styles.friendsInfo}>
        </div>
      </div>
    </main>
  );

}