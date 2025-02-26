#!/usr/bin/env python3
"""Debug script to test the configuration system."""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

import logging
from src.utils.config import get_config, ConfigSection
from src.utils.errors import ConfigError
from src.utils.logging import get_logger

# Set up logging
logging.basicConfig(level=logging.DEBUG,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = get_logger(__name__)

def main():
    """Test the configuration system."""
    print("Available ConfigSection values:")
    for section in ConfigSection:
        print(f"  - {section.name}: '{section.value}'")

    config = get_config()
    print(f"Config type: {type(config)}")

    try:
        # Test getting the AI section
        print("\nTesting get_section('ai'):")
        ai_section = config.get_section('ai')
        print(f"AI section: {ai_section}")
    except Exception as e:
        print(f"Error getting AI section: {e}")

    try:
        # Test updating the AI section
        print("\nTesting update_section('ai', {}):")
        config.update_section('ai', {
            'test': 'value',
            'openai': {
                'api_key': 'test_api_key_123',
                'model': 'gpt-3.5-turbo',
                'embedding_model': 'text-embedding-ada-002'
            }
        })
        print("Update successful")
    except Exception as e:
        print(f"Error updating AI section: {e}")

if __name__ == "__main__":
    main()
