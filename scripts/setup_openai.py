#!/usr/bin/env python3
"""
Setup script for OpenAI API configuration.

This script configures the OpenAI API settings for ani-sage's AI features,
securely storing the API key and other settings.
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.config import get_config
from src.utils.errors import ConfigError
from src.utils.logging import get_logger, configure_logging

logger = get_logger(__name__)


def setup_openai_config(
    api_key: str,
    organization: str = None,
    model: str = None,
    embedding_model: str = None,
    max_tokens: int = None,
    temperature: float = None
) -> bool:
    """Set up OpenAI API configuration.

    Args:
        api_key: OpenAI API key
        organization: OpenAI organization ID (optional)
        model: Model to use for completions (default: gpt-3.5-turbo)
        embedding_model: Model to use for embeddings (default: text-embedding-ada-002)
        max_tokens: Maximum tokens for completions (default: 256)
        temperature: Temperature for completions (default: 0.7)

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get current configuration
        config = get_config()

        # Update with OpenAI settings
        try:
            # Try directly setting fields if they exist
            if hasattr(config, 'openai_api_key'):
                config.openai_api_key = api_key

                if organization:
                    config.openai_organization = organization
                if model:
                    config.openai_model = model
                if embedding_model:
                    config.openai_embedding_model = embedding_model
                if max_tokens:
                    config.openai_max_tokens = max_tokens
                if temperature:
                    config.openai_temperature = temperature

                # Save the updated configuration
                config.save()
                logger.info("OpenAI configuration updated directly")
                return True

            # If direct field access doesn't work, try using update_section
            if hasattr(config, 'update_section'):
                # Prepare AI section values
                ai_values = {}

                # If an 'ai' section already exists, set OpenAI values within it
                try:
                    ai_section = config.get_section('ai')
                    ai_values = ai_section
                except:
                    # AI section doesn't exist
                    pass

                # Update with our new values
                openai_values = ai_values.get('openai', {})
                openai_values.update({
                    'api_key': api_key,
                })

                if organization:
                    openai_values['organization'] = organization
                if model:
                    openai_values['model'] = model
                if embedding_model:
                    openai_values['embedding_model'] = embedding_model
                if max_tokens:
                    openai_values['max_tokens'] = max_tokens
                if temperature:
                    openai_values['temperature'] = temperature

                ai_values['openai'] = openai_values

                # Update the config section
                config.update_section('ai', ai_values)
                logger.info("OpenAI configuration updated in AI section")
                return True

            # If we can't update the config through normal means, try environment variables
            os.environ["OPENAI_API_KEY"] = api_key
            if organization:
                os.environ["OPENAI_ORGANIZATION"] = organization
            if model:
                os.environ["OPENAI_MODEL"] = model
            if embedding_model:
                os.environ["OPENAI_EMBEDDING_MODEL"] = embedding_model
            if max_tokens:
                os.environ["OPENAI_MAX_TOKENS"] = str(max_tokens)
            if temperature:
                os.environ["OPENAI_TEMPERATURE"] = str(temperature)

            logger.info("OpenAI configuration set via environment variables")

            # Add note about adding to shell profile
            print("\nEnvironment variables set for current session only.")
            print("To make them permanent, add these lines to your shell profile (~/.bashrc, ~/.zshrc, etc.):")
            print(f'export OPENAI_API_KEY="{api_key}"')
            if organization:
                print(f'export OPENAI_ORGANIZATION="{organization}"')
            if model:
                print(f'export OPENAI_MODEL="{model}"')
            if embedding_model:
                print(f'export OPENAI_EMBEDDING_MODEL="{embedding_model}"')
            if max_tokens:
                print(f'export OPENAI_MAX_TOKENS="{max_tokens}"')
            if temperature:
                print(f'export OPENAI_TEMPERATURE="{temperature}"')

            return True

        except Exception as e:
            logger.error(f"Failed to update configuration: {e}")
            raise ConfigError(f"Failed to update configuration: {e}")

    except Exception as e:
        logger.error(f"Failed to set up OpenAI configuration: {e}")
        return False


def main():
    """Run the OpenAI configuration setup script."""
    parser = argparse.ArgumentParser(
        description="Configure OpenAI API settings for ani-sage"
    )

    parser.add_argument(
        "--api-key", "-k",
        help="OpenAI API key"
    )
    parser.add_argument(
        "--organization", "-o",
        help="OpenAI organization ID (optional)"
    )
    parser.add_argument(
        "--model", "-m",
        help="Model to use for completions (default: gpt-3.5-turbo)"
    )
    parser.add_argument(
        "--embedding-model", "-e",
        help="Model to use for embeddings (default: text-embedding-ada-002)"
    )
    parser.add_argument(
        "--max-tokens", "-t",
        type=int,
        help="Maximum tokens for completions (default: 256)"
    )
    parser.add_argument(
        "--temperature", "-p",
        type=float,
        help="Temperature for completions (default: 0.7)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    # Configure logging
    log_level = "DEBUG" if args.verbose else "INFO"
    configure_logging(log_level=log_level)

    # If no API key provided, prompt for it
    api_key = args.api_key
    if not api_key:
        try:
            import getpass
            api_key = getpass.getpass("Enter your OpenAI API key: ")
        except Exception as e:
            logger.error(f"Failed to get API key: {e}")
            sys.exit(1)

    if not api_key:
        logger.error("No API key provided")
        sys.exit(1)

    # Set up configuration
    success = setup_openai_config(
        api_key=api_key,
        organization=args.organization,
        model=args.model,
        embedding_model=args.embedding_model,
        max_tokens=args.max_tokens,
        temperature=args.temperature
    )

    if success:
        print("OpenAI API configuration complete!")
    else:
        print("Failed to configure OpenAI API. Check the logs for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()
