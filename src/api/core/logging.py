"""API-specific logging configuration for ani-sage."""

import logging
import os
import sys
from typing import Optional

# Import from the main logging module
from ...utils.logging import get_logger

def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Configure and return a logger instance.

    This function is kept for backward compatibility.
    New code should use get_logger() from utils.logging directly.

    Args:
        name: Logger name
        level: Optional log level override

    Returns:
        Configured logger instance
    """
    # We'll delegate to the main logging system
    logger = get_logger(name)

    # If level is explicitly specified, set it
    if level:
        logger.setLevel(level.upper())

    return logger

# For backward compatibility, keep the existing logger references
# but make them refer to the unified loggers
api_logger = get_logger("ani_sage.api")
mal_logger = get_logger("ani_sage.api.mal")
anilist_logger = get_logger("ani_sage.api.anilist")
youtube_logger = get_logger("ani_sage.api.youtube")
auth_logger = get_logger("ani_sage.api.auth")

# Export a warning about deprecation
import warnings
warnings.warn(
    "Direct use of src.api.core.logging is deprecated. "
    "Please use src.utils.logging instead.",
    DeprecationWarning,
    stacklevel=2
)
