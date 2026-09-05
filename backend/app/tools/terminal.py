import subprocess, shlex
from app.tools.base import ToolResult
from app.security.permissions import Permission
from app.config import settings

class TerminalTool:
    name = "terminal"
    description = "Run an allowlisted development/system command."
    permission = Permission.SENSITIVE

    def execute(self, command: str, cwd: str | None = None, confirmed: bool = False, **kwargs):
        parts = shlex.split(command, posix=False)
        if not parts:
            return ToolResult(False, "Empty command.")
        executable = parts[0].strip('"').lower()
        if executable not in settings.terminal_allowlist:
            return ToolResult(False, f"Command blocked by security policy: {executable}")
        try:
            p = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True, timeout=60)
            output = (p.stdout + "\n" + p.stderr).strip()
            return ToolResult(p.returncode == 0, output or "Command completed.", {"returncode": p.returncode})
        except subprocess.TimeoutExpired:
            return ToolResult(False, "Command timed out.")
        except Exception as e:
            return ToolResult(False, "Command execute nahi ho paaya.", error=str(e))
