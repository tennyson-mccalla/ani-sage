"""Standard error handling for ani-sage."""

import sys
import traceback
from typing import Any, Dict, Optional, Type, TypeVar

from .logging import get_logger

# Create logger for error handling
logger = get_logger("ani_sage.errors")

# Error levels
ERROR_LEVELS = {
    "DEBUG": 0,
    "INFO": 1,
    "WARNING": 2,
    "ERROR": 3,
    "CRITICAL": 4,
}

# Generic type for exception classes
E = TypeVar('E', bound=Exception)

class AniSageError(Exception):
    """Base exception for all ani-sage errors.

    All custom exceptions should inherit from this class.
    """

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        level: str = "ERROR"
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}
        self.level = level

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary for serialization."""
        return {
            "error": self.code or self.__class__.__name__,
            "message": self.message,
            "details": self.details,
            "level": self.level,
        }

    def log(self) -> None:
        """Log this error at the appropriate level with its details."""
        log_method = getattr(logger, self.level.lower(), logger.error)
        log_method(f"{self.code or self.__class__.__name__}: {self.message}")

        if self.details:
            log_method(f"Error details: {self.details}")


class ConfigError(AniSageError):
    """Exception raised for configuration-related errors."""
    pass


class MetadataError(AniSageError):
    """Exception raised for metadata processing errors."""
    pass


class APIError(AniSageError):
    """Exception raised for API-related errors."""
    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status_code: Optional[int] = None,
    ):
        super().__init__(message, code, details)
        self.status_code = status_code


class ValidationError(AniSageError):
    """Exception raised for data validation errors."""
    def __init__(self, message: str, field: Optional[str] = None, **kwargs):
        details = kwargs.pop("details", {})
        if field:
            details["field"] = field
        super().__init__(message, "VALIDATION_ERROR", details, "WARNING")


class AnalysisError(AniSageError):
    """Exception raised for AI analysis errors."""
    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
    ):
        if model:
            details = details or {}
            details["model"] = model
        super().__init__(message, code or "ANALYSIS_ERROR", details)


def handle_exception(
    exc: Exception,
    exc_type: Optional[Type[E]] = None,
    reraise: bool = False,
    log_level: str = "ERROR",
    exit_code: Optional[int] = None,
) -> None:
    """Handle an exception with appropriate logging.

    Args:
        exc: The exception to handle
        exc_type: Expected exception type
        reraise: Whether to re-raise the exception after handling
        log_level: Level to log the exception at
        exit_code: If provided, exit the program with this code

    Raises:
        The original exception if reraise is True
    """
    if isinstance(exc, AniSageError):
        # Use the error's own logging if it's our custom error
        exc.log()
    else:
        # Log unexpected exceptions
        log_method = getattr(logger, log_level.lower(), logger.error)
        exc_name = exc.__class__.__name__

        log_method(f"Unexpected {exc_name}: {str(exc)}")

        # For unexpected errors, include traceback at debug level
        logger.debug(f"Traceback:\n{''.join(traceback.format_tb(exc.__traceback__))}")

    # Verify exception type if specified
    if exc_type and not isinstance(exc, exc_type):
        logger.error(f"Expected {exc_type.__name__} but got {exc.__class__.__name__}")

    # Exit if exit code provided
    if exit_code is not None:
        sys.exit(exit_code)

    # Re-raise if requested
    if reraise:
        raise exc
