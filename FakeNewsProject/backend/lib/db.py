import os
from typing import Any, Dict, List

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "app")

client = None
db = None
_memory: Dict[str, List[Dict[str, Any]]] = {"analyses": [], "reports": []}


async def connect():
    global client, db
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=1500)
        await client.admin.command("ping")
        db = client[DB_NAME]
    except Exception:
        client = None
        db = None  # fall back to in-memory store so the app still runs without MongoDB


def using_memory():
    return db is None


async def insert_one(collection: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    if db is not None:
        result = await db[collection].insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc
    doc["_id"] = str(len(_memory[collection]) + 1)
    _memory[collection].append(doc)
    return doc


async def find(collection: str, limit: int = 100) -> List[Dict[str, Any]]:
    if db is not None:
        docs = []
        async for d in db[collection].find().sort("created_at", -1).limit(limit):
            d["_id"] = str(d["_id"])
            docs.append(d)
        return docs
    return list(reversed(_memory[collection]))[:limit]


async def count(collection: str) -> int:
    if db is not None:
        return await db[collection].count_documents({})
    return len(_memory[collection])


async def stats() -> Dict[str, Any]:
    return {
        "analyses": await count("analyses"),
        "reports": await count("reports"),
        "engine": "TF-IDF",
        "modules": 5,
        "storage": "memory" if using_memory() else "mongodb",
    }
