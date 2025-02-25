import asyncio
import time
from typing import Dict, Optional

class RateLimiter:
    """Rate limiter implementation using token bucket algorithm."""

    def __init__(
        self,
        rate: float = 1.0,  # requests per second
        burst: int = 5      # maximum burst size
    ):
        self.rate = rate
        self.burst = burst
        self.tokens = burst
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()

        # Per-endpoint limits
        self.endpoint_limits: Dict[str, Dict[str, float]] = {}

    def _add_tokens(self) -> None:
        """Add tokens based on time elapsed."""
        now = time.monotonic()
        elapsed = now - self.last_update
        new_tokens = elapsed * self.rate

        self.tokens = min(self.burst, self.tokens + new_tokens)
        self.last_update = now

    async def acquire(self, tokens: int = 1) -> None:
        """Acquire tokens for a request."""
        async with self._lock:
            while self.tokens < tokens:
                self._add_tokens()
                if self.tokens < tokens:
                    wait_time = (tokens - self.tokens) / self.rate
                    await asyncio.sleep(wait_time)

            self.tokens -= tokens

    def set_endpoint_limit(
        self,
        endpoint: str,
        rate: float,
        burst: Optional[int] = None
    ) -> None:
        """Set rate limit for specific endpoint."""
        self.endpoint_limits[endpoint] = {
            'rate': rate,
            'burst': burst or int(rate * 2),
            'tokens': burst or int(rate * 2),
            'last_update': time.monotonic()
        }

    def remove_endpoint_limit(self, endpoint: str) -> None:
        """Remove rate limit for specific endpoint."""
        self.endpoint_limits.pop(endpoint, None)
