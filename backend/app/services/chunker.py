from dataclasses import dataclass


@dataclass
class Chunk:
    text: str
    chunk_type: str
    chunk_index: int
    metadata: dict


class MeetingChunker:
    """
    Splits meeting content into overlapping chunks for embedding.
    Uses character-based splitting (approx 4 chars/token).
    """

    CHARS_PER_TOKEN = 4

    CHUNK_CONFIG = {
        "transcript": (600, 100),   # (size_tokens, overlap_tokens)
        "notes":      (400, 80),
        "summary":    (800, 0),
        "action_item": (300, 0),
    }

    def chunk_meeting(self, meeting) -> list[Chunk]:
        chunks: list[Chunk] = []
        base_meta = {
            "meeting_id": str(meeting.id),
            "meeting_title": meeting.meeting_title or "Untitled",
            "meeting_date": str(meeting.meeting_date) if meeting.meeting_date else None,
            "company_id": str(meeting.company_id),
        }

        # Transcript
        if meeting.transcript_full and meeting.transcript_full.strip():
            for i, text in enumerate(self._split(meeting.transcript_full, "transcript")):
                prefix = f"[TRANSCRIPT — {meeting.meeting_title or 'Untitled'}]\n"
                chunks.append(Chunk(
                    text=prefix + text,
                    chunk_type="transcript",
                    chunk_index=i,
                    metadata={**base_meta, "chunk_type": "transcript"},
                ))

        # Notes
        if meeting.meeting_notes_full and meeting.meeting_notes_full.strip():
            for i, text in enumerate(self._split(meeting.meeting_notes_full, "notes")):
                prefix = f"[MEETING NOTES — {meeting.meeting_title or 'Untitled'}]\n"
                chunks.append(Chunk(
                    text=prefix + text,
                    chunk_type="notes",
                    chunk_index=i,
                    metadata={**base_meta, "chunk_type": "notes"},
                ))

        # Summary
        if meeting.summary and meeting.summary.strip():
            chunks.append(Chunk(
                text=f"[SUMMARY — {meeting.meeting_title or 'Untitled'}]\n{meeting.summary}",
                chunk_type="summary",
                chunk_index=0,
                metadata={**base_meta, "chunk_type": "summary"},
            ))

        # Action items — one chunk per item + one combined chunk
        action_items = meeting.action_items_json or []
        if action_items:
            for i, item in enumerate(action_items):
                task = item.get("task", "") if isinstance(item, dict) else str(item)
                owner = item.get("owner", "Unassigned") if isinstance(item, dict) else "Unassigned"
                due = item.get("due_date", "No deadline") if isinstance(item, dict) else "No deadline"
                text = (
                    f"[ACTION ITEM — {meeting.meeting_title or 'Untitled'}]\n"
                    f"Task: {task}\n"
                    f"Owner: {owner}\n"
                    f"Due: {due}"
                )
                chunks.append(Chunk(
                    text=text,
                    chunk_type="action_items",
                    chunk_index=i,
                    metadata={**base_meta, "chunk_type": "action_item", "item_index": i},
                ))

            # Combined action items chunk
            combined = (
                f"[ALL ACTION ITEMS — {meeting.meeting_title or 'Untitled'}]\n"
                + "\n".join(
                    f"• {(i.get('task', '') if isinstance(i, dict) else str(i))} "
                    f"[{(i.get('owner', '') if isinstance(i, dict) else '')}]"
                    for i in action_items
                )
            )
            chunks.append(Chunk(
                text=combined,
                chunk_type="action_items",
                chunk_index=len(action_items),
                metadata={**base_meta, "chunk_type": "action_items_combined"},
            ))

        return chunks

    def _split(self, text: str, chunk_type: str) -> list[str]:
        size_tokens, overlap_tokens = self.CHUNK_CONFIG.get(chunk_type, (500, 100))
        size = size_tokens * self.CHARS_PER_TOKEN
        overlap = overlap_tokens * self.CHARS_PER_TOKEN

        text = text.strip()
        if len(text) <= size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + size
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            if end >= len(text):
                break
            start = end - overlap

        return chunks
