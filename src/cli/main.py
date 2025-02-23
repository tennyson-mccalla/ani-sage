"""Main CLI entry point for ani-sage."""

import sys
from pathlib import Path
from typing import Optional

from ..utils.config import Config
from ..utils.logging import setup_logging, debug_log

def main() -> int:
    """Main entry point for the CLI."""
    setup_logging()
    debug_log("Starting ani-sage CLI")

    config = Config.load()
    debug_log(f"Loaded configuration from {config.config_path}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
