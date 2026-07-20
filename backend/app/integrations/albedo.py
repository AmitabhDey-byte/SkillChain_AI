import asyncio
from collections.abc import AsyncIterator
import json
import logging
from typing import Any

import httpx
from fastapi import Depends

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


ALBEDO_INSTRUCTION = """You are Albedo, SkillChain AI's friendly blockchain career assistant. Help students, developers, freelancers, and recruiters understand Stellar, Soroban, wallets, on-chain credentials, blockchain careers, secure payments, and SkillChain workflows. Keep answers practical, concise, and easy to scan. Never request wallet secret keys, seed phrases, private keys, API keys, or passwords. Explain that testnet assets have no real monetary value. Do not provide investment, legal, or tax advice. If a question is unrelated to blockchain, technical careers, hiring, credentials, or SkillChain, politely guide the user back to those areas."""
logger = logging.getLogger("skillchain.integrations.albedo")


def normalize_gemini_api_key(value: str) -> str:
    normalized = value.strip()
    if normalized.upper().startswith("GEMINI_API_KEY="):
        normalized = normalized.split("=", 1)[1].strip()
    if len(normalized) >= 2 and normalized[0] == normalized[-1] and normalized[0] in {"'", '"'}:
        normalized = normalized[1:-1].strip()
    return normalized


class AlbedoService:
    def __init__(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        model: str,
        retry_delays: tuple[float, ...] = (0.3, 1.0),
    ) -> None:
        self.client = client
        self.api_key = api_key
        self.model = model
        self.retry_delays = retry_delays

    async def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        contents: list[dict[str, Any]] = []
        for message in request.history:
            role = "user" if message.role == "user" else "model"
            if not contents and role == "model":
                continue
            if contents and contents[-1]["role"] == role:
                contents[-1]["parts"][0]["text"] += f"\n{message.content}"
            else:
                contents.append({"role": role, "parts": [{"text": message.content}]})
        current_message = f"Current user type: {request.role}\nQuestion: {request.message}"
        if contents and contents[-1]["role"] == "user":
            contents[-1]["parts"][0]["text"] += f"\n{current_message}"
        else:
            contents.append({"role": "user", "parts": [{"text": current_message}]})
        payload = {
            "systemInstruction": {"parts": [{"text": ALBEDO_INSTRUCTION}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.35,
                "maxOutputTokens": 900,
            },
        }
        response = await self._generate(payload)
        response_data: dict[str, Any] = response.json()
        candidates = response_data.get("candidates") or []
        if not candidates:
            raise AppError("Albedo could not answer that request.", "albedo_empty_response", 502)
        candidate = candidates[0]
        if candidate.get("finishReason") in {"SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"}:
            raise AppError("Albedo could not answer that request safely.", "albedo_blocked", 422)
        parts = ((candidate.get("content") or {}).get("parts") or [])
        reply = "".join(part.get("text", "") for part in parts).strip()
        if not reply:
            raise AppError("Albedo returned an empty response.", "albedo_empty_response", 502)
        return AssistantChatResponse(reply=reply, model=self.model)

    async def _generate(self, payload: dict[str, Any]) -> httpx.Response:
        for attempt in range(len(self.retry_delays) + 1):
            try:
                response = await self.client.post(
                    f"/v1beta/models/{self.model}:generateContent",
                    headers={"X-Goog-Api-Key": self.api_key, "Content-Type": "application/json"},
                    json=payload,
                )
            except httpx.TimeoutException as error:
                if attempt < len(self.retry_delays):
                    await asyncio.sleep(self.retry_delays[attempt])
                    continue
                raise AppError("Albedo took too long to respond.", "albedo_timeout", 504) from error
            except httpx.RequestError as error:
                raise AppError("Albedo is temporarily unavailable.", "albedo_unavailable", 502) from error
            if response.status_code in {429, 500, 502, 503, 504} and attempt < len(self.retry_delays):
                await asyncio.sleep(self.retry_delays[attempt])
                continue
            if response.status_code == 429:
                raise AppError("Albedo is busy. Try again shortly.", "albedo_rate_limited", 429)
            if response.status_code >= 400:
                upstream_code, upstream_message, upstream_payload = self._upstream_error(response)
                error_text = json.dumps(upstream_payload, ensure_ascii=True).upper()
                logger.warning(
                    "albedo_upstream_rejected status=%s code=%s model=%s message=%s",
                    response.status_code,
                    upstream_code,
                    self.model,
                    upstream_message,
                )
                if response.status_code in {401, 403} or "API_KEY_INVALID" in error_text or "API KEY NOT VALID" in error_text:
                    raise AppError("Albedo is not configured correctly.", "albedo_unauthorized", 503)
                model_not_found = "MODEL" in upstream_code.upper() and "NOT_FOUND" in upstream_code.upper()
                if response.status_code == 404 or model_not_found:
                    raise AppError(
                        "The configured Gemini model is unavailable.",
                        "albedo_model_unavailable",
                        503,
                        {"model": self.model},
                    )
                if response.status_code == 400:
                    raise AppError(
                        "Gemini rejected the chatbot request configuration.",
                        "albedo_request_rejected",
                        502,
                        {"upstream_code": upstream_code or "INVALID_ARGUMENT"},
                    )
                raise AppError("Albedo could not complete the request.", "albedo_upstream_error", 502)
            return response
        raise AppError("Albedo could not complete the request.", "albedo_failed", 502)

    @staticmethod
    def _upstream_error(response: httpx.Response) -> tuple[str, str, dict[str, Any]]:
        try:
            payload = response.json()
        except ValueError:
            return "", "Gemini returned a non-JSON error.", {}
        if not isinstance(payload, dict):
            return "", "Gemini returned an invalid error.", {}
        error = payload.get("error")
        if not isinstance(error, dict):
            return "", "Gemini rejected the request.", payload
        return str(error.get("status") or ""), str(error.get("message") or "Gemini rejected the request."), payload


async def get_albedo_service(settings: Settings = Depends(get_settings)) -> AsyncIterator[AlbedoService]:
    api_key = normalize_gemini_api_key(settings.gemini_api_key.get_secret_value()) if settings.gemini_api_key else ""
    if not api_key:
        raise AppError("Albedo is not configured on this server.", "albedo_not_configured", 503)
    timeout = httpx.Timeout(settings.gemini_timeout_seconds, connect=10)
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)
    async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", timeout=timeout, limits=limits) as client:
        yield AlbedoService(
            client,
            api_key,
            settings.gemini_model,
        )
