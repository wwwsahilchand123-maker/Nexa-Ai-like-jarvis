import re
from dataclasses import dataclass
from app.tools.registry import ToolRegistry

@dataclass
class Plan:
    intent: str
    tool: str | None
    args: dict
    reply: str

class Planner:
    def __init__(self, registry: ToolRegistry):
        self.registry = registry

    def plan(self, text: str) -> Plan:
        t = text.strip().lower()

        if any(x in t for x in ["system status", "system bata", "cpu", "ram", "battery", "storage", "kitni storage"]):
            return Plan("system_status", "system_status", {}, "System status nikal raha hoon.")

        if ("chrome" in t or "brave" in t or "browser" in t) and any(x in t for x in ["khol", "open", "chala"]):
            target_app = "brave" if "brave" in t else "chrome" if "chrome" in t else "browser"
            return Plan("open_application", "open_application", {"application": target_app}, f"{target_app.capitalize()} open kar raha hoon.")

        if ("vs code" in t or "vscode" in t) and any(x in t for x in ["khol", "open", "chala"]):
            return Plan("open_application", "open_application", {"application": "vs code"}, "VS Code open kar raha hoon.")

        if "google" in t and "search" in t:
            q = re.sub(r".*google.*?search\s*(?:kar|karo|kar do)?\s*", "", text, flags=re.I).strip() or text
            return Plan("browser_search", "browser_search", {"query": q}, "Google par search kar raha hoon.")

        if "download" in t and ("pdf" in t or "file" in t or "zip" in t):
            pattern = "*.pdf" if "pdf" in t else "*.zip" if "zip" in t else "*"
            return Plan("search_files", "search_files", {"folder": str(__import__("pathlib").Path.home() / "Downloads"), "pattern": pattern}, "Downloads check kar raha hoon.")

        from datetime import datetime

        if any(x in t for x in ["hello", "namaste", "hi nexa", "kya haal", "kaise ho", "tum kaun ho", "who are you"]):
            return Plan("greeting", None, {}, "Namaste! Main NEXA AI hoon — aapka advanced Windows desktop voice agent. Main apps open kar sakta hoon, system monitor kar sakta hoon, files dhund sakta hoon, aur commands run kar sakta hoon.")

        if any(x in t for x in ["time kya", "kitne baje", "kya time", "current time"]):
            now_time = datetime.now().strftime("%I:%M %p")
            return Plan("time", None, {}, f"Abhi samay {now_time} ho raha hai.")

        if any(x in t for x in ["date kya", "aaj kya date", "aaj ki date", "current date"]):
            today = datetime.now().strftime("%A, %d %B %Y")
            return Plan("date", None, {}, f"Aaj {today} hai.")

        if any(x in t for x in ["git status", "git log", "git diff", "node -v", "npm -v", "python --version"]):
            cmd = "git status" if "status" in t else "git log -n 5" if "log" in t else text.strip()
            return Plan("terminal", "terminal", {"command": cmd}, f"Command '{cmd}' execute kar raha hoon.")

        if "youtube" in t and any(x in t for x in ["khol", "open", "chala"]):
            return Plan("open_url", "open_url", {"url": "https://www.youtube.com"}, "YouTube open kar raha hoon.")

        if "github" in t and any(x in t for x in ["khol", "open", "chala"]):
            return Plan("open_url", "open_url", {"url": "https://www.github.com"}, "GitHub open kar raha hoon.")

        if t in {"stop", "cancel", "ruk ja", "task cancel kar"}:
            return Plan("cancel", None, {}, "Theek hai, task stop kar diya.")

        if t.startswith("open ") or " kholo" in t or " khol do" in t:
            app = re.sub(r"^(open|kholo|khol do)\s+", "", text, flags=re.I).strip()
            app = app.replace("khol do","").replace("kholo","").strip()
            return Plan("open_application", "open_application", {"application": app}, f"{app} open kar raha hoon.")

        return Plan("unknown", None, {}, "Ye command samajh nahi aayi. Thoda specific bolo—jaise 'Chrome kholo', 'System status bata', ya 'Downloads mein PDFs dhund'.")
