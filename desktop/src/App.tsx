import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Bot, Cpu, HardDrive, Battery, Mic, MicOff,
  Play, RefreshCw, Terminal, Volume2, VolumeX, ShieldAlert,
  Radio, Sparkles, AlertTriangle, Disc
} from "lucide-react";
import {
  connectAgent, EventMessage, getHistory, getMemories,
  getSystemStatus, getTools
} from "./api";
import { playCyberChime, playSuccessChime, playWarningTone } from "./sounds";
import { VoiceRecorder } from "./audioRecorder";

type State = "idle" | "listening" | "planning" | "executing" | "speaking" | "completed" | "failed" | "waiting_confirmation";

const STARK_APPS = [
  { label: "CHROME", cmd: "Chrome kholo", icon: "🌐" },
  { label: "BRAVE", cmd: "Brave kholo", icon: "🦁" },
  { label: "NOTEPAD", cmd: "Notepad kholo", icon: "📝" },
  { label: "CALCULATOR", cmd: "Calculator kholo", icon: "🔢" },
  { label: "SYSTEM INFO", cmd: "System status bata", icon: "⚡" },
  { label: "YOUTUBE", cmd: "YouTube kholo", icon: "▶️" },
  { label: "PDF INTEL", cmd: "Downloads mein PDFs dhund", icon: "📁" },
  { label: "GIT TELEMETRY", cmd: "Git status check kar", icon: "💻" },
  { label: "TIME SYNC", cmd: "Current time kya hai", icon: "⏱️" }
];

export default function App() {
  const [state, setState] = useState<State>("idle");
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [confirm, setConfirm] = useState<any>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [systemStats, setSystemStats] = useState<any>({
    cpu_percent: 28.4,
    ram_percent: 64.2,
    disk_free_gb: 185,
    battery_percent: 88,
    network_sent_mb: 420,
    network_recv_mb: 4800,
    platform: "Windows 11 Stark-OS"
  });

  const ws = useRef<WebSocket | null>(null);

  // Live HUD Clock & Date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setCurrentDate(now.toLocaleDateString("en-US", { day: "2-digit", month: "short", weekday: "long" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live System Telemetry Poll
  useEffect(() => {
    getSystemStatus().then(setSystemStats).catch(() => {});
    const interval = setInterval(() => {
      getSystemStatus().then(setSystemStats).catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let reconnectTimeout: any;
    function initWs() {
      try {
        const socket = connectAgent((e) => {
          setEvents((v) => [...v.slice(-40), e]);
          if (e.type === "state") {
            setState(e.payload.state);
            if (e.payload.state === "listening") setIsRecording(true);
            else if (e.payload.state !== "listening") setIsRecording(false);
          }
          if (e.type === "transcript") setTranscript(e.payload.text);
          if (e.type === "assistant") {
            if (e.payload.requires_confirmation) {
              setConfirm(e.payload);
              playWarningTone(soundEffects);
            } else {
              playSuccessChime(soundEffects);
              if (voiceEnabled && e.payload.text && window.speechSynthesis) {
                try {
                  window.speechSynthesis.cancel();
                  const utter = new SpeechSynthesisUtterance(e.payload.text);
                  utter.rate = 1.05;
                  utter.pitch = 0.95; // Calm deeper JARVIS voice
                  window.speechSynthesis.speak(utter);
                } catch {}
              }
            }
          }
          if (e.type === "tool_result" && e.payload.success) {
            setConfirm(null);
            playSuccessChime(soundEffects);
          }
        });

        socket.onopen = () => setConnected(true);
        socket.onclose = () => {
          setConnected(false);
          reconnectTimeout = setTimeout(initWs, 3000);
        };
        socket.onerror = () => setConnected(false);
        ws.current = socket;
      } catch {
        reconnectTimeout = setTimeout(initWs, 3000);
      }
    }

    initWs();
    return () => {
      clearTimeout(reconnectTimeout);
      ws.current?.close();
    };
  }, [voiceEnabled, soundEffects]);

  const send = (commandText?: string, confirmed = false) => {
    const value = (commandText || text).trim();
    if (!value || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    playCyberChime(soundEffects);
    ws.current.send(JSON.stringify({ text: value, confirmed }));
    setText("");
    setTranscript(value);
  };

  // Dual-Mode Hardware Microphone Voice Engine
  const triggerVoiceListen = async () => {
    if (isRecording) {
      // User clicked stop: send recorded voice to backend
      setIsRecording(false);
      setState("executing");
      setTranscript("Voice command process ho rahi hai...");

      if (recorderRef.current) {
        const wavBlob = recorderRef.current.stop();
        recorderRef.current = null;
        setMicVolume(0);

        if (wavBlob) {
          try {
            const resp = await fetch("http://127.0.0.1:8765/upload-voice", {
              method: "POST",
              body: wavBlob,
              headers: { "Content-Type": "audio/wav" },
            });
            const data = await resp.json();
            if (data.text) {
              setTranscript(data.text);
              playSuccessChime(soundEffects);
            } else {
              setTranscript("Voice samajh nahi aayi. Kripya dubara boliye.");
              setState("idle");
            }
          } catch (e) {
            console.error("Upload error:", e);
            setState("failed");
          }
          return;
        }
      }
      setState("idle");
      return;
    }

    // START recording
    playCyberChime(soundEffects);
    setIsRecording(true);
    setState("listening");
    setTranscript("NEXA sun raha hai... Boliye Sir (Hindi / English)");

    const recorder = new VoiceRecorder();
    recorder.onVolumeChange = (vol) => setMicVolume(vol);
    const started = await recorder.start();

    if (started) {
      recorderRef.current = recorder;
    } else {
      // Fallback to direct Python OS hardware microphone
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ action: "listen" }));
      } else {
        fetch("http://127.0.0.1:8765/listen", { method: "POST" })
          .then((r) => r.json())
          .then((data) => {
            if (data.text) {
              setTranscript(data.text);
              playSuccessChime(soundEffects);
            }
          })
          .catch(() => {})
          .finally(() => setIsRecording(false));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030611] text-cyan-100 font-rajdhani select-none relative overflow-hidden flex flex-col">
      {/* Background CRT Scanlines & Hex Grid */}
      <div className="absolute inset-0 scanlines pointer-events-none z-30 opacity-30" />
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />

      {/* Atmospheric Ambient Core Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HUD BAR - STARK INDUSTRIES HUD */}
      <header className="h-16 px-6 border-b border-cyan-500/30 hud-panel flex items-center justify-between z-20 flex-shrink-0">
        {/* NEXA Brand & Identity */}
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10 rounded-full border-2 border-cyan-400/80 bg-cyan-950/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <div className="h-6 w-6 border border-cyan-400 rotate-45 flex items-center justify-center">
              <span className="text-[11px] font-orbitron font-extrabold text-cyan-300 -rotate-45">N</span>
            </div>
          </div>
          <div>
            <div className="font-orbitron font-extrabold text-lg tracking-widest text-cyan-400 cyan-glow-text flex items-center gap-2">
              NEXA AI <span className="text-amber-400 text-xs font-mono-tech tracking-normal">// AUTONOMOUS OS</span>
            </div>
            <div className="text-[10px] font-mono-tech text-cyan-300/60 uppercase">
              NEXA NEURAL INTELLIGENCE • TACTICAL DESKTOP AGENT
            </div>
          </div>
        </div>

        {/* Center Subtitle / Query */}
        <div className="hidden lg:block text-center font-mono-tech">
          <div className="text-xs text-cyan-300 tracking-wider font-semibold">
            {isRecording ? "VOICE RECOGNITION ACTIVE // LISTENING..." : "NEXA READY // COMMAND IN HINDI OR ENGLISH"}
          </div>
          <div className="text-[11px] text-amber-400/80 tracking-widest mt-0.5">
            NEURAL ENGINE: ACTIVE • 100% OPERATIONAL
          </div>
        </div>

        {/* Top Right Live Time & Controls */}
        <div className="flex items-center gap-5 font-mono-tech text-xs">
          <div className="hidden sm:block text-right">
            <div className="text-xl font-orbitron font-bold text-white tracking-widest">{currentTime}</div>
            <div className="text-[10px] text-amber-400 uppercase tracking-widest">{currentDate}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEffects(!soundEffects)}
              className={`p-2 rounded border ${soundEffects ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]" : "border-white/10 text-white/40"}`}
              title="Toggle Audio Feedback"
            >
              <Radio size={15} />
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded border ${voiceEnabled ? "border-amber-500 text-amber-300 bg-amber-950/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "border-white/10 text-white/40"}`}
              title="Toggle Voice Speech Synthesis"
            >
              {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN COCKPIT BODY */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 relative z-10">
        {/* LEFT PANEL: STARK BRIDGE CONTROL */}
        <aside className="w-64 p-3 flex flex-col justify-between hud-panel rounded-2xl border border-cyan-500/25 flex-shrink-0">
          <div className="space-y-2">
            <div className="text-[10px] font-mono-tech text-amber-400 tracking-widest uppercase border-b border-cyan-500/20 pb-1.5 flex items-center justify-between">
              <span>// BRIDGE CONTROL</span>
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </div>

            {/* Trapezoid Angled Tactical App Buttons */}
            <div className="space-y-1.5 mt-2">
              {STARK_APPS.map(({ label, cmd, icon }) => (
                <button
                  key={cmd}
                  onClick={() => send(cmd)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-cyan-500/20 hover:border-cyan-400/70 text-xs font-mono-tech text-slate-300 hover:text-cyan-200 transition-all flex items-center justify-between group hover:translate-x-1 shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="font-bold tracking-wider">{label}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition">▶</span>
                </button>
              ))}
            </div>
          </div>

          {/* Left Mini Radar / Gauge */}
          <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 font-mono-tech text-[10px]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>AGENT STATUS</span>
              <span className={`font-bold ${connected ? "text-emerald-400" : "text-rose-400"}`}>
                {connected ? "SYNCED (8765)" : "OFFLINE"}
              </span>
            </div>
            <div className="text-slate-500">VOICE ENGINE: OS-HARDWARE MIC</div>
            <div className="text-slate-500">AUTONOMY: WINDOWS 11 READY</div>
          </div>
        </aside>

        {/* CENTER STAGE: IRON MAN WIREFRAME & J.A.R.V.I.S. ARC REACTOR */}
        <main className="flex-1 flex flex-col justify-between relative overflow-hidden hud-panel rounded-2xl border border-cyan-500/25 p-4">
          {/* Iron Man Holographic Chest & Armor Outline SVG in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <svg viewBox="0 0 600 600" className="w-[580px] h-[580px] stroke-cyan-400 fill-none stroke-[1.2]">
              {/* Head Silhouette */}
              <polygon points="300,70 340,90 350,140 335,210 300,230 265,210 250,140 260,90" />
              {/* Helmet Cheekbones & Eyes */}
              <path d="M275,145 L295,150 L275,155 Z" className="fill-cyan-300 filter drop-shadow-[0_0_8px_#00f0ff]" />
              <path d="M325,145 L305,150 L325,155 Z" className="fill-cyan-300 filter drop-shadow-[0_0_8px_#00f0ff]" />
              <line x1="280" y1="180" x2="320" y2="180" />
              {/* Neck & Collar */}
              <path d="M270,220 L240,250 L210,270 L140,290" />
              <path d="M330,220 L360,250 L390,270 L460,290" />
              {/* Shoulders & Chest Plates */}
              <path d="M140,290 L160,380 L230,420 L270,440" />
              <path d="M460,290 L440,380 L370,420 L330,440" />
              <path d="M220,320 L260,340 L260,400 L220,380 Z" />
              <path d="M380,320 L340,340 L340,400 L380,380 Z" />
            </svg>
          </div>

          {/* TOP NOTIFICATION / TRANSCRIPT BANNER */}
          <div className="relative z-20 text-center max-w-xl mx-auto w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-xs font-mono-tech text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-rose-500 animate-ping" : "bg-cyan-400"}`} />
              <span>{isRecording ? "MICROPHONE LIVE // LISTENING..." : state.toUpperCase()}</span>
            </div>
            <div className="mt-2 text-sm text-white font-mono-tech min-h-[22px] tracking-wide">
              {transcript ? `"${transcript}"` : "Click NEXA Core or Mic button to speak in Hindi or English."}
            </div>

            {/* Live Audio Input Volume Bar when Recording */}
            {isRecording && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[10px] font-mono-tech text-cyan-400">MIC:</span>
                <div className="w-48 h-2 bg-slate-900/80 rounded-full border border-cyan-500/40 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 transition-all duration-75"
                    style={{ width: `${Math.max(8, micVolume)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono-tech text-amber-400 w-8 text-left">{micVolume}%</span>
              </div>
            )}
          </div>

          {/* CENTERPIECE: NEXA CONCENTRIC ARC REACTOR WITH LIVE VOICE PULSE */}
          <div className="relative z-20 flex-1 flex items-center justify-center my-auto">
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Layer 1: Outer Segmented Teeth Gear Ring (Clockwise) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30 flex items-center justify-center"
              >
                {/* Outer HUD Tech Cutout Blocks */}
                <div className="absolute -top-2 left-1/4 h-3 w-10 bg-cyan-400/70 rounded-sm" />
                <div className="absolute -bottom-2 right-1/4 h-3 w-10 bg-cyan-400/70 rounded-sm" />
                <div className="absolute top-1/4 -right-2 w-3 h-10 bg-cyan-400/70 rounded-sm" />
                <div className="absolute bottom-1/4 -left-2 w-3 h-10 bg-cyan-400/70 rounded-sm" />
              </motion.div>

              {/* Layer 2: Middle Cyan Track with Yellow Accent Markers (Counter-Clockwise) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-6 rounded-full border-2 border-dashed border-cyan-400/40 flex items-center justify-center"
              >
                {/* Yellow Accent Markers */}
                <div className="absolute top-2 left-1/3 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <div className="absolute top-3 left-1/2 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <div className="absolute top-2 right-1/3 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <div className="absolute bottom-2 left-1/4 w-12 h-1.5 bg-amber-400 rounded shadow-[0_0_8px_#fbbf24]" />
              </motion.div>

              {/* Layer 3: Tech Degree Scale & Crosshairs */}
              <div className="absolute inset-12 rounded-full border border-cyan-300/30 flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-400/20" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/20" />
              </div>

              {/* Layer 4: Interactive Central NEXA Core Button */}
              <motion.button
                onClick={triggerVoiceListen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: isRecording ? 1 + (micVolume / 100) * 0.1 : 1,
                  boxShadow: isRecording
                    ? ["0 0 40px #f43f5e", "0 0 80px #f43f5e", "0 0 40px #f43f5e"]
                    : ["0 0 30px #00f0ff", "0 0 60px #00f0ff", "0 0 30px #00f0ff"]
                }}
                transition={{ duration: isRecording ? 0.1 : 2, repeat: isRecording ? 0 : Infinity }}
                className={`relative z-30 h-44 w-44 rounded-full flex flex-col items-center justify-center border-4 ${
                  isRecording
                    ? "border-rose-500 bg-rose-950/70 shadow-[0_0_60px_#f43f5e]"
                    : "border-cyan-400 bg-cyan-950/60 shadow-[0_0_60px_#00f0ff]"
                } backdrop-blur-md cursor-pointer group`}
                title={isRecording ? "Stop voice listening (or Click to Submit)" : "Click to speak in Hindi/English"}
              >
                {/* Arc Core Center Glow */}
                <div className="absolute inset-3 rounded-full border border-dashed border-cyan-300/40 animate-spin-slow" />
                
                {/* Core Icon & Branding */}
                {isRecording ? (
                  <MicOff size={40} className="text-rose-400 animate-pulse" />
                ) : (
                  <Mic size={40} className="text-cyan-300 group-hover:text-white transition-all drop-shadow-[0_0_12px_#00f0ff]" />
                )}

                <div className="font-orbitron font-extrabold text-xl tracking-[0.25em] text-white mt-2 cyan-glow-text">
                  NEXA
                </div>
                <div className="text-[9px] font-mono-tech text-amber-400 tracking-widest uppercase mt-0.5">
                  {isRecording ? "• REC LIVE •" : "VOICE PTT"}
                </div>
              </motion.button>
            </div>
          </div>

          {/* BOTTOM COMMAND CONSOLE */}
          <div className="relative z-20 w-full max-w-2xl mx-auto pt-2">
            <div className="hud-panel rounded-xl p-2.5 flex items-center gap-2 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <button
                onClick={triggerVoiceListen}
                className={`h-10 w-10 rounded-lg grid place-items-center transition ${
                  isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40"
                }`}
                title={isRecording ? "Stop voice listening" : "Click to speak"}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Give a command (e.g. 'Brave kholo', 'Notepad kholo', 'System status bata')..."
                className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-slate-500 font-mono-tech tracking-wide"
              />

              <button
                onClick={() => send()}
                className="h-10 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-extrabold text-xs tracking-widest flex items-center gap-1.5 transition cyan-glow active:scale-95"
              >
                <Play size={13} /> EXECUTE
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] font-mono-tech text-cyan-400/60 px-2">
              <span>[MIC CORE] Real Hardware PC Voice Input</span>
              <span>[ENTER] Transmit Command</span>
              <span>[HINDI / ENGLISH] Supported</span>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: LIVE TELEMETRY GAUGES & EVENT LOG (IMAGE 3 STYLE) */}
        <aside className="w-80 p-3 flex flex-col justify-between hud-panel rounded-2xl border border-cyan-500/25 flex-shrink-0 font-mono-tech">
          {/* Circular Radar Arc Gauges */}
          <div className="space-y-3">
            <div className="text-[10px] text-amber-400 tracking-widest uppercase border-b border-cyan-500/20 pb-1.5 flex items-center justify-between">
              <span>// SYSTEM TELEMETRY</span>
              <Activity size={14} className="text-cyan-400 animate-pulse" />
            </div>

            {/* Circular Arc Dial Meters for CPU & RAM */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {/* CPU Meter */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 relative">
                <div className="text-[10px] text-slate-400">CPU LOAD</div>
                <div className="text-2xl font-orbitron font-bold text-cyan-400 mt-1">
                  {systemStats.cpu_percent}%
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${systemStats.cpu_percent}%` }} />
                </div>
              </div>

              {/* RAM Meter */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 relative">
                <div className="text-[10px] text-slate-400">RAM USAGE</div>
                <div className="text-2xl font-orbitron font-bold text-amber-400 mt-1">
                  {systemStats.ram_percent}%
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${systemStats.ram_percent}%` }} />
                </div>
              </div>
            </div>

            {/* Storage & Power */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">PRIMARY DISK:</span>
                <span className="text-cyan-300 font-bold">{systemStats.disk_free_gb} GB FREE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">POWER SOURCE:</span>
                <span className="text-emerald-400 font-bold">{systemStats.battery_percent ? `${systemStats.battery_percent}%` : "AC STABLE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">NETWORK I/O:</span>
                <span className="text-slate-300">▲ {systemStats.network_sent_mb}MB ▼ {systemStats.network_recv_mb}MB</span>
              </div>
            </div>
          </div>

          {/* Event Log Matrix */}
          <div className="flex-1 flex flex-col justify-between mt-3 overflow-hidden border-t border-cyan-500/20 pt-2">
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Terminal size={12} /> NEURAL EXECUTION LOG
            </div>
            <div className="flex-1 overflow-y-auto scrollbar space-y-1.5 pr-1 max-h-56">
              <AnimatePresence initial={false}>
                {events.map((e: EventMessage, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 rounded bg-black/50 border border-cyan-500/15 text-[10px]"
                  >
                    <div className="text-cyan-400 font-bold flex items-center justify-between">
                      <span>[{e.type}]</span>
                      <span className="opacity-40">#{i + 1}</span>
                    </div>
                    <pre className="mt-0.5 whitespace-pre-wrap break-words text-slate-300 font-sans text-[10px]">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </div>

      {/* Futuristic Security Override Modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md grid place-items-center p-6 z-50 font-mono-tech"
          >
            <div className="hud-panel max-w-lg w-full rounded-2xl p-6 border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-base text-amber-400">SECURITY PROTOCOL OVERRIDE</div>
                  <div className="text-[10px] text-slate-400">Authorization required to execute action.</div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                {confirm.text}
              </div>

              <pre className="mt-3 p-3 rounded bg-black/60 text-[11px] text-cyan-300 font-mono overflow-auto border border-white/5 max-h-40">
                {JSON.stringify(confirm.args, null, 2)}
              </pre>

              <div className="mt-5 flex justify-end gap-3 font-orbitron text-xs">
                <button
                  onClick={() => setConfirm(null)}
                  className="px-4 py-2 rounded bg-white/10 hover:bg-white/15 text-slate-300"
                >
                  ABORT
                </button>
                <button
                  onClick={() => send(confirm.text, true)}
                  className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  CONFIRM & RUN
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
