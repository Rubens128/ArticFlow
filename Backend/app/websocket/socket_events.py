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
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:

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
            SELECT 1 FROM chat_members
            WHERE chat_id = %s AND user_id = %s
        """, (chat_id, user_id))

        if not cursor.fetchone():
            emit("message_error", {"error": "Chat inexistente ou você não faz parte desse chat"})
            return

        cursor.execute("""
            INSERT INTO messages (chat_id, sender_id, content)
            VALUES (%s, %s, %s)
            RETURNING message_id, sent_at
        """, (chat_id, user_id, message))

        message_id, sent_at = cursor.fetchone()

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
            "sender_id": user_id,
            "content": message,
            "timestamp": sent_at.isoformat().replace("+00:00", "Z")
        }
    }


    emit("message_confirmed", payload)

    emit("new_message", payload, to=str(chat_id), skip_sid=request.sid)

    return