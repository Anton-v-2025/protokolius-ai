import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Integration


class EmbeddingService:
    """
    Generates embeddings via LiteLLM — supports OpenAI, Azure, Cohere, etc.
    Falls back gracefully if embedding model is not configured.
    """

    MAX_BATCH_SIZE = 100

    def __init__(self, integration: "Integration"):
        self.integration = integration

    def _get_api_key(self) -> str:
        from app.services.crypto import crypto
        if not self.integration.llm_api_key_enc:
            raise ValueError("LLM API key not configured")
        return crypto.decrypt(self.integration.llm_api_key_enc)

    def _get_embedding_model(self) -> str:
        provider = self.integration.llm_provider or "openai"
        model = self.integration.llm_embedding_model or "text-embedding-3-small"
        # LiteLLM format: provider/model
        if provider == "openai" and not model.startswith("openai/"):
            return model  # LiteLLM handles bare openai models
        if provider == "anthropic":
            # Anthropic doesn't have embedding models — fallback to openai
            return "text-embedding-3-small"
        return model

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        import litellm
        api_key = self._get_api_key()
        model = self._get_embedding_model()
        base_url = self.integration.llm_base_url

        all_embeddings = []

        # Process in batches
        for i in range(0, len(texts), self.MAX_BATCH_SIZE):
            batch = texts[i:i + self.MAX_BATCH_SIZE]
            kwargs = {"model": model, "input": batch, "api_key": api_key}
            if base_url:
                kwargs["api_base"] = base_url

            response = await asyncio.to_thread(litellm.embedding, **kwargs)
            batch_embeddings = [item["embedding"] for item in response.data]
            all_embeddings.extend(batch_embeddings)

        return all_embeddings

    async def embed_text(self, text: str) -> list[float]:
        result = await self.embed_texts([text])
        return result[0] if result else []
