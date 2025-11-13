from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:  # Prefer package imports when available
    from backend.models import Questionnaire, AnswersPayload, StoredAnswers
    from backend.questionnaire_store import get_questionnaire, seed_if_empty
    from backend.storage import save_answers, get_answers, init_storage
except ImportError:  # Fallback when executed as a standalone module
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from models import Questionnaire, AnswersPayload, StoredAnswers
    from questionnaire_store import get_questionnaire, seed_if_empty
    from storage import save_answers, get_answers, init_storage

app = FastAPI(title="Student Questionnaire API", version="0.1.0")

@app.on_event("startup")
def startup():
    init_storage()
    seed_if_empty()

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/questionnaire", response_model=Questionnaire)
def questionnaire_endpoint():
    return get_questionnaire()

@app.post("/api/answers", response_model=StoredAnswers)
def post_answers(payload: AnswersPayload):
    stored = save_answers(payload.userId, payload.answers)
    return stored

@app.get("/api/answers/{user_id}", response_model=StoredAnswers)
def fetch_answers(user_id: str):
    stored = get_answers(user_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Answers not found")
    return stored

@app.get("/health")
def health():
    return {"status": "ok"}

# Run with: uvicorn main:app --reload
