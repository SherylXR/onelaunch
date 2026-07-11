"""SQLite access. DDL is the single source of truth in schemas/living_profile.json."""
import json
import sqlite3
from datetime import datetime, timezone

from backend.config import DB_PATH, SCHEMAS_DIR


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    ddl = json.loads((SCHEMAS_DIR / "living_profile.json").read_text())["sqlite_ddl"]
    with connect() as conn:
        for stmt in ddl:
            conn.execute(stmt)


def get_profile() -> dict | None:
    with connect() as conn:
        row = conn.execute("SELECT data FROM profile WHERE id = 1").fetchone()
    return json.loads(row["data"]) if row else None


def save_profile(profile: dict) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO profile (id, data, updated_at) VALUES (1, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            (json.dumps(profile, ensure_ascii=False), now_iso()),
        )


def log_decision(stage: str, choice: str, rationale: str | None = None) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO decisions (ts, stage, choice, rationale) VALUES (?, ?, ?, ?)",
            (now_iso(), stage, choice, rationale),
        )


def get_decisions() -> list[dict]:
    with connect() as conn:
        rows = conn.execute("SELECT ts, stage, choice, rationale FROM decisions ORDER BY id").fetchall()
    return [dict(r) for r in rows]
