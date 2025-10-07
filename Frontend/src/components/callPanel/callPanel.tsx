import { ProfileImage } from "../profileImage/profileImage"
import { FaMicrophone } from "react-icons/fa";
import { FaMicrophoneSlash } from "react-icons/fa";
import styles from "./callPanel.module.css"
import { useEffect, useState, useRef } from "react";
import { IoMdClose } from "react-icons/io";

type CallPanelProps = {
    active: boolean;
    imageSrc: string;
    imageAlt: string;
    onClickClose: () => void;
}

export function CallPanel({ active, imageSrc, imageAlt, onClickClose }: CallPanelProps){

    const [isMute, setIsMute] = useState<boolean>(true)
    const [lastUserText, setLastUserText] = useState("");
    const [lastBotText, setLastBotText] = useState("");

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const ENDPOINT = "http://localhost:5000/ai/stt";
    const CHAT_URL = "http://localhost:5000/ai/chat";
    const TTS_URL = "http://localhost:5000/ai/tts";

    async function startRecording() {

        if(recorderRef.current) return;

        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ?
        "audio/webm;codecs=opus" : "audio/webm";
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        streamRef.current = stream;

        const rec = new MediaRecorder(stream, { mimeType: mime });
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
        
        rec.onstop = async () => {
            try {
                const blob = new Blob(chunksRef.current, { type: mime });
                chunksRef.current = [];
                
                if(blob.size < 1024) return;

                const form = new FormData();

                form.append("audio", blob, 'input.webm');

                const sttResp = await fetch(ENDPOINT, { method: "POST", body: form});
                const sttData = await sttResp.json();
                const transcript = (sttData.transcript || "").trim();
                setLastUserText(transcript);

                if(transcript.length){
                    const chatResp = await fetch(CHAT_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: transcript })
                    });

                    const chatData = await chatResp.json();
                    const reply = (chatData.reply || "").trim();
                    setLastBotText(reply);

                    if(reply){
                        
                        setLastBotText(reply);

                        const resp = await fetch(TTS_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: reply, language: "pt" })
                        });

                        const data = await resp.json();

                        const url = `data:audio/wav;base64,${data.wav_base64}`;
                        const audio = new Audio(url);
                        audio.play().catch(console.error);
                        
                    }
                    
                } else {
                    
                    setLastBotText("[sem texto para enviar]");
                }

            } catch (err){
                console.error("sett->chat error:", err);
                setLastBotText("[erro ao falar com a IA");
            }
        };

        rec.start();
        recorderRef.current = rec;
    };


    function stopRecording(){
        if( recorderRef.current && recorderRef.current.state !== "inactive"){
            
            recorderRef.current.stop();
        }

        recorderRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }

    return (
        <div className={`${styles.panelDiv} ${active? styles.isOpen : ""}`}>
            <div className={styles.panelDivImage}>
                <ProfileImage src={imageSrc} alt={imageAlt} width="30%"></ProfileImage>
            </div>
            <div className={styles.panelDivOptions}>
                <p>{lastUserText}</p>
                {isMute? <FaMicrophoneSlash className={styles.iconMike} onClick={() => {setIsMute(false); startRecording();}}></FaMicrophoneSlash>
                : <FaMicrophone className={styles.iconMike} onClick={() => {setIsMute(true); stopRecording();}}></FaMicrophone>}
                <IoMdClose className={styles.iconClose} onClick={() => onClickClose()}></IoMdClose>
            </div>
        </div>
    )
}