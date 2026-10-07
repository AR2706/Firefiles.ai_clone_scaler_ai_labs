from app.database import SessionLocal
from app.seed import seed
from app.seed_data import MEETINGS


def test_seed_creates_complete_meetings(client):
    with SessionLocal() as db:
        assert seed(db) == len(MEETINGS)

    listing = client.get("/api/meetings", params={"sort": "recent"}).json()
    assert listing["total"] == len(MEETINGS)
    assert listing["items"][0]["title"] == "Q4 Product Roadmap Planning"

    detail = client.get(f"/api/meetings/{listing['items'][0]['id']}").json()
    assert detail["summary"]["generated_by"] == "seed"
    assert len(detail["chapters"]) == 5 and len(detail["action_items"]) == 4
    assert len(detail["participants"]) == 4
    # Chapter and task timestamps come from real transcript lines.
    assert detail["chapters"][-1]["start_ms"] > 0
