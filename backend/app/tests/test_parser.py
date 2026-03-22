import pytest
from app.services.readai_parser import ReadAIParser


@pytest.fixture
def parser():
    return ReadAIParser()


@pytest.fixture
def sample_payload():
    return {
        "meeting": {
            "id": "test_001",
            "title": "Weekly Sync",
            "start_time": "2026-03-18T10:00:00Z",
            "end_time": "2026-03-18T11:00:00Z",
            "participants": [
                {"name": "Anna Smith", "email": "anna@company.com"},
                {"name": "Bob Lee", "email": "bob@company.com"},
            ],
            "transcript": {
                "segments": [
                    {"speaker_name": "Anna Smith", "text": "Good morning everyone."},
                    {"speaker_name": "Bob Lee", "text": "Morning! Ready to start."},
                ]
            },
            "notes": "Meeting notes about project update.",
            "summary": "Quick weekly sync, all on track.",
            "action_items": [
                {"text": "Prepare budget draft", "assignee": "Bob Lee", "due_date": "2026-03-22"},
            ],
        }
    }


def test_parse_basic(parser, sample_payload):
    result = parser.parse(sample_payload)
    assert result.external_id == "test_001"
    assert result.title == "Weekly Sync"
    assert len(result.participants) == 2
    assert result.participants[0].name == "Anna Smith"
    assert result.participants[0].email == "anna@company.com"


def test_parse_transcript(parser, sample_payload):
    result = parser.parse(sample_payload)
    assert "[Anna Smith]" in result.transcript_full
    assert "Good morning everyone" in result.transcript_full


def test_parse_action_items(parser, sample_payload):
    result = parser.parse(sample_payload)
    assert len(result.action_items) == 1
    assert result.action_items[0].task == "Prepare budget draft"
    assert result.action_items[0].owner == "Bob Lee"
    assert result.action_items[0].due_date == "2026-03-22"


def test_parse_date(parser, sample_payload):
    result = parser.parse(sample_payload)
    assert result.meeting_date is not None
    assert result.meeting_date.year == 2026


def test_parse_duration(parser, sample_payload):
    result = parser.parse(sample_payload)
    assert result.duration_seconds == 3600


def test_parse_flat_payload(parser):
    flat = {
        "id": "flat_001",
        "title": "Flat Meeting",
        "start_time": "2026-03-18T10:00:00Z",
        "participants": [],
        "notes": "Some notes",
    }
    result = parser.parse(flat)
    assert result.external_id == "flat_001"


def test_parse_missing_id(parser):
    result = parser.parse({})
    assert result.external_id.startswith("unknown_")
