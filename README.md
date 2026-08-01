# OLG iGaming Architecture Knowledge Platform

This workspace contains a two-service Python project:

- `frontend/`: Flask-based architecture experience UI
- `backend/`: FastAPI-based architecture knowledge API

## Features included

- Visual architecture landing page with clickable application overlays
- Application detail page with capabilities, dependencies, and document references
- Architecture metadata search
- Architecture copilot endpoint (starter placeholder)
- Relationships API for dependency exploration
- Seed data for applications, documents, and relationships
- Docker Compose support

## Project structure

- `backend/app/main.py` - FastAPI app entry point
- `backend/app/routers/` - API endpoint routers
- `backend/app/services/repository.py` - seed data repository/query logic
- `backend/data/architecture_seed.json` - architecture metadata seed
- `frontend/app.py` - Flask app entry point
- `frontend/templates/` - Jinja templates for landing/details pages
- `frontend/static/js/` - UI behavior for map/search/copilot/details
- `frontend/static/css/styles.css` - responsive styling
- `scripts/load_seed.py` - quick seed validation script
- `scripts/run_backend.ps1` - local backend start script
- `scripts/run_frontend.ps1` - local frontend start script

## Diagram image

Copy your architecture screenshot into:

- `frontend/static/images/igaming-architecture.png`

If the image is missing, the UI shows a placeholder panel.

## Local setup (Windows PowerShell)

1. Create and activate virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend deps:

```powershell
pip install -r backend/requirements.txt
```

3. Install frontend deps:

```powershell
pip install -r frontend/requirements.txt
```

4. Optional: validate seed data:

```powershell
python scripts/load_seed.py
```

5. Run backend (Terminal 1):

```powershell
.\scripts\run_backend.ps1
```

6. Run frontend (Terminal 2):

```powershell
.\scripts\run_frontend.ps1
```

7. Open:

- Frontend: `http://localhost:5000`
- Backend API docs: `http://localhost:8000/docs`

## Docker setup

1. Create `.env` from `.env.example` and adjust values if needed.
2. Build and run:

```powershell
docker compose up --build
```

3. Open:

- Frontend: `http://localhost:5000`
- Backend API docs: `http://localhost:8000/docs`

## API endpoints

- `GET /health`
- `GET /api/applications?q={query}`
- `GET /api/applications/{app_id}`
- `GET /api/relationships`
- `GET /api/documents/search?q={query}`
- `POST /api/ask`

`POST /api/ask` request example:

```json
{
  "question": "How does Player Platform connect to Sports Betting?",
  "context": "optional additional context"
}
```

## Notes

- The copilot endpoint currently returns a deterministic placeholder response.
- Replace placeholder Q&A logic in `backend/app/services/repository.py` with your preferred LLM integration.
