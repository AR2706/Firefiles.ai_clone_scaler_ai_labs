"""Application entry point: builds the FastAPI app and wires up the routers."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, SEED_ON_STARTUP
from app.database import init_db
from app.routers import export, meetings, notes, search, transcript
from app.seed import seed_if_empty
from app.services.rate_limiter import RateLimitMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    if SEED_ON_STARTUP:
        seed_if_empty()
    yield


app = FastAPI(title="MeetNotes API", version="1.0.0", lifespan=lifespan)

# Middleware added last runs first, so CORS wraps the rate limiter and even a
# 429 response carries the headers a browser needs to read it.
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Retry-After", "X-RateLimit-Remaining"],
)

for router in (meetings.router, transcript.router, notes.router, search.router, export.router):
    app.include_router(router, prefix="/api")


@app.get("/healthz", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
