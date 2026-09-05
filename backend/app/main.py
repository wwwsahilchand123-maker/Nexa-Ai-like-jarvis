import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import speech_recognition as sr
from app.tools.registry import ToolRegistry
from app.memory.store import MemoryStore
from app.agent.engine import AgentEngine

app = FastAPI(title="NEXA AI Agent Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

registry = ToolRegistry()
memory = MemoryStore()
engine = AgentEngine(registry, memory)

class Command(BaseModel):
    text: str
    confirmed: bool = False

import io
import wave
import os
from fastapi import Request

def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    recognizer = sr.Recognizer()
    try:
        # Save last received voice sample for diagnostics
        os.makedirs("data", exist_ok=True)
        with open("data/last_voice.wav", "wb") as f:
            f.write(audio_bytes)

        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            rate = wf.getframerate()
            frames = wf.getnframes()
            ch = wf.getnchannels()
            dur = frames / float(rate) if rate > 0 else 0
            print(f"[VOICE] Received {len(audio_bytes)} bytes | Duration: {dur:.2f}s | Rate: {rate}Hz | Channels: {ch}")
    except Exception as e:
        print(f"[VOICE] Inspect WAV error: {e}")

    try:
        with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
            audio = recognizer.record(source)
            for lang in ["hi-IN", "en-IN", "en-US"]:
                try:
                    txt = recognizer.recognize_google(audio, language=lang)
                    if txt and txt.strip():
                        print(f"[VOICE SUCCESS] Recognized ({lang}): '{txt.strip()}'")
                        return txt.strip()
                except sr.UnknownValueError:
                    continue
                except Exception as e:
                    print(f"[VOICE API Error] ({lang}): {e}")
    except Exception as e:
        print(f"[VOICE Error] AudioFile parse error: {e}")
    return ""

def record_and_transcribe(timeout=10, phrase_time_limit=12):
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 120
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.8

    # Try Sound Mapper (device 0 = Windows default active mic, e.g. Mivi DuoPods / USB / Builtin)
    for dev_idx in [0, None]:
        try:
            with sr.Microphone(device_index=dev_idx) as source:
                recognizer.adjust_for_ambient_noise(source, duration=0.25)
                if recognizer.energy_threshold > 250:
                    recognizer.energy_threshold = 180
                print(f"[OS MIC] Listening on device {dev_idx} (threshold: {recognizer.energy_threshold})...")
                audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            
            for lang in ["hi-IN", "en-IN", "en-US"]:
                try:
                    txt = recognizer.recognize_google(audio, language=lang)
                    if txt and txt.strip():
                        print(f"[OS MIC SUCCESS] ({lang}): '{txt.strip()}'")
                        return txt.strip()
                except Exception:
                    continue
        except Exception as e:
            print(f"[OS MIC dev {dev_idx}] Error: {e}")
            continue
    return ""

@app.get("/health")
def health():
    return {"ok": True, "service": "nexa-agent"}

@app.get("/system")
def system_info():
    tool = registry.get("system_status")
    return tool.execute().data if tool else {}

@app.get("/tools")
def tools():
    return [{"name": t.name, "description": t.description, "permission": t.permission.value} for t in registry.list()]

@app.get("/history")
def history():
    return memory.history()

@app.get("/memory")
def memories():
    return memory.all()

@app.post("/command")
async def command(body: Command):
    events = []
    async def emit(kind, payload):
        events.append({"type": kind, "payload": payload})
    result = await engine.run(body.text, body.confirmed, emit)
    return {"result": result, "events": events}

@app.post("/upload-voice")
async def upload_voice(request: Request):
    audio_data = await request.body()
    if not audio_data:
        return {"success": False, "message": "No audio received"}
    loop = asyncio.get_running_loop()
    text = await loop.run_in_executor(None, transcribe_audio_bytes, audio_data)
    if not text:
        return {"success": False, "message": "Voice sunai nahi di ya match nahi hui."}
    events = []
    async def emit(kind, payload):
        events.append({"type": kind, "payload": payload})
    result = await engine.run(text, False, emit)
    return {"success": True, "text": text, "result": result, "events": events}

@app.post("/listen")
async def listen_voice():
    events = []
    async def emit(kind, payload):
        events.append({"type": kind, "payload": payload})
    loop = asyncio.get_running_loop()
    text = await loop.run_in_executor(None, record_and_transcribe, 8, 10)
    if not text:
        return {"success": False, "message": "Voice sunai nahi di ya timeout ho gaya."}
    result = await engine.run(text, False, emit)
    return {"success": True, "text": text, "result": result, "events": events}

@app.post("/memory")
def set_memory(body: dict):
    memory.set(body["key"], body["value"])
    return {"ok": True}

@app.websocket("/ws")
async def websocket(ws: WebSocket):
    await ws.accept()
    async def emit(kind, payload):
        await ws.send_json({"type": kind, "payload": payload})
    try:
        while True:
            msg = await ws.receive_json()
            if msg.get("action") == "listen":
                await emit("state", {"state": "listening"})
                loop = asyncio.get_running_loop()
                spoken_text = await loop.run_in_executor(None, record_and_transcribe, 8, 10)
                if not spoken_text:
                    await emit("assistant", {"text": "Aapki aawaz record nahi hui. Kripya dubara boliye."})
                    await emit("state", {"state": "failed"})
                    continue
                await emit("transcript", {"text": spoken_text})
                await engine.run(spoken_text, False, emit)
                continue

            text = msg.get("text", "")
            confirmed = bool(msg.get("confirmed", False))
            await emit("transcript", {"text": text})
            await engine.run(text, confirmed, emit)
    except WebSocketDisconnect:
        pass
