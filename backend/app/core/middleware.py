import asyncio
from collections import defaultdict, deque
from collections.abc import Callable
from dataclasses import dataclass
from hashlib import sha256
from time import perf_counter
from time import monotonic
from uuid import uuid4

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp, Message, Receive, Scope, Send


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        supplied_request_id = request.headers.get("X-Request-ID", "")
        request_id = supplied_request_id if supplied_request_id.isascii() and 0 < len(supplied_request_id) <= 100 else str(uuid4())
        request.state.request_id = request_id
        started_at = perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{perf_counter() - started_at:.6f}"
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response


class RequestBodyLimitExceeded(Exception):
    pass


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        content_length = headers.get(b"content-length", b"").decode()
        if content_length.isdigit() and int(content_length) > self.max_bytes:
            response = JSONResponse(
                status_code=413,
                headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
                content={"error": {"code": "request_too_large", "message": "The request body is too large."}},
            )
            await response(scope, receive, send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    raise RequestBodyLimitExceeded
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestBodyLimitExceeded:
            response = JSONResponse(
                status_code=413,
                headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
                content={"error": {"code": "request_too_large", "message": "The request body is too large."}},
            )
            await response(scope, receive, send)


@dataclass(frozen=True)
class RateLimitRule:
    requests: int
    window_seconds: int


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Callable) -> None:
        super().__init__(app)
        self.entries: dict[str, deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()

    @staticmethod
    def rule_for(path: str) -> RateLimitRule:
        if "/assistant/" in path or "/assessments/" in path:
            return RateLimitRule(12, 60)
        if "/auth/" in path:
            return RateLimitRule(20, 60)
        if "/github/" in path:
            return RateLimitRule(45, 60)
        if "/credentials" in path:
            return RateLimitRule(30, 60)
        return RateLimitRule(180, 60)

    @staticmethod
    def bucket_for(path: str) -> str:
        for category in ("assistant", "assessments", "auth", "github", "credentials", "marketplace", "admin"):
            if f"/{category}" in path:
                return category
        return "general"

    @staticmethod
    def client_key(request: Request) -> str:
        authorization = request.headers.get("authorization", "")
        if authorization:
            return sha256(authorization.encode()).hexdigest()[:24]
        forwarded = request.headers.get("x-vercel-forwarded-for") or request.headers.get("x-real-ip")
        if forwarded:
            return forwarded.split(",")[0].strip()[:64]
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)
        rule = self.rule_for(request.url.path)
        key = f"{self.client_key(request)}:{self.bucket_for(request.url.path)}:{request.method}"
        now = monotonic()
        async with self.lock:
            if len(self.entries) > 10_000:
                stale_keys = [
                    entry_key
                    for entry_key, timestamps in self.entries.items()
                    if not timestamps or timestamps[-1] <= now - 60
                ]
                for stale_key in stale_keys:
                    self.entries.pop(stale_key, None)
            entries = self.entries[key]
            while entries and entries[0] <= now - rule.window_seconds:
                entries.popleft()
            if len(entries) >= rule.requests:
                retry_after = max(1, round(rule.window_seconds - (now - entries[0])))
                return JSONResponse(
                    status_code=429,
                    headers={"Retry-After": str(retry_after)},
                    content={"error": {"code": "rate_limited", "message": "Too many requests. Try again shortly."}},
                )
            entries.append(now)
        return await call_next(request)
