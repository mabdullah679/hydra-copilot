from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .config import DB_PATH, DATA_DIR, BLOB_DIR

_initialized = False


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)
    Path(BLOB_DIR).mkdir(parents=True, exist_ok=True)


def _ensure_schema(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS runs (
            run_id TEXT PRIMARY KEY,
            workflow TEXT NOT NULL,
            status TEXT NOT NULL,
            request_json TEXT NOT NULL,
            idempotency_key TEXT,
            result_json TEXT,
            audit_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            ts TEXT NOT NULL,
            step TEXT NOT NULL,
            tool TEXT,
            decision TEXT,
            elapsed_ms INTEGER,
            error TEXT,
            meta_json TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            workflow TEXT NOT NULL,
            decision TEXT NOT NULL,
            reason_code TEXT,
            notes TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    _apply_migrations(conn)


def _apply_migrations(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    # runs.idempotency_key
    cols = [r[1] for r in cur.execute("PRAGMA table_info(runs)").fetchall()]
    if "idempotency_key" not in cols:
        cur.execute("ALTER TABLE runs ADD COLUMN idempotency_key TEXT")
    conn.commit()


def get_conn() -> sqlite3.Connection:
    global _initialized
    ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=3000;")
    if not _initialized:
        _ensure_schema(conn)
        _initialized = True
    return conn


def init_db() -> None:
    conn = get_conn()
    _ensure_schema(conn)
    conn.close()


def insert_run(run_id: str, workflow: str, status: str, request: Dict[str, Any]) -> None:
    conn = get_conn()
    now = utc_now()
    idempotency_key = request.get("idempotency_key")
    conn.execute(
        """
        INSERT INTO runs (run_id, workflow, status, request_json, idempotency_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (run_id, workflow, status, json.dumps(request), idempotency_key, now, now),
    )
    conn.commit()
    conn.close()


def update_run(run_id: str, status: str, result: Optional[Dict[str, Any]], audit: Optional[Dict[str, Any]]) -> None:
    conn = get_conn()
    now = utc_now()
    conn.execute(
        """
        UPDATE runs
        SET status = ?, result_json = ?, audit_json = ?, updated_at = ?
        WHERE run_id = ?
        """,
        (
            status,
            json.dumps(result) if result is not None else None,
            json.dumps(audit) if audit is not None else None,
            now,
            run_id,
        ),
    )
    conn.commit()
    conn.close()


def update_run_status(run_id: str, status: str) -> None:
    conn = get_conn()
    conn.execute(
        """
        UPDATE runs
        SET status = ?, updated_at = ?
        WHERE run_id = ?
        """,
        (status, utc_now(), run_id),
    )
    conn.commit()
    conn.close()


def insert_event(
    run_id: str,
    ts: str,
    step: str,
    tool: Optional[str],
    decision: Optional[str],
    elapsed_ms: Optional[int],
    error: Optional[str],
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO events (run_id, ts, step, tool, decision, elapsed_ms, error, meta_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            ts,
            step,
            tool,
            decision,
            elapsed_ms,
            error,
            json.dumps(meta) if meta else None,
        ),
    )
    conn.commit()
    conn.close()


def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_run_by_idempotency(workflow: str, idempotency_key: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM runs WHERE workflow = ? AND idempotency_key = ? ORDER BY created_at DESC LIMIT 1",
        (workflow, idempotency_key),
    ).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_events(run_id: str) -> list[Dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT ts, step, tool, decision, elapsed_ms, error, meta_json FROM events WHERE run_id = ? ORDER BY id ASC",
        (run_id,),
    ).fetchall()
    conn.close()
    events = []
    for r in rows:
        ev = dict(r)
        if ev.get("meta_json"):
            ev["meta"] = json.loads(ev["meta_json"])
        ev.pop("meta_json", None)
        events.append(ev)
    return events


def insert_feedback(run_id: str, workflow: str, decision: str, reason_code: str | None, notes: str | None) -> None:
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO feedback (run_id, workflow, decision, reason_code, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (run_id, workflow, decision, reason_code, notes, utc_now()),
    )
    conn.commit()
    conn.close()


def get_feedback(run_id: str) -> list[Dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT run_id, workflow, decision, reason_code, notes, created_at FROM feedback WHERE run_id = ? ORDER BY id ASC",
        (run_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_runs(limit: int = 50) -> list[Dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT run_id, workflow, status, created_at, updated_at FROM runs ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
