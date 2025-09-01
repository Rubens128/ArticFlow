import styles from "./button.module.css"

type buttonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    text: string;
}

export function Button({ text, ...rest }: buttonProps) {

    return (
        <button className={styles.button} 
        aria-label={text} {...rest}>
            {text}
        </button>
    )
}