from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_matching_wallet, require_wallet_identity
from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.db.models import ApplicationStatus, JobApplication, User, UserRole
from backend.app.db.session import get_database_session
from backend.app.schemas.marketplace import (
    JobApplicationCreate,
    JobApplicationListResponse,
    JobApplicationResponse,
    JobApplicationStatusUpdate,
)


router = APIRouter()


async def require_recruiter(
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_database_session),
) -> User | None:
    if identity is None:
        return None
    user = await session.scalar(select(User).where(User.wallet_address == identity.wallet_address))
    if settings.security_enforced and (user is None or user.role != UserRole.RECRUITER):
        raise AppError("Recruiter access is required.", "recruiter_required", 403)
    return user


@router.post("/applications", response_model=JobApplicationResponse, status_code=201, summary="Apply to a marketplace opportunity")
async def create_application(
    request: JobApplicationCreate,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> JobApplication:
    require_matching_wallet(identity, request.applicant_wallet)
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
    recruiter: User | None = Depends(require_recruiter),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_database_session),
) -> JobApplicationListResponse:
    statement = select(JobApplication).order_by(JobApplication.created_at.desc()).limit(200)
    if settings.security_enforced and recruiter:
        if not recruiter.organization:
            raise AppError("Add an organization to access recruiter applications.", "recruiter_organization_required", 403)
        statement = statement.where(JobApplication.company_name == recruiter.organization)
    if company_id:
        statement = statement.where(JobApplication.company_id == company_id)
    result = await session.scalars(statement)
    applications = list(result.all())
    return JobApplicationListResponse(applications=applications, total=len(applications))


@router.patch("/applications/{application_id}", response_model=JobApplicationResponse, summary="Update an application review status")
async def update_application(
    application_id: UUID,
    request: JobApplicationStatusUpdate,
    recruiter: User | None = Depends(require_recruiter),
    settings: Settings = Depends(get_settings),
    session: AsyncSession = Depends(get_database_session),
) -> JobApplication:
    application = await session.get(JobApplication, application_id)
    if not application:
        raise AppError("Application request was not found.", "application_not_found", 404)
    if settings.security_enforced and recruiter and application.company_name != recruiter.organization:
        raise AppError("This application belongs to another organization.", "application_forbidden", 403)
    application.status = ApplicationStatus(request.status.value)
    await session.commit()
    await session.refresh(application)
    return application
