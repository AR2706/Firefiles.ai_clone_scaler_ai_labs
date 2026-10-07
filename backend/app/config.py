"""Application settings, read from environment variables with safe defaults."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'app.db'}")

# Comma-separated list of origins allowed to call the API from a browser.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# Seed the database with sample meetings when it is empty on startup.
SEED_ON_STARTUP = os.getenv("SEED_ON_STARTUP", "true").lower() == "true"

# Token-bucket rate limit applied per client IP.
RATE_LIMIT_CAPACITY = int(os.getenv("RATE_LIMIT_CAPACITY", "120"))
RATE_LIMIT_REFILL_PER_SECOND = float(os.getenv("RATE_LIMIT_REFILL_PER_SECOND", "2"))
