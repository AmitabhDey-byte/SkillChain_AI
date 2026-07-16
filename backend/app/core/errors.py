import logging
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


logger = logging.getLogger("skillchain.errors")


class AppError(Exception):
    def __init__(self, message: str, code: str = "application_error", status_code: int = 400, details: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


def error_payload(request: Request, code: str, message: str, details: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "request_id": getattr(request.state, "request_id", None),
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload


async def app_error_handler(request: Request, error: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content=error_payload(request, error.code, error.message, error.details),
    )


async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    details = [
        {
            "field": ".".join(str(part) for part in issue["loc"]),
            "message": issue["msg"],
            "type": issue["type"],
        }
        for issue in error.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=error_payload(request, "validation_error", "The request contains invalid data.", details),
    )


async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    logger.exception("unhandled_error request_id=%s", getattr(request.state, "request_id", None), exc_info=error)
    return JSONResponse(
        status_code=500,
        content=error_payload(request, "internal_error", "An unexpected error occurred."),
    )

