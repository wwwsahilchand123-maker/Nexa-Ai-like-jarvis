Set-Location "$PSScriptRoot\..\backend"
if (!(Test-Path ".venv")) { python -m venv .venv }
& ".\.venv\Scripts\pip.exe" install -r requirements.txt
if (!(Test-Path ".env")) { Copy-Item ".env.example" ".env" }
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8765
