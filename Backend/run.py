from app import create_app
from app.websocket.socket_config import socketio
from app.routes.ai_routes import load_chatterBox
import os

app = create_app()

if __name__ == "__main__":
    
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        load_chatterBox()
    socketio.run(app, debug=True)