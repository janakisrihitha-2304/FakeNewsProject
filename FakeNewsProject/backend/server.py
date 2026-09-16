import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analysis, ai

app = FastAPI(title="Signal Desk API", version="1.0.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.on_event("startup")
async def startup():
    from lib.db import connect
    await connect()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "signal-desk"}
