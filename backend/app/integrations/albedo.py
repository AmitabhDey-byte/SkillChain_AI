import asyncio
from collections.abc import AsyncIterator
from typing import Any

import httpx
from fastapi import Depends

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.assistant import AssistantChatRequest, AssistantChatResponse


ALBEDO_INSTRUCTION = """You are Albedo, SkillChain AI's friendly blockchain career assistant. Help students, developers, freelancers, and recruiters understand Stellar, Soroban, wallets, on-chain credentials, blockchain careers, secure payments, and SkillChain workflows. Keep answers practical, concise, and easy to scan. Never request wallet secret keys, seed phrases, private keys, API keys, or passwords. Explain that testnet assets have no real monetary value. Do not provide investment, legal, or tax advice. If a question is unrelated to blockchain, technical careers, hiring, credentials, or SkillChain, politely guide the user back to those areas."""


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
        contents = [
            {
                "role": message.role,
                "parts": [{"text": message.content}],
            }
            for message in request.history
        ]
        contents.append(
            {
                "role": "user",
                "parts": [{"text": f"Current user type: {request.role}\nQuestion: {request.message}"}],
            }
        )
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
            if response.status_code in {401, 403}:
                raise AppError("Albedo is not configured correctly.", "albedo_unauthorized", 503)
            if response.status_code >= 400:
                raise AppError("Albedo could not complete the request.", "albedo_upstream_error", 502)
            return response
        raise AppError("Albedo could not complete the request.", "albedo_failed", 502)


async def get_albedo_service(settings: Settings = Depends(get_settings)) -> AsyncIterator[AlbedoService]:
    if not settings.gemini_api_key or not settings.gemini_api_key.get_secret_value():
        raise AppError("Albedo is not configured on this server.", "albedo_not_configured", 503)
    timeout = httpx.Timeout(settings.gemini_timeout_seconds, connect=10)
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)
    async with httpx.AsyncClient(base_url="https://generativelanguage.googleapis.com", timeout=timeout, limits=limits) as client:
        yield AlbedoService(
            client,
            settings.gemini_api_key.get_secret_value(),
            settings.gemini_model,
        )
