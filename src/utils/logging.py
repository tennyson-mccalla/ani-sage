"""Logging configuration for ani-sage."""

import logging
import os
import sys
from pathlib import Path
from typing import Optional

def setup_logging(log_level: Optional[str] = None) -> None:
    """Configure logging for the application."""
    level = log_level or os.getenv("ANI_SAGE_LOG_LEVEL", "INFO")

    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)]
    )

def debug_log(message: str) -> None:
    """Log debug messages if DEBUG environment variable is set."""
    if os.getenv("DEBUG") == "1":
        print(f"[DEBUG] {message}", file=sys.stderr)
