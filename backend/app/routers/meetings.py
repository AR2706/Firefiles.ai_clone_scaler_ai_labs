"""Meeting CRUD: list, create (form, paste or file upload), read, update, delete."""
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_owned_meeting
from app.models import Meeting, User, to_naive_utc
from app.schemas import MeetingCreate, MeetingDetail, MeetingPage, MeetingUpdate
from app.services import meetings as meeting_service
from app.services.summarizer import generate_notes
from app.services.transcript_parser import TranscriptParseError, parse_transcript

router = APIRouter(prefix="/meetings", tags=["meetings"])

MAX_UPLOAD_BYTES = 2 * 1024 * 1024


def _parse_or_422(content: str, filename: str | None = None):
    try:
        return parse_transcript(content, filename)
    except TranscriptParseError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


def _split_names(value: str) -> list[str]:
    return [name for name in value.split(",") if name.strip()]


@router.get("", response_model=MeetingPage)
def list_meetings(
    q: str | None = Query(default=None, description="Matches title, participant or transcript"),
    participant: str | None = None,
    tag: str | None = None,
    source: str | None = Query(default=None, description="Comma-separated: seed, upload, paste, form"),
    date_from: datetime | None = Query(default=None, description="Start of range (ISO 8601)"),
    date_to: datetime | None = Query(default=None, description="End of range, inclusive"),
    sort: str = Query(default="recent", pattern="^(recent|oldest|title|duration)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meetings, total = meeting_service.list_meetings(
        db, user, q=q, participant=participant, tag=tag, source=source, date_from=date_from,
        date_to=date_to, sort=sort, page=page, page_size=page_size,
    )
    return MeetingPage(
        items=[meeting_service.to_list_item(meeting) for meeting in meetings],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=MeetingDetail, status_code=201)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a meeting from a form, with an optional pasted transcript."""
    has_transcript = bool(payload.transcript and payload.transcript.strip())
    parsed = _parse_or_422(payload.transcript) if has_transcript else []
    meeting = meeting_service.create_meeting(
        db, user, title=payload.title, started_at=payload.started_at,
        participant_names=payload.participants, tag_names=payload.tags,
        parsed_segments=parsed, source="paste" if has_transcript else "form",
    )
    generate_notes(meeting)
    db.commit()
    return meeting


@router.post("/upload", response_model=MeetingDetail, status_code=201)
async def upload_meeting(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    participants: str = Form(default="", description="Comma-separated names"),
    tags: str = Form(default="", description="Comma-separated tags"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a meeting from an uploaded .txt, .vtt or .json transcript file."""
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Transcript files are limited to 2 MB.")
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=422, detail="The file must be UTF-8 text.") from error

    parsed = _parse_or_422(content, file.filename)
    fallback_title = (file.filename or "Untitled meeting").rsplit(".", 1)[0]
    meeting = meeting_service.create_meeting(
        db, user, title=(title or "").strip() or fallback_title, started_at=None,
        participant_names=_split_names(participants), tag_names=_split_names(tags),
        parsed_segments=parsed, source="upload",
    )
    generate_notes(meeting)
    db.commit()
    return meeting


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting: Meeting = Depends(get_owned_meeting)):
    return meeting


@router.patch("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(
    payload: MeetingUpdate,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.title is not None:
        meeting.title = payload.title.strip()
    if payload.started_at is not None:
        meeting.started_at = to_naive_utc(payload.started_at)
    if payload.participants is not None:
        meeting.participants = meeting_service.get_or_create_participants(
            db, user, payload.participants
        )
    if payload.tags is not None:
        meeting.tags = meeting_service.get_or_create_tags(db, user, payload.tags)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting: Meeting = Depends(get_owned_meeting), db: Session = Depends(get_db)):
    db.delete(meeting)
    db.commit()
