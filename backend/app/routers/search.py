from fastapi import APIRouter, Query

from backend.app.models import DocumentMetadata
from backend.app.services.repository import repository

router = APIRouter(prefix="/api", tags=["knowledge"])


@router.get("/documents/search", response_model=list[DocumentMetadata])
def search_documents(q: str = Query(default="", description="Search architecture docs")):
    return repository.search_documents(q)
