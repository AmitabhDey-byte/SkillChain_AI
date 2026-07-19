from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AppError
from backend.app.db.models import ApplicationStatus, JobApplication
from backend.app.db.session import get_database_session
from backend.app.schemas.marketplace import (
    JobApplicationCreate,
    JobApplicationListResponse,
    JobApplicationResponse,
    JobApplicationStatusUpdate,
)


router = APIRouter()


@router.post("/applications", response_model=JobApplicationResponse, status_code=201, summary="Apply to a marketplace opportunity")
async def create_application(
    request: JobApplicationCreate,
    session: AsyncSession = Depends(get_database_session),
) -> JobApplication:
    application = JobApplication(
        job_id=request.job_id,
        company_id=request.company_id,
        company_name=request.company_name,
        job_title=request.job_title,
        applicant_wallet=request.applicant_wallet,
        applicant_name=request.applicant_name,
        applicant_headline=request.applicant_headline,
        applicant_role=request.applicant_role,
        skills=request.skills,
        message=request.message,
        status=ApplicationStatus.PENDING,
    )
    session.add(application)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise AppError("You already applied to this opportunity.", "application_exists", 409) from error
    await session.refresh(application)
    return application


@router.get("/applications", response_model=JobApplicationListResponse, summary="List recruiter application requests")
async def list_applications(
    company_id: Annotated[str | None, Query(max_length=64)] = None,
    session: AsyncSession = Depends(get_database_session),
) -> JobApplicationListResponse:
    statement = select(JobApplication).order_by(JobApplication.created_at.desc()).limit(200)
    if company_id:
        statement = statement.where(JobApplication.company_id == company_id)
    result = await session.scalars(statement)
    applications = list(result.all())
    return JobApplicationListResponse(applications=applications, total=len(applications))


@router.patch("/applications/{application_id}", response_model=JobApplicationResponse, summary="Update an application review status")
async def update_application(
    application_id: UUID,
    request: JobApplicationStatusUpdate,
    session: AsyncSession = Depends(get_database_session),
) -> JobApplication:
    application = await session.get(JobApplication, application_id)
    if not application:
        raise AppError("Application request was not found.", "application_not_found", 404)
    application.status = ApplicationStatus(request.status.value)
    await session.commit()
    await session.refresh(application)
    return application
