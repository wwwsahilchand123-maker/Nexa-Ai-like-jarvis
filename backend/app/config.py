from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ai_provider: str = "demo"
    ai_api_key: str = ""
    ai_model: str = ""
    stt_provider: str = "demo"
    stt_api_key: str = ""
    tts_provider: str = "demo"
    tts_api_key: str = ""
    nexa_host: str = "127.0.0.1"
    nexa_port: int = 8765
    nexa_demo_mode: bool = True
    nexa_allowed_terminal_commands: str = "git,status,python,npm,node,docker"
    nexa_db_path: str = "./data/nexa.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def db_path(self) -> Path:
        p = Path(self.nexa_db_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def terminal_allowlist(self) -> set[str]:
        return {x.strip().lower() for x in self.nexa_allowed_terminal_commands.split(",") if x.strip()}

settings = Settings()
