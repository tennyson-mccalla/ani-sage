"""Main CLI entry point for ani-sage."""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional, List

from ..utils.config import Config
from ..utils.logging import setup_logging, get_logger, cli_logger
from ..utils.errors import AniSageError, handle_exception, ConfigError

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="ani-sage: AI-powered anime recommendation system"
    )

    # Global options
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    parser.add_argument(
        "--log-file",
        type=str,
        help="Log to the specified file"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress non-error output"
    )

    # Add more command-line arguments as needed

    return parser.parse_args()

def main() -> int:
    """Main entry point for the CLI."""
    try:
        args = parse_args()

        # Set up logging
        log_level = "DEBUG" if args.debug else None
        setup_logging(log_level=log_level, log_file=args.log_file)

        cli_logger.info("Starting ani-sage CLI")

        # Load configuration
        try:
            config = Config.load()
            cli_logger.debug(f"Loaded configuration from {config.config_path}")
        except Exception as e:
            raise ConfigError(f"Failed to load configuration: {str(e)}")

        # Check if configuration is valid
        if not config.anime_dirs:
            cli_logger.warning("No anime directories configured")

        # Main CLI logic would go here

        return 0

    except AniSageError as e:
        # Our custom errors are already handled by logging in handle_exception
        handle_exception(e, exit_code=1)
        return 1  # This line won't be reached due to sys.exit in handle_exception
    except Exception as e:
        # Unexpected errors
        handle_exception(e, log_level="CRITICAL", exit_code=2)
        return 2  # This line won't be reached due to sys.exit in handle_exception

if __name__ == "__main__":
    sys.exit(main())
