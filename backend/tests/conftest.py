"""Test setup: point the app at a throwaway database before it is imported."""
import os
import tempfile

_db_file = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file}"
os.environ["SEED_ON_STARTUP"] = "false"
os.environ["RATE_LIMIT_CAPACITY"] = "100000"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from sqlalchemy import text  # noqa: E402

from app.database import Base, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402

SAMPLE_TRANSCRIPT = """Asha: Welcome everyone. Today we need to decide the launch date for the billing dashboard.
Ben: The billing dashboard is ready, but the invoice export still fails for large accounts.
Asha: How long will the invoice export fix take?
Ben: I'll fix the invoice export by Thursday and send an update to the team.
Chloe: We should move the launch date to next Monday to leave time for testing.
Asha: Agreed. Let's confirm the launch date for Monday and tell the customers."""


@pytest.fixture()
def client():
    """A test client with empty tables for every test."""
    Base.metadata.drop_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS segment_fts"))
    init_db()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def meeting(client):
    response = client.post(
        "/api/meetings",
        json={"title": "Billing launch sync", "tags": ["Product"], "transcript": SAMPLE_TRANSCRIPT},
    )
    assert response.status_code == 201
    return response.json()
