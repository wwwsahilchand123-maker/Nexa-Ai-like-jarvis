from app.tools.base import ToolResult
from app.security.permissions import Permission

class BrowserSearchTool:
    name = "browser_search"
    description = "Open a web search in the default browser."
    permission = Permission.SAFE

    def execute(self, query: str, **kwargs):
        import urllib.parse, webbrowser
        url = "https://www.google.com/search?q=" + urllib.parse.quote_plus(query)
        webbrowser.open(url)
        return ToolResult(True, f"Google par {query} search kar diya.", {"url": url})
