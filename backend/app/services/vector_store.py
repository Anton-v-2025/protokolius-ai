import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text
from app.models import MeetingChunk
from app.services.chunker import Chunk


class VectorStore:
    """
    Manages reading/writing meeting chunks + embeddings in pgvector.
    """

    async def delete_meeting_chunks(self, db: AsyncSession, meeting_id: uuid.UUID):
        await db.execute(
            delete(MeetingChunk).where(MeetingChunk.meeting_id == meeting_id)
        )

    async def store_chunks(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        meeting_id: uuid.UUID,
        chunks: list[Chunk],
        embeddings: list[list[float]],
    ):
        objects = []
        for chunk, embedding in zip(chunks, embeddings):
            obj = MeetingChunk(
                company_id=company_id,
                meeting_id=meeting_id,
                chunk_index=chunk.chunk_index,
                chunk_type=chunk.chunk_type,
                chunk_text=chunk.text,
                embedding=embedding if embedding else None,
                metadata_json=chunk.metadata,
            )
            objects.append(obj)
        db.add_all(objects)

    async def similarity_search(
        self,
        db: AsyncSession,
        company_id: uuid.UUID,
        query_embedding: list[float],
        top_k: int = 8,
    ) -> list[MeetingChunk]:
        """
        ANN search — tries pgvector first, falls back to Python cosine similarity.
        """
        try:
            return await self._similarity_search_pgvector(db, company_id, query_embedding, top_k)
        except Exception:
            await db.rollback()
            return await self._similarity_search_python(db, company_id, query_embedding, top_k)

    async def _similarity_search_pgvector(
        self, db: AsyncSession, company_id: uuid.UUID, query_embedding: list[float], top_k: int
    ) -> list[MeetingChunk]:
        stmt = text("""
            SELECT id, meeting_id, chunk_text, chunk_type, metadata_json,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM meeting_chunks
            WHERE company_id = :company_id
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :embedding::vector
            LIMIT :top_k
        """)
        result = await db.execute(stmt, {
            "embedding": str(query_embedding),
            "company_id": str(company_id),
            "top_k": top_k,
        })
        rows = result.fetchall()
        chunks = []
        for row in rows:
            chunk = MeetingChunk()
            chunk.id = row.id
            chunk.meeting_id = row.meeting_id
            chunk.chunk_text = row.chunk_text
            chunk.chunk_type = row.chunk_type
            chunk.metadata_json = row.metadata_json
            chunk.similarity = row.similarity
            chunks.append(chunk)
        return chunks

    async def _similarity_search_python(
        self, db: AsyncSession, company_id: uuid.UUID, query_embedding: list[float], top_k: int
    ) -> list[MeetingChunk]:
        """Python-based cosine similarity fallback (no pgvector required)."""
        import math
        result = await db.execute(
            select(MeetingChunk).where(
                MeetingChunk.company_id == company_id,
                MeetingChunk.embedding.isnot(None),
            )
        )
        all_chunks = result.scalars().all()

        q_norm = math.sqrt(sum(x * x for x in query_embedding)) or 1.0

        scored = []
        for chunk in all_chunks:
            emb = chunk.embedding
            if emb is None or (hasattr(emb, '__len__') and len(emb) == 0):
                continue
            dot = sum(a * b for a, b in zip(query_embedding, emb))
            e_norm = math.sqrt(sum(x * x for x in emb)) or 1.0
            similarity = dot / (q_norm * e_norm)
            chunk.similarity = similarity
            scored.append((similarity, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in scored[:top_k]]

    async def get_chunks_count(self, db: AsyncSession, company_id: uuid.UUID) -> int:
        result = await db.execute(
            select(MeetingChunk).where(MeetingChunk.company_id == company_id)
        )
        return len(result.scalars().all())
