import styles from "./sideBar.module.css"
import { LuMenu } from "react-icons/lu";
import { PiChats } from "react-icons/pi";
import { HiOutlineUsers } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";
import { Link } from "react-router-dom"

type sideBarProps = {
    currentIcon: Number;
}

export function SideBar({ currentIcon }: sideBarProps){

    return(
        <nav className={styles.sideBar}>
          <div className={styles.sideBarIcons}>
            <Link to="/" className={styles.sideBarIconStyle}>
              <LuMenu size="2.5dvw"></LuMenu>
            </Link>
            <Link to={currentIcon == 1? "": "/"} className={currentIcon == 1? styles.sideBarIconStyleActive: styles.sideBarIconStyle} >
              <PiChats size="2.25dvw"></PiChats>
            </Link>
            <Link to={currentIcon == 2? "": "/"} className={currentIcon == 2? styles.sideBarIconStyleActive: styles.sideBarIconStyle}>
              <HiOutlineUsers size="2.25dvw"></HiOutlineUsers>
            </Link>
          </div>
          <div className={styles.sideBarIcons}>
            <Link to={currentIcon == 3? "": "/"} className={currentIcon == 3? styles.sideBarIconStyleActive: styles.sideBarIconStyle}>
              <IoSettingsOutline size="2.45dvw"></IoSettingsOutline>
            </Link>
            <Link to={currentIcon == 4? "": "/"} className={currentIcon == 4? styles.sideBarIconStyleActive: styles.sideBarIconStyle}>
              <PiUserCircleLight size="2.7dvw"></PiUserCircleLight>
            </Link>
          </div>

        </nav>
    )
}