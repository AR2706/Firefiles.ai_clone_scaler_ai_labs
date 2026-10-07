"""Pydantic models: the shapes the API accepts and returns."""
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

# The database stores naive UTC times. Adding "Z" on the way out tells the
# browser they are UTC, so it can show them in the viewer's own time zone.
UtcDateTime = Annotated[datetime, PlainSerializer(lambda value: value.isoformat() + "Z")]


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(OrmModel):
    id: int
    name: str
    email: str


class ParticipantOut(OrmModel):
    id: int
    name: str
    email: str | None = None


class TagOut(OrmModel):
    id: int
    name: str


# --- Transcript ---------------------------------------------------------------

class SegmentOut(OrmModel):
    id: int
    position: int
    speaker_name: str
    start_ms: int
    end_ms: int
    text: str


# --- Summary ------------------------------------------------------------------

class SummaryOut(OrmModel):
    overview: str
    key_points: list[str]
    keywords: list[str]
    generated_by: str
    style: str
    rating: int | None
    updated_at: UtcDateTime


class SummaryUpdate(BaseModel):
    overview: str | None = None
    key_points: list[str] | None = None
    rating: int | None = Field(default=None, ge=1, le=5)


class RegenerateRequest(BaseModel):
    style: str = Field(default="standard", pattern="^(condensed|standard|expanded)$")


class ChapterOut(OrmModel):
    id: int
    title: str
    summary: str
    start_ms: int


# --- Action items -------------------------------------------------------------

class ActionItemOut(OrmModel):
    id: int
    meeting_id: int
    text: str
    assignee: str | None
    is_done: bool
    source_start_ms: int | None
    created_at: UtcDateTime


class TaskOut(ActionItemOut):
    """An action item shown outside its meeting, so it carries the meeting's title."""

    meeting_title: str


class ActionItemCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    assignee: str | None = Field(default=None, max_length=120)


class ActionItemUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=1000)
    assignee: str | None = Field(default=None, max_length=120)
    is_done: bool | None = None


# --- Comments -----------------------------------------------------------------

class CommentOut(OrmModel):
    id: int
    segment_id: int
    body: str
    created_at: UtcDateTime
    author: UserOut


class CommentCreate(BaseModel):
    segment_id: int
    body: str = Field(min_length=1, max_length=2000)


# --- Meetings -----------------------------------------------------------------

class MeetingListItem(OrmModel):
    id: int
    title: str
    started_at: UtcDateTime
    duration_seconds: int
    source: str
    participants: list[ParticipantOut]
    tags: list[TagOut]
    action_items_total: int = 0
    action_items_done: int = 0
    overview: str = ""


class MeetingPage(BaseModel):
    items: list[MeetingListItem]
    total: int
    page: int
    page_size: int


class MeetingDetail(OrmModel):
    id: int
    title: str
    started_at: UtcDateTime
    duration_seconds: int
    source: str
    media_url: str | None
    participants: list[ParticipantOut]
    tags: list[TagOut]
    summary: SummaryOut | None
    chapters: list[ChapterOut]
    action_items: list[ActionItemOut]


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    started_at: datetime | None = None
    participants: list[str] = []
    tags: list[str] = []
    # Pasted transcript text in .txt, .vtt or .json form. Optional.
    transcript: str | None = None


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    started_at: datetime | None = None
    participants: list[str] | None = None
    tags: list[str] | None = None


# --- Insights -----------------------------------------------------------------

class InsightFilter(BaseModel):
    key: str
    label: str
    count: int
    segment_ids: list[int]


class SpeakerStat(BaseModel):
    name: str
    talk_ms: int
    percent: int
    word_count: int


class Insights(BaseModel):
    filters: list[InsightFilter]
    speakers: list[SpeakerStat]


# --- Search and ask -----------------------------------------------------------

class SearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    started_at: UtcDateTime
    segment_id: int
    speaker_name: str
    start_ms: int
    snippet: str


class SearchResults(BaseModel):
    query: str
    meetings: list[MeetingListItem]
    transcript_hits: list[SearchHit]


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class AskResponse(BaseModel):
    answer: str
    sources: list[SegmentOut]
