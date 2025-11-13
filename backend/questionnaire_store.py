from .cosmos import read_questionnaire, upsert_questionnaire, questionnaire_available
from .data import QUESTIONNAIRE
from .models import Questionnaire

def seed_if_empty():
    if not questionnaire_available():
        return False
    existing = read_questionnaire()
    if existing:
        return True
    doc = {
        "id": "questionnaire",
        "title": QUESTIONNAIRE.title,
        "description": QUESTIONNAIRE.description,
        "questions": [q.dict() for q in QUESTIONNAIRE.questions]
    }
    upsert_questionnaire(doc)
    return True

def get_questionnaire() -> Questionnaire:
    remote = read_questionnaire()
    if remote:
        return Questionnaire(**remote)
    return QUESTIONNAIRE
