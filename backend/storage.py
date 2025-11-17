from pathlib import Path
from typing import Dict, Optional

try:
    from backend import cosmos
    from backend.models import StoredAnswers
except ImportError:  # Allow fallback execution without package context
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    import cosmos
    from models import StoredAnswers

# In-memory fallback store keyed by "{questionnaire_id}:{user_id}"
_answers_store: Dict[str, StoredAnswers] = {}


def _answer_key(user_id: str, questionnaire_id: str) -> str:
    return f"{questionnaire_id}:{user_id}"


def init_storage():
    cosmos.init_cosmos()


def save_answers(user_id: str, questionnaire_id: str, answers: dict) -> StoredAnswers:
    # Try cosmos first
    doc = cosmos.upsert_answers(user_id, questionnaire_id, answers)
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
