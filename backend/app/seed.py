"""Load the sample meetings. Run with `python -m app.seed` (add --reset to wipe first)."""
import sys
from datetime import timedelta

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine, init_db
from app.deps import get_current_user
from app.models import ActionItem, Chapter, Meeting, Summary, utcnow
from app.seed_data import MEETINGS
from app.services.meetings import create_meeting
from app.services.transcript_parser import parse_transcript


# The parser estimates timings from word count alone. Real meetings have pauses
# between speakers, so sample timings are stretched to a more natural length.
SAMPLE_PACE = 2.5


def seed(db: Session) -> int:
    """Insert the sample meetings and return how many were added."""
    owner = get_current_user(db)
    today = utcnow().replace(minute=0, second=0, microsecond=0)

    for data in MEETINGS:
        segments = parse_transcript(data["transcript"])
        for segment in segments:
            segment.start_ms = int(segment.start_ms * SAMPLE_PACE)
            segment.end_ms = int(segment.end_ms * SAMPLE_PACE)
        meeting = create_meeting(
            db, owner,
            title=data["title"],
            started_at=(today - timedelta(days=data["days_ago"])).replace(hour=data["hour"]),
            participant_names=[],
            tag_names=data["tags"],
            parsed_segments=segments,
            source="seed",
        )
        meeting.summary = Summary(
            overview=data["overview"],
            key_points=data["key_points"],
            keywords=data["keywords"],
            generated_by="seed",
        )
        meeting.chapters = [
            Chapter(title=title, summary=summary, start_ms=segments[line].start_ms)
            for line, title, summary in data["chapters"]
        ]
        meeting.action_items = [
            ActionItem(
                text=task, assignee=assignee, is_done=is_done,
                source_start_ms=segments[line].start_ms,
            )
            for line, task, assignee, is_done in data["action_items"]
        ]
    db.commit()
    return len(MEETINGS)


def seed_if_empty() -> None:
    """Seed only when there are no meetings, so restarts never duplicate data."""
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Meeting)) == 0:
            seed(db)


def reset() -> None:
    Base.metadata.drop_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS segment_fts"))
    init_db()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset()
    else:
        init_db()
    with SessionLocal() as session:
        print(f"Seeded {seed(session)} meetings.")
