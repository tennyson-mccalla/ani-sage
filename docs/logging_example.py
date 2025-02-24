#!/usr/bin/env python
"""Example script demonstrating ani-sage logging and error handling.

This script shows how to:
1. Configure logging for your module
2. Create and use loggers
3. Handle errors consistently
4. Use custom error types

Run this script directly to see the output:
    python docs/logging_example.py
"""

import os
import sys
import time
from pathlib import Path

# Add the src directory to sys.path to allow importing ani-sage modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.logging import setup_logging, get_logger
from src.utils.errors import (
    AniSageError,
    APIError,
    ValidationError,
    ConfigError,
    handle_exception
)

# Create a module-specific logger
logger = get_logger("example")

def demonstrate_logging():
    """Show different logging levels."""
    logger.debug("This is a DEBUG message with detailed information")
    logger.info("This is an INFO message about normal operation")
    logger.warning("This is a WARNING message about potential issues")
    logger.error("This is an ERROR message about failures")
    logger.critical("This is a CRITICAL message about serious failures")

    # You can also use string formatting
    user_id = 123
    anime_count = 42
    logger.info(f"User {user_id} has {anime_count} anime in their collection")

    # For expensive operations, check level first
    if logger.isEnabledFor(10):  # DEBUG is level 10
        logger.debug(f"Expensive operation result: {calculate_expensive_value()}")

def calculate_expensive_value():
    """Simulate an expensive operation."""
    time.sleep(0.5)
    return "expensive result"

def demonstrate_error_handling():
    """Show how to use the error handling system."""
    try:
        # Simulate a validation error
        raise ValidationError(
            "Invalid title format",
            field="anime_title",
            details={"provided": "!!Bad Title!!", "expected": "alphanumeric"}
        )
    except AniSageError as e:
        # The error will be logged automatically
        handle_exception(e, reraise=False)

    try:
        # Simulate an API error
        raise APIError(
            "Failed to contact MyAnimeList API",
            code="MAL_API_ERROR",
            details={"endpoint": "/anime/1234", "method": "GET"},
            status_code=500
        )
    except AniSageError as e:
        # Handle the error, but exit the program
        handle_exception(e, exit_code=1)

def main():
    """Run the demonstration."""
    # Configure logging
    os.environ["ANI_SAGE_LOG_LEVEL"] = "DEBUG"  # Enable all log levels
    setup_logging()

    logger.info("Starting logging demonstration")

    try:
        demonstrate_logging()
        demonstrate_error_handling()
    except Exception as e:
        # Catch-all for unexpected errors
        handle_exception(e, log_level="CRITICAL", exit_code=2)

    logger.info("Logging demonstration completed")

if __name__ == "__main__":
    main()
