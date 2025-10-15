from functools import wraps
from flask import request, jsonify, current_app, g
import jwt

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get("token")

        if not token:
            return jsonify({"erro": "Token ausente. Faça login novamente."}), 401
        
        try:
            
            payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"], leeway=10)
            g.user_id = payload["user_id"]
            g.nick = payload["nick"]

        except jwt.ExpiredSignatureError:
            return jsonify({"erro": "Token expirado. Faça login novamente."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"erro": "Token inválido. Acesso negado."}), 401

        return f(*args, **kwargs)

    return decorated_function