"""FastAPI entrypoint.

Run:  uvicorn backend.app:app --reload --port 8000
Dev frontend (vite, port 5173) proxies /api and /health here.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend import db
from backend.orchestrator import run_pipeline

app = FastAPI(title="OneLaunch")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db.init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/run")
def run(session: str = "default") -> StreamingResponse:
    return StreamingResponse(
        run_pipeline(session),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
