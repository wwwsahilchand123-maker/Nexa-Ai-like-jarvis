# Architecture

```text
Electron shell
   |
React UI <----WebSocket----> FastAPI Agent Service
                              |
                              +-- Intent / Planner
                              +-- Tool Registry
                              |     +-- Windows
                              |     +-- Filesystem
                              |     +-- Browser
                              |     +-- Terminal
                              |     +-- System
                              +-- Memory
                              +-- Automations
                              +-- Security / Permissions
                              +-- AI / STT / TTS provider abstractions
                              +-- SQLite
```

## Event model
The backend emits:
- `state`
- `transcript`
- `plan`
- `tool_start`
- `tool_result`
- `assistant`
- `error`
- `task_complete`

The frontend renders actual backend state; it does not fake execution progress.

## Agent flow
1. Normalize Hindi/Hinglish/English text.
2. Detect intent.
3. Create a safe plan.
4. Check permission.
5. Ask confirmation when required.
6. Execute a tool.
7. Verify the result.
8. Record history.
9. Respond in natural language.

## Extension
AI providers and voice providers implement interfaces so they can be swapped without changing the agent or UI.
