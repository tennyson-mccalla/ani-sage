"""PyTest configuration and fixtures."""

import os
import pytest
from pathlib import Path

@pytest.fixture
def test_data_dir() -> Path:
    """Get the path to the test data directory."""
    return Path(__file__).parent / "fixtures"

@pytest.fixture
def sample_config_dir(tmp_path) -> Path:
    """Create a temporary config directory."""
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    return config_dir

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers",
        "integration: mark test as an integration test"
    )
