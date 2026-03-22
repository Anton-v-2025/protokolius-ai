import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Integration


class LLMService:
    """
    Multi-provider LLM completion via LiteLLM.
    Supports: OpenAI, Anthropic, Gemini, any OpenAI-compatible endpoint.
    """

    def __init__(self, integration: "Integration"):
        self.integration = integration

    def _get_api_key(self) -> str:
        from app.services.crypto import crypto
        if not self.integration.llm_api_key_enc:
            raise ValueError("LLM API key not configured")
        return crypto.decrypt(self.integration.llm_api_key_enc)

    def _get_model(self) -> str:
        provider = self.integration.llm_provider or "openai"
        model = self.integration.llm_model or "gpt-4o"

        # LiteLLM provider prefixes
        prefix_map = {
            "anthropic": "anthropic/",
            "gemini": "gemini/",
            "openai": "",
            "openai-compatible": "",
        }
        prefix = prefix_map.get(provider, "")
        if prefix and not model.startswith(prefix):
            return f"{prefix}{model}"
        return model

    async def complete(
        self,
        messages: list[dict],
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> str:
        import litellm

        api_key = self._get_api_key()
        model = self._get_model()
        base_url = self.integration.llm_base_url

        kwargs = {
            "model": model,
            "messages": messages,
            "api_key": api_key,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if base_url:
            kwargs["api_base"] = base_url

        response = await asyncio.to_thread(litellm.completion, **kwargs)
        return response.choices[0].message.content or ""

    async def complete_with_system(
        self,
        system: str,
        user: str,
        max_tokens: int = 2048,
    ) -> str:
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        return await self.complete(messages, max_tokens=max_tokens)
