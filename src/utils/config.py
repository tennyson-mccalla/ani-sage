"""Configuration management for ani-sage."""

import os
from pathlib import Path
from typing import Dict, List, Optional
import tomli
import tomli_w
from pydantic import BaseModel, Field

class Config(BaseModel):
    """Configuration settings for ani-sage."""

    # Base paths following XDG spec
    config_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("XDG_CONFIG_HOME", "~/.config")) / "ani-sage"
    )
    cache_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("XDG_CACHE_HOME", "~/.cache")) / "ani-sage"
    )
    data_dir: Path = Field(
        default_factory=lambda: Path(os.getenv("XDG_DATA_HOME", "~/.local/share")) / "ani-sage"
    )

    # Anime directories
    anime_dirs: List[Path] = Field(default_factory=list)

    # API configuration
    mal_client_id: Optional[str] = None
    anilist_token: Optional[str] = None

    @property
    def config_path(self) -> Path:
        """Get the path to the config file."""
        return self.config_dir / "config.toml"

    def _ensure_dirs(self) -> None:
        """Ensure all necessary directories exist."""
        for directory in [self.config_dir, self.cache_dir, self.data_dir]:
            directory.expanduser().mkdir(parents=True, exist_ok=True)

    @classmethod
    def load(cls) -> "Config":
        """Load configuration from file.

        Returns:
            Config object with loaded settings
        """
        config = cls()
        config._ensure_dirs()

        if config.config_path.exists():
            try:
                with open(config.config_path.expanduser(), "rb") as f:
                    data = tomli.load(f)

                # Convert string paths to Path objects
                if "anime_dirs" in data:
                    data["anime_dirs"] = [Path(p) for p in data["anime_dirs"]]
                if "config_dir" in data:
                    data["config_dir"] = Path(data["config_dir"])
                if "cache_dir" in data:
                    data["cache_dir"] = Path(data["cache_dir"])
                if "data_dir" in data:
                    data["data_dir"] = Path(data["data_dir"])

                return cls(**data)
            except Exception as e:
                print(f"Error loading config: {e}")
                return config
        return config

    def save(self) -> None:
        """Save configuration to file."""
        self._ensure_dirs()

        # Convert Path objects to strings for TOML serialization
        data = {
            "config_dir": str(self.config_dir),
            "cache_dir": str(self.cache_dir),
            "data_dir": str(self.data_dir),
            "anime_dirs": [str(p) for p in self.anime_dirs],
        }

        if self.mal_client_id:
            data["mal_client_id"] = self.mal_client_id
        if self.anilist_token:
            data["anilist_token"] = self.anilist_token

        try:
            with open(self.config_path.expanduser(), "wb") as f:
                tomli_w.dump(data, f)
        except Exception as e:
            print(f"Error saving config: {e}")

    def add_anime_dir(self, directory: Path) -> None:
        """Add an anime directory to the configuration.

        Args:
            directory: Path to add
        """
        directory = Path(directory).expanduser()
        if directory.is_dir() and directory not in self.anime_dirs:
            self.anime_dirs.append(directory)
            self.save()

    def remove_anime_dir(self, directory: Path) -> None:
        """Remove an anime directory from the configuration.

        Args:
            directory: Path to remove
        """
        directory = Path(directory).expanduser()
        if directory in self.anime_dirs:
            self.anime_dirs.remove(directory)
            self.save()

    def clear_anime_dirs(self) -> None:
        """Clear all configured anime directories."""
        self.anime_dirs = []
        self.save()
