import styles from "./friends.module.css"
import { BsPersonArmsUp } from "react-icons/bs";
import { useState, useEffect } from "react";
import { Input } from "../input/input";
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ProfileImage } from "../profileImage/profileImage";
import { IoChatbubbles } from "react-icons/io5";
import { IoMdMore } from "react-icons/io";
import { FaCheck } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { PiClockCounterClockwise } from "react-icons/pi";
import { IoMdAdd } from "react-icons/io";
import { getSocket } from "../../api/socket";
import type { friendType } from "../../pages/Main/Main";
import { MdOutlineBlock } from "react-icons/md";
import { MdClose } from "react-icons/md";

type userInfo = {
    user_id: number;
    nick: string;
    profile_image: string;
}

type friendsProps = {
    friends: friendType[];
    setFriends: React.Dispatch<React.SetStateAction<friendType[]>>;
    pendingFriends: friendType[];
    setPendingFriends: React.Dispatch<React.SetStateAction<friendType[]>>;
    waitingFriends: friendType[];
    setWaitingFriends: React.Dispatch<React.SetStateAction<friendType[]>>;
    setCurrentChat: React.Dispatch<React.SetStateAction<number>>;
    setCurrentIcon: React.Dispatch<React.SetStateAction<number>>;
}

export function Friends({ friends, setFriends, pendingFriends, 
    setPendingFriends, waitingFriends, setWaitingFriends, setCurrentIcon, setCurrentChat }: friendsProps){

    const navigate = useNavigate();

    const [option, setOption] = useState<number>(1);
    const [inputSearchFriend, setInputSearchFriend] = useState<string>("");
    const [addUserInfo, setAddUserInfo] = useState<userInfo | null>(null);
    const [userNotFound, setUserNotFound] = useState<boolean | null>(null);
    const [infoTextFromSearch, setInfoTextFromSearch] = useState<string>("");
    const [menuFriend, setMenuFriend] = useState<boolean>(false);

    const HandleSendFriendRequest = () => {

        if(option !== 3) return;

        const socket = getSocket();
        if(!socket.connected) socket.connect();

        if(!addUserInfo) return;

        socket.emit("send_friend_request", { requested_user_id : addUserInfo.user_id})

        setAddUserInfo(null)
        setUserNotFound(null)
        setInfoTextFromSearch("")
    }

    const HandleAcceptFriend = (friend_id: number) => {
        const socket = getSocket();
        if(!socket.connected) socket.connect();

        socket.emit("update_friends", { new_status: "accepted", friend_id: friend_id})
    }

    const HandleRefuseFriend = (friend_id: number) => {
        const socket = getSocket();
        if(!socket.connected) socket.connect();

        socket.emit("update_friends", { new_status: "refused", friend_id: friend_id})

    }

    function typeOfFriendsList(){
        
        if(option === 1){
            
            return(
                friends.map((friend , i) => {
                    
                    if(!friend.nick.toLocaleLowerCase().startsWith(inputSearchFriend.toLowerCase())) return;

                    return (
                        <div className={`${styles.friendsDivListFriend} 
                        ${menuFriend ? styles.friendsDivListFriendActive : ""}`} key={i}>
                            <div className={styles.friendsDivListFriendFlexOrganization}>
                                <ProfileImage src={friend.profile_image? friend.profile_image: "profileImages/Penguino.png"}
                                alt={`Imagem de perfil do usuario: ${friend.nick}`} width="clamp(2rem, 2.5dvw, 3rem)">
                                </ProfileImage>
                                <div className={styles.friendsDivListFriendInfo}> 
                                    <p className={styles.friendsDivListFriendInfoNick}>{friend.nick}</p>

                                    <p className={styles.friendsDivListFriendInfoDescription}>
                                        {friend.description? friend.description: "Sem descrição"}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.friendsDivListFriendFlexOrganization} style={{position: "relative"}}>
                                <IoChatbubbles className="w-[clamp(1rem,1.75dvw,2rem)] h-auto cursor-pointer"
                                onClick={() => {
                                    setCurrentIcon(1); 
                                    setCurrentChat(friend.friends_chat_id ? friend.friends_chat_id : -1)
                                    }}></IoChatbubbles>
                                <IoMdMore className="w-[clamp(1rem,1.75dvw,2rem)] h-auto cursor-pointer"
                                onClick={() => setMenuFriend(!menuFriend)}></IoMdMore>
                                <div className={styles.friendsDivListFriendMenu} style={{display: menuFriend ? "flex" : "none"}}>
                                    <div className={styles.friendsDivListFriendMenuOption}
                                        onClick={() => {
                                            setCurrentIcon(1); 
                                            setCurrentChat(friend.friends_chat_id ? friend.friends_chat_id : -1);
                                            setMenuFriend(false);
                                        }}>
                                        <IoChatbubbles className="w-[clamp(1rem,1.25dvw,2rem)] h-auto cursor-pointer"></IoChatbubbles>
                                        <p>Enviar Mensagem</p>
                                    </div>
                                    <div className={styles.friendsDivListFriendMenuOption}>
                                        <MdClose className="w-[clamp(1rem,1.25dvw,2rem)] h-auto text-white-400"
                                        onClick={() => {}}></MdClose>
                                        <p>Excluir Amigo</p>
                                    </div>
                                    <div className={styles.friendsDivListFriendMenuOption}>
                                        <MdOutlineBlock className="w-[clamp(1rem,1.25dvw,2rem)] h-auto text-white-400"></MdOutlineBlock>
                                        <p>Bloquear Amigo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })
            )
        } else if (option === 2){

            return(
                pendingFriends.map((friend , i) => {

                    if(!friend.nick.toLocaleLowerCase().startsWith(inputSearchFriend.toLowerCase())) return;

                    return (
                        <div className={styles.friendsDivListFriend} key={i}>
                            <div className={styles.friendsDivListFriendFlexOrganization}>
                                <ProfileImage src={friend.profile_image? friend.profile_image: "profileImages/Penguino.png"}
                                alt={`Imagem de perfil do usuario: ${friend.nick}`} width="clamp(2rem, 2.5dvw, 3rem)">
                                </ProfileImage>
                                <div className={styles.friendsDivListFriendInfo}> 
                                    <p className={styles.friendsDivListFriendInfoNick}>{friend.nick}</p>

                                    <p className={styles.friendsDivListFriendInfoDescription}>
                                        {friend.description? friend.description: "Sem descrição"}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.friendsDivListFriendFlexOrganization}>
                                <FaCheck className="w-[clamp(1rem,1.25dvw,2rem)] h-auto text-green-400 cursor-pointer"
                                onClick={() => HandleAcceptFriend(friend.friend_id)}></FaCheck>
                                <IoMdClose className="w-[clamp(1rem,1.75dvw,2rem)] h-auto text-red-400 cursor-pointer"
                                onClick={() => HandleRefuseFriend(friend.friend_id)}></IoMdClose>
                            </div>
                        </div>
                    )
                })
            )

        } else if (option === 3){
            
            return(
                waitingFriends.map((friend , i) => {

                    return (
                        <div className={styles.friendsDivListFriend} key={i}>
                            <div className={styles.friendsDivListFriendFlexOrganization}>
                                <ProfileImage src={friend.profile_image? friend.profile_image: "profileImages/Penguino.png"}
                                alt={`Imagem de perfil do usuario: ${friend.nick}`} width="clamp(2rem, 2.5dvw, 3rem)">
                                </ProfileImage>
                                <div className={styles.friendsDivListFriendInfo}> 
                                    <p className={styles.friendsDivListFriendInfoNick}>{friend.nick}</p>

                                    <p className={styles.friendsDivListFriendInfoDescription}>
                                        {friend.description? friend.description: "Sem descrição"}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.friendsDivListFriendFlexOrganization}>
                                <IoMdClose className="w-[clamp(1rem,1.75dvw,2rem)] h-auto text-red-400 cursor-pointer"
                                onClick={() => HandleRefuseFriend(friend.friend_id)}></IoMdClose>
                                <PiClockCounterClockwise className="w-[clamp(1rem,1.75dvw,2rem)] h-auto"></PiClockCounterClockwise>
                            </div>
                        </div>
                    )
                })
            )
        }
    }

    useEffect(() => {

        (async () => {

            try{

                const res = await fetch("/api/friendsGet", {
                    credentials: "include",
                });

                if(res.status === 400 || res.status === 4){

                    const error = await res.json();

                    alert("Erro ao coletar lista de amigos, tente novamente mais tarde.");

                    console.log(error);

                    return;
                }

                const data = await res.json()

                setFriends(data["friends"]);
                setPendingFriends(data["pendingFriends"]);
                setWaitingFriends(data["waitingFriends"]);

                return;

            } catch{

                navigate("/", {replace: true});
            }

        })();
    }, [])

    useEffect(() => {

        setAddUserInfo(null)
        setInputSearchFriend("")
        setUserNotFound(null)
        setInfoTextFromSearch("")

    }, [option])

    const HandleSend = async (e? : React.FormEvent) => {

        e?.preventDefault();

        try{

            const res = await fetch(`/api/searchUser?nick=${inputSearchFriend}`, {
                credentials: "include"
            })

            if(res.status === 400){

                const error = await res.json();

                alert("Erro ao coletar usuario pelo nick, tente novamente mais tarde.");

                console.log(error);

                return;
            }

            const data = await res.json()
            
            let infoText = ""

            if(data){

                setAddUserInfo(data)
                setUserNotFound(false)


                if(waitingFriends.some(friend => friend.friend_id === data.user_id))
                    infoText = "Você já enviou um pedido de amizade para este usuário";

                if(pendingFriends.some(friend => friend.friend_id === data.user_id))
                    infoText = "Este usuário já te enviou um pedido de amizade";

                if(friends.some(friend => friend.friend_id === data.user_id))
                    infoText = "Você já é amigo deste usuário";

                if(!infoText){
                    
                    infoText = "Usuário encontrado"
                
                }else{

                    setAddUserInfo(null);
                    setUserNotFound(true);
                }

            }else {

                infoText = "Não existem usuários com este nick";

                setAddUserInfo(null);
                setUserNotFound(true);
            }

            setInfoTextFromSearch(infoText);
            setInputSearchFriend("");
        
        }catch{

            navigate("/", {replace: true})
        }
    }

    return (
        <div className={styles.friendsDiv}>
            <div className={styles.friendsDivHeader}>
                <div className={styles.friendsDivHeaderTitle}>
                    <BsPersonArmsUp></BsPersonArmsUp>
                    <h1>Amigos</h1>
                </div>
                <div className={styles.friendsDivHeaderButton}>
                    <button 
                    className={`${styles.friendsDivHeaderButtonStyle} ${option === 1? styles.selected : ""}`}
                    onClick={() => setOption(1)}>
                    Todos
                    </button>

                    <button 
                    className={`${styles.friendsDivHeaderButtonStyle} ${option === 2? styles.selected : ""}`}
                    onClick={() => setOption(2)}>
                    Pedidos
                    </button>

                    <button 
                    className={`${styles.friendsDivHeaderButtonStyle} ${option === 3? styles.selected : ""}`}
                    onClick={() => setOption(3)}>
                    Adicionar Amigos
                    </button>
                </div>
            </div>

            <div className={styles.friendsDivInputWrapper}>
                <form onSubmit={HandleSend}>
                    <Input text={option < 3? "Buscar amigo" : "Digite o nick do usuário que deseja adicionar"} 
                        customSize="!w-[70%] !h-[clamp(1rem,2.5dvw,3rem)] !text-[clamp(0.5rem,0.8dvw,2rem)]"
                        onChange={(e) => setInputSearchFriend(e.target.value)} value={inputSearchFriend}></Input>
                    <IoSearchOutline className={styles.friendsDivInputWrapperIcon}></IoSearchOutline>
                </form>
            </div>

            <div className={styles.friendsDivList}>
                
                <h1 style={userNotFound? {marginBottom: "20px"} : {}}>{infoTextFromSearch}</h1>

                {
                option === 3 && addUserInfo && userNotFound === false?
                <div className={styles.friendsDivListFriend} style={{borderTop: "none"}}>
                    <div className={styles.friendsDivListFriendFlexOrganization}>
                        <ProfileImage src={addUserInfo.profile_image? addUserInfo.profile_image: "profileImages/Penguino.png"}
                            alt={`Imagem de perfil do usuario: ${addUserInfo.nick}`} width="clamp(2rem, 2.5dvw, 3rem)">
                        </ProfileImage>
                        <div className={styles.friendsDivListFriendInfo}> 
                            <p className={styles.friendsDivListFriendInfoNick}>{addUserInfo.nick}</p>
                        </div>
                    </div>
                    <div className={styles.friendsDivListFriendFlexOrganization}>
                        <IoMdAdd className="w-[clamp(1rem,1.75dvw,2rem)] h-auto text-green-400 cursor-pointer"
                        onClick={HandleSendFriendRequest}></IoMdAdd>
                    </div>
                </div>
                : ""
                }

                <h1>
                    {
                    option === 1? 
                        `Todos os amigos - 
                        ${friends.filter((f => f.nick.toLocaleLowerCase().startsWith(inputSearchFriend.toLocaleLowerCase()))).length}` 
                    : option === 2? 
                        `Pedidos de amizade pendentes - 
                        ${pendingFriends.filter((f => f.nick.toLocaleLowerCase().startsWith(inputSearchFriend.toLocaleLowerCase()))).length}` 
                    :
                    `Pedidos de amizade enviados- ${waitingFriends.length}`
                    } 
                </h1>
                
                <div className={styles.friendsDivListScrollBar}>
                    {typeOfFriendsList()}
                </div>
            </div>
        </div>

    )
}