"""Database engine, session factory and the full-text search index setup."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import DATA_DIR, DATABASE_URL

DATA_DIR.mkdir(parents=True, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, _record) -> None:
    """SQLite ignores foreign keys unless this pragma is set on every connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    """FastAPI dependency that yields one session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# An FTS5 "external content" table indexes transcript text without storing a
# second copy of it. The triggers keep the index in step with the base table.
_FTS_STATEMENTS = [
    """
    CREATE VIRTUAL TABLE IF NOT EXISTS segment_fts USING fts5(
        text, speaker_name,
        content='transcript_segments', content_rowid='id',
        tokenize='porter unicode61'
    )
    """,
    """
    CREATE TRIGGER IF NOT EXISTS segment_fts_insert AFTER INSERT ON transcript_segments BEGIN
        INSERT INTO segment_fts(rowid, text, speaker_name)
        VALUES (new.id, new.text, new.speaker_name);
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS segment_fts_delete AFTER DELETE ON transcript_segments BEGIN
        INSERT INTO segment_fts(segment_fts, rowid, text, speaker_name)
        VALUES ('delete', old.id, old.text, old.speaker_name);
    END
    """,
    """
    CREATE TRIGGER IF NOT EXISTS segment_fts_update AFTER UPDATE ON transcript_segments BEGIN
        INSERT INTO segment_fts(segment_fts, rowid, text, speaker_name)
        VALUES ('delete', old.id, old.text, old.speaker_name);
        INSERT INTO segment_fts(rowid, text, speaker_name)
        VALUES (new.id, new.text, new.speaker_name);
    END
    """,
]


def init_db() -> None:
    """Create all tables and the search index. Safe to call more than once."""
    from app import models  # noqa: F401  (registers the tables on Base)

    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        for statement in _FTS_STATEMENTS:
            connection.execute(text(statement))
