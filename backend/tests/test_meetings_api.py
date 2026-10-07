from tests.conftest import SAMPLE_TRANSCRIPT


def test_create_from_pasted_transcript_builds_notes(meeting):
    assert meeting["source"] == "paste"
    assert [p["name"] for p in meeting["participants"]] == ["Asha", "Ben", "Chloe"]
    assert meeting["duration_seconds"] > 0
    assert meeting["summary"]["overview"]
    assert meeting["chapters"]
    assert any("invoice export" in item["text"] for item in meeting["action_items"])


def test_create_from_form_without_transcript(client):
    response = client.post("/api/meetings", json={"title": "Planning", "participants": ["Dev"]})
    assert response.status_code == 201
    body = response.json()
    assert body["source"] == "form" and body["summary"] is None


def test_upload_transcript_file(client):
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("weekly-sync.txt", SAMPLE_TRANSCRIPT, "text/plain")},
        data={"participants": "Dana"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "weekly-sync"
    assert "Dana" in [p["name"] for p in body["participants"]]


def test_unreadable_transcript_is_rejected(client):
    response = client.post(
        "/api/meetings/upload", files={"file": ("x.json", "{not json", "application/json")}
    )
    assert response.status_code == 422


def test_list_filters_and_sorts(client, meeting):
    client.post("/api/meetings", json={"title": "Design review", "participants": ["Dev"]})

    listing = client.get("/api/meetings").json()
    assert listing["total"] == 2

    assert client.get("/api/meetings", params={"q": "billing"}).json()["total"] == 1
    assert client.get("/api/meetings", params={"q": "invoice"}).json()["total"] == 1  # transcript
    assert client.get("/api/meetings", params={"participant": "dev"}).json()["total"] == 1
    assert client.get("/api/meetings", params={"tag": "product"}).json()["total"] == 1
    assert client.get("/api/meetings", params={"source": "paste,upload"}).json()["total"] == 1
    titles = [m["title"] for m in client.get("/api/meetings", params={"sort": "title"}).json()["items"]]
    assert titles == ["Billing launch sync", "Design review"]


def test_update_and_delete(client, meeting):
    url = f"/api/meetings/{meeting['id']}"
    updated = client.patch(url, json={"title": "Renamed", "participants": ["Asha", "Zed"]}).json()
    assert updated["title"] == "Renamed"
    assert [p["name"] for p in updated["participants"]] == ["Asha", "Zed"]

    assert client.delete(url).status_code == 204
    assert client.get(url).status_code == 404


def test_times_are_utc_and_date_range_filters(client):
    client.post("/api/meetings", json={"title": "Old", "started_at": "2026-01-10T09:00:00+05:30"})
    client.post("/api/meetings", json={"title": "New", "started_at": "2026-03-01T12:00:00Z"})

    old = client.get("/api/meetings", params={"q": "old"}).json()["items"][0]
    assert old["started_at"] == "2026-01-10T03:30:00Z"  # converted from +05:30 to UTC

    in_january = client.get(
        "/api/meetings",
        params={"date_from": "2026-01-01T00:00:00Z", "date_to": "2026-01-31T23:59:59Z"},
    ).json()
    assert [m["title"] for m in in_january["items"]] == ["Old"]
