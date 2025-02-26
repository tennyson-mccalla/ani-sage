"""Tests for configuration management."""

import os
from pathlib import Path
import pytest
from src.utils.config import Config

@pytest.fixture
def temp_config(tmp_path):
    """Create a temporary config with custom paths."""
    config = Config()
    config.config_dir = tmp_path / "config"
    config.cache_dir = tmp_path / "cache"
    config.data_dir = tmp_path / "data"
    return config

def test_config_dirs_creation(temp_config):
    """Test that configuration directories are created."""
    temp_config._ensure_dirs()
    assert temp_config.config_dir.exists()
    assert temp_config.cache_dir.exists()
    assert temp_config.data_dir.exists()

def test_config_save_load(temp_config, tmp_path):
    """Test saving and loading configuration."""
    # Add some test data
    anime_dir = tmp_path / "anime"
    anime_dir.mkdir()
    temp_config.add_anime_dir(anime_dir)
    temp_config.mal_client_id = "test_client_id"
    temp_config.anilist_token = "test_token"

    # Save config
    temp_config.save()
    assert temp_config.config_path.exists()

    # Load in a new config instance
    loaded_config = Config()
    loaded_config.config_dir = temp_config.config_dir
    loaded_config = loaded_config.load()

    # Verify loaded data
    assert loaded_config.anime_dirs == [anime_dir]
    assert loaded_config.mal_client_id == "test_client_id"
    assert loaded_config.anilist_token == "test_token"

def test_anime_dir_management(temp_config, tmp_path):
    """Test adding and removing anime directories."""
    # Create test directories
    dir1 = tmp_path / "anime1"
    dir2 = tmp_path / "anime2"
    dir1.mkdir()
    dir2.mkdir()

    # Add directories
    temp_config.add_anime_dir(dir1)
    temp_config.add_anime_dir(dir2)
    assert len(temp_config.anime_dirs) == 2
    assert dir1 in temp_config.anime_dirs
    assert dir2 in temp_config.anime_dirs

    # Remove directory
    temp_config.remove_anime_dir(dir1)
    assert len(temp_config.anime_dirs) == 1
    assert dir1 not in temp_config.anime_dirs
    assert dir2 in temp_config.anime_dirs

    # Clear directories
    temp_config.clear_anime_dirs()
    assert len(temp_config.anime_dirs) == 0

def test_invalid_anime_dir(temp_config, tmp_path):
    """Test handling of invalid anime directories."""
    # Try to add non-existent directory
    invalid_dir = tmp_path / "nonexistent"
    temp_config.add_anime_dir(invalid_dir)
    assert len(temp_config.anime_dirs) == 0

def test_duplicate_anime_dir(temp_config, tmp_path):
    """Test handling of duplicate anime directories."""
    # Create test directory
    anime_dir = tmp_path / "anime"
    anime_dir.mkdir()

    # Add same directory twice
    temp_config.add_anime_dir(anime_dir)
    temp_config.add_anime_dir(anime_dir)
    assert len(temp_config.anime_dirs) == 1
    assert anime_dir in temp_config.anime_dirs
