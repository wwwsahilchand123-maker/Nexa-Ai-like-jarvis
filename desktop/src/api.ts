export type EventMessage = { type: string; payload: any };

export function connectAgent(onEvent: (e: EventMessage) => void) {
  const ws = new WebSocket("ws://127.0.0.1:8765/ws");
  ws.onmessage = (e) => onEvent(JSON.parse(e.data));
  return ws;
}

export async function getHealth() {
  const r = await fetch("http://127.0.0.1:8765/health");
  return r.json();
}

export async function getTools() {
  const r = await fetch("http://127.0.0.1:8765/tools");
  return r.json();
}

export async function getHistory() {
  const r = await fetch("http://127.0.0.1:8765/history");
  return r.json();
}

export async function getMemories() {
  const r = await fetch("http://127.0.0.1:8765/memory");
  return r.json();
}

export async function saveMemory(key: string, value: any) {
  const r = await fetch("http://127.0.0.1:8765/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value })
  });
  return r.json();
}

export async function getSystemStatus() {
  const r = await fetch("http://127.0.0.1:8765/system");
  return r.json();
}

