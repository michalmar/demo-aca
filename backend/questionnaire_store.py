import logging
from pathlib import Path

try:
    from backend.cosmos import read_questionnaire, upsert_questionnaire, questionnaire_available
    from backend.data import QUESTIONNAIRE
    from backend.models import Questionnaire
except ImportError:  # Allow execution when package context is unavailable
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from cosmos import read_questionnaire, upsert_questionnaire, questionnaire_available
    from data import QUESTIONNAIRE
    from models import Questionnaire


logger = logging.getLogger(__name__)

def seed_if_empty():
    if not questionnaire_available():
        logger.warning("Skipping questionnaire seed because Cosmos questionnaire container is unavailable.")
        return False
    existing = read_questionnaire()
    if existing:
        logger.info("Questionnaire already present in Cosmos; skipping seed.")
        return True
    logger.info("Seeding default questionnaire with %d questions", len(QUESTIONNAIRE.questions))
    doc = {
        "id": "questionnaire",
        "title": QUESTIONNAIRE.title,
        "description": QUESTIONNAIRE.description,
        "questions": [q.dict() for q in QUESTIONNAIRE.questions]
    }
    upsert_questionnaire(doc)
    logger.info("Default questionnaire seeded successfully.")
    return True

def get_questionnaire() -> Questionnaire:
    remote = read_questionnaire()
    if remote:
        logger.debug("Returning questionnaire from Cosmos store.")
        return Questionnaire(**remote)
    logger.debug("Returning bundled questionnaire fallback.")
    return QUESTIONNAIRE
