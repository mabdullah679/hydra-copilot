import os

from fastapi.testclient import TestClient


def test_submit_and_get_run(tmp_path, monkeypatch):
    monkeypatch.setenv("HYDRA_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("CELERY_ALWAYS_EAGER", "1")

    from app.main import app

    client = TestClient(app)

    payload = {
        "outline": "Launch message",
        "persona": "busy founder",
        "channel": "email",
        "brand_rules": ["Be concise"],
    }

    res = client.post("/workflows/marketing/submit", json=payload)
    assert res.status_code == 200
    run_id = res.json()["run_id"]

    res2 = client.get(f"/runs/{run_id}")
    assert res2.status_code == 200
    data = res2.json()
    assert data["run_id"] == run_id
    assert data["workflow"] == "marketing"
    assert data["request"]["outline"] == "Launch message"


def test_feedback_updates_run_status_and_timeline(tmp_path, monkeypatch):
    monkeypatch.setenv("HYDRA_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("CELERY_ALWAYS_EAGER", "1")

    from app.main import app

    client = TestClient(app)

    submit = client.post(
        "/workflows/marketing/submit",
        json={"outline": "Status update check", "persona": "operator", "channel": "email"},
    )
    assert submit.status_code == 200
    run_id = submit.json()["run_id"]

    feedback = client.post(
        "/feedback",
        json={
            "run_id": run_id,
            "workflow": "marketing",
            "decision": "approved",
            "reason_code": "checked",
            "notes": "Looks good",
        },
    )
    assert feedback.status_code == 200

    run = client.get(f"/runs/{run_id}")
    assert run.status_code == 200
    assert run.json()["status"] == "approved"

    events = client.get(f"/runs/{run_id}/events")
    assert events.status_code == 200
    steps = [ev["step"] for ev in events.json()["events"]]
    assert "human_feedback" in steps
