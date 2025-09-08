import styles from "./input.module.css"
import React from "react"

type inputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    text: string;
    customSize?: string;
}

export function Input({ text, customSize = "", ...rest }: inputProps){

    return (
        <input className={customSize? (`${customSize} ${styles.input}`): styles.input} placeholder={text} {...rest} required/>
    )
}