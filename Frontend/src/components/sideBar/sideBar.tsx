import styles from "./sideBar.module.css"
import { LuMenu } from "react-icons/lu";
import { PiChats } from "react-icons/pi";
import { HiOutlineUsers } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";
import { Link } from "react-router-dom"
import { useState } from "react";

type sideBarProps = {
    currentIcon: Number;
}

export function SideBar({ currentIcon }: sideBarProps){

    const [expand, setExpand] = useState<boolean>(false)

    return(
      <div style={{position: "relative"}}>
        <div className={styles.spacer}></div>
        <nav className={`${styles.sideBar} ${expand? styles.expand : ""}`}>
          <div className={styles.sideBarIcons}>
            <Link to="" className={styles.sideBarIconsLink}>
              <LuMenu size="2dvw" onClick={() => setExpand(!expand)} className={styles.sideBarIconStyle}></LuMenu>
            </Link>
            <Link to={currentIcon == 1? "": "/"} className={styles.sideBarIconsLink}>
              <PiChats size="1.75dvw" className={currentIcon == 1? styles.sideBarIconStyleActive: styles.sideBarIconStyle} ></PiChats>
              <p>{expand ? "conversas" : ""}</p>
            </Link>
            <Link to={currentIcon == 2? "": "/"} className={styles.sideBarIconsLink}>
              <HiOutlineUsers size="1.75dvw" className={currentIcon == 2? styles.sideBarIconStyleActive: styles.sideBarIconStyle}></HiOutlineUsers>
              <p>{expand ? "amigos" : ""}</p>
            </Link>
          </div>
          <div className={styles.sideBarIcons}>
            <Link to={currentIcon == 3? "": "/"} className={styles.sideBarIconsLink}>
              <IoSettingsOutline size="1.95dvw" className={currentIcon == 3? styles.sideBarIconStyleActive: styles.sideBarIconStyle}></IoSettingsOutline>
              <p>{expand ? "configurações" : ""}</p>
            </Link>
            <Link to={currentIcon == 4? "": "/"} className={styles.sideBarIconsLink}>
              <PiUserCircleLight size="2dvw" className={currentIcon == 4? styles.sideBarIconStyleActive: styles.sideBarIconStyle}></PiUserCircleLight>
              <p>{expand ? "perfil" : ""}</p>
            </Link>
          </div>

        </nav>
      </div>
    )
}