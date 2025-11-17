import logging
import os
from typing import Optional

from azure.cosmos import CosmosClient, PartitionKey, exceptions


logger = logging.getLogger(__name__)


def _get_setting(*keys: str, default: Optional[str] = None) -> Optional[str]:
    """Resolve the first matching environment variable from the provided keys."""

    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return default


COSMOS_ENDPOINT = _get_setting("COSMOS_ENDPOINT")
COSMOS_KEY = _get_setting("COSMOS_KEY")
COSMOS_DATABASE_NAME = _get_setting(
    "COSMOS_DATABASE_NAME",
    "COSMOS_DB_NAME",
    default="questionnaire_db",
)
COSMOS_ANSWERS_CONTAINER = _get_setting(
    "COSMOS_ANSWERS_CONTAINER_NAME",
    default="answers",
)
COSMOS_QUESTIONNAIRE_CONTAINER = _get_setting(
    "COSMOS_QUESTIONNAIRE_CONTAINER_NAME",
    default="questionnaire",
)

_ANSWERS_PARTITION_KEY = _get_setting(
    "COSMOS_ANSWERS_PARTITION_KEY",
    default="/userId",
)
_QUESTIONNAIRE_PARTITION_KEY = _get_setting(
    "COSMOS_QUESTIONNAIRE_PARTITION_KEY",
    default="/id",
)

_client: Optional[CosmosClient] = None
_answers_container = None
_questionnaire_container = None


def _should_skip_ssl_verification() -> bool:
    return _get_setting("COSMOS_EMULATOR_DISABLE_SSL_VERIFY") in {"1", "true", "True"}


def init_cosmos() -> bool:
    """Initialize Cosmos DB resources if configuration is available."""

    global _client, _answers_container, _questionnaire_container

    logger.info(
        "Cosmos configuration resolved: endpoint=%s key=%s database=%s answers_container=%s questionnaire_container=%s",
        "set" if COSMOS_ENDPOINT else "unset",
        "set" if COSMOS_KEY else "unset",
        COSMOS_DATABASE_NAME,
        COSMOS_ANSWERS_CONTAINER,
        COSMOS_QUESTIONNAIRE_CONTAINER,
    )

    if not COSMOS_ENDPOINT or not COSMOS_KEY:
        logger.warning(
            "Skipping Cosmos initialization because endpoint or key is missing. Using in-memory fallback.")
        return False  # not configured; use in-memory fallback

    try:
        client_kwargs = {}
        if _should_skip_ssl_verification():
            client_kwargs["connection_verify"] = False
            logger.info("COSMOS_EMULATOR_DISABLE_SSL_VERIFY is set; disabling SSL verification for client.")

        logger.info("Creating Cosmos client and ensuring database/containers exist...")
        _client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY, **client_kwargs)
        database = _client.create_database_if_not_exists(COSMOS_DATABASE_NAME)

        _answers_container = database.create_container_if_not_exists(
            id=COSMOS_ANSWERS_CONTAINER,
            partition_key=PartitionKey(path=_ANSWERS_PARTITION_KEY),
        )

        _questionnaire_container = database.create_container_if_not_exists(
            id=COSMOS_QUESTIONNAIRE_CONTAINER,
            partition_key=PartitionKey(path=_QUESTIONNAIRE_PARTITION_KEY),
        )
        logger.info("Cosmos containers ready: answers=%s questionnaire=%s", COSMOS_ANSWERS_CONTAINER, COSMOS_QUESTIONNAIRE_CONTAINER)
        return True
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Cosmos initialization failed; falling back to in-memory store")
        _client = None
        _answers_container = None
        _questionnaire_container = None
        return False


def cosmos_available() -> bool:
    return _answers_container is not None


def upsert_answers(user_id: str, answers: dict):
    if not cosmos_available():
        logger.debug("Cosmos unavailable when upserting answers for user %s; returning None", user_id)
        return None
    document = {"id": user_id, "userId": user_id, "answers": answers}
    _answers_container.upsert_item(document)
    return document


def read_answers(user_id: str):
    if not cosmos_available():
        return None
    try:
        return _answers_container.read_item(item=user_id, partition_key=user_id)
    except exceptions.CosmosResourceNotFoundError:
        return None


def questionnaire_available() -> bool:
    return _questionnaire_container is not None


def upsert_questionnaire(doc: dict):
    if not questionnaire_available():
        logger.debug("Cosmos questionnaire container not available; cannot upsert questionnaire")
        return None
    _questionnaire_container.upsert_item(doc)
    return doc


def read_questionnaire():
    if not questionnaire_available():
        logger.debug("Cosmos questionnaire container not available; cannot read questionnaire")
        return None
    try:
        return _questionnaire_container.read_item(
            item="questionnaire",
            partition_key="questionnaire",
        )
    except exceptions.CosmosResourceNotFoundError:
        return None
