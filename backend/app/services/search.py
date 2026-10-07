"""Full-text search over transcript segments, backed by SQLite FTS5."""
import re

from sqlalchemy import text
from sqlalchemy.orm import Session

_WORD = re.compile(r"\w+", re.UNICODE)


def to_fts_query(user_query: str, *, match_any: bool = False) -> str | None:
    """Convert free text into a safe FTS5 query.

    Each word is quoted, so FTS5 operators typed by a user are treated as plain
    text, and the last word is a prefix match so results appear while typing.
    By default every word must match; `match_any` relaxes that to any word.
    """
    words = _WORD.findall(user_query.lower())
    if not words:
        return None
    quoted = [f'"{word}"' for word in words]
    quoted[-1] += "*"
    return (" OR " if match_any else " ").join(quoted)


def matching_meeting_ids(db: Session, user_query: str) -> list[int]:
    """Ids of meetings whose transcript matches the query."""
    fts_query = to_fts_query(user_query)
    if fts_query is None:
        return []
    rows = db.execute(
        text(
            "SELECT DISTINCT s.meeting_id FROM segment_fts "
            "JOIN transcript_segments s ON s.id = segment_fts.rowid "
            "WHERE segment_fts MATCH :query"
        ),
        {"query": fts_query},
    )
    return [row[0] for row in rows]


def search_segments(
    db: Session,
    owner_id: int,
    user_query: str,
    *,
    meeting_id: int | None = None,
    match_any: bool = False,
    limit: int = 30,
) -> list[dict]:
    """Best-matching transcript lines, ranked by BM25, with a highlighted snippet."""
    fts_query = to_fts_query(user_query, match_any=match_any)
    if fts_query is None:
        return []
    sql = (
        "SELECT s.id AS segment_id, s.meeting_id, s.speaker_name, s.start_ms, s.end_ms, "
        "s.position, s.text, m.title AS meeting_title, m.started_at, "
        "snippet(segment_fts, 0, '<mark>', '</mark>', '…', 18) AS snippet "
        "FROM segment_fts "
        "JOIN transcript_segments s ON s.id = segment_fts.rowid "
        "JOIN meetings m ON m.id = s.meeting_id "
        "WHERE segment_fts MATCH :query AND m.owner_id = :owner_id "
    )
    params: dict = {"query": fts_query, "owner_id": owner_id, "limit": limit}
    if meeting_id is not None:
        sql += "AND s.meeting_id = :meeting_id "
        params["meeting_id"] = meeting_id
    sql += "ORDER BY bm25(segment_fts) LIMIT :limit"
    return [dict(row._mapping) for row in db.execute(text(sql), params)]
