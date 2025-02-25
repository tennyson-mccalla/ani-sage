"""Logging configuration for ani-sage."""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Dict, Optional

# Default log format
DEFAULT_LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Global logger registry
_loggers: Dict[str, logging.Logger] = {}

def get_log_level() -> str:
    """Get the log level from environment variables.

    Returns:
        The log level as a string (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # First try ANI_SAGE_LOG_LEVEL, then fallback to DEBUG if DEBUG=1 is set
    level = os.getenv("ANI_SAGE_LOG_LEVEL")
    if level is None and os.getenv("DEBUG") == "1":
        level = "DEBUG"
    return level or "INFO"

def setup_logging(
    log_level: Optional[str] = None,
    log_file: Optional[str] = None,
    log_format: Optional[str] = None
) -> None:
    """Configure root logging for the application.

    Args:
        log_level: Override log level (defaults to environment variable)
        log_file: Optional file path for logging
        log_format: Custom log format string
    """
    level = log_level or get_log_level()
    fmt = log_format or DEFAULT_LOG_FORMAT

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level.upper())

    # Clear existing handlers to avoid duplicates
    root_logger.handlers.clear()

    # Add console handler
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(level.upper())
    console_formatter = logging.Formatter(fmt)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # Add file handler if specified
    if log_file:
        file_path = Path(log_file).expanduser()
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            file_path,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        file_handler.setLevel(level.upper())
        file_formatter = logging.Formatter(fmt)
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)

    # Log configuration details
    root_logger.debug(f"Logging initialized with level: {level}")
    if log_file:
        root_logger.debug(f"Logging to file: {log_file}")

# Alias for setup_logging to maintain compatibility with scripts
configure_logging = setup_logging

def get_logger(name: str) -> logging.Logger:
    """Get a named logger with consistent configuration.

    Args:
        name: Logger name, typically using dot notation (e.g., ani_sage.api.mal)

    Returns:
        Configured logger instance
    """
    if name not in _loggers:
        logger = logging.getLogger(name)

        # Don't set level here to inherit from root logger
        # This ensures consistent level control

        _loggers[name] = logger

    return _loggers[name]

# Pre-configured loggers for main components
core_logger = get_logger("ani_sage.core")
api_logger = get_logger("ani_sage.api")
cli_logger = get_logger("ani_sage.cli")
ai_logger = get_logger("ani_sage.ai")

# Specialized API loggers
mal_logger = get_logger("ani_sage.api.mal")
anilist_logger = get_logger("ani_sage.api.anilist")
youtube_logger = get_logger("ani_sage.api.youtube")
auth_logger = get_logger("ani_sage.api.auth")

def debug_log(message: str) -> None:
    """Log debug messages if DEBUG environment variable is set.

    This is maintained for backward compatibility with existing code.
    New code should use get_logger().debug() instead.

    Args:
        message: The message to log
    """
    if os.getenv("DEBUG") == "1":
        core_logger.debug(message)

# Alias for setup_logging to maintain compatibility with scripts
configure_logging = setup_logging

