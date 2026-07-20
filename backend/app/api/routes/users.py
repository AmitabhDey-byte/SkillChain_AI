from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_wallet_identity
from backend.app.core.errors import AppError
from backend.app.db.models import User, UserRole
from backend.app.db.session import get_database_session
from backend.app.schemas.user import UserProfileResponse, UserProfileUpsert


router = APIRouter()


async def find_user(session: AsyncSession, wallet_address: str) -> User | None:
    return await session.scalar(select(User).where(User.wallet_address == wallet_address))


@router.get("/me", response_model=UserProfileResponse, summary="Read the authenticated user profile")
async def read_profile(
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> User:
    if identity is None:
        raise AppError("Connect and sign with your Stellar wallet to continue.", "auth_required", 401)
    user = await find_user(session, identity.wallet_address)
    if user is None:
        raise AppError("Complete onboarding to create your SkillChain profile.", "profile_not_found", 404)
    return user


@router.put("/me", response_model=UserProfileResponse, summary="Create or update the authenticated user profile")
async def upsert_profile(
    request: UserProfileUpsert,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> User:
    if identity is None:
        raise AppError("Connect and sign with your Stellar wallet to continue.", "auth_required", 401)
    user = await find_user(session, identity.wallet_address)
    values = request.model_dump()
    values["role"] = UserRole(request.role.value)
    values["skills"] = list(dict.fromkeys(skill.strip() for skill in request.skills if skill.strip()))
    if user is None:
        user = User(wallet_address=identity.wallet_address, onboarding_complete=True, **values)
        session.add(user)
    else:
        for field, value in values.items():
            setattr(user, field, value)
        user.onboarding_complete = True
    await session.commit()
    await session.refresh(user)
    return user
