import unittest

from fastapi.testclient import TestClient

from backend.main import app


class VercelEntrypointTests(unittest.TestCase):
    def test_fastapi_health_route_is_exposed(self) -> None:
        response = TestClient(app).get("/api/v1/health/live")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")


if __name__ == "__main__":
    unittest.main()
