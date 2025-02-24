import logging
import os
import sys
from typing import Optional

def setup_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Configure and return a logger instance."""
    # Get log level from environment or use default
    log_level = level or os.getenv("ANI_SAGE_LOG_LEVEL", "INFO").upper()

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Create console handler if none exists
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)

        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)

        # Add handler to logger
        logger.addHandler(handler)

    return logger

# Create default loggers for different components
api_logger = setup_logger("ani_sage.api")
mal_logger = setup_logger("ani_sage.api.mal")
anilist_logger = setup_logger("ani_sage.api.anilist")
auth_logger = setup_logger("ani_sage.api.auth")
