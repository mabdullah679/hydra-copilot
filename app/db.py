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
    conn.commit()


def get_conn() -> sqlite3.Connection:
    global _initialized
    ensure_dirs()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
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
    conn.execute(
        """
        INSERT INTO runs (run_id, workflow, status, request_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (run_id, workflow, status, json.dumps(request), now, now),
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


def get_events(run_id: str) -> list[Dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT ts, step, tool, decision, elapsed_ms, error FROM events WHERE run_id = ? ORDER BY id ASC",
        (run_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
