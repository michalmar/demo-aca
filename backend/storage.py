from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from backend import cosmos
    from backend.models import StoredAnswers, AnswerDetail
except ImportError:  # Allow fallback execution without package context
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    import cosmos
    from models import StoredAnswers, AnswerDetail

# In-memory fallback store keyed by "{questionnaire_id}:{user_id}"
_answers_store: Dict[str, StoredAnswers] = {}


def _answer_key(user_id: str, questionnaire_id: str) -> str:
    return f"{questionnaire_id}:{user_id}"


def init_storage():
    cosmos.init_cosmos()


def _serialize_answers(answers: Dict[str, AnswerDetail]) -> Dict[str, Dict[str, object]]:
    serialized: Dict[str, Dict[str, object]] = {}
    for key, detail in answers.items():
        if isinstance(detail, AnswerDetail):
            serialized[key] = detail.model_dump(exclude_none=True)
        elif isinstance(detail, dict):
            serialized[key] = {k: v for k, v in detail.items() if v is not None}
        else:
            serialized[key] = {"value": detail}
    return serialized


def save_answers(user_id: str, questionnaire_id: str, answers: Dict[str, AnswerDetail]) -> StoredAnswers:
    # Try cosmos first
    doc = cosmos.upsert_answers(user_id, questionnaire_id, _serialize_answers(answers))
    if doc:
        return StoredAnswers(
            userId=user_id,
            questionnaireId=questionnaire_id,
            answers=doc["answers"],
        )
    # Fallback to memory
    key = _answer_key(user_id, questionnaire_id)
    stored = StoredAnswers(userId=user_id, questionnaireId=questionnaire_id, answers=answers)
    _answers_store[key] = stored
    return stored


def get_answers(user_id: str, questionnaire_id: str) -> Optional[StoredAnswers]:
    doc = cosmos.read_answers(user_id, questionnaire_id)
    if doc:
        return StoredAnswers(
            userId=user_id,
            questionnaireId=questionnaire_id,
            answers=doc["answers"],
        )
    key = _answer_key(user_id, questionnaire_id)
    return _answers_store.get(key)


def list_all_answers(limit: int = 100, offset: int = 0) -> Tuple[List[StoredAnswers], int]:
    """List all answers with pagination support.
    
    Returns a tuple of (items, total_count).
    """
    docs, total = cosmos.list_answers(limit=limit, offset=offset)
    if docs is not None:
        return [
            StoredAnswers(
                userId=doc.get("userId", ""),
                questionnaireId=doc.get("questionnaireId", ""),
                answers=doc.get("answers", {}),
            )
            for doc in docs
        ], total
    
    # Fallback to in-memory store
    all_items = list(_answers_store.values())
    total = len(all_items)
    return all_items[offset:offset + limit], total


def delete_stored_answers(user_id: str, questionnaire_id: str) -> bool:
    """Delete an answers document.
    
    Returns True if deleted successfully, False otherwise.
    """
    deleted = cosmos.delete_answers(user_id, questionnaire_id)
    if deleted:
        return True
    
    # Try in-memory fallback
    key = _answer_key(user_id, questionnaire_id)
    if key in _answers_store:
        del _answers_store[key]
        return True
    return False
