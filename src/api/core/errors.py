"""API-specific error types for ani-sage."""

# Import from the main error handling module
from ...utils.errors import AniSageError, APIError as BaseAPIError

# For backward compatibility, keep separate API error classes
# but make them inherit from our unified error system

class APIError(BaseAPIError):
    """Base exception for API-related errors.

    This class is kept for backward compatibility.
    New code should use utils.errors.APIError directly.
    """
    def __init__(self, message: str, status_code: int = None):
        super().__init__(
            message=message,
            code="API_ERROR",
            details={"status_code": status_code} if status_code else None,
            status_code=status_code
        )


class RateLimitError(APIError):
    """Exception raised when API rate limit is exceeded."""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429)


class AuthenticationError(APIError):
    """Exception raised for authentication failures."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class ValidationError(APIError):
    """Exception raised for invalid request data."""
    def __init__(self, message: str = "Invalid request data"):
        super().__init__(message, status_code=400)


class NotFoundError(APIError):
    """Exception raised when requested resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


# Export a warning about deprecation
import warnings
warnings.warn(
    "Direct use of src.api.core.errors is deprecated. "
    "Please use src.utils.errors instead.",
    DeprecationWarning,
    stacklevel=2
)
