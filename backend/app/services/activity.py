import logging
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models import InteractionType, WalletInteraction


logger = logging.getLogger("skillchain.activity")


async def record_wallet_interaction(
    session: AsyncSession,
    wallet_address: str,
    interaction_type: InteractionType,
    network: str,
    transaction_hash: str | None = None,
    ledger_sequence: int | None = None,
    success: bool = True,
    interaction_data: dict[str, Any] | None = None,
) -> bool:
    session.add(
        WalletInteraction(
            wallet_address=wallet_address,
            interaction_type=interaction_type,
            network=network,
            transaction_hash=transaction_hash,
            ledger_sequence=ledger_sequence,
            success=success,
            interaction_data=interaction_data or {},
        )
    )

    try:
        await session.commit()
        return True
    except SQLAlchemyError:
        await session.rollback()
        logger.exception("wallet_interaction_persistence_failed type=%s", interaction_type.value)
        return False
