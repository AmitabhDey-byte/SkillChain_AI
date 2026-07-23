from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import WalletIdentity, require_wallet_identity
from backend.app.db.models import Feedback, User
from backend.app.db.session import get_database_session
from backend.app.schemas.feedback import FeedbackCreate, FeedbackResponse


router = APIRouter()


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit authenticated product feedback")
async def submit_feedback(
    request: FeedbackCreate,
    identity: WalletIdentity | None = Depends(require_wallet_identity),
    session: AsyncSession = Depends(get_database_session),
) -> Feedback:
    user = None
    if identity is not None:
        user = await session.scalar(select(User).where(User.wallet_address == identity.wallet_address))
    entry = Feedback(
        user_id=user.id if user is not None else None,
        wallet_address=identity.wallet_address if identity is not None else None,
        rating=request.rating,
        category=request.category.strip().lower(),
        message=request.message.strip(),
        page=request.page.strip() if request.page else None,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry
