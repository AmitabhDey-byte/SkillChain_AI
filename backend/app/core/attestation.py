import hashlib
import hmac
import json
from typing import Any


def sign_assessment(
    model: str,
    rubric_version: str,
    repository_ids: list[int],
    assessment: dict[str, Any],
    secret: str,
) -> str:
    payload = json.dumps(
        {
            "assessment": assessment,
            "model": model,
            "repository_ids": sorted(repository_ids),
            "rubric_version": rubric_version,
        },
        sort_keys=True,
        separators=(",", ":"),
    ).encode()
    return hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
