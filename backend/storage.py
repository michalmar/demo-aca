from pathlib import Path
from typing import Dict

try:
    from backend.models import StoredAnswers
    from backend import cosmos
except ImportError:  # Allow fallback execution without package context
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from models import StoredAnswers
    import cosmos

# In-memory fallback store
_answers_store: Dict[str, StoredAnswers] = {}

def init_storage():
    cosmos.init_cosmos()

def save_answers(user_id: str, answers: dict):
    # Try cosmos first
    doc = cosmos.upsert_answers(user_id, answers)
    if doc:
        return StoredAnswers(userId=user_id, answers=doc["answers"])
    # Fallback to memory
    _answers_store[user_id] = StoredAnswers(userId=user_id, answers=answers)
    return _answers_store[user_id]

def get_answers(user_id: str):
    doc = cosmos.read_answers(user_id)
    if doc:
        return StoredAnswers(userId=user_id, answers=doc["answers"])
    return _answers_store.get(user_id)
