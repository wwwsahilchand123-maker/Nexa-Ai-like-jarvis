# NEXA AI — Advanced Windows Desktop AI Agent

NEXA AI is a modular Windows desktop AI voice-agent foundation built from the supplied specification. It is designed for natural Hindi/Hinglish/English commands, controlled Windows automation, file intelligence, browser automation, system monitoring, local memory, automations, command history, permissions, and a premium desktop UI.

## Important
The supplied attachment is a **project specification, not source code**. This package converts that specification into an organized, runnable project foundation. External AI/STT/TTS providers still require the user's own credentials/configuration.

## Stack
- Desktop: Electron + React + TypeScript + Vite
- UI: Tailwind CSS + Framer Motion
- Agent service: Python + FastAPI + WebSocket
- Storage: SQLite
- Browser automation: Playwright
- Windows automation: Python subprocess / psutil / pyautogui where configured
- Validation: Pydantic
- Tests: pytest + Vitest

## Requirements
- Windows 11
- Node.js 20+
- Python 3.11+
- npm
- Optional: Git, Docker, VS Code
- Optional: Playwright browser binaries

## Quick Start (1-Click Run)

### Windows 1-Click Launch:
Simply double-click:
- **`START_NEXA.bat`** in the root folder: Automatically starts the Python FastAPI backend and launches the Electron desktop application.
- **`START_WEB.bat`**: Starts the backend and opens the Web interface directly in your browser.

---

## Manual Quick start

### 1. Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8765
```

### 2. Frontend/Desktop
In another terminal:
```powershell
cd desktop
npm install
npm run dev
```

For Electron + Vite development, use:
```powershell
npm run electron:dev
```

### 3. Production
```powershell
cd desktop
npm run build
npm run dist
```

The installer configuration is in `desktop/electron-builder.yml`.

## AI / Voice providers
Provider interfaces are intentionally abstracted:
- `backend/app/providers/ai.py`
- `backend/app/providers/stt.py`
- `backend/app/providers/tts.py`

The default demo provider is deterministic and local so the app can run without an API key. Add a real provider behind the same interface rather than hard-coding credentials.

## Safety
Tools are permissioned:
- SAFE: automatic
- SENSITIVE: configurable confirmation
- DESTRUCTIVE: confirmation required

The terminal tool uses an allowlist by default. Do not disable the security layer just to make the demo appear more capable.

## Project layout
```text
nexa-ai/
  desktop/
    src/
    electron/
    package.json
    electron-builder.yml
  backend/
    app/
      agent/
      api/
      automation/
      memory/
      providers/
      security/
      storage/
      tools/
      voice/
    tests/
    requirements.txt
  docs/
  scripts/
  .env.example
  .gitignore
```

## First run
Open the app, choose Demo Mode if you do not have providers configured, and test:
- "Chrome kholo"
- "System status bata"
- "Downloads mein PDFs dhund"
- "Git status check kar"

The demo agent routes these to real local tools where available and simulates unsafe actions.

## Adding tools
Implement the `Tool` protocol in `backend/app/tools/base.py`, register the tool in `backend/app/tools/registry.py`, and define its permission level.

## Troubleshooting
If Chrome/VS Code is not found, use the full executable path in `backend/app/config.py` or configure PATH. If microphone access is unavailable, use push-to-talk or configure an STT provider.

## Security note
Never commit `.env`, API keys, access tokens, cookies, browser profiles, or private credentials.
