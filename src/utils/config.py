"""Configuration management for ani-sage."""

import os
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel

class Config(BaseModel):
    """Configuration settings for ani-sage."""

    # Base paths following XDG spec
    config_dir: Path = Path(os.getenv("XDG_CONFIG_HOME", "~/.config")) / "ani-sage"
    cache_dir: Path = Path(os.getenv("XDG_CACHE_HOME", "~/.cache")) / "ani-sage"
    data_dir: Path = Path(os.getenv("XDG_DATA_HOME", "~/.local/share")) / "ani-sage"

    # Anime directories
    anime_dirs: List[Path] = []

    # API configuration
    mal_client_id: Optional[str] = None
    anilist_token: Optional[str] = None

    @property
    def config_path(self) -> Path:
        """Get the path to the config file."""
        return self.config_dir / "config.toml"

    @classmethod
    def load(cls) -> "Config":
        """Load configuration from file."""
        # TODO: Implement config loading
        return cls()

    def save(self) -> None:
        """Save configuration to file."""
        # TODO: Implement config saving
        pass
