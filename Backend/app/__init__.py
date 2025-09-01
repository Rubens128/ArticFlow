from flask import Flask, jsonify
from dotenv import load_dotenv
from app.db import init_db
from app.routes.auth_routes import auth_routes, init_auth_limits
from app.websocket.socket_config import socketio
from flask_cors import CORS
import os


def ratelimit_handler(e):

    retry = getattr(e, "retry_after", None)

    msg = "Muitas tentativas. Tente novamente em alguns instantes."

    if retry is not None:
        msg = f"Muitas tentativas. Tente novamente em {int(retry)}s."
            
    return jsonify({"error": msg}), 429


def create_app():

    load_dotenv()

    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    
    app.register_blueprint(auth_routes)

    CORS(app, supports_credentials=True)

    init_db(app)

    init_auth_limits(app)

    socketio.init_app(app)

    from app.websocket import socket_events

    app.register_error_handler(429, ratelimit_handler)

    return app