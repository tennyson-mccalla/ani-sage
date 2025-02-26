#!/usr/bin/env python
"""Example script demonstrating ani-sage configuration system.

This script shows how to:
1. Load and access configuration
2. Modify configuration values
3. Work with configuration sections
4. Handle configuration errors properly

Run this script directly to see the output:
    python docs/config_example.py
"""

import os
import sys
from pathlib import Path

# Add the src directory to sys.path to allow importing ani-sage modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.logging import setup_logging, get_logger
from src.utils.config import Config, ConfigSection, get_config
from src.utils.errors import ConfigError, handle_exception

# Set up logging
setup_logging(log_level="DEBUG")

# Create a logger for this script
logger = get_logger("config_example")

def print_section(title):
    """Print a section header."""
    print("\n" + "=" * 50)
    print(f" {title} ".center(50, "="))
    print("=" * 50)

def demonstrate_basic_config():
    """Demonstrate basic configuration operations."""
    print_section("Basic Configuration Usage")

    try:
        # Get the global configuration instance
        config = get_config()

        # Display current configuration
        print(f"Config directory: {config.config_dir}")
        print(f"Cache directory: {config.cache_dir}")
        print(f"Data directory: {config.data_dir}")
        print(f"Log level: {config.log_level}")
        print(f"Theme: {config.theme}")

        # Check anime directories
        if config.anime_dirs:
            print("\nConfigured anime directories:")
            for idx, directory in enumerate(config.anime_dirs, 1):
                print(f"  {idx}. {directory}")
        else:
            print("\nNo anime directories configured")

    except ConfigError as e:
        handle_exception(e, exit_code=1)

def demonstrate_modifying_config():
    """Demonstrate modifying configuration."""
    print_section("Modifying Configuration")

    try:
        # Get the global configuration instance
        config = get_config()

        # Change a configuration value
        old_theme = config.theme
        new_theme = "light" if old_theme == "dark" else "dark"

        print(f"Changing theme from '{old_theme}' to '{new_theme}'")
        config.theme = new_theme
        config.save()

        # Add a temporary test directory (will be removed later)
        test_dir = Path.home() / "ani-sage-test-dir"
        test_dir.mkdir(exist_ok=True)

        print(f"Adding test directory: {test_dir}")
        config.add_anime_dir(test_dir)

        # Display updated configuration
        print("\nUpdated anime directories:")
        for idx, directory in enumerate(config.anime_dirs, 1):
            print(f"  {idx}. {directory}")

        # Clean up by removing the test directory
        print(f"\nRemoving test directory: {test_dir}")
        config.remove_anime_dir(test_dir)
        test_dir.rmdir()

    except ConfigError as e:
        handle_exception(e, exit_code=1)

def demonstrate_environment_vars():
    """Demonstrate using environment variables for configuration."""
    print_section("Environment Variables")

    try:
        # Save original log level
        original_level = os.getenv("ANI_SAGE_LOG_LEVEL")

        # Set environment variable
        os.environ["ANI_SAGE_LOG_LEVEL"] = "DEBUG"
        print("Set ANI_SAGE_LOG_LEVEL to DEBUG")

        # Create a new config instance (to load from environment)
        config = Config.load()
        print(f"Log level from environment: {config.log_level}")

        # Restore original environment value
        if original_level:
            os.environ["ANI_SAGE_LOG_LEVEL"] = original_level
        else:
            os.environ.pop("ANI_SAGE_LOG_LEVEL", None)

    except ConfigError as e:
        handle_exception(e, exit_code=1)

def demonstrate_sections():
    """Demonstrate working with configuration sections."""
    print_section("Configuration Sections")

    try:
        # Get the global configuration instance
        config = get_config()

        # Get and display sections
        paths_section = config.get_section(ConfigSection.PATHS)
        prefs_section = config.get_section("preferences")  # String form also works

        print("Paths section:")
        for key, value in paths_section.items():
            print(f"  {key}: {value}")

        print("\nPreferences section:")
        for key, value in prefs_section.items():
            print(f"  {key}: {value}")

        # Modify a section
        print("\nUpdating preferences section...")
        config.update_section(
            ConfigSection.PREFERENCES,
            {"language": "ja"}  # Set language to Japanese
        )

        # Get updated section
        updated_prefs = config.get_section(ConfigSection.PREFERENCES)
        print("Updated preferences section:")
        for key, value in updated_prefs.items():
            print(f"  {key}: {value}")

        # Reset to original language
        config.update_section(
            ConfigSection.PREFERENCES,
            {"language": "en"}  # Reset to English
        )

    except ConfigError as e:
        handle_exception(e, exit_code=1)

def demonstrate_error_handling():
    """Demonstrate configuration error handling."""
    print_section("Error Handling")

    try:
        # Attempt to get an invalid section
        config = get_config()

        print("Attempting to get invalid section 'invalid'...")
        try:
            config.get_section("invalid")
        except ConfigError as e:
            print(f"Caught error: {e}")

        # Attempt to add non-existent directory
        print("\nAttempting to add non-existent directory...")
        try:
            config.add_anime_dir(Path("/path/that/does/not/exist"))
        except ConfigError as e:
            print(f"Caught error: {e}")

    except Exception as e:
        handle_exception(e, exit_code=1)

def main():
    """Run the configuration demonstration."""
    logger.info("Starting configuration system demonstration")

    try:
        demonstrate_basic_config()
        demonstrate_modifying_config()
        demonstrate_environment_vars()
        demonstrate_sections()
        demonstrate_error_handling()

        print_section("Demonstration Complete")
        print("The configuration system demonstration has completed successfully.")
        print("For more information, see the docs/logging.md file.")

    except Exception as e:
        handle_exception(e, log_level="CRITICAL", exit_code=2)

    logger.info("Configuration demonstration completed")

if __name__ == "__main__":
    main()
