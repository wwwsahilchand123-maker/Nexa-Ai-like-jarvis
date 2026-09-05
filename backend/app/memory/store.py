import sqlite3, json
from pathlib import Path
from app.config import settings

class MemoryStore:
    def __init__(self):
        self.path = settings.db_path
        with sqlite3.connect(self.path) as db:
            db.execute("CREATE TABLE IF NOT EXISTS memory (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
            db.execute("CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, command TEXT, intent TEXT, result TEXT, duration_ms INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)")

    def set(self, key, value):
        with sqlite3.connect(self.path) as db:
            db.execute("INSERT OR REPLACE INTO memory(key,value) VALUES(?,?)", (key, json.dumps(value)))

    def get(self, key):
        with sqlite3.connect(self.path) as db:
            row = db.execute("SELECT value FROM memory WHERE key=?", (key,)).fetchone()
        return None if not row else json.loads(row[0])

    def all(self):
        with sqlite3.connect(self.path) as db:
            return [{"key": r[0], "value": json.loads(r[1])} for r in db.execute("SELECT key,value FROM memory")]

    def add_history(self, command, intent, result, duration_ms):
        with sqlite3.connect(self.path) as db:
            db.execute("INSERT INTO history(command,intent,result,duration_ms) VALUES(?,?,?,?)", (command,intent,result,duration_ms))

    def history(self, limit=100):
        with sqlite3.connect(self.path) as db:
            rows = db.execute("SELECT id,command,intent,result,duration_ms,created_at FROM history ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(zip(["id","command","intent","result","duration_ms","created_at"], r)) for r in rows]
