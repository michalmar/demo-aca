from contextlib import asynccontextmanager
from pathlib import Path

from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

import os
import sys

sys.path.append(str(Path(__file__).resolve().parent))
from models import (
    AnswersPayload,
    Questionnaire,
    QuestionnaireCreate,
    QuestionnaireUpdate,
    StoredAnswers,
)
from questionnaire_store import (
    create_questionnaire,
    delete_questionnaire,
    get_default_questionnaire,
    get_questionnaire,
    list_questionnaires,
    seed_if_empty,
    update_questionnaire,
)
from storage import save_answers, get_answers, init_storage

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_storage()
    seed_if_empty()
    yield


app = FastAPI(title="Student Questionnaire API", version="0.1.0", lifespan=lifespan)

FE_FQDN = os.getenv("FRONTEND_FQDN")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", f"https://{FE_FQDN}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/questionnaire", response_model=Questionnaire)
def questionnaire_endpoint():
    return get_default_questionnaire()


@app.get("/api/questionnaires", response_model=List[Questionnaire])
def list_questionnaires_endpoint():
    return list_questionnaires()


@app.get("/api/questionnaires/{questionnaire_id}", response_model=Questionnaire)
def get_questionnaire_endpoint(questionnaire_id: str):
    questionnaire = get_questionnaire(questionnaire_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return questionnaire


@app.post("/api/questionnaires", response_model=Questionnaire, status_code=201)
def create_questionnaire_endpoint(payload: QuestionnaireCreate):
    try:
        return create_questionnaire(payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.put("/api/questionnaires/{questionnaire_id}", response_model=Questionnaire)
def update_questionnaire_endpoint(questionnaire_id: str, payload: QuestionnaireUpdate):
    updated = update_questionnaire(questionnaire_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return updated


@app.delete("/api/questionnaires/{questionnaire_id}", status_code=204)
def delete_questionnaire_endpoint(questionnaire_id: str):
    deleted = delete_questionnaire(questionnaire_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return Response(status_code=204)

@app.post("/api/answers", response_model=StoredAnswers)
def post_answers(payload: AnswersPayload):
    questionnaire_id = payload.questionnaireId or get_default_questionnaire().id
    stored = save_answers(payload.userId, questionnaire_id, payload.answers)
    return stored

@app.get("/api/answers/{user_id}", response_model=StoredAnswers)
def fetch_answers(user_id: str, questionnaire_id: Optional[str] = Query(default=None)):
    effective_id = questionnaire_id or get_default_questionnaire().id
    stored = get_answers(user_id, effective_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Answers not found")
    return stored


@app.post("/api/questionnaires/{questionnaire_id}/answers", response_model=StoredAnswers, status_code=201)
def post_answers_for_questionnaire(questionnaire_id: str, payload: AnswersPayload):
    effective_id = payload.questionnaireId or questionnaire_id
    if payload.questionnaireId and payload.questionnaireId != questionnaire_id:
        raise HTTPException(status_code=400, detail="Questionnaire ID mismatch")
    stored = save_answers(payload.userId, effective_id, payload.answers)
    return stored


@app.get("/api/questionnaires/{questionnaire_id}/answers/{user_id}", response_model=StoredAnswers)
def fetch_answers_for_questionnaire(questionnaire_id: str, user_id: str):
    stored = get_answers(user_id, questionnaire_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Answers not found")
    return stored

@app.get("/health")
def health():
    return {"status": "ok"}

# Run with: uvicorn main:app --reload
