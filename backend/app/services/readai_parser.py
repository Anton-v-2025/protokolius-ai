from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ParsedParticipant:
    name: str
    email: str | None = None


@dataclass
class ParsedActionItem:
    task: str
    owner: str | None = None
    due_date: str | None = None


@dataclass
class ParsedMeeting:
    external_id: str
    title: str | None
    meeting_date: datetime | None
    duration_seconds: int | None
    participants: list[ParsedParticipant]
    transcript_full: str
    meeting_notes_full: str
    summary: str
    action_items: list[ParsedActionItem]
    raw_payload: dict
    metadata: dict = field(default_factory=dict)


class ReadAIParser:
    """
    Parses Read AI webhook payload.
    Handles nested (`{meeting: {...}}`) and flat payload structures.
    """

    def parse(self, raw_payload: dict) -> ParsedMeeting:
        # Handle both {meeting: {...}} and flat structures
        m = raw_payload.get("meeting", raw_payload)

        return ParsedMeeting(
            external_id=self._extract_id(m),
            title=self._extract_title(m),
            meeting_date=self._extract_date(m),
            duration_seconds=self._extract_duration(m),
            participants=self._extract_participants(m),
            transcript_full=self._extract_transcript(m),
            meeting_notes_full=self._extract_notes(m),
            summary=self._extract_summary(m),
            action_items=self._extract_action_items(m),
            raw_payload=raw_payload,
            metadata={
                "language": m.get("language", "en"),
                "source": "Read AI",
                "duration_seconds": self._extract_duration(m),
                "zoom_link": m.get("join_url") or m.get("zoom_link"),
                "recording_url": m.get("recording_url") or m.get("video_url"),
            },
        )

    def _extract_id(self, m: dict) -> str:
        return (
            m.get("id")
            or m.get("meeting_id")
            or m.get("external_id")
            or f"unknown_{int(datetime.utcnow().timestamp())}"
        )

    def _extract_title(self, m: dict) -> str | None:
        return m.get("title") or m.get("name") or m.get("meeting_title") or "Untitled Meeting"

    def _extract_date(self, m: dict) -> datetime | None:
        for key in ("start_time", "meeting_date", "date", "created_at", "scheduled_at"):
            val = m.get(key)
            if val:
                try:
                    if isinstance(val, (int, float)):
                        return datetime.utcfromtimestamp(val)
                    return datetime.fromisoformat(val.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    continue
        return None

    def _extract_duration(self, m: dict) -> int | None:
        dur = m.get("duration") or m.get("duration_seconds")
        if dur:
            try:
                return int(dur)
            except (ValueError, TypeError):
                pass
        # Try to compute from start/end
        start = m.get("start_time")
        end = m.get("end_time")
        if start and end:
            try:
                s = datetime.fromisoformat(start.replace("Z", "+00:00"))
                e = datetime.fromisoformat(end.replace("Z", "+00:00"))
                return int((e - s).total_seconds())
            except Exception:
                pass
        return None

    def _extract_participants(self, m: dict) -> list[ParsedParticipant]:
        participants = m.get("participants") or m.get("attendees") or []
        result = []
        for p in participants:
            if isinstance(p, str):
                result.append(ParsedParticipant(name=p))
            elif isinstance(p, dict):
                name = (
                    p.get("name")
                    or p.get("display_name")
                    or p.get("email", "").split("@")[0]
                    or "Unknown"
                )
                result.append(ParsedParticipant(name=name, email=p.get("email")))
        return result

    def _extract_transcript(self, m: dict) -> str:
        # Read AI returns transcript as list of segments
        transcript_obj = m.get("transcript", {})

        if isinstance(transcript_obj, str):
            return transcript_obj

        segments = []
        if isinstance(transcript_obj, dict):
            segments = transcript_obj.get("segments", []) or transcript_obj.get("utterances", [])
        elif isinstance(transcript_obj, list):
            segments = transcript_obj

        if segments:
            lines = []
            for seg in segments:
                if isinstance(seg, dict):
                    speaker = seg.get("speaker_name") or seg.get("speaker") or "Unknown"
                    text = seg.get("text") or seg.get("content") or ""
                    if text:
                        lines.append(f"[{speaker}]: {text}")
                elif isinstance(seg, str):
                    lines.append(seg)
            return "\n".join(lines)

        # Fallback to flat text
        return (
            m.get("transcript_text")
            or m.get("full_transcript")
            or m.get("transcription")
            or ""
        )

    def _extract_notes(self, m: dict) -> str:
        return (
            m.get("notes")
            or m.get("meeting_notes")
            or m.get("protocol")
            or m.get("meeting_notes_full")
            or ""
        )

    def _extract_summary(self, m: dict) -> str:
        return (
            m.get("summary")
            or m.get("overview")
            or m.get("brief")
            or ""
        )

    def _extract_action_items(self, m: dict) -> list[ParsedActionItem]:
        items = m.get("action_items") or m.get("tasks") or m.get("todos") or []
        result = []
        for item in items:
            if isinstance(item, str):
                result.append(ParsedActionItem(task=item))
            elif isinstance(item, dict):
                task = (
                    item.get("text")
                    or item.get("title")
                    or item.get("description")
                    or item.get("task")
                    or ""
                )
                owner = (
                    item.get("assignee")
                    or item.get("owner")
                    or item.get("assigned_to")
                )
                due_date = item.get("due_date") or item.get("deadline")
                if task:
                    result.append(ParsedActionItem(task=task, owner=owner, due_date=due_date))
        return result
