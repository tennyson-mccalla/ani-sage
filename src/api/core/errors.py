"""
Error types for API modules.

These error classes provide structured error handling for API operations.
"""

from typing import Dict, Any, Optional


class APIError(Exception):
    """Base class for all API-related errors."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Initialize an API error.

        Args:
            message: Error message
            code: Error code
            details: Additional error details
        """
        self.message = message
        self.code = code or "API_ERROR"
        self.details = details or {}
        super().__init__(message)


class AuthenticationError(APIError):
    """Exception raised for authentication failures."""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "AUTH_ERROR", details)


class ValidationError(APIError):
    """Exception raised for invalid request parameters."""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "VALIDATION_ERROR", details)


class RateLimitError(APIError):
    """Exception raised when rate limits are exceeded."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        details = details or {}
        if retry_after:
            details["retry_after"] = retry_after
        super().__init__(message, "RATE_LIMIT_ERROR", details)


class QuotaExceededError(APIError):
    """Exception raised when API quotas are exceeded."""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "QUOTA_EXCEEDED_ERROR", details)


class NetworkError(APIError):
    """Exception raised for network connectivity issues."""

    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, "NETWORK_ERROR", details)


class ResourceNotFoundError(APIError):
    """Exception raised when a requested resource is not found."""

    def __init__(
        self,
        message: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        details = details or {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
        super().__init__(message, "RESOURCE_NOT_FOUND", details)


# Export a warning about deprecation
import warnings
warnings.warn(
    "Direct use of src.api.core.errors is deprecated. "
    "Please use src.utils.errors instead.",
    DeprecationWarning,
    stacklevel=2
)
