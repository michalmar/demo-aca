import os
from typing import Optional

from azure.cosmos import CosmosClient, PartitionKey, exceptions


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

    print(f"COSMOS_ENDPOINT: {COSMOS_ENDPOINT}")
    print(f"COSMOS_KEY: {'set' if COSMOS_KEY else 'not set'}")
    print(f"COSMOS_DATABASE_NAME: {COSMOS_DATABASE_NAME}")
    print(f"COSMOS_ANSWERS_CONTAINER: {COSMOS_ANSWERS_CONTAINER}")
    print(f"COSMOS_QUESTIONNAIRE_CONTAINER: {COSMOS_QUESTIONNAIRE_CONTAINER}")

    if not COSMOS_ENDPOINT or not COSMOS_KEY:
        return False  # not configured; use in-memory fallback

    try:
        client_kwargs = {}
        if _should_skip_ssl_verification():
            client_kwargs["connection_verify"] = False

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
        return True
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"[Cosmos] init failed, fallback to memory: {exc}")
        _client = None
        _answers_container = None
        _questionnaire_container = None
        return False


def cosmos_available() -> bool:
    return _answers_container is not None


def upsert_answers(user_id: str, answers: dict):
    if not cosmos_available():
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
        return None
    _questionnaire_container.upsert_item(doc)
    return doc


def read_questionnaire():
    if not questionnaire_available():
        return None
    try:
        return _questionnaire_container.read_item(
            item="questionnaire",
            partition_key="questionnaire",
        )
    except exceptions.CosmosResourceNotFoundError:
        return None
