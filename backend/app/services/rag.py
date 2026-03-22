import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Integration


DEFAULT_SYSTEM_PROMPT = """Ты — ИИ-аналитик встреч в Протоколиус AI, продукте ESSG Consulting.

## Кто ты
Ты сочетаешь глубокую аналитику уровня ведущих консалтинговых компаний с живым, тёплым общением. Ты не сухой бот и не развязный чат-бот — ты профессиональный коллега, с которым приятно работать.

## Как ты анализируешь
- Не ищешь ключевые слова — ты ПОНИМАЕШЬ контекст: кто что сказал, какие решения приняли, что осталось без ответа
- Находишь паттерны между встречами: повторяющиеся темы, незакрытые задачи, сдвиги приоритетов
- Выделяешь action items, дедлайны, ответственных — даже если они упомянуты неявно
- Если видишь потенциальную проблему (просроченная задача, забытое решение) — обращаешь внимание
- Структурируешь ответы: сначала суть, потом детали. Используешь списки и разбивку по темам

## Как ты общаешься
- Тон: профессиональный, дружелюбный, уважительный. Как коллега-аналитик, который хорошо знает контекст
- Обращайся на «вы», но без казённых формулировок — естественно и по-человечески
- Можешь уместно пошутить или подбодрить, но не переигрывай — юмор должен быть органичным
- Не начинай каждый ответ одинаково — варьируй подачу
- Если информации нет в данных встреч — скажи прямо: «По данным встреч этой информации нет»
- Отвечай на русском языке. Бизнес-термины на английском допустимы (action items, follow-up, deadline и т.д.)

## Что ты НЕ делаешь
- Не придумываешь информацию, которой нет в контексте встреч
- Не даёшь общих советов без привязки к данным
- Не пишешь «Уважаемый пользователь» и подобные канцеляризмы
- Не используешь эмодзи (за редким исключением ✅ для выполненных задач)

## Формат ответов
- Короткий вопрос → короткий ответ (2-4 предложения)
- Запрос на саммари → структурированный обзор с разделами
- Запрос по action items → таблица/список: задача, ответственный, срок, статус
- Аналитический вопрос → разбор с выводами и рекомендациями
"""


class RAGService:
    """
    Retrieval-Augmented Generation pipeline for meeting knowledge queries.
    """

    def __init__(self, company_id: str, integration: "Integration"):
        self.company_id = uuid.UUID(company_id)
        self.integration = integration

    async def query(
        self,
        question: str,
        top_k: int = 8,
    ) -> tuple[str, list, list[uuid.UUID]]:
        """
        Returns (answer, chunks_used, meeting_ids_referenced)
        """
        from app.database import AsyncSessionLocal
        from app.services.embeddings import EmbeddingService
        from app.services.vector_store import VectorStore
        from app.services.llm import LLMService

        # 1. Embed the query
        embed_svc = EmbeddingService(self.integration)
        query_embedding = await embed_svc.embed_text(question)

        if not query_embedding:
            return "Сервис эмбеддингов недоступен. Проверьте настройки LLM-провайдера.", [], []

        # 2. Retrieve relevant chunks
        vector_store = VectorStore()
        async with AsyncSessionLocal() as db:
            chunks = await vector_store.similarity_search(
                db, self.company_id, query_embedding, top_k=top_k
            )

        if not chunks:
            return "По данным встреч релевантной информации не нашлось. Попробуйте переформулировать вопрос.", [], []

        # 3. Build context
        context_parts = []
        meeting_ids = list({chunk.meeting_id for chunk in chunks})

        for chunk in chunks:
            meta = chunk.metadata_json or {}
            title = meta.get("meeting_title", "Unknown Meeting")
            date = meta.get("meeting_date", "")
            date_str = f" ({date[:10]})" if date else ""
            context_parts.append(f"--- {title}{date_str} ---\n{chunk.chunk_text}")

        context = "\n\n".join(context_parts)

        # Trim to ~6000 tokens (24000 chars)
        if len(context) > 24000:
            context = context[:24000] + "\n...[truncated]"

        # 4. Get assistant prompt
        system_prompt = self.integration.assistant_prompt or DEFAULT_SYSTEM_PROMPT

        # 5. LLM completion
        llm = LLMService(self.integration)
        user_message = f"""Context from company meetings:

{context}

Question: {question}"""

        try:
            answer = await llm.complete_with_system(
                system=system_prompt,
                user=user_message,
                max_tokens=1024,
            )
        except Exception as e:
            answer = f"LLM error: {str(e)[:200]}"

        return answer, chunks, meeting_ids
