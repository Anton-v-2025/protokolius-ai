import pytest
from unittest.mock import MagicMock
from app.services.chunker import MeetingChunker


@pytest.fixture
def chunker():
    return MeetingChunker()


@pytest.fixture
def mock_meeting():
    m = MagicMock()
    m.id = "test-uuid"
    m.company_id = "company-uuid"
    m.meeting_title = "Weekly Sync"
    m.meeting_date = None
    m.transcript_full = "Speaker A: Hello.\nSpeaker B: Hi there."
    m.meeting_notes_full = "Discussed project timeline."
    m.summary = "Short summary."
    m.action_items_json = [
        {"task": "Do X", "owner": "Alice", "due_date": "2026-03-20"},
    ]
    return m


def test_chunk_produces_chunks(chunker, mock_meeting):
    chunks = chunker.chunk_meeting(mock_meeting)
    assert len(chunks) > 0


def test_chunk_types(chunker, mock_meeting):
    chunks = chunker.chunk_meeting(mock_meeting)
    types = {c.chunk_type for c in chunks}
    assert "transcript" in types
    assert "notes" in types
    assert "summary" in types
    assert "action_items" in types


def test_chunk_text_includes_header(chunker, mock_meeting):
    chunks = chunker.chunk_meeting(mock_meeting)
    transcript_chunks = [c for c in chunks if c.chunk_type == "transcript"]
    assert any("[TRANSCRIPT" in c.text for c in transcript_chunks)


def test_chunk_action_item_content(chunker, mock_meeting):
    chunks = chunker.chunk_meeting(mock_meeting)
    action_chunks = [c for c in chunks if c.chunk_type == "action_items"]
    text = " ".join(c.text for c in action_chunks)
    assert "Do X" in text
    assert "Alice" in text


def test_long_text_splits(chunker):
    long_text = "Speaker: " + "This is a sentence. " * 300
    chunks = chunker._split(long_text, "transcript")
    assert len(chunks) > 1


def test_short_text_single_chunk(chunker):
    short = "Hello world."
    chunks = chunker._split(short, "transcript")
    assert len(chunks) == 1
    assert chunks[0] == short
