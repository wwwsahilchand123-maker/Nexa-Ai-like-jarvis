from pathlib import Path
from app.tools.base import ToolResult
from app.security.permissions import Permission

class SearchFilesTool:
    name = "search_files"
    description = "Search a folder for files by extension/name."
    permission = Permission.SAFE

    def execute(self, folder: str = "", pattern: str = "*", **kwargs):
        base = Path(folder).expanduser() if folder else Path.home() / "Downloads"
        if not base.exists():
            return ToolResult(False, f"Folder nahi mila: {base}")
        matches = [str(p) for p in base.rglob(pattern) if p.is_file()][:200]
        return ToolResult(True, f"{len(matches)} files mili.", {"folder": str(base), "files": matches})

class RenameFileTool:
    name = "rename_file"
    description = "Rename a file. Requires confirmation."
    permission = Permission.SENSITIVE

    def execute(self, source: str, destination: str, **kwargs):
        s, d = Path(source).expanduser(), Path(destination).expanduser()
        d.parent.mkdir(parents=True, exist_ok=True)
        s.rename(d)
        return ToolResult(True, f"File rename ho gayi: {d}")

class DeleteFileTool:
    name = "delete_file"
    description = "Delete a file or empty directory. Requires confirmation."
    permission = Permission.DESTRUCTIVE

    def execute(self, path: str, **kwargs):
        p = Path(path).expanduser()
        if p.is_file():
            p.unlink()
        elif p.is_dir():
            p.rmdir()
        else:
            return ToolResult(False, "Path nahi mila.")
        return ToolResult(True, "Delete operation complete.")
