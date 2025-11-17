import logging
from pathlib import Path
from typing import Dict, List, Optional

try:
    from backend.cosmos import (
        delete_questionnaire as cosmos_delete_questionnaire,
        list_questionnaires as cosmos_list_questionnaires,
        questionnaire_available,
        read_questionnaire as cosmos_read_questionnaire,
        upsert_questionnaire as cosmos_upsert_questionnaire,
    )
    from backend.data import DEFAULT_QUESTIONNAIRE_ID, QUESTIONNAIRES
    from backend.models import Questionnaire, QuestionnaireCreate, QuestionnaireUpdate
except ImportError:  # Allow execution when package context is unavailable
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from cosmos import (
        delete_questionnaire as cosmos_delete_questionnaire,
        list_questionnaires as cosmos_list_questionnaires,
        questionnaire_available,
        read_questionnaire as cosmos_read_questionnaire,
        upsert_questionnaire as cosmos_upsert_questionnaire,
    )
    from data import DEFAULT_QUESTIONNAIRE_ID, QUESTIONNAIRES
    from models import Questionnaire, QuestionnaireCreate, QuestionnaireUpdate


logger = logging.getLogger(__name__)

_memory_store: Dict[str, Questionnaire] = {q.id: q for q in QUESTIONNAIRES}


def _use_memory_store() -> bool:
    return not questionnaire_available()


def _store_questionnaire_locally(questionnaire: Questionnaire) -> Questionnaire:
    _memory_store[questionnaire.id] = questionnaire
    return questionnaire


def seed_if_empty() -> bool:
    if not questionnaire_available():
        logger.warning("Skipping questionnaire seed because Cosmos questionnaire container is unavailable.")
        return False

    existing = cosmos_list_questionnaires() or []
    if existing:
        logger.info("Questionnaires already present in Cosmos; skipping seed.")
        return True

    logger.info("Seeding %d default questionnaire(s) into Cosmos", len(QUESTIONNAIRES))
    for questionnaire in QUESTIONNAIRES:
        cosmos_upsert_questionnaire(questionnaire.model_dump())
    logger.info("Default questionnaires seeded successfully.")
    return True


def list_questionnaires() -> List[Questionnaire]:
    if _use_memory_store():
        return list(_memory_store.values())

    docs = cosmos_list_questionnaires()
    if docs is None:
        logger.debug("Cosmos list returned None; falling back to in-memory questionnaires")
        return list(_memory_store.values())
    return [Questionnaire(**doc) for doc in docs]


def get_questionnaire(questionnaire_id: str) -> Optional[Questionnaire]:
    if _use_memory_store():
        return _memory_store.get(questionnaire_id)
    doc = cosmos_read_questionnaire(questionnaire_id)
    return Questionnaire(**doc) if doc else None


def get_default_questionnaire() -> Questionnaire:
    questionnaire = get_questionnaire(DEFAULT_QUESTIONNAIRE_ID)
    if questionnaire:
        return questionnaire
    # Defensive fallback to first bundled questionnaire when Cosmos returns empty.
    return QUESTIONNAIRES[0]


def create_questionnaire(payload: QuestionnaireCreate) -> Questionnaire:
    if _use_memory_store():
        if payload.id in _memory_store:
            raise ValueError(f"Questionnaire with id '{payload.id}' already exists")
        return _store_questionnaire_locally(Questionnaire(**payload.model_dump()))

    existing = cosmos_read_questionnaire(payload.id)
    if existing:
        raise ValueError(f"Questionnaire with id '{payload.id}' already exists")

    cosmos_upsert_questionnaire(payload.model_dump())
    questionnaire = Questionnaire(**payload.model_dump())
    _store_questionnaire_locally(questionnaire)
    return questionnaire


def update_questionnaire(questionnaire_id: str, updates: QuestionnaireUpdate) -> Optional[Questionnaire]:
    stored = get_questionnaire(questionnaire_id)
    if not stored:
        return None

    update_data = updates.model_dump(exclude_unset=True, exclude_none=True)
    merged_data = {**stored.model_dump(), **update_data}
    updated = Questionnaire(**merged_data)

    if _use_memory_store():
        return _store_questionnaire_locally(updated)

    cosmos_upsert_questionnaire(updated.model_dump())
    _store_questionnaire_locally(updated)
    return updated


def delete_questionnaire(questionnaire_id: str) -> bool:
    if _use_memory_store():
        return _memory_store.pop(questionnaire_id, None) is not None

    deleted = cosmos_delete_questionnaire(questionnaire_id)
    _memory_store.pop(questionnaire_id, None)
    return bool(deleted)
