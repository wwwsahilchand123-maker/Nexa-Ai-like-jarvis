from typing import Protocol

class STTProvider(Protocol):
    def transcribe(self, audio: bytes) -> str: ...

class DemoSTTProvider:
    def transcribe(self, audio: bytes) -> str:
        return ""
