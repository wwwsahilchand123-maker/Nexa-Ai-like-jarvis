from typing import Protocol
from dataclasses import dataclass

class AIProvider(Protocol):
    def respond(self, prompt: str, context: list[dict]) -> str: ...

class DemoAIProvider:
    def respond(self, prompt: str, context: list[dict]) -> str:
        return "Samajh gaya. Main available local tools ke through task execute kar raha hoon."
