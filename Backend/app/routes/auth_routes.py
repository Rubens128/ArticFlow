from flask import Blueprint, request, jsonify, current_app, g
from datetime import datetime, timedelta, timezone
from app.middleware.auth_middleware import jwt_required
import bcrypt
import re
import jwt
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

def init_auth_limits(app):
    limiter.init_app(app)

auth_routes = Blueprint("auth_routes", __name__)

@auth_routes.route("/register", methods=["POST"])
@limiter.limit("5 per minute", per_method=True, methods=["POST"])

def register():
    data = request.get_json()

    nick = data.get("nick", "").replace(" ", "")
    email = data.get("email", "").replace(" ", "").lower()
    raw_password = data.get("password", "").strip()

    email_template = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    password_template = {
        "length": len(raw_password) >= 8,
        "uppercase": bool(re.search(r"[A-Z]", raw_password)),
        "lowercase": bool(re.search(r"[a-z]", raw_password)),
        "number": bool(re.search(r"\d", raw_password)),
        "special": bool(re.search(r"[^\w]", raw_password))        
    }

    if not re.match(r"^\w+$", nick):
        return jsonify({"error": "Nick só pode conter letras, números e underline."}), 400

    if not nick or not email or not raw_password:
        return jsonify({"error": "Todos os campos são obrigatórios."}), 400

    if not re.match(email_template, email):
        return jsonify({"error": "E-mail invalido."}), 400
    
    if len(nick) < 3 or len(nick) > 32:

        return jsonify({"error": "Tamanho do nick inválido."}), 400

    if not all(password_template.values()):
        
        erros = [crit for crit, ok in password_template.items() if not ok]

        return jsonify({"error": "Senha inválida.", "requisitos_nao_atendidos": erros}), 400

    hashed_password = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    DbConnection = current_app.db_connection
    cursor = DbConnection.cursor()

    try:
        cursor.execute("""
            SELECT user_id FROM users WHERE nick = %s
        """, (nick,))

        existing_user_nick = cursor.fetchone()

        if existing_user_nick:
            return jsonify({"error": "Nick já está em uso."}), 409

        cursor.execute("""
            SELECT user_id FROM users WHERE email = %s
        """, (email,))

        existing_user_email = cursor.fetchone()

        if existing_user_email:
            return jsonify({"error": "E-mail já está em uso."}), 409
        
        cursor.execute("""
            INSERT INTO users (nick, email, password)
            VALUES (%s, %s, %s)
            RETURNING user_id
        """, (nick, email, hashed_password))

        user_id = cursor.fetchone()

        cursor.execute("""
            INSERT INTO user_profile (user_id)
            VALUES (%s)
        """, (user_id))

        cursor.execute("""
            INSERT INTO user_settings (user_id)
            VALUES (%s)
        """, (user_id))

        DbConnection.commit()
    
    except Exception as e:
        
        DbConnection.rollback()
        
        return jsonify({"error": "Erro ao registrar usuário", "details": str(e)}), 400
    
    finally:

        cursor.close()

    return jsonify({"message": "Usuário registrado com sucesso!"}), 201

@auth_routes.route("/login",methods=["POST"])
@limiter.limit("5 per minute", per_method=True, methods=["POST"])

def login():

    data = request.get_json()

    nick = data.get("nick", "").strip()
    raw_password = data.get("password", "").strip().encode("utf-8")

    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:

        cursor.execute("""
            SELECT user_id, password FROM users
            WHERE nick = %s
        """, (nick,))
    
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Usuário ou senha inexistentes. Acesso negado!"}), 401

        user_id, hashed_password = result

        hashed_password = hashed_password.encode("utf-8")

        if bcrypt.checkpw(raw_password, hashed_password):

            payload = {
                "user_id": user_id,
                "nick": nick,
                "iat": datetime.now(timezone.utc),
                "nbf": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(hours=2),
            }

            token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
            
            exp_time = datetime.now(timezone.utc) + timedelta(hours=2)

            response = jsonify({"message": "Usuário e senha corretos."})
            response.set_cookie(
                "token",
                token,
                httponly=True,
                secure=False,
                samesite="Lax",
                expires=exp_time
            )

            return response
        
        else:
            return jsonify({"message": "Usuário ou senha inexistentes. Acesso negado!"}), 401

    except Exception as e:

        Dbconnection.rollback()

        return jsonify({"erro": str(e)}), 500
    
    finally:

        cursor.close()

@auth_routes.route("/chats",methods=["POST"])

@jwt_required

def chats():
    
    data = request.get_json()

    name = data.get("name", "").strip()
    image = data.get("image", "").strip()
    members = data.get("members")

    if not isinstance(members, list) or len(members) <= 1:
        return jsonify({"error": "A lista de membros é obrigatória e deve ter pelo menos 2 usuários."}), 400

    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()
    
    permissions = ["owner", "member"]

    try:

        cursor.execute("""
            INSERT INTO chats (group_name, group_image, members_count)
            VALUES (%s, %s, %s)
            RETURNING chat_id
        """, (name, image, len(members)))

        chat_id = cursor.fetchone()[0]

        for index , nick in enumerate(members):
            
            cursor.execute("""
                SELECT user_id FROM users
                WHERE nick = %s
            """, (nick,))

            result = cursor.fetchone()
            
            if result is None:
                return jsonify({"error": f"Usuário com nick '{nick}' não encontrado."}), 400
            
            user_id = result[0]

            permission = permissions[0] if index == 0 else permissions[1]

            cursor.execute("""
                INSERT INTO chat_members (user_id, chat_id, permissions)
                VALUES (%s, %s, %s)
            """, (user_id, chat_id, permission))

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        return jsonify({"error": "Erro ao registrar chat", "details": str(e)}), 400
    
    finally:

        cursor.close()
    
    return jsonify({"message": "Chat registrado com sucesso!", "chat_id": chat_id}), 201

@auth_routes.route("/messagesAdd",methods=["POST"])

@jwt_required

def messages():
    data = request.get_json()

    chat_id = data.get("chat_id", "")
    user_id = g.user_id
    message = data.get("content", "").strip()

    if not chat_id or not message:
        return jsonify({"error": "O envio de chat_id e message são necessários"}), 400
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:
        
        cursor.execute("""
            SELECT 1 FROM chat_members
            WHERE chat_id = %s AND user_id = %s
        """, (chat_id, user_id))

        if not cursor.fetchone():
            return jsonify({"error": "Chat inexistente ou você não faz parte desse chat"}), 400

        cursor.execute("""
            INSERT INTO messages (chat_id, sender_id, content)
            VALUES (%s, %s, %s)
            RETURNING message_id, to_char(sent_at, 'DD/MM/YYYY')
        """, (chat_id, user_id, message))

        returningSQL = cursor.fetchone()
        message_info = (*returningSQL, g.nick)

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        return jsonify({"error": "Erro ao registrar mensagem", "details": str(e)}), 400

    finally:

        cursor.close()

    return jsonify({"message": "Mensagem registrada com sucesso!", "message_info": message_info}), 201

@auth_routes.route("/chatsGet",methods=["GET"])

@jwt_required

def chatsGet():
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    user_id = g.user_id
    
    chats_list = list()

    try:
        cursor.execute("""
            SELECT chat_id, new_messages FROM chat_members
            WHERE user_id = %s
        """, (user_id,))

        infoChatMembers = cursor.fetchall()
        chats_ids = [row[0] for row in infoChatMembers]
        
        if not chats_ids:
            return jsonify([])

        cursor.execute("""
            SELECT distinct on (chat_id) 
            chat_id, to_char(sent_at, 'DD/MM/YYYY'), content FROM messages
            WHERE chat_id IN %s
            ORDER BY chat_id, sent_at desc
        """, (tuple(chats_ids), ))

        chats_ids_in_order = cursor.fetchall()

        for id in chats_ids:
            exists = False
            for chats in chats_ids_in_order:
                if id in chats:
                    exists = True
                    break
            
            if not exists:
                chats_ids_in_order.append((id, None, None))

        for index, chat in enumerate(chats_ids_in_order):
            
            cursor.execute("""
                SELECT group_name, group_image, friends FROM chats
                WHERE chat_id = %s
            """, (chat[0],))

            chat_info = cursor.fetchone()

            new_messages = 0

            for infoChat in infoChatMembers:

                if(infoChat[0] == chat[0]):

                    new_messages = infoChat[1]
                    break
                
            
            if not chat_info:
                continue
            
            if(not chat_info[2]):

                chats_list.append({
                    "chat_id": chat[0],
                    "chat_name": chat_info[0],
                    "chat_image": chat_info[1],
                    "chat_sentAt": chat[1],
                    "chat_content": chat[2],
                    "new_messages": new_messages
                })
            
            else:

                cursor.execute("""
                    SELECT user_id FROM chat_members
                    WHERE chat_id = %s AND user_id != %s
                """, (chat[0], user_id))

                friend_id = cursor.fetchone()[0]

                cursor.execute("""
                    SELECT u.nick, up.profile_image
                    FROM users u
                    LEFT JOIN user_profile up
                    ON u.user_id = up.user_id
                    WHERE u.user_id = %s
                """, (friend_id,))

                friend_info = cursor.fetchone()

                chats_list.append({
                    "chat_id": chat[0],
                    "chat_name": friend_info[0],
                    "chat_image": friend_info[1],
                    "chat_sentAt": chat[1],
                    "chat_content": chat[2],
                    "new_messages": new_messages
                })

    except Exception as e:
        print(str(e))
        return jsonify({"error": "Erro ao coletar os chats", "details": str(e)}), 400
    
    finally:

        cursor.close()

    return jsonify(chats_list)

@auth_routes.route("/messagesGet",methods=["GET"])

@jwt_required

def messagesGet():

    data = request.args

    chat_id = data.get("chat_id", "")
    lastMessage_id = data.get("message_id", "")
    user_id = g.user_id

    if not chat_id or isinstance(chat_id, int):
        return jsonify({"error": "Erro ao encontrar o chat"}), 400
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:
        
        if(lastMessage_id != "-1"):
            
            cursor.execute("""
                SELECT 1 FROM messages 
                WHERE chat_id = %s AND message_id < %s
            """, (chat_id, lastMessage_id))

            if not cursor.fetchone():

                return jsonify([])
        

        cursor.execute("""
            SELECT 1 FROM chat_members
            WHERE user_id = %s AND chat_id = %s
        """, (user_id, chat_id))

        if not cursor.fetchone():
            return jsonify({"error": "Você não faz parte desse chat ou chat inexistente"}), 400

        lastMessage_string = ""

        params = [user_id, chat_id]

        if (lastMessage_id != "-1"):
            
            lastMessage_string = f"AND m.message_id < %s"
            params.append(lastMessage_id)
        
        query = f"""
            SELECT nick, content, sent_at, main, message_id FROM (
            SELECT m.message_id, u.nick, m.content, to_char(sent_at, 'DD/MM/YYYY') AS sent_at, u.user_id = %s as main
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.user_id
            WHERE m.chat_id = %s {lastMessage_string}
            ORDER BY message_id DESC
            LIMIT 50
            )
            ORDER BY message_id ASC
        """

        cursor.execute(query, tuple(params))

        messages = cursor.fetchall()

        messages_list = list()

        for index, messageInfo in enumerate(messages):

            messages_list.append({
                "index": messageInfo[4],
                "nick": messageInfo[0] if messageInfo[0] else "unknown user",
                "content": messageInfo[1],
                "sent_at": messageInfo[2],
                "main": messageInfo[3]
            })

        return jsonify(messages_list)
    
    except Exception as e:

        return jsonify({"error": "Erro ao coletar informações do chat", "details": str(e)}), 400
    
    finally:
        
        cursor.close()

@auth_routes.route("/friendsGet",methods=["GET"])

@jwt_required

def friendsGet():

    data = request.args

    user_id = g.user_id

    try:

        Dbconnection = current_app.db_connection
        cursor = Dbconnection.cursor()

        allFriends = {
            "friends": list(),
            "pendingFriends": list(),
            "waitingFriends": list()
        }

        cursor.execute("""
            SELECT f.user_id_2, u2.nick, f.status, up.description, up.profile_image, f.friends_chat_id 
            FROM friends f
            LEFT JOIN users u2 on f.user_id_2 = u2.user_id
            LEFT JOIN user_profile up on u2.user_id = up.user_id
            WHERE f.user_id_1 = %s AND status != 'refused'
        """, (user_id, ))

        friends = cursor.fetchall()

        for friend in friends:

            statusFriend = ""

            if friend[2] == "accepted":

                statusFriend = "friends"
            
            elif friend[2] == "pending":
                
                statusFriend = "pendingFriends"

            elif friend[2] == "waiting":

                statusFriend = "waitingFriends"

            else:

                continue

            allFriends[statusFriend].append({
                "friend_id": friend[0],
                "nick": friend[1],
                "status": friend[2],
                "description": friend[3],
                "profile_image": friend[4],
                "friends_chat_id": friend[5]
            })
        
        return jsonify(allFriends)

    except Exception as e:

        return jsonify({"error": "Erro ao coletar informações sobre os amigos", "details": str(e)}), 400
    
    finally:
        
        cursor.close()

@auth_routes.route("/searchUser",methods=["GET"])

@jwt_required

def searchUser():

    data = request.args

    nick = data.get("nick", "")
    user_id = g.user_id

    try:
        
        Dbconnection = current_app.db_connection
        cursor = Dbconnection.cursor()

        cursor.execute("""
            SELECT u.user_id, u.nick, up.profile_image
            FROM users u
            LEFT JOIN user_profile up
            ON u.user_id = up.user_id
            WHERE u.nick = %s AND u.user_id != %s
        """, (nick, user_id))

        userInfo = cursor.fetchone()

        if(userInfo):

            userInfoDict = {
                "user_id": userInfo[0],
                "nick": userInfo[1],
                "profile_image": userInfo[2]
            }

            return jsonify(userInfoDict)

        else:

            return jsonify("")
    
    except Exception as e:

        return jsonify({"error": "Erro ao buscar usuário por nick", "details": str(e)}), 400
    
    finally:

        cursor.close()