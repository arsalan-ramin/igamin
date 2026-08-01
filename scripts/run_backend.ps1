$env:DATA_FILE = "backend/data/architecture_seed.json"
$env:ALLOWED_ORIGINS = "http://localhost:5000,http://127.0.0.1:5000"
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
