from flask_socketio import emit, join_room
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

        if not chats_ids:
            emit("chats_joined", {"chat_ids": []})
            return
        
        chats_ids = [row[0] for row in chats_ids]
        
        for chat_id in chats_ids:
            join_room(str(chat_id))
        
        emit("chats_joined", {"chat_ids": chats_ids})
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