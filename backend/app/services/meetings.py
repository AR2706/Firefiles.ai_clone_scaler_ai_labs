"""Business logic for meetings: creating, updating and listing them."""
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Meeting,
    Participant,
    Tag,
    TranscriptSegment,
    User,
    meeting_participants,
    meeting_tags,
    to_naive_utc,
)
from app.schemas import MeetingListItem
from app.services.search import matching_meeting_ids
from app.services.transcript_parser import ParsedSegment

SORT_OPTIONS = {
    "recent": Meeting.started_at.desc(),
    "oldest": Meeting.started_at.asc(),
    "title": func.lower(Meeting.title).asc(),
    "duration": Meeting.duration_seconds.desc(),
}


def _clean_names(names: list[str]) -> list[str]:
    """Strip blanks and drop case-insensitive duplicates, keeping the first spelling."""
    seen: dict[str, str] = {}
    for name in names:
        name = name.strip()
        if name:
            seen.setdefault(name.lower(), name)
    return list(seen.values())


def get_or_create_participants(db: Session, owner: User, names: list[str]) -> list[Participant]:
    participants = []
    for name in _clean_names(names):
        participant = db.scalars(
            select(Participant).where(
                Participant.owner_id == owner.id, func.lower(Participant.name) == name.lower()
            )
        ).first()
        if participant is None:
            participant = Participant(owner_id=owner.id, name=name)
            db.add(participant)
            db.flush()  # Make it visible to the next lookup in this transaction.
        participants.append(participant)
    return participants


def get_or_create_tags(db: Session, owner: User, names: list[str]) -> list[Tag]:
    tags = []
    for name in _clean_names(names):
        tag = db.scalars(
            select(Tag).where(Tag.owner_id == owner.id, func.lower(Tag.name) == name.lower())
        ).first()
        if tag is None:
            tag = Tag(owner_id=owner.id, name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def replace_segments(meeting: Meeting, parsed: list[ParsedSegment]) -> None:
    """Swap a meeting's transcript for new segments and update its duration."""
    meeting.segments = [
        TranscriptSegment(
            position=position,
            speaker_name=segment.speaker,
            start_ms=segment.start_ms,
            end_ms=segment.end_ms,
            text=segment.text,
        )
        for position, segment in enumerate(parsed)
    ]
    meeting.duration_seconds = round(parsed[-1].end_ms / 1000) if parsed else 0


def create_meeting(
    db: Session,
    owner: User,
    *,
    title: str,
    started_at: datetime | None,
    participant_names: list[str],
    tag_names: list[str],
    parsed_segments: list[ParsedSegment],
    source: str,
) -> Meeting:
    # Speakers found in the transcript count as participants too.
    speakers = [segment.speaker for segment in parsed_segments]
    participants = get_or_create_participants(db, owner, participant_names + speakers)
    tags = get_or_create_tags(db, owner, tag_names)

    meeting = Meeting(owner_id=owner.id, title=title.strip(), source=source)
    if started_at is not None:
        meeting.started_at = to_naive_utc(started_at)
    db.add(meeting)
    meeting.participants = participants
    meeting.tags = tags
    replace_segments(meeting, parsed_segments)
    return meeting


def to_list_item(meeting: Meeting) -> MeetingListItem:
    item = MeetingListItem.model_validate(meeting)
    item.action_items_total = len(meeting.action_items)
    item.action_items_done = sum(1 for action in meeting.action_items if action.is_done)
    item.overview = meeting.summary.overview if meeting.summary else ""
    return item


def list_meetings(
    db: Session,
    owner: User,
    *,
    q: str | None = None,
    participant: str | None = None,
    tag: str | None = None,
    source: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort: str = "recent",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Meeting], int]:
    """Return one page of meetings plus the total number that match the filters."""
    conditions = [Meeting.owner_id == owner.id]

    if q and q.strip():
        pattern = f"%{q.strip().lower()}%"
        by_participant = select(meeting_participants.c.meeting_id).join(Participant).where(
            func.lower(Participant.name).like(pattern)
        )
        conditions.append(
            or_(
                func.lower(Meeting.title).like(pattern),
                Meeting.id.in_(by_participant),
                Meeting.id.in_(matching_meeting_ids(db, q)),
            )
        )
    if participant:
        conditions.append(
            Meeting.id.in_(
                select(meeting_participants.c.meeting_id).join(Participant).where(
                    func.lower(Participant.name) == participant.strip().lower()
                )
            )
        )
    if tag:
        conditions.append(
            Meeting.id.in_(
                select(meeting_tags.c.meeting_id).join(Tag).where(
                    func.lower(Tag.name) == tag.strip().lower()
                )
            )
        )
    if source:
        conditions.append(Meeting.source.in_([name.strip() for name in source.split(",")]))
    if date_from:
        conditions.append(Meeting.started_at >= to_naive_utc(date_from))
    if date_to:
        conditions.append(Meeting.started_at <= to_naive_utc(date_to))

    total = db.scalar(select(func.count()).select_from(Meeting).where(*conditions)) or 0
    meetings = db.scalars(
        select(Meeting)
        .where(*conditions)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.tags),
            selectinload(Meeting.action_items),
            selectinload(Meeting.summary),
        )
        .order_by(SORT_OPTIONS.get(sort, SORT_OPTIONS["recent"]), Meeting.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return list(meetings), total
