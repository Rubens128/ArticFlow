import styles from "./emojiMenu.module.css";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";

type EmojiProps = {
    emojiDivRef: React.RefObject<HTMLDivElement | null>;
    setInput: React.Dispatch<React.SetStateAction<string>>;
}

export function EmojiMenu({ emojiDivRef, setInput }: EmojiProps){

    const divPosition = emojiDivRef?.current?.getBoundingClientRect();

    return (
        <div className={styles.emojiMenuDiv} style={{
            top: `calc(${divPosition?.top ?? 0}px - 55dvh - 15px)`,
            left: `calc(${divPosition?.left ?? 0}px - 10dvw)`
        }}>
            <EmojiPicker className={styles.emojiMenuDivPicker} 
            height={"55dvh"} width={"20dvw"} emojiStyle={EmojiStyle.NATIVE}
            onEmojiClick={(emojiData) => setInput((prevInput) => prevInput + emojiData.emoji)}>

            </EmojiPicker>
        </div>
    )
}