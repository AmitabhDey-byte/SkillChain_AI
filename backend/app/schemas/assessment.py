from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class CommitEvidence(BaseModel):
    sha: str = Field(min_length=7, max_length=64)
    message: str = Field(min_length=1, max_length=500)
    authored_at: datetime | None = None
    additions: int = Field(default=0, ge=0)
    deletions: int = Field(default=0, ge=0)
    files_changed: int = Field(default=0, ge=0)


class RepositoryEvidence(BaseModel):
    github_repository_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    full_name: str = Field(min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    repository_url: str
    language: str | None = Field(default=None, max_length=100)
    languages: dict[str, float] = Field(default_factory=dict)
    topics: list[str] = Field(default_factory=list, max_length=20)
    stars: int = Field(default=0, ge=0)
    forks: int = Field(default=0, ge=0)
    open_issues: int = Field(default=0, ge=0)
    contributors: int = Field(default=1, ge=0)
    size_kb: int = Field(default=0, ge=0)
    default_branch: str = Field(default="main", max_length=100)
    license: str | None = Field(default=None, max_length=100)
    readme_excerpt: str | None = Field(default=None, max_length=8000)
    recent_commits: list[CommitEvidence] = Field(default_factory=list, max_length=20)
    has_tests: bool = False
    has_documentation: bool = False
    is_fork: bool = False
    is_archived: bool = False
    pushed_at: datetime | None = None

    @model_validator(mode="after")
    def validate_language_percentages(self) -> "RepositoryEvidence":
        if any(value < 0 or value > 100 for value in self.languages.values()):
            raise ValueError("Language percentages must be between 0 and 100.")
        if sum(self.languages.values()) > 100.5:
            raise ValueError("Language percentages cannot exceed 100.")
        return self


class AssessmentPreviewRequest(BaseModel):
    github_username: str = Field(min_length=1, max_length=39)
    repositories: list[RepositoryEvidence] = Field(min_length=1, max_length=5)


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class DimensionScore(BaseModel):
    score: int = Field(ge=0, le=100)
    rationale: str = Field(min_length=20, max_length=1000)
    evidence: list[str] = Field(min_length=1, max_length=5)


class AssessmentDimensions(BaseModel):
    code_quality: DimensionScore
    architecture: DimensionScore
    documentation: DimensionScore
    consistency: DimensionScore
    complexity: DimensionScore
    impact: DimensionScore


class SkillSignal(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    level: SkillLevel
    confidence: float = Field(ge=0, le=1)
    evidence: list[str] = Field(min_length=1, max_length=5)


class RepositoryFinding(BaseModel):
    repository: str
    complexity_score: int = Field(ge=0, le=100)
    technologies: list[str] = Field(max_length=20)
    strengths: list[str] = Field(min_length=1, max_length=5)
    improvements: list[str] = Field(max_length=5)


class SkillAssessment(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    level: SkillLevel
    summary: str = Field(min_length=50, max_length=2000)
    dimensions: AssessmentDimensions
    skills: list[SkillSignal] = Field(min_length=1, max_length=15)
    repository_findings: list[RepositoryFinding] = Field(min_length=1, max_length=5)
    portfolio_strengths: list[str] = Field(min_length=1, max_length=8)
    risk_flags: list[str] = Field(max_length=8)
    next_steps: list[str] = Field(min_length=1, max_length=8)
    methodology: str = Field(min_length=20, max_length=1000)


class GeminiUsage(BaseModel):
    prompt_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)


class AssessmentPreviewResponse(BaseModel):
    model: str
    rubric_version: str
    subject_wallet: str = Field(pattern=r"^G[A-Z2-7]{55}$")
    github_username: str = Field(min_length=1, max_length=39)
    assessment: SkillAssessment
    usage: GeminiUsage
    attestation: str = Field(pattern=r"^[a-f0-9]{64}$")
