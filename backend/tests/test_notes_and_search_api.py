def test_transcript_can_be_filtered(client, meeting):
    url = f"/api/meetings/{meeting['id']}/transcript"
    assert len(client.get(url).json()) == 6
    matches = client.get(url, params={"q": "Invoice Export"}).json()
    assert len(matches) == 3 and all("invoice export" in m["text"].lower() for m in matches)


def test_action_item_lifecycle(client, meeting):
    base = f"/api/meetings/{meeting['id']}/action-items"
    created = client.post(base, json={"text": "Email customers", "assignee": "Asha"}).json()
    assert created["is_done"] is False

    done = client.patch(f"/api/action-items/{created['id']}", json={"is_done": True}).json()
    assert done["is_done"] is True and done["assignee"] == "Asha"

    cleared = client.patch(f"/api/action-items/{created['id']}", json={"assignee": None}).json()
    assert cleared["assignee"] is None and cleared["is_done"] is True

    assert client.delete(f"/api/action-items/{created['id']}").status_code == 204
    assert created["id"] not in [item["id"] for item in client.get(base).json()]


def test_regenerate_keeps_user_action_items(client, meeting):
    base = f"/api/meetings/{meeting['id']}"
    client.patch(f"{base}/summary", json={"overview": "Edited by hand"})
    added = client.post(f"{base}/action-items", json={"text": "My own task"}).json()

    regenerated = client.post(f"{base}/summary/regenerate").json()
    assert regenerated["summary"]["overview"] != "Edited by hand"
    assert added["id"] in [item["id"] for item in regenerated["action_items"]]


def test_comments_on_a_transcript_line(client, meeting):
    base = f"/api/meetings/{meeting['id']}"
    segment_id = client.get(f"{base}/transcript").json()[0]["id"]
    comment = client.post(f"{base}/comments", json={"segment_id": segment_id, "body": "Key moment"})
    assert comment.status_code == 201
    assert client.post(f"{base}/comments", json={"segment_id": 99999, "body": "x"}).status_code == 404
    assert len(client.get(f"{base}/comments").json()) == 1
    assert client.delete(f"/api/comments/{comment.json()['id']}").status_code == 204


def test_global_search_returns_meetings_and_highlighted_lines(client, meeting):
    results = client.get("/api/search", params={"q": "invoice"}).json()
    assert results["meetings"][0]["id"] == meeting["id"]
    assert "<mark>" in results["transcript_hits"][0]["snippet"]
    # FTS operators typed by a user must not break the query.
    assert client.get("/api/search", params={"q": 'launch" OR (*'}).status_code == 200


def test_search_index_follows_deletes(client, meeting):
    client.delete(f"/api/meetings/{meeting['id']}")
    assert client.get("/api/search", params={"q": "invoice"}).json()["transcript_hits"] == []


def test_ask_returns_sources(client, meeting):
    url = f"/api/meetings/{meeting['id']}/ask"
    answer = client.post(url, json={"question": "When is the launch date?"}).json()
    assert answer["sources"] and "launch" in answer["answer"].lower()
    nothing = client.post(url, json={"question": "What about kangaroos?"}).json()
    assert nothing["sources"] == []


def test_export_formats(client, meeting):
    url = f"/api/meetings/{meeting['id']}/export"
    markdown = client.get(url, params={"content": "summary", "format": "md"})
    assert markdown.text.startswith("# Billing launch sync")
    assert 'filename="billing-launch-sync-summary.md"' in markdown.headers["content-disposition"]
    text = client.get(url, params={"content": "transcript", "format": "txt"}).text
    assert "[00:00] Asha: Welcome everyone." in text


def test_refine_changes_level_of_detail_and_rating_resets(client, meeting):
    base = f"/api/meetings/{meeting['id']}"
    rated = client.patch(f"{base}/summary", json={"rating": 4}).json()
    assert rated["rating"] == 4
    assert client.patch(f"{base}/summary", json={"rating": 9}).status_code == 422

    short = client.post(f"{base}/summary/regenerate", json={"style": "condensed"}).json()["summary"]
    long = client.post(f"{base}/summary/regenerate", json={"style": "expanded"}).json()["summary"]
    assert short["style"] == "condensed" and long["style"] == "expanded"
    assert len(short["key_points"]) <= 3 < len(long["key_points"])
    assert len(short["overview"]) < len(long["overview"])
    assert long["rating"] is None


def test_insights_filters_and_talk_time(client, meeting):
    insights = client.get(f"/api/meetings/{meeting['id']}/insights").json()
    by_key = {item["key"]: item for item in insights["filters"]}
    assert by_key["questions"]["count"] == 1
    assert by_key["tasks"]["count"] >= 2
    assert by_key["dates"]["count"] >= 2  # Thursday, Monday
    assert sum(speaker["percent"] for speaker in insights["speakers"]) in (99, 100, 101)
    assert insights["speakers"][0]["talk_ms"] >= insights["speakers"][-1]["talk_ms"]


def test_tasks_across_meetings(client, meeting):
    other = client.post("/api/meetings", json={"title": "Other"}).json()
    added = client.post(f"/api/meetings/{other['id']}/action-items", json={"text": "Ship it"}).json()
    client.patch(f"/api/action-items/{added['id']}", json={"is_done": True})

    everything = client.get("/api/action-items").json()
    assert {task["meeting_title"] for task in everything} == {"Billing launch sync", "Other"}
    open_tasks = client.get("/api/action-items", params={"done": "false"}).json()
    assert all(not task["is_done"] for task in open_tasks) and len(open_tasks) == len(everything) - 1
