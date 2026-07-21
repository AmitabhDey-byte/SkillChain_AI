import asyncio
from collections.abc import AsyncIterator
import json
import logging
from typing import Any

import httpx
from fastapi import Depends
from pydantic import ValidationError

from backend.app.core.config import Settings, get_settings
from backend.app.core.errors import AppError
from backend.app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    InterviewKitContent,
    InterviewKitRequest,
    InterviewKitResponse,
)


ALBEDO_INSTRUCTION = """You are Albedo, SkillChain AI's friendly blockchain career assistant. Help students, developers, freelancers, and recruiters understand Stellar, Soroban, wallets, on-chain credentials, blockchain careers, secure payments, and SkillChain workflows. Keep answers practical, concise, and easy to scan. Never request wallet secret keys, seed phrases, private keys, API keys, or passwords. Explain that testnet assets have no real monetary value. Do not provide investment, legal, or tax advice. If a question is unrelated to blockchain, technical careers, hiring, credentials, or SkillChain, politely guide the user back to those areas."""
INTERVIEW_INSTRUCTION = """You are SkillChain AI's evidence-based technical interview architect. Build fair, role-specific questions that ask candidates to explain real artifacts, technical decisions, trade-offs, ownership, collaboration, and measurable outcomes. Never infer protected personal characteristics. Avoid trivia, brainteasers, credential prestige, or questions unrelated to demonstrated work. Return only valid JSON with no markdown."""
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
        api_version: str = "v1",
        retry_delays: tuple[float, ...] = (0.3, 1.0),
    ) -> None:
        self.client = client
        self.api_key = api_key
        self.model = model
        self.api_version = api_version
        self.retry_delays = retry_delays

    async def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        transcript: list[str] = []
        for message in request.history:
            speaker = "User" if message.role == "user" else "Albedo"
            transcript.append(f"{speaker}: {message.content}")
        conversation = "\n".join(transcript[-8:]) or "No previous conversation."
        prompt = (
            f"{ALBEDO_INSTRUCTION}\n\n"
            f"Conversation so far:\n{conversation}\n\n"
            f"Current user type: {request.role}\n"
            f"Question: {request.message}\n\n"
            "Answer as Albedo in plain text."
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
        }
        response = await self._generate(payload)
        reply = self._response_text(response, "Albedo")
        return AssistantChatResponse(reply=reply, model=self.model)

    async def generate_interview_kit(self, request: InterviewKitRequest) -> InterviewKitResponse:
        role_context = {
            "target_role": request.role.strip(),
            "seniority": request.seniority,
            "job_description": request.job_description.strip() or "Not provided",
            "evidence_domains": list(dict.fromkeys(skill.strip() for skill in request.skills if skill.strip())),
        }
        prompt = (
            f"{INTERVIEW_INSTRUCTION}\n\n"
            f"Role context:\n{json.dumps(role_context, ensure_ascii=True)}\n\n"
            "Create a 45 to 60 minute structured interview kit. Return exactly this JSON shape:\n"
            '{"title":"string","overview":"string","questions":[{"question":"string","look_for":"string","skill":"string"}],'
            '"scorecard":[{"criterion":"string","guidance":"string"}],"duration_minutes":45}\n'
            "Include 5 to 7 questions and 4 to 5 scorecard criteria. Every question must reference evidence or a realistic scenario."
        )
        response = await self._generate({"contents": [{"parts": [{"text": prompt}]}]})
        raw_content = self._response_text(response, "Interview Studio")
        try:
            content = InterviewKitContent.model_validate(self._parse_json_object(raw_content))
        except (json.JSONDecodeError, ValidationError, ValueError) as error:
            raise AppError(
                "Gemini returned an interview kit in an unexpected format. Try generating it again.",
                "interview_kit_invalid",
                502,
            ) from error
        return InterviewKitResponse(**content.model_dump(), model=self.model)

    @staticmethod
    def _response_text(response: httpx.Response, feature_name: str) -> str:
        response_data: dict[str, Any] = response.json()
        candidates = response_data.get("candidates") or []
        if not candidates:
            raise AppError(f"{feature_name} could not complete that request.", "albedo_empty_response", 502)
        candidate = candidates[0]
        if candidate.get("finishReason") in {"SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"}:
            raise AppError(f"{feature_name} could not complete that request safely.", "albedo_blocked", 422)
        parts = ((candidate.get("content") or {}).get("parts") or [])
        text = "".join(part.get("text", "") for part in parts).strip()
        if not text:
            raise AppError(f"{feature_name} returned an empty response.", "albedo_empty_response", 502)
        return text

    @staticmethod
    def _parse_json_object(value: str) -> dict[str, Any]:
        normalized = value.strip()
        if normalized.startswith("```"):
            normalized = normalized.split("\n", 1)[1] if "\n" in normalized else normalized[3:]
            if normalized.rstrip().endswith("```"):
                normalized = normalized.rstrip()[:-3]
        start = normalized.find("{")
        end = normalized.rfind("}")
        if start < 0 or end < start:
            raise ValueError("Missing JSON object")
        parsed = json.loads(normalized[start : end + 1])
        if not isinstance(parsed, dict):
            raise ValueError("Expected a JSON object")
        return parsed

    async def _generate(self, payload: dict[str, Any]) -> httpx.Response:
        for attempt in range(len(self.retry_delays) + 1):
            try:
                response = await self.client.post(
                    f"/{self.api_version}/models/{self.model}:generateContent",
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
                        {"model": self.model, "api_version": self.api_version},
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
            settings.gemini_api_version,
        )
