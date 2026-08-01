from fastapi import APIRouter, Query

from backend.app.models import ApplicationDetail, ApplicationSummary, Relationship
from backend.app.services.repository import repository

router = APIRouter(prefix="/api", tags=["applications"])


@router.get("/applications", response_model=list[ApplicationSummary])
def list_applications(q: str | None = Query(default=None, description="Search term")):
    apps = repository.get_applications(q)
    return [
        {
            "id": app["id"],
            "name": app["name"],
            "domain": app["domain"],
            "short_description": app["short_description"],
            "tags": app.get("tags", []),
        }
        for app in apps
    ]


@router.get("/applications/{app_id}", response_model=ApplicationDetail)
def get_application(app_id: str):
    return repository.get_application_by_id(app_id)


@router.get("/relationships", response_model=list[Relationship])
def list_relationships():
    return repository.get_relationships()
