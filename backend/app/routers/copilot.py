from fastapi import APIRouter

from backend.app.models import AskRequest, AskResponse
from backend.app.services.repository import repository

router = APIRouter(prefix="/api", tags=["copilot"])


@router.post("/ask", response_model=AskResponse)
def ask_architecture(request: AskRequest):
    return repository.ask_architecture(request.question, request.context)
