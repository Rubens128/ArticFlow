from flask import Blueprint, request, jsonify
from faster_whisper import WhisperModel
from chatterbox.tts import ChatterboxTTS
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

import torchaudio as ta
import torch, io
import base64, os, tempfile, subprocess
import requests

ai_routes = Blueprint("ai_routes", __name__)

whisper_model = WhisperModel("base", device="cpu", compute_type="int8")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")

SYSTEM_DEFAULT = "Responda em PT-BR, seja objetivo e evite inventar fatos"

MODEL = None
MULTILINGUALMODEL = None

def build_messages(history, message):

    history = history if isinstance(history, list) else []

    system = next((m for m in history if m.get("role") == "system"), None)
    messages = [{"role": "system", "content":  system["content"] if system else SYSTEM_DEFAULT}]

    for m in history:
        role, content = m.get("role"), m.get("content", "").strip()
        
        if role in ("user", "assistant") and content:
            
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    system_msg = messages[0]
    rest = messages[1:][-9:]

    return [system_msg] + rest


def to_wav16k_mono(src_path: str, dst_path: str):
    subprocess.check_call([
        "ffmpeg", "-y", "-i", src_path,
        "-ac", "1",  "-ar", "16000", "-f", "wav", dst_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

@ai_routes.route("/ai/chat", methods=["POST"])

def ai_chat_question():
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []
    temperature = float(data.get("temperature", 0.2))
    max_tokens = int(data.get("max_tokens", 512))

    if not message:
        return jsonify({"error": "campo 'message' é obrigatório"}), 400

    payload = {
        "model": OLLAMA_MODEL,
        "messages": build_messages(history, message),
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens
        }
    }

    try:
        resp = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        reply = (data.get("message", {}).get("content") or "").strip()
        finish_reason = "stop" if data.get("done") else "unknown"

        return jsonify({
            "reply": reply,
            "model": data.get("model", OLLAMA_MODEL),
            "finish_reason": finish_reason
        }), 200
    
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "falha ao chamar o Ollama",
            "details": str(e)
        }), 502
    
@ai_routes.route("/ai/stt", methods=["POST"])

def stt():
    if "audio" not in request.files:
        return jsonify(error="arquivo 'audio' ausente"), 400

    f = request.files["audio"]

    with tempfile.TemporaryDirectory() as td:
        in_path = os.path.join(td, "in.webm")
        wav_path = os.path.join(td, "in.wav")
        f.save(in_path)

        to_wav16k_mono(in_path, wav_path)

        segments, info = whisper_model.transcribe(wav_path, language="pt")
        text = "".join(seg.text for seg in segments).strip()
        return jsonify(transcript=text)

def load_chatterBox():

    global MODEL
    global MULTILINGUALMODEL

    device = "cuda" if torch.cuda.is_available() else "cpu"

    torch.set_grad_enabled(False)

    try:

        MULTILINGUALMODEL = ChatterboxMultilingualTTS.from_pretrained(device=device)
        MODEL = ChatterboxTTS.from_pretrained(device=device)

        _ = MULTILINGUALMODEL.generate("ok", language_id="pt")
        _ = MODEL.generate("ok")

        print(f"ChatterboxMultilingual e TTS carregados em {device}.")

    except Exception as e:
        
        raise RuntimeError(f"Falha ao carregar Chatterbox: {e}")


@ai_routes.route("/ai/tts", methods=["POST"])

def ai_tts():

    if not MODEL or not MULTILINGUALMODEL:
        return jsonify({"error": "Modelos chatterbox não carregados"}),500

    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    language = data.get("language") or "pt"

    if not text:
        return jsonify({"error": "Campo 'text' é obrigatório"}),400
    
    try:
        wav = MULTILINGUALMODEL.generate(text, language_id=language)

        buf = io.BytesIO()

        ta.save(buf, wav, sample_rate=MULTILINGUALMODEL.sr, format="wav")

        buf.seek(0)

        audio_base64 = base64.b64encode(buf.read()).decode("ascii")

        return jsonify({"wav_base64": audio_base64})
    
    except Exception as e:

        return jsonify({"error": f"Erro ao criar audio: {e}"}),500