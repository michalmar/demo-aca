import os
from typing import Optional
from azure.cosmos import CosmosClient, PartitionKey, exceptions

from dotenv import load_dotenv
load_dotenv()

COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
COSMOS_DB_NAME = os.getenv("COSMOS_DB_NAME", "questionnaire_db")
COSMOS_CONTAINER = os.getenv("COSMOS_CONTAINER", "answers")
COSMOS_Q_CONTAINER = os.getenv("COSMOS_Q_CONTAINER", "questionnaire")

_client: Optional[CosmosClient] = None
_container = None
_q_container = None

def init_cosmos():
    global _client, _container, _q_container

    print(f"COSMOS_ENDPOINT: {COSMOS_ENDPOINT}")
    print(f"COSMOS_KEY: {'set' if COSMOS_KEY else 'not set'}")
    print(f"COSMOS_DB_NAME: {COSMOS_DB_NAME}")
    print(f"COSMOS_CONTAINER: {COSMOS_CONTAINER}")
    print(f"COSMOS_Q_CONTAINER: {COSMOS_Q_CONTAINER}")

    if not COSMOS_ENDPOINT or not COSMOS_KEY:
        return False  # not configured; use in-memory fallback
    try:
        _client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY, connection_verify=False)
        db = _client.create_database_if_not_exists(COSMOS_DB_NAME)
        _container = db.create_container_if_not_exists(
            id=COSMOS_CONTAINER,
            partition_key=PartitionKey(path="/userId"),
            offer_throughput=400
        )
        _q_container = db.create_container_if_not_exists(
            id=COSMOS_Q_CONTAINER,
            partition_key=PartitionKey(path="/id"),
            offer_throughput=400
        )
        return True
    except Exception as e:
        print(f"[Cosmos] init failed, fallback to memory: {e}")
        _client = None
        _container = None
        _q_container = None
        return False

def cosmos_available():
    return _container is not None

def upsert_answers(user_id: str, answers: dict):
    if not cosmos_available():
        return None
    doc = {"id": user_id, "userId": user_id, "answers": answers}
    _container.upsert_item(doc)
    return doc

def read_answers(user_id: str):
    if not cosmos_available():
        return None
    try:
        return _container.read_item(item=user_id, partition_key=user_id)
    except exceptions.CosmosResourceNotFoundError:
        return None

def questionnaire_available():
    return _q_container is not None

def upsert_questionnaire(doc: dict):
    if not questionnaire_available():
        return None
    _q_container.upsert_item(doc)
    return doc

def read_questionnaire():
    if not questionnaire_available():
        return None
    try:
        return _q_container.read_item(item="questionnaire", partition_key="questionnaire")
    except exceptions.CosmosResourceNotFoundError:
        return None
