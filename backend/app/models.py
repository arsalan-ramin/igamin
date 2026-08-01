from pydantic import BaseModel, Field


class ApplicationSummary(BaseModel):
    id: str
    name: str
    domain: str
    short_description: str
    tags: list[str] = Field(default_factory=list)


class DiagramBox(BaseModel):
    x: float
    y: float
    w: float
    h: float


class ApplicationDetail(ApplicationSummary):
    description: str
    capabilities: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    documents: list[str] = Field(default_factory=list)
    diagram: DiagramBox


class Relationship(BaseModel):
    source: str
    target: str
    relation: str


class DocumentMetadata(BaseModel):
    id: str
    application_id: str
    title: str
    summary: str
    tags: list[str] = Field(default_factory=list)


class AskRequest(BaseModel):
    question: str
    context: str | None = None


class AskResponse(BaseModel):
    answer: str
    supporting_applications: list[str] = Field(default_factory=list)
    supporting_documents: list[str] = Field(default_factory=list)
