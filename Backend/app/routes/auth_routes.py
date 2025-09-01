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
                samesite="None",
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

@auth_routes.route("/messages",methods=["POST"])

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
            RETURNING message_id
        """, (chat_id, user_id, message))

        message_id = cursor.fetchone()[0]

        Dbconnection.commit()

    except Exception as e:

        Dbconnection.rollback()

        return jsonify({"error": "Erro ao registrar mensagem", "details": str(e)}), 400

    finally:

        cursor.close()

    return jsonify({"message": "Mensagem registrada com sucesso!", "message_id": message_id}), 201

@auth_routes.route("/chats",methods=["GET"])

@jwt_required

def chatsGet():

    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    user_id = g.user_id

    chats_dict = dict()

    try:
        
        cursor.execute("""
            SELECT chat_id FROM chat_members
            WHERE user_id = %s
        """, (user_id,))

        chats_ids = cursor.fetchall()
        chats_ids = [row[0] for row in chats_ids]

        cursor.execute("""
            SELECT chat_id FROM messages
            WHERE chat_id IN %s
            GROUP BY chat_id
            ORDER BY MAX(sent_at) DESC
        """, (tuple(chats_ids), ))

        chats_ids_in_order = cursor.fetchall()
        chats_ids_in_order = [row[0] for row in chats_ids_in_order]

        for index, chat_id in enumerate(chats_ids_in_order):

            cursor.execute("""
                SELECT group_name, group_image FROM chats
                WHERE chat_id = %s
            """, (chat_id,))

            chat_info = cursor.fetchone()

            if not chat_info:
                continue

            chats_dict[index] = {
                "chat_id": chat_id,
                "chat_name": chat_info[0],
                "chat_image": chat_info[1]
            }

    except Exception as e:

        return jsonify({"error": "Erro ao coletar os chats", "details": str(e)}), 400
    
    finally:

        cursor.close()
    
    return jsonify(chats_dict)

@auth_routes.route("/messages",methods=["GET"])

@jwt_required

def messagesGet():

    data = request.args

    chat_id = data.get("chat_id", "")
    user_id = g.user_id

    if not chat_id:
        return jsonify({"error": "Erro ao encontrar o chat"}), 400
    
    Dbconnection = current_app.db_connection
    cursor = Dbconnection.cursor()

    try:

        cursor.execute("""
            SELECT 1 FROM chat_members
            WHERE user_id = %s AND chat_id = %s
        """, (user_id, chat_id))

        if not cursor.fetchone():
            return jsonify({"error": "Você não faz parte desse chat ou chat inexistente"}), 400

        cursor.execute("""
            SELECT u.nick, m.content, m.sent_at
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.user_id
            WHERE m.chat_id = %s
            ORDER BY m.sent_at ASC
            LIMIT 20
        """, (chat_id,))

        messages = cursor.fetchall()

        messages_dict = dict()

        for index, messageInfo in enumerate(messages):

            messages_dict[index] = {
                "nick": messageInfo[0] if messageInfo[0] else "unknown user",
                "content": messageInfo[1],
                "sent_at": messageInfo[2]
            }

        return jsonify(messages_dict)
    
    except Exception as e:

        return jsonify({"error": "Erro ao coletar informações do chat", "details": str(e)}), 400
    
    finally:
        
        cursor.close()