import styles from "./input.module.css"
import React from "react"

// type inputProps = {
//     text: string;
//     type: string;
//     name: string;
//     id: string;
//     autocomplete?: string;
//     inputmode?: "email"|"text";
//     spellcheck?: boolean;
//     minLenght?: number;
//     maxLenght?: number;
//     onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
// }

type inputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    text: string;
}

export function Input({ text, ...rest }: inputProps){

    return (
        <input className={styles.input} placeholder={text} {...rest} required/>
    )
}