"""FastAPI entrypoint.

Run:  uvicorn backend.app:app --reload --port 8000
Single-port mode: frontend/dist (npm run build) is served at / with an SPA
fallback, so http://localhost:8000 is the whole app — that's what the demo-day
tunnel exposes (see demo/RUNBOOK.md). The vite dev server (5173, proxying
/api here) still works for frontend development.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend import db
from backend.config import ROOT
from backend.orchestrator import SESSIONS, continue_pipeline, resume_pipeline, run_pipeline

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


SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@app.get("/api/run")
def run(session: str = "default") -> StreamingResponse:
    return StreamingResponse(
        run_pipeline(session),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


class CvBody(BaseModel):
    cv_text: str
    session: str = "default"


@app.post("/api/cv")
def set_cv(body: CvBody) -> dict:
    """Stash CV text for the next /api/run; empty text falls back to the fixture."""
    SESSIONS.setdefault(body.session, {})["cv_text"] = body.cv_text.strip() or None
    return {"ok": True}


class AnswersBody(BaseModel):
    answers: list[dict]  # [{id, question, answer}]
    session: str = "default"


@app.post("/api/answers")
def set_answers(body: AnswersBody) -> dict:
    """Collect discovery answers; /api/continue then builds the energy map."""
    SESSIONS.setdefault(body.session, {})["answers"] = body.answers
    return {"ok": True}


@app.get("/api/continue")
def continue_(session: str = "default") -> StreamingResponse:
    """Answers → energy map → stage 3; pauses at awaiting_choice."""
    return StreamingResponse(
        continue_pipeline(session),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@app.get("/api/resume")
def resume(choice: str, session: str = "default",
           reason: str | None = None) -> StreamingResponse:
    """Continue a run paused at stage 3 with the human's chosen direction."""
    return StreamingResponse(
        resume_pipeline(session, choice, reason),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


class SPAStaticFiles(StaticFiles):
    """Static frontend with SPA fallback: unknown paths serve index.html.

    Mounted last, so /api/* and /health above always win.
    """

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


DIST = ROOT / "frontend" / "dist"
if DIST.exists():  # dev without a build still works via vite on 5173
    app.mount("/", SPAStaticFiles(directory=DIST, html=True), name="spa")
