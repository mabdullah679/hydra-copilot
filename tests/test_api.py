import os

from fastapi.testclient import TestClient


def test_submit_and_get_run(tmp_path, monkeypatch):
    monkeypatch.setenv("HYDRA_DATA_DIR", str(tmp_path / "data"))

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
