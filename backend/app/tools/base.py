from dataclasses import dataclass
from typing import Any, Protocol
from app.security.permissions import Permission

@dataclass
class ToolResult:
    success: bool
    message: str
    data: Any = None
    error: str | None = None

class Tool(Protocol):
    name: str
    description: str
    permission: Permission
    def execute(self, **kwargs: Any) -> ToolResult: ...
