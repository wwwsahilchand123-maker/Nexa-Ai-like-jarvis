from app.tools.system import SystemStatusTool
from app.tools.windows import OpenApplicationTool, OpenUrlTool
from app.tools.filesystem import SearchFilesTool, RenameFileTool, DeleteFileTool
from app.tools.terminal import TerminalTool
from app.tools.browser import BrowserSearchTool

class ToolRegistry:
    def __init__(self):
        self.tools = {
            t.name: t for t in [
                SystemStatusTool(), OpenApplicationTool(), OpenUrlTool(),
                SearchFilesTool(), RenameFileTool(), DeleteFileTool(),
                TerminalTool(), BrowserSearchTool()
            ]
        }

    def get(self, name):
        return self.tools.get(name)

    def list(self):
        return list(self.tools.values())
