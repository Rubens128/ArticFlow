import styles from "./logo.module.css"
import logo from "../../assets/Logo.svg"

type LogoProps = {
    classNameDiv?: String;
    classNameImage?: String;
}

export function Logo({ classNameDiv, classNameImage }: LogoProps){

    return (
        <div className={`${styles.div} ${classNameDiv}`}>
        <img src={logo} className={`${styles.image} ${classNameImage}`}></img>
        <h1>ArticFlow</h1>
        </div>
    )
}