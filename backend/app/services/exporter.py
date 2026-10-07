"""Render a meeting as Markdown or plain text for download."""
from app.models import Meeting


def format_timestamp(milliseconds: int) -> str:
    seconds = milliseconds // 1000
    hours, minutes, seconds = seconds // 3600, (seconds % 3600) // 60, seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}" if hours else f"{minutes:02d}:{seconds:02d}"


def _header(meeting: Meeting, markdown: bool) -> list[str]:
    names = ", ".join(p.name for p in meeting.participants) or "None listed"
    title = f"# {meeting.title}" if markdown else meeting.title
    return [title, "", f"Date: {meeting.started_at:%d %b %Y, %H:%M} UTC", f"Participants: {names}", ""]


def export_transcript(meeting: Meeting, markdown: bool) -> str:
    lines = _header(meeting, markdown)
    for segment in meeting.segments:
        stamp = format_timestamp(segment.start_ms)
        if markdown:
            lines.append(f"**{segment.speaker_name}** `{stamp}`  \n{segment.text}\n")
        else:
            lines.append(f"[{stamp}] {segment.speaker_name}: {segment.text}")
    return "\n".join(lines) + "\n"


def export_summary(meeting: Meeting, markdown: bool) -> str:
    heading = "## " if markdown else ""
    lines = _header(meeting, markdown)
    if meeting.summary:
        lines += [f"{heading}Overview", "", meeting.summary.overview, ""]
        if meeting.summary.key_points:
            lines += [f"{heading}Key points", ""]
            lines += [f"- {point}" for point in meeting.summary.key_points] + [""]
    if meeting.chapters:
        lines += [f"{heading}Outline", ""]
        lines += [f"- {format_timestamp(c.start_ms)} {c.title}: {c.summary}" for c in meeting.chapters]
        lines.append("")
    if meeting.action_items:
        lines += [f"{heading}Action items", ""]
        for item in meeting.action_items:
            box = "[x]" if item.is_done else "[ ]"
            owner = f" ({item.assignee})" if item.assignee else ""
            lines.append(f"- {box} {item.text}{owner}")
        lines.append("")
    return "\n".join(lines)
