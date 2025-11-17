import logging
import os
from typing import Optional, Tuple

from azure.cosmos import CosmosClient, PartitionKey, exceptions
from azure.identity import ManagedIdentityCredential


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

_MANAGED_IDENTITY_CLIENT_ID = _get_setting(
    "AZURE_CLIENT_ID",
    "MANAGED_IDENTITY_CLIENT_ID",
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


def _managed_identity_available() -> bool:
    if COSMOS_KEY:
        return False
    identity_markers = (
        "AZURE_CLIENT_ID",
        "MANAGED_IDENTITY_CLIENT_ID",
        "IDENTITY_ENDPOINT",
        "MSI_ENDPOINT",
    )
    return any(os.getenv(marker) for marker in identity_markers)


def _build_managed_identity_credential() -> Optional[ManagedIdentityCredential]:
    try:
        if _MANAGED_IDENTITY_CLIENT_ID:
            return ManagedIdentityCredential(client_id=_MANAGED_IDENTITY_CLIENT_ID)
        return ManagedIdentityCredential()
    except Exception:  # pragma: no cover - defensive logging
        logger.exception("Failed to initialize managed identity credential")
        return None


def _resolve_credential() -> Tuple[Optional[object], str]:
    if COSMOS_KEY:
        return COSMOS_KEY, "key"
    if _managed_identity_available():
        credential = _build_managed_identity_credential()
        if credential:
            return credential, "managed identity"
    return None, "none"


def init_cosmos() -> bool:
    """Initialize Cosmos DB resources if configuration is available."""

    global _client, _answers_container, _questionnaire_container

    logger.info(
        "Cosmos configuration resolved: endpoint=%s key=%s managed_identity_client_id=%s database=%s answers_container=%s questionnaire_container=%s",
        "set" if COSMOS_ENDPOINT else "unset",
        "set" if COSMOS_KEY else "unset",
        "set" if _MANAGED_IDENTITY_CLIENT_ID else "unset",
        COSMOS_DATABASE_NAME,
        COSMOS_ANSWERS_CONTAINER,
        COSMOS_QUESTIONNAIRE_CONTAINER,
    )

    if not COSMOS_ENDPOINT:
        logger.warning("Skipping Cosmos initialization because endpoint is missing. Using in-memory fallback.")
        return False  # not configured; use in-memory fallback

    credential, auth_mode = _resolve_credential()
    if not credential:
        logger.warning(
            "Skipping Cosmos initialization because no valid credential was resolved. Using in-memory fallback.")
        return False

    try:
        client_kwargs = {}
        if _should_skip_ssl_verification():
            client_kwargs["connection_verify"] = False
            logger.info("COSMOS_EMULATOR_DISABLE_SSL_VERIFY is set; disabling SSL verification for client.")

        logger.info("Creating Cosmos client with %s authentication and ensuring database/containers exist...", auth_mode)
        _client = CosmosClient(COSMOS_ENDPOINT, credential=credential, **client_kwargs)
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
    except Exception:  # pragma: no cover - defensive logging
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
