"""Global search, "ask this meeting", and the lookup lists used by filters."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_owned_meeting
from app.models import Meeting, Participant, Tag, User
from app.schemas import (
    AskRequest,
    AskResponse,
    ParticipantOut,
    SearchHit,
    SearchResults,
    SegmentOut,
    TagOut,
    UserOut,
)
from app.services import meetings as meeting_service
from app.services.search import search_segments
from app.services.summarizer import STOPWORDS

router = APIRouter(tags=["search"])

MAX_ASK_SOURCES = 3


@router.get("/search", response_model=SearchResults)
def global_search(
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Search every meeting: matching meetings plus the best transcript lines."""
    meetings, _ = meeting_service.list_meetings(db, user, q=q, page_size=10)
    hits = search_segments(db, user.id, q, limit=20)
    return SearchResults(
        query=q,
        meetings=[meeting_service.to_list_item(meeting) for meeting in meetings],
        transcript_hits=[SearchHit(**hit) for hit in hits],
    )


@router.post("/meetings/{meeting_id}/ask", response_model=AskResponse)
def ask_meeting(
    payload: AskRequest,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Answer a question by retrieving the transcript lines most relevant to it.

    This is the retrieval half of retrieval-augmented generation. The lines it
    returns are what an LLM would be given as context to write a fluent answer.
    """
    keywords = " ".join(w for w in payload.question.lower().split() if w.strip("?.,!") not in STOPWORDS)
    hits = search_segments(
        db, user.id, keywords or payload.question, meeting_id=meeting.id,
        match_any=True, limit=MAX_ASK_SOURCES,
    )
    if not hits:
        return AskResponse(
            answer="I couldn't find anything in this meeting about that. Try different words.",
            sources=[],
        )
    hits.sort(key=lambda hit: hit["position"])
    quotes = " ".join(f'{hit["speaker_name"]} said: "{hit["text"]}"' for hit in hits)
    sources = [
        SegmentOut(
            id=hit["segment_id"], position=hit["position"], speaker_name=hit["speaker_name"],
            start_ms=hit["start_ms"], end_ms=hit["end_ms"], text=hit["text"],
        )
        for hit in hits
    ]
    return AskResponse(answer=f"Here is what the meeting says about that. {quotes}", sources=sources)


@router.get("/participants", response_model=list[ParticipantOut])
def list_participants(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Participant).where(Participant.owner_id == user.id).order_by(Participant.name)
    ).all()


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Tag).where(Tag.owner_id == user.id).order_by(Tag.name)).all()


@router.get("/me", response_model=UserOut)
def current_user(user: User = Depends(get_current_user)):
    return user
