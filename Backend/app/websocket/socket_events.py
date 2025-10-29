from flask_socketio import emit, join_room, rooms
from flask import current_app, request
from app.websocket.socket_config import socketio
import jwt

@socketio.on("connect")

def handle_connect():

    token = request.cookies.get("token")

    if not token:
        emit("chats_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
        user_id = payload["user_id"]

    except jwt.ExpiredSignatureError:

        emit("chats_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("chats_error", {"error": "Token inválido. Acesso negado."})
        return

    try:

        Dbconnection = current_app.db_connection
        cursor = Dbconnection.cursor()

        cursor.execute("""
            SELECT chat_id FROM chat_members
            WHERE user_id = %s
        """, (user_id,))

        chats_ids = cursor.fetchall()

        join_room(f"user:{user_id}")

        if not chats_ids:
            emit("chats_joined", {"chat_ids": []})
            return
        
        chats_ids = [row[0] for row in chats_ids]
        
        for chat_id in chats_ids:
            join_room(str(chat_id))

        print(rooms(request.sid, namespace="/"))
        return


    except Exception as e:
        
        emit("chats_error", {"error": str(e)})
        return
    
    finally:
        cursor.close()


@socketio.on("send_message")

def handle_send_message(data):

    token = request.cookies.get("token")

    if not token:
        emit("message_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
        user_id = payload["user_id"]

    except jwt.ExpiredSignatureError:

        emit("message_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("message_error", {"error": "Token inválido. Acesso negado."})
        return

    chat_id = data.get("chat_id", "")
    message = data.get("content", "").strip()

    if not chat_id or not message:
        emit("message_error", {"error": "O envio de chat_id e message são necessários"})
        return

    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:
        
        cursor.execute("""
            SELECT nick FROM chat_members c LEFT JOIN users u ON
            u.user_id = c.user_id
            WHERE c.chat_id = %s AND c.user_id = %s
        """, (chat_id, user_id))

        nick = cursor.fetchone()[0]
        
        if not nick:
            emit("message_error", {"error": "Chat inexistente ou você não faz parte desse chat"})
            return

        cursor.execute("""
            INSERT INTO messages (chat_id, sender_id, content)
            VALUES (%s, %s, %s)
            RETURNING message_id, to_char(sent_at, 'DD/MM/YYYY')
        """, (chat_id, user_id, message))

        message_id, sent_at = cursor.fetchone()

        cursor.execute("""
            UPDATE chat_members
            SET new_messages = new_messages + 1
            WHERE chat_id = %s AND user_id != %s
        """, (chat_id, user_id))

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        emit("message_error", {"error": "Erro ao registrar mensagem", "details": str(e)})
        return

    finally:

        cursor.close()

    payload = {
        "chat_id": chat_id,
        "last_message": {
            "message_id": message_id,
            "nick": nick,
            "content": message,
            "timestamp": sent_at
        }
    }


    emit("message_confirmed", payload)

    emit("new_message", payload, to=str(chat_id), skip_sid=request.sid)

    return

@socketio.on("read_messages")

def handle_read_messages(data):

    token = request.cookies.get("token")

    if not token:
        emit("message_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
        user_id = payload["user_id"]

    except jwt.ExpiredSignatureError:

        emit("message_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("message_error", {"error": "Token inválido. Acesso negado."})
        return

    chat_id = data.get("chat_id", "")

    if not chat_id:
        emit("message_error", {"error": "O envio de chat_id é necessário"})
        return
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()
    
    try:

        cursor.execute("""
            UPDATE chat_members
            SET new_messages = 0
            WHERE user_id = %s AND chat_id = %s
        """, (user_id, chat_id))

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        emit("message_error", {"error": "Erro ao dar update na coluna new_message", "details": str(e)})
        return
    
    finally:

        cursor.close()

    emit("update_confirmed", "update realizado com sucesso")

    return

@socketio.on("send_friend_request")

def handle_friend_request(data):
    
    token = request.cookies.get("token")

    if not token:
        emit("message_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
        user_id = payload["user_id"]

    except jwt.ExpiredSignatureError:

        emit("message_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("message_error", {"error": "Token inválido. Acesso negado."})
        return

    requested_user_id = data.get("requested_user_id", "")

    try:
        Dbconnection = current_app.db_connection
        cursor = Dbconnection.cursor()

        cursor.execute("""
            SELECT 1 FROM users
            WHERE user_id = %s AND user_id != %s
        """, (requested_user_id, user_id))

        if not cursor.fetchone():
            return

        cursor.execute("""
            INSERT INTO friends (user_id_1, user_id_2, status)
            VALUES (%s, %s, %s), (%s, %s, %s)
        """, (user_id, requested_user_id, "waiting", requested_user_id, user_id, "pending"))

        cursor.execute("""
            SELECT u.nick, up.description, up.profile_image
            FROM users u
            LEFT JOIN user_profile up
            ON u.user_id = up.user_id
            WHERE u.user_id = %s
        """, (requested_user_id,))

        senderInfo = cursor.fetchone()

        senderInfoDict = {
            "chatFriends_id": None,
            "friend_id": requested_user_id,
            "nick": senderInfo[0],
            "status": "waiting",
            "description": senderInfo[1],
            "profile_image": senderInfo[2]
        }

        cursor.execute("""
            SELECT u.nick, up.description, up.profile_image
            FROM users u
            LEFT JOIN user_profile up
            ON u.user_id = up.user_id
            WHERE u.user_id = %s
        """, (user_id,))
        
        receiverInfo = cursor.fetchone()

        receiverInfoDict = {
            "friend_id": user_id,
            "nick": receiverInfo[0],
            "status": "pending",
            "description": receiverInfo[1],
            "profile_image": receiverInfo[2],
            "friends_chat_id": None
        }

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        emit("friend_error", {"error": "erro ao enviar pedido de amizade", "details": str(e)})
        return
    
    finally:

        cursor.close()
    
    emit("request_sent", senderInfoDict)

    emit("request_received", receiverInfoDict, to=f"user:{requested_user_id}", skip_sid=request.sid)

    return

@socketio.on("update_friends")

def updateFriends(data):

    token = request.cookies.get("token")

    if not token:
        emit("message_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
        user_id = payload["user_id"]

    except jwt.ExpiredSignatureError:

        emit("message_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("message_error", {"error": "Token inválido. Acesso negado."})
        return

    status = data.get("new_status", "")
    friend_id = data.get("friend_id", "")

    chatFriends_id = None

    try:
         
        Dbconnection = current_app.db_connection
        cursor = Dbconnection.cursor()

        if(status == "accepted"):

            cursor.execute("""
                SELECT 1
                FROM friends f
                LEFT JOIN chats c
                ON f.friends_chat_id = c.chat_id
                WHERE f.user_id_1 = %s AND c.friends = true
            """, (user_id,))

            if(cursor.fetchone()): return

            cursor.execute("""
                INSERT INTO chats (group_name, group_image, members_count, friends)
                VALUES (%s, %s, %s, %s)
                RETURNING chat_id
            """, ("user", "", 2, True))

            chatFriends_id = cursor.fetchone()[0]

            cursor.execute("""
                UPDATE friends
                SET status = %s, friends_chat_id = %s
                WHERE (user_id_1 = %s AND user_id_2 = %s)
                OR (user_id_1 = %s AND user_id_2 = %s)
            """, (status, chatFriends_id, user_id, friend_id, friend_id, user_id))

            cursor.execute("""
                INSERT INTO chat_members (user_id, chat_id, permissions)
                VALUES (%s, %s, %s)
            """, (user_id, chatFriends_id, "owner"))
            
            cursor.execute("""
                    INSERT INTO chat_members (user_id, chat_id, permissions)
                    VALUES (%s, %s, %s)
            """, (friend_id, chatFriends_id, "owner"))

        else:

            cursor.execute("""
                UPDATE friends
                SET status = %s
                WHERE (user_id_1 = %s AND user_id_2 = %s)
                OR (user_id_1 = %s AND user_id_2 = %s)
            """, (status, user_id, friend_id, friend_id, user_id))
            

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        emit("update_friends_error", {"error": "Erro ao atualizar status da amizade", "details": str(e)})

        return
    
    finally:

        cursor.close()

    payloadSent = {
        "friend_id": friend_id,
        "status": status,
        "friends_chat_id": chatFriends_id
    }

    payloadReceived = {
        "friend_id": user_id,
        "status": status,
        "friends_chat_id": chatFriends_id
    }

    emit("update_status_friends_success_sent", payloadSent)

    emit("update_status_friends_success_received", payloadReceived, to=f"user:{friend_id}", skip_sid=request.sid)

    return

@socketio.on("join_room")

def joinRoom(data):

    token = request.cookies.get("token")

    if not token:
        emit("message_error", {"error": "Token ausente. Faça login novamente."})
        return

    try:
        
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)

    except jwt.ExpiredSignatureError:

        emit("message_error", {"error": "Token expirado. Faça login novamente."})
        return
    
    except jwt.InvalidTokenError:

        emit("message_error", {"error": "Token inválido. Acesso negado."})
        return
    
    chat_id = data.get("chat_id")

    if(not chat_id): return
    
    join_room(str(chat_id))