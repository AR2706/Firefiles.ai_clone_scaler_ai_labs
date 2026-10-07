"""A token-bucket rate limiter, applied to every API request as middleware.

Each client gets a bucket holding up to `capacity` tokens. A request spends
one token; tokens refill at a steady rate. This allows short bursts (a page
load firing several requests) while capping the sustained request rate.

Buckets live in this process's memory, which is right for a single server.
With several servers the same algorithm would keep its buckets in Redis.
"""
import math
import time
from dataclasses import dataclass

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import RATE_LIMIT_CAPACITY, RATE_LIMIT_REFILL_PER_SECOND

MAX_TRACKED_CLIENTS = 10_000


@dataclass
class Bucket:
    tokens: float
    updated_at: float


class TokenBucketLimiter:
    def __init__(self, capacity: int, refill_per_second: float, clock=time.monotonic):
        self.capacity = capacity
        self.refill_per_second = refill_per_second
        self._clock = clock
        self._buckets: dict[str, Bucket] = {}

    def take(self, key: str) -> tuple[bool, int, int]:
        """Spend one token for `key`.

        Returns (allowed, tokens remaining, seconds until the next token).
        """
        now = self._clock()
        bucket = self._buckets.get(key)
        if bucket is None:
            if len(self._buckets) >= MAX_TRACKED_CLIENTS:
                self._buckets.clear()  # Crude cap so memory cannot grow without bound.
            bucket = self._buckets[key] = Bucket(tokens=self.capacity, updated_at=now)

        elapsed = now - bucket.updated_at
        bucket.tokens = min(self.capacity, bucket.tokens + elapsed * self.refill_per_second)
        bucket.updated_at = now

        if bucket.tokens >= 1:
            bucket.tokens -= 1
            return True, int(bucket.tokens), 0
        wait = math.ceil((1 - bucket.tokens) / self.refill_per_second)
        return False, 0, wait


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: TokenBucketLimiter | None = None):
        super().__init__(app)
        self.limiter = limiter or TokenBucketLimiter(
            RATE_LIMIT_CAPACITY, RATE_LIMIT_REFILL_PER_SECOND
        )

    async def dispatch(self, request: Request, call_next):
        # Health checks and CORS preflights are not counted.
        if not request.url.path.startswith("/api") or request.method == "OPTIONS":
            return await call_next(request)

        # Behind a proxy the real client address is the first X-Forwarded-For entry.
        forwarded = request.headers.get("x-forwarded-for", "")
        client = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")

        allowed, remaining, retry_after = self.limiter.take(client)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": str(retry_after), "X-RateLimit-Remaining": "0"},
            )
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.limiter.capacity)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
