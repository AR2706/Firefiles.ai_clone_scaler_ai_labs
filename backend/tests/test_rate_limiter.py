from app.services.rate_limiter import TokenBucketLimiter


class FakeClock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now


def test_burst_up_to_capacity_then_blocked():
    limiter = TokenBucketLimiter(capacity=3, refill_per_second=1, clock=FakeClock())
    assert [limiter.take("a")[0] for _ in range(4)] == [True, True, True, False]


def test_tokens_refill_over_time():
    clock = FakeClock()
    limiter = TokenBucketLimiter(capacity=2, refill_per_second=0.5, clock=clock)
    limiter.take("a"), limiter.take("a")
    allowed, _, retry_after = limiter.take("a")
    assert (allowed, retry_after) == (False, 2)
    clock.now += 2
    assert limiter.take("a")[0] is True


def test_clients_have_separate_buckets():
    limiter = TokenBucketLimiter(capacity=1, refill_per_second=1, clock=FakeClock())
    assert limiter.take("a")[0] is True
    assert limiter.take("a")[0] is False
    assert limiter.take("b")[0] is True


def test_api_reports_remaining_requests(client):
    response = client.get("/api/meetings")
    assert "x-ratelimit-remaining" in response.headers
