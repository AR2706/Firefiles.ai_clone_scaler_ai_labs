"""Shared FastAPI dependencies."""
from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, User

DEFAULT_USER = {"name": "Aritra Pradhan", "email": "aritra@meetnotes.app"}


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Return the default signed-in user, creating it on first use.

    Real authentication is out of scope. Every query still filters by this
    user's id, so adding sign-in later only means changing this function.
    """
    user = db.scalars(select(User).order_by(User.id)).first()
    if user is None:
        user = User(**DEFAULT_USER)
        db.add(user)
        db.commit()
    return user


def get_owned_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Meeting:
    """Load a meeting by id, or 404 if it is missing or belongs to someone else."""
    meeting = db.get(Meeting, meeting_id)
    if meeting is None or meeting.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting
