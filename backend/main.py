from contextlib import asynccontextmanager
from pathlib import Path

from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

import os
import sys

sys.path.append(str(Path(__file__).resolve().parent))
import cosmos
from models import (
    AnswersPayload,
    Questionnaire,
    QuestionnaireCreate,
    QuestionnaireUpdate,
    StoredAnswers,
    TopicUploadRequest,
    TopicUploadResponse,
    PaginatedAnswersResponse,
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
from storage import save_answers, get_answers, init_storage, list_all_answers, delete_stored_answers
from content_generator import get_content_generator


def _answers_or_empty(user_id: str, questionnaire_id: str) -> StoredAnswers:
    stored = get_answers(user_id, questionnaire_id)
    if stored:
        return stored
    # Return an empty payload so callers don't need to special-case new users.
    return StoredAnswers(userId=user_id, questionnaireId=questionnaire_id, answers={})

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
    return _answers_or_empty(user_id, effective_id)


@app.post("/api/questionnaires/{questionnaire_id}/answers", response_model=StoredAnswers, status_code=201)
def post_answers_for_questionnaire(questionnaire_id: str, payload: AnswersPayload):
    effective_id = payload.questionnaireId or questionnaire_id
    if payload.questionnaireId and payload.questionnaireId != questionnaire_id:
        raise HTTPException(status_code=400, detail="Questionnaire ID mismatch")
    stored = save_answers(payload.userId, effective_id, payload.answers)
    return stored


@app.get("/api/questionnaires/{questionnaire_id}/answers/{user_id}", response_model=StoredAnswers)
def fetch_answers_for_questionnaire(questionnaire_id: str, user_id: str):
    return _answers_or_empty(user_id, questionnaire_id)


@app.get("/api/responses", response_model=PaginatedAnswersResponse)
def list_responses(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(default=10, ge=1, le=100, description="Number of items per page"),
):
    """List all stored answers with pagination."""
    import math
    offset = (page - 1) * pageSize
    items, total = list_all_answers(limit=pageSize, offset=offset)
    total_pages = math.ceil(total / pageSize) if total > 0 else 1
    return PaginatedAnswersResponse(
        items=items,
        total=total,
        page=page,
        pageSize=pageSize,
        totalPages=total_pages,
    )


@app.delete("/api/responses/{questionnaire_id}/{user_id}", status_code=204)
def delete_response(questionnaire_id: str, user_id: str):
    """Delete a specific response by questionnaire ID and user ID."""
    deleted = delete_stored_answers(user_id, questionnaire_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Response not found")
    return Response(status_code=204)


@app.post("/api/upload", response_model=TopicUploadResponse)
def upload_topic(payload: TopicUploadRequest):
    """
    Upload a new topic to generate flashcards and test questions.
    
    This endpoint uses Azure OpenAI to generate educational content
    and stores it in CosmosDB as new questionnaire documents.
    """
    generator = get_content_generator()
    
    if not generator.is_available():
        raise HTTPException(
            status_code=503,
            detail="Content generation service is not available. Check Azure OpenAI configuration."
        )
    
    flashcard_id = None
    test_id = None
    errors = []
    
    images = [image.model_dump() for image in (payload.images or [])]

    # Generate flashcards
    try:
        flashcard_data = generator.generate_flashcards(payload.topicName, payload.topicText, images=images)
        flashcard_questionnaire = QuestionnaireCreate(**flashcard_data)
        created_flashcard = create_questionnaire(flashcard_questionnaire)
        flashcard_id = created_flashcard.id
    except ValueError as e:
        # Duplicate ID - try with a unique suffix
        try:
            import time
            flashcard_data["id"] = f"{flashcard_data.get('id', 'flashcard')}-{int(time.time())}"
            flashcard_questionnaire = QuestionnaireCreate(**flashcard_data)
            created_flashcard = create_questionnaire(flashcard_questionnaire)
            flashcard_id = created_flashcard.id
        except Exception as inner_e:
            errors.append(f"Flashcard creation failed: {inner_e}")
    except Exception as e:
        errors.append(f"Flashcard generation failed: {e}")
    
    # Generate test
    try:
        test_data = generator.generate_test(payload.topicName, payload.topicText, images=images)
        test_questionnaire = QuestionnaireCreate(**test_data)
        created_test = create_questionnaire(test_questionnaire)
        test_id = created_test.id
    except ValueError as e:
        # Duplicate ID - try with a unique suffix
        try:
            import time
            test_data["id"] = f"{test_data.get('id', 'test')}-{int(time.time())}"
            test_questionnaire = QuestionnaireCreate(**test_data)
            created_test = create_questionnaire(test_questionnaire)
            test_id = created_test.id
        except Exception as inner_e:
            errors.append(f"Test creation failed: {inner_e}")
    except Exception as e:
        errors.append(f"Test generation failed: {e}")
    
    if not flashcard_id and not test_id:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate content: {'; '.join(errors)}"
        )
    
    message_parts = []
    if flashcard_id:
        message_parts.append(f"Flashcards created (ID: {flashcard_id})")
    if test_id:
        message_parts.append(f"Test created (ID: {test_id})")
    if errors:
        message_parts.append(f"Warnings: {'; '.join(errors)}")
    
    return TopicUploadResponse(
        success=True,
        message="; ".join(message_parts),
        flashcardId=flashcard_id,
        testId=test_id
    )


@app.get("/check")
def check_cosmos_connection():
    """Return the current Cosmos DB connectivity status."""

    connected = False
    detail = "Cosmos DB connection not initialized."

    try:
        connected = cosmos.cosmos_available()
        if connected:
            detail = "Cosmos DB connection is healthy."
        else:
            # Attempt a one-time re-initialization in case connectivity was restored.
            init_attempt = cosmos.init_cosmos()
            if init_attempt and cosmos.cosmos_available():
                connected = True
                detail = "Cosmos DB connection re-established after re-initialization."
            else:
                detail = "Cosmos DB is unavailable or not configured; API is using in-memory storage."
    except Exception as exc:  # pragma: no cover - defensive logging
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "connected": False,
                "detail": f"Failed to verify Cosmos DB connectivity: {exc}",
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK if connected else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "ok" if connected else "unavailable",
            "connected": connected,
            "detail": detail,
        },
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/config")
def get_config():
    """Return public configuration information including the OpenAI model in use."""
    return {
        "openaiModel": os.getenv("AZURE_OPENAI_MODEL", "unknown"),
    }

# Run with: uvicorn main:app --reload
