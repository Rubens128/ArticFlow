import styles from "./logo.module.css"
import logo from "../../assets/Logo.svg"

export function Logo(){

    return (
        <div className={styles.div}>
        <img src={logo} className={styles.image}></img>
        <h1>ArticFlow</h1>
        </div>
    )
}