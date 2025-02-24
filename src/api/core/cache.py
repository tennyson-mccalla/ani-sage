import time
from typing import Any, Dict, Optional, Tuple
import hashlib
import json

class CacheEntry:
    """Represents a cached API response."""
    def __init__(self, data: Any, expires_at: float):
        self.data = data
        self.expires_at = expires_at

class ResponseCache:
    """Simple in-memory cache for API responses."""

    def __init__(self, default_ttl: int = 300):  # 5 minutes default TTL
        self._cache: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl

    def _generate_key(self, url: str, params: Optional[Dict[str, Any]] = None) -> str:
        """Generate a unique cache key from URL and parameters."""
        key_parts = [url]
        if params:
            # Sort parameters to ensure consistent keys
            sorted_params = sorted(params.items())
            key_parts.append(json.dumps(sorted_params))

        key_string = '|'.join(key_parts)
        return hashlib.sha256(key_string.encode()).hexdigest()

    def get(self, url: str, params: Optional[Dict[str, Any]] = None) -> Optional[Any]:
        """Retrieve a cached response if it exists and hasn't expired."""
        key = self._generate_key(url, params)
        entry = self._cache.get(key)

        if entry and time.time() < entry.expires_at:
            return entry.data

        # Remove expired entry
        if entry:
            del self._cache[key]
        return None

    def set(
        self,
        url: str,
        params: Optional[Dict[str, Any]],
        data: Any,
        ttl: Optional[int] = None
    ) -> None:
        """Cache a response with optional TTL override."""
        key = self._generate_key(url, params)
        expires_at = time.time() + (ttl or self.default_ttl)
        self._cache[key] = CacheEntry(data, expires_at)

    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()

    def remove(self, url: str, params: Optional[Dict[str, Any]] = None) -> None:
        """Remove a specific cached entry."""
        key = self._generate_key(url, params)
        self._cache.pop(key, None)

    def set_ttl(self, url: str, params: Optional[Dict[str, Any]], ttl: int) -> None:
        """Update TTL for an existing cache entry."""
        key = self._generate_key(url, params)
        entry = self._cache.get(key)
        if entry:
            entry.expires_at = time.time() + ttl
