import json
import os
from pathlib import Path
from typing import Any

from fastapi import HTTPException


class ArchitectureRepository:
    def __init__(self) -> None:
        data_file = os.getenv("DATA_FILE", "backend/data/architecture_seed.json")
        self._data_path = Path(data_file)
        self._data = self._load_data()

    def _load_data(self) -> dict[str, Any]:
        if not self._data_path.exists():
            raise FileNotFoundError(
                f"Architecture seed data file not found: {self._data_path}"
            )

        with self._data_path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def get_applications(self, query: str | None = None) -> list[dict[str, Any]]:
        applications: list[dict[str, Any]] = self._data.get("applications", [])
        if not query:
            return applications

        query_lc = query.lower()
        return [
            app
            for app in applications
            if query_lc in app["name"].lower()
            or query_lc in app["domain"].lower()
            or any(query_lc in tag.lower() for tag in app.get("tags", []))
        ]

    def get_application_by_id(self, app_id: str) -> dict[str, Any]:
        for app in self._data.get("applications", []):
            if app["id"] == app_id:
                return app
        raise HTTPException(status_code=404, detail=f"Application '{app_id}' not found")

    def get_relationships(self) -> list[dict[str, Any]]:
        return self._data.get("relationships", [])

    def search_documents(self, query: str) -> list[dict[str, Any]]:
        query_lc = query.lower().strip()
        if not query_lc:
            return self._data.get("documents", [])

        return [
            doc
            for doc in self._data.get("documents", [])
            if query_lc in doc["title"].lower()
            or query_lc in doc["summary"].lower()
            or any(query_lc in tag.lower() for tag in doc.get("tags", []))
        ]

    def ask_architecture(self, question: str, context: str | None = None) -> dict[str, Any]:
        question_lc = question.lower()

        matched_apps = [
            app["id"]
            for app in self._data.get("applications", [])
            if app["name"].lower() in question_lc
            or any(tag.lower() in question_lc for tag in app.get("tags", []))
        ]

        matched_docs = [
            doc["id"]
            for doc in self._data.get("documents", [])
            if any(token in doc["summary"].lower() for token in question_lc.split())
        ][:5]

        answer = (
            "This is a starter copilot response. Integrate an LLM provider to replace this "
            "logic for production-grade architecture Q&A."
        )
        if context:
            answer += f" Context noted: {context[:180]}"

        return {
            "answer": answer,
            "supporting_applications": matched_apps[:8],
            "supporting_documents": matched_docs,
        }


repository = ArchitectureRepository()
