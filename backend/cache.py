"""Cache-before-API-call helper.

Every stage output is cached by SHA256 of its input JSON. The check happens
BEFORE any API call so a full demo run replays with zero network.
"""
import hashlib
import json
from typing import Callable

from backend import db


def input_hash(input_obj: dict) -> str:
    canonical = json.dumps(input_obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest()


def get_cached(stage: str, input_obj: dict) -> dict | None:
    with db.connect() as conn:
        row = conn.execute(
            "SELECT output FROM cache WHERE input_hash = ?", (input_hash(input_obj),)
        ).fetchone()
    return json.loads(row["output"]) if row else None


def put_cache(stage: str, input_obj: dict, output: dict) -> None:
    with db.connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (input_hash, stage, output, created_at) VALUES (?, ?, ?, ?)",
            (input_hash(input_obj), stage, json.dumps(output, ensure_ascii=False), db.now_iso()),
        )


def cached_call(stage: str, input_obj: dict, fn: Callable[[dict], dict]) -> dict:
    """Return cached output for (stage, input) if present; otherwise call fn and cache."""
    hit = get_cached(stage, input_obj)
    if hit is not None:
        return hit
    output = fn(input_obj)
    put_cache(stage, input_obj, output)
    return output
