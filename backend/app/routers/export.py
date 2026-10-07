"""Download a meeting's transcript or summary as a file."""
import re

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from app.deps import get_owned_meeting
from app.models import Meeting
from app.services.exporter import export_summary, export_transcript

router = APIRouter(tags=["export"])


@router.get("/meetings/{meeting_id}/export", response_class=PlainTextResponse)
def export_meeting(
    content: str = Query(default="transcript", pattern="^(transcript|summary)$"),
    format: str = Query(default="md", pattern="^(md|txt)$"),
    meeting: Meeting = Depends(get_owned_meeting),
):
    render = export_transcript if content == "transcript" else export_summary
    body = render(meeting, markdown=format == "md")
    slug = re.sub(r"[^a-z0-9]+", "-", meeting.title.lower()).strip("-") or "meeting"
    media_type = "text/markdown" if format == "md" else "text/plain"
    return PlainTextResponse(
        body,
        media_type=f"{media_type}; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{slug}-{content}.{format}"'},
    )
