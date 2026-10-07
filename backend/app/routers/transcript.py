"""Transcript reading and comments on transcript lines."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_owned_meeting
from app.models import Comment, Meeting, TranscriptSegment, User
from app.schemas import CommentCreate, CommentOut, Insights, SegmentOut
from app.services.insights import build_insights

router = APIRouter(tags=["transcript"])


@router.get("/meetings/{meeting_id}/transcript", response_model=list[SegmentOut])
def get_transcript(
    q: str | None = None,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
):
    """All transcript lines in order, or only the lines containing `q`."""
    query = select(TranscriptSegment).where(TranscriptSegment.meeting_id == meeting.id)
    if q and q.strip():
        query = query.where(func.lower(TranscriptSegment.text).contains(q.strip().lower()))
    return db.scalars(query.order_by(TranscriptSegment.position)).all()


@router.get("/meetings/{meeting_id}/insights", response_model=Insights)
def get_insights(meeting: Meeting = Depends(get_owned_meeting)):
    """Smart filters (tasks, questions, dates, metrics) and talk time per speaker."""
    return build_insights(list(meeting.segments))


@router.get("/meetings/{meeting_id}/comments", response_model=list[CommentOut])
def list_comments(meeting: Meeting = Depends(get_owned_meeting)):
    return meeting.comments


@router.post("/meetings/{meeting_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    payload: CommentCreate,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    segment = db.get(TranscriptSegment, payload.segment_id)
    if segment is None or segment.meeting_id != meeting.id:
        raise HTTPException(status_code=404, detail="Transcript line not found")
    comment = Comment(
        meeting_id=meeting.id, segment_id=segment.id, author_id=user.id, body=payload.body.strip()
    )
    db.add(comment)
    db.commit()
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    comment = db.get(Comment, comment_id)
    if comment is None or comment.author_id != user.id:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
