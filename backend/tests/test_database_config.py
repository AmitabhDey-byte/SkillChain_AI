import unittest

from backend.app.core.config import normalize_async_database_url


class DatabaseUrlConfigurationTests(unittest.TestCase):
    def test_hosted_postgres_url_uses_asyncpg(self) -> None:
        normalized = normalize_async_database_url(
            "postgresql://user:pass@db.example/skillchain?sslmode=require&channel_binding=require"
        )

        self.assertEqual(
            normalized,
            "postgresql+asyncpg://user:pass@db.example/skillchain?ssl=require",
        )

    def test_psycopg2_url_uses_asyncpg(self) -> None:
        normalized = normalize_async_database_url("postgresql+psycopg2://user:pass@localhost/skillchain")

        self.assertEqual(normalized, "postgresql+asyncpg://user:pass@localhost/skillchain")


if __name__ == "__main__":
    unittest.main()
