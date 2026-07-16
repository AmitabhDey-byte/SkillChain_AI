from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class LiveResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    timestamp: datetime


class DependencyStatus(BaseModel):
    database: Literal["configured", "missing"]
    gemini: Literal["configured", "pending"]
    stellar: Literal["configured", "missing"]


class ReadyResponse(BaseModel):
    status: Literal["ready", "degraded"]
    environment: str
    dependencies: DependencyStatus

