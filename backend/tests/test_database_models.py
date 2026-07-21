import unittest

from sqlalchemy import create_engine, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.db.base import Base
from backend.app.db.models import AuthChallenge, Feedback, GithubProfile, InteractionType, Notification, User, UserRole, WalletInteraction


class DatabaseModelTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_expected_tables_are_registered(self) -> None:
        table_names = set(inspect(self.engine).get_table_names())
        self.assertEqual(table_names, {"auth_challenges", "feedback", "github_profiles", "job_applications", "notifications", "users", "wallet_interactions"})

    def test_notification_wallet_index_is_registered(self) -> None:
        indexes = {item["name"] for item in inspect(self.engine).get_indexes(Notification.__tablename__)}
        self.assertIn("ix_notifications_recipient_read", indexes)

    def test_user_github_and_wallet_relationships(self) -> None:
        user = User(
            wallet_address="GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ2",
            role=UserRole.TALENT,
            display_name="Aisha Kapoor",
            headline="Stellar developer",
            onboarding_complete=True,
        )
        user.github_profile = GithubProfile(
            username="aisha-builds",
            profile_url="https://github.com/aisha-builds",
            public_repositories=12,
        )
        user.wallet_interactions.append(
            WalletInteraction(
                wallet_address=user.wallet_address,
                interaction_type=InteractionType.WALLET_CONNECTED,
                network="testnet",
            )
        )

        with Session(self.engine) as session:
            session.add(user)
            session.commit()
            stored_user = session.scalar(select(User).where(User.wallet_address == user.wallet_address))
            self.assertIsNotNone(stored_user)
            self.assertEqual(stored_user.github_profile.username, "aisha-builds")
            self.assertEqual(len(stored_user.wallet_interactions), 1)

    def test_feedback_rating_constraint(self) -> None:
        with Session(self.engine) as session:
            session.add(Feedback(rating=6, category="onboarding", message="Invalid rating"))
            with self.assertRaises(IntegrityError):
                session.commit()


if __name__ == "__main__":
    unittest.main()
