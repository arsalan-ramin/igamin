import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.applications import router as applications_router
from backend.app.routers.copilot import router as copilot_router
from backend.app.routers.search import router as search_router

app = FastAPI(
    title="OLG iGaming Architecture Knowledge API",
    version="0.1.0",
    description="Centralized architecture metadata, search, and AI-assisted Q&A.",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5000,http://127.0.0.1:5000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications_router)
app.include_router(search_router)
app.include_router(copilot_router)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
