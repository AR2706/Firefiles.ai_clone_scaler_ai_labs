"""AI notes: the summary and the action items of a meeting."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, get_owned_meeting
from app.models import ActionItem, Meeting, Summary, User
from app.schemas import (
    ActionItemCreate,
    ActionItemOut,
    ActionItemUpdate,
    MeetingDetail,
    RegenerateRequest,
    SummaryOut,
    SummaryUpdate,
    TaskOut,
)
from app.services.summarizer import generate_notes

router = APIRouter(tags=["notes"])


@router.post("/meetings/{meeting_id}/summary/regenerate", response_model=MeetingDetail)
def regenerate_summary(
    payload: RegenerateRequest | None = None,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
):
    """Rebuild the notes from the transcript, optionally shorter or longer."""
    if not meeting.segments:
        raise HTTPException(status_code=409, detail="This meeting has no transcript to summarize.")
    generate_notes(meeting, style=payload.style if payload else "standard")
    db.commit()
    db.refresh(meeting)
    return meeting


@router.patch("/meetings/{meeting_id}/summary", response_model=SummaryOut)
def edit_summary(
    payload: SummaryUpdate,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
):
    if meeting.summary is None:
        meeting.summary = Summary(generated_by="manual")
    if payload.overview is not None:
        meeting.summary.overview = payload.overview.strip()
    if payload.key_points is not None:
        meeting.summary.key_points = [p.strip() for p in payload.key_points if p.strip()]
    if payload.rating is not None:
        meeting.summary.rating = payload.rating
    db.commit()
    return meeting.summary


@router.get("/action-items", response_model=list[TaskOut])
def list_all_action_items(
    done: bool | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Action items from every meeting, newest meeting first. `done` filters by status."""
    query = (
        select(ActionItem)
        .join(Meeting)
        .where(Meeting.owner_id == user.id)
        .options(joinedload(ActionItem.meeting))
        .order_by(Meeting.started_at.desc(), ActionItem.id)
    )
    if done is not None:
        query = query.where(ActionItem.is_done == done)
    return [
        TaskOut(**ActionItemOut.model_validate(item).model_dump(), meeting_title=item.meeting.title)
        for item in db.scalars(query)
    ]


@router.get("/meetings/{meeting_id}/action-items", response_model=list[ActionItemOut])
def list_action_items(meeting: Meeting = Depends(get_owned_meeting)):
    return meeting.action_items


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemOut, status_code=201)
def add_action_item(
    payload: ActionItemCreate,
    meeting: Meeting = Depends(get_owned_meeting),
    db: Session = Depends(get_db),
):
    item = ActionItem(
        meeting_id=meeting.id,
        text=payload.text.strip(),
        assignee=(payload.assignee or "").strip() or None,
    )
    db.add(item)
    db.commit()
    return item


def _get_owned_action_item(
    item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> ActionItem:
    item = db.get(ActionItem, item_id)
    if item is None or item.meeting.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Action item not found")
    return item


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(
    payload: ActionItemUpdate,
    item: ActionItem = Depends(_get_owned_action_item),
    db: Session = Depends(get_db),
):
    # Only fields present in the request body are changed.
    changes = payload.model_dump(exclude_unset=True)
    if "text" in changes and changes["text"] is not None:
        item.text = changes["text"].strip()
    if "assignee" in changes:
        item.assignee = (changes["assignee"] or "").strip() or None
    if "is_done" in changes and changes["is_done"] is not None:
        item.is_done = changes["is_done"]
    db.commit()
    return item


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(
    item: ActionItem = Depends(_get_owned_action_item), db: Session = Depends(get_db)
):
    db.delete(item)
    db.commit()
