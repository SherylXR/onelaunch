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
    conn.execute("PRAGMA busy_timeout=5000")  # survive concurrent writers
    return conn


def init_db() -> None:
    ddl = json.loads((SCHEMAS_DIR / "living_profile.json").read_text())["sqlite_ddl"]
    with connect() as conn:
        for stmt in ddl:
            conn.execute(stmt)
        try:  # migration: decisions gained a session column
            conn.execute("ALTER TABLE decisions ADD COLUMN session TEXT")
        except sqlite3.OperationalError:
            pass  # already migrated


# ALL state below is session-scoped — one living profile / journal per
# browser session. Never read "latest"; always read this session's row.

def get_profile(session: str) -> dict | None:
    with connect() as conn:
        row = conn.execute("SELECT data FROM profiles WHERE session = ?", (session,)).fetchone()
    return json.loads(row["data"]) if row else None


def save_profile(session: str, profile: dict) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO profiles (session, data, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(session) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            (session, json.dumps(profile, ensure_ascii=False), now_iso()),
        )


def log_decision(session: str, stage: str, choice: str, rationale: str | None = None) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO decisions (ts, stage, choice, rationale, session) VALUES (?, ?, ?, ?, ?)",
            (now_iso(), stage, choice, rationale, session),
        )


def get_decisions(session: str) -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT ts, stage, choice, rationale FROM decisions WHERE session = ? ORDER BY id",
            (session,),
        ).fetchall()
    return [dict(r) for r in rows]
