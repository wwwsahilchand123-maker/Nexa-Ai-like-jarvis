import os, subprocess, shutil
from app.tools.base import ToolResult
from app.security.permissions import Permission

COMMON_APPS = {
    "chrome": ["chrome.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
    "google chrome": ["chrome.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
    "edge": ["msedge.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
    "microsoft edge": ["msedge.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
    "vscode": ["code", "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"],
    "vs code": ["code", "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"],
    "brave": ["brave.exe", "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe", "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"],
    "browser": ["brave.exe", "chrome.exe", "msedge.exe"],
    "notepad": ["notepad.exe"],
    "explorer": ["explorer.exe"],
    "calc": ["calc.exe"],
    "calculator": ["calc.exe"],
    "terminal": ["wt.exe", "cmd.exe"],
    "cmd": ["cmd.exe"],
    "powershell": ["powershell.exe"],
    "task manager": ["taskmgr.exe"],
    "taskmgr": ["taskmgr.exe"],
}

class OpenApplicationTool:
    name = "open_application"
    description = "Open a known Windows application."
    permission = Permission.SAFE

    def execute(self, application: str, **kwargs):
        key = application.strip().lower()
        candidates = COMMON_APPS.get(key, [application])
        for candidate in candidates:
            candidate = os.path.expandvars(candidate)
            if shutil.which(candidate) or os.path.exists(candidate) or candidate.endswith(".exe"):
                try:
                    subprocess.Popen([candidate], shell=False)
                    return ToolResult(True, f"{application} open kar diya.")
                except Exception as e:
                    last = str(e)
        return ToolResult(False, f"{application} nahi mila. PATH ya executable path check karo.", error=locals().get("last"))

class OpenUrlTool:
    name = "open_url"
    description = "Open a URL using the Windows default browser."
    permission = Permission.SAFE

    def execute(self, url: str, **kwargs):
        import webbrowser
        webbrowser.open(url)
        return ToolResult(True, f"{url} open kar diya.")
