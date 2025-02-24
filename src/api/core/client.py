from typing import Any, Dict, Optional, Union
import aiohttp
from pydantic import BaseModel
from .errors import APIError, RateLimitError
from .rate_limit import RateLimiter
from .cache import ResponseCache
from .logging import api_logger

logger = api_logger

class APIResponse(BaseModel):
    """Standardized API response model."""
    status_code: int
    data: Optional[Any] = None
    error: Optional[str] = None
    headers: Dict[str, str] = {}

class BaseAPIClient:
    """Base API client with common functionality."""

    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        enable_cache: bool = True,
        enable_rate_limiting: bool = True
    ):
        self.base_url = base_url.rstrip('/')
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self._cache = ResponseCache() if enable_cache else None
        self._rate_limiter = RateLimiter() if enable_rate_limiting else None
        self._session = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create an aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self._session

    async def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Union[Dict[str, Any], str]] = None,
        headers: Optional[Dict[str, str]] = None,
        use_cache: bool = True
    ) -> APIResponse:
        """Make an HTTP request with caching and rate limiting."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        logger.debug(f"Making {method} request to {url}")
        if data:
            logger.debug(f"Request data: {data}")

        # Check cache if enabled and method is GET
        if self._cache and use_cache and method.upper() == 'GET':
            cached_response = self._cache.get(url, params)
            if cached_response:
                return cached_response

        # Apply rate limiting if enabled
        if self._rate_limiter:
            await self._rate_limiter.acquire()

        session = await self._get_session()
        try:
            async with session.request(
                method=method,
                url=url,
                params=params,
                json=data if isinstance(data, dict) else None,
                data=data if isinstance(data, str) else None,
                headers=headers
            ) as response:
                # Log response details for debugging
                logger.debug(f"Response status code: {response.status}")
                logger.debug(f"Response headers: {dict(response.headers)}")

                status_code = response.status
                response_headers = dict(response.headers)

                try:
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    if response.content_type == 'application/json':
                        logger.debug(f"Response content: {response_data}")
                    else:
                        logger.debug(f"Response content (raw): {response_data}")
                except:
                    response_data = None
                    logger.debug("No response content")

                # Handle common error cases
                if status_code >= 400:
                    error_msg = f"API request failed: {status_code}"
                    if isinstance(response_data, dict):
                        error_msg = f"{error_msg} - {response_data.get('error', '')}: {response_data.get('message', '')}"
                    elif response_data:
                        error_msg = f"{error_msg} - {response_data}"

                    if status_code == 429:
                        raise RateLimitError("Rate limit exceeded")
                    raise APIError(error_msg)

                api_response = APIResponse(
                    status_code=status_code,
                    data=response_data,
                    headers=response_headers
                )

                # Cache successful GET responses
                if self._cache and use_cache and method.upper() == 'GET':
                    self._cache.set(url, params, api_response)

                return api_response

        except aiohttp.ClientError as e:
            logger.error(f"Request failed: {str(e)}")
            raise APIError(f"Request failed: {str(e)}")

    async def close(self):
        """Close the session and cleanup resources."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None  # Clear the session reference
        if self._cache:
            self._cache.clear()

    async def __aenter__(self):
        """Enter async context manager."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context manager."""
        await self.close()
