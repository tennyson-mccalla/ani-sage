"""Configuration management for ani-sage."""

import os
import sys
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, get_type_hints
import tomli
import tomli_w
from pydantic import BaseModel, Field, ValidationError as PydanticValidationError

from .logging import get_logger
from .errors import ConfigError, ValidationError

# Create logger for config module
logger = get_logger("ani_sage.config")

class ConfigSection(str, Enum):
    """Configuration section identifiers."""
    PATHS = "paths"
    APIS = "apis"
    ANIME = "anime"
    PREFERENCES = "preferences"
    LOGGING = "logging"


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

    # User preferences
    theme: str = "dark"
    language: str = "en"

    # Logging configuration
    log_level: str = "INFO"
    log_file: Optional[str] = None

    @property
    def config_path(self) -> Path:
        """Get the path to the config file."""
        return self.config_dir / "config.toml"

    @property
    def log_file_path(self) -> Optional[Path]:
        """Get the path to the log file if configured."""
        if self.log_file:
            # Handle tilde in paths
            return Path(self.log_file).expanduser()
        return None

    def _ensure_dirs(self) -> None:
        """Ensure all necessary directories exist."""
        for directory in [self.config_dir, self.cache_dir, self.data_dir]:
            try:
                directory.expanduser().mkdir(parents=True, exist_ok=True)
                logger.debug(f"Ensured directory exists: {directory}")
            except Exception as e:
                raise ConfigError(f"Failed to create directory {directory}: {str(e)}")

    def _load_env_vars(self) -> None:
        """Load configuration values from environment variables."""
        # Map of environment variables to config attributes
        env_mapping = {
            "ANI_SAGE_CONFIG_DIR": "config_dir",
            "ANI_SAGE_CACHE_DIR": "cache_dir",
            "ANI_SAGE_DATA_DIR": "data_dir",
            "ANI_SAGE_MAL_CLIENT_ID": "mal_client_id",
            "ANI_SAGE_ANILIST_TOKEN": "anilist_token",
            "ANI_SAGE_THEME": "theme",
            "ANI_SAGE_LANGUAGE": "language",
            "ANI_SAGE_LOG_LEVEL": "log_level",
            "ANI_SAGE_LOG_FILE": "log_file"
        }

        type_hints = get_type_hints(self.__class__)

        for env_var, attr_name in env_mapping.items():
            value = os.getenv(env_var)
            if value is not None:
                # Convert string to appropriate type based on type hints
                attr_type = type_hints.get(attr_name, str)

                try:
                    if attr_type == Path:
                        setattr(self, attr_name, Path(value))
                    elif attr_type == bool:
                        setattr(self, attr_name, value.lower() in ("true", "1", "yes"))
                    elif attr_type == int:
                        setattr(self, attr_name, int(value))
                    elif attr_type == float:
                        setattr(self, attr_name, float(value))
                    else:
                        setattr(self, attr_name, value)

                    logger.debug(f"Loaded {attr_name} from environment variable {env_var}")
                except Exception as e:
                    logger.warning(f"Failed to set {attr_name} from {env_var}: {str(e)}")

    def validate(self) -> None:
        """Validate configuration values."""
        # Check paths
        for path_attr in ['config_dir', 'cache_dir', 'data_dir']:
            path = getattr(self, path_attr).expanduser()

            # Check if path exists or can be created
            if not path.exists() and not path.parent.exists():
                raise ValidationError(
                    f"Parent directory for {path_attr} does not exist: {path.parent}",
                    field=path_attr
                )

        # Check log level
        valid_log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if self.log_level.upper() not in valid_log_levels:
            raise ValidationError(
                f"Invalid log level: {self.log_level}. Must be one of {valid_log_levels}",
                field="log_level"
            )

        # Check API credentials format
        if self.mal_client_id and len(self.mal_client_id) < 10:
            logger.warning("MAL client ID seems too short, might be invalid")

        if self.anilist_token and len(self.anilist_token) < 20:
            logger.warning("AniList token seems too short, might be invalid")

    @classmethod
    def load(cls) -> "Config":
        """Load configuration from file.

        Returns:
            Config object with loaded settings

        Raises:
            ConfigError: If configuration cannot be loaded or is invalid
        """
        try:
            config = cls()

            # Load environment variables first
            config._load_env_vars()

            # Then ensure directories exist
            config._ensure_dirs()

            # Load from file if it exists
            if config.config_path.exists():
                try:
                    logger.debug(f"Loading configuration from {config.config_path}")
                    with open(config.config_path.expanduser(), "rb") as f:
                        data = tomli.load(f)

                    # Process paths from TOML
                    if "paths" in data:
                        for key, value in data["paths"].items():
                            if key in ["config_dir", "cache_dir", "data_dir"]:
                                setattr(config, key, Path(value))

                    # Process anime directories
                    if "anime" in data and "dirs" in data["anime"]:
                        config.anime_dirs = [Path(p) for p in data["anime"]["dirs"]]

                    # Process API credentials
                    if "apis" in data:
                        if "mal_client_id" in data["apis"]:
                            config.mal_client_id = data["apis"]["mal_client_id"]
                        if "anilist_token" in data["apis"]:
                            config.anilist_token = data["apis"]["anilist_token"]

                    # Process user preferences
                    if "preferences" in data:
                        for key, value in data["preferences"].items():
                            if hasattr(config, key):
                                setattr(config, key, value)

                    # Process logging settings
                    if "logging" in data:
                        if "level" in data["logging"]:
                            config.log_level = data["logging"]["level"]
                        if "file" in data["logging"]:
                            config.log_file = data["logging"]["file"]

                except Exception as e:
                    logger.error(f"Error loading config file: {e}")
                    # Continue with default values rather than failing
            else:
                logger.info(f"No configuration file found at {config.config_path}, using defaults")

            # Validate the configuration
            config.validate()

            # Save the configuration if it doesn't exist (initialize with defaults)
            if not config.config_path.exists():
                logger.info("Creating initial configuration file")
                config.save()

            return config

        except PydanticValidationError as e:
            msg = f"Configuration validation failed: {str(e)}"
            logger.error(msg)
            raise ConfigError(msg)
        except Exception as e:
            msg = f"Failed to load configuration: {str(e)}"
            logger.error(msg)
            raise ConfigError(msg)

    def save(self) -> None:
        """Save configuration to file."""
        try:
            self._ensure_dirs()

            # Create organized configuration structure
            data = {
                "paths": {
                    "config_dir": str(self.config_dir),
                    "cache_dir": str(self.cache_dir),
                    "data_dir": str(self.data_dir),
                },
                "anime": {
                    "dirs": [str(p) for p in self.anime_dirs],
                },
                "apis": {},
                "preferences": {
                    "theme": self.theme,
                    "language": self.language,
                },
                "logging": {
                    "level": self.log_level,
                }
            }

            # Add optional values
            if self.mal_client_id:
                data["apis"]["mal_client_id"] = self.mal_client_id
            if self.anilist_token:
                data["apis"]["anilist_token"] = self.anilist_token
            if self.log_file:
                data["logging"]["file"] = self.log_file

            logger.debug(f"Saving configuration to {self.config_path}")
            with open(self.config_path.expanduser(), "wb") as f:
                tomli_w.dump(data, f)

            logger.info(f"Configuration saved successfully")

        except Exception as e:
            msg = f"Error saving configuration: {e}"
            logger.error(msg)
            raise ConfigError(msg)

    def add_anime_dir(self, directory: Path) -> None:
        """Add an anime directory to the configuration.

        Args:
            directory: Path to add

        Raises:
            ConfigError: If the directory is invalid or cannot be added
        """
        try:
            directory = Path(directory).expanduser()

            if not directory.exists():
                raise ConfigError(f"Directory does not exist: {directory}")

            if not directory.is_dir():
                raise ConfigError(f"Not a directory: {directory}")

            if directory in self.anime_dirs:
                logger.info(f"Directory already in configuration: {directory}")
                return

            self.anime_dirs.append(directory)
            logger.info(f"Added anime directory: {directory}")
            self.save()

        except Exception as e:
            if not isinstance(e, ConfigError):
                raise ConfigError(f"Failed to add anime directory: {str(e)}")
            raise

    def remove_anime_dir(self, directory: Path) -> None:
        """Remove an anime directory from the configuration.

        Args:
            directory: Path to remove

        Raises:
            ConfigError: If the directory cannot be removed
        """
        try:
            directory = Path(directory).expanduser()

            if directory not in self.anime_dirs:
                logger.warning(f"Directory not in configuration: {directory}")
                return

            self.anime_dirs.remove(directory)
            logger.info(f"Removed anime directory: {directory}")
            self.save()

        except Exception as e:
            raise ConfigError(f"Failed to remove anime directory: {str(e)}")

    def clear_anime_dirs(self) -> None:
        """Clear all configured anime directories."""
        try:
            self.anime_dirs = []
            logger.info("Cleared all anime directories")
            self.save()
        except Exception as e:
            raise ConfigError(f"Failed to clear anime directories: {str(e)}")

    def get_section(self, section: Union[ConfigSection, str]) -> Dict[str, Any]:
        """Get a section of the configuration.

        Args:
            section: Section identifier

        Returns:
            Dictionary of configuration values for the section
        """
        if isinstance(section, str):
            try:
                section = ConfigSection(section.lower())
            except ValueError:
                raise ConfigError(f"Invalid configuration section: {section}")

        if section == ConfigSection.PATHS:
            return {
                "config_dir": self.config_dir,
                "cache_dir": self.cache_dir,
                "data_dir": self.data_dir,
            }
        elif section == ConfigSection.APIS:
            return {
                "mal_client_id": self.mal_client_id,
                "anilist_token": self.anilist_token,
            }
        elif section == ConfigSection.ANIME:
            return {
                "dirs": self.anime_dirs,
            }
        elif section == ConfigSection.PREFERENCES:
            return {
                "theme": self.theme,
                "language": self.language,
            }
        elif section == ConfigSection.LOGGING:
            return {
                "level": self.log_level,
                "file": self.log_file,
            }
        else:
            raise ConfigError(f"Unknown configuration section: {section}")

    def update_section(self, section: Union[ConfigSection, str], values: Dict[str, Any]) -> None:
        """Update a section of the configuration.

        Args:
            section: Section identifier
            values: Dictionary of values to update

        Raises:
            ConfigError: If the section is invalid or values cannot be updated
        """
        if isinstance(section, str):
            try:
                section = ConfigSection(section.lower())
            except ValueError:
                raise ConfigError(f"Invalid configuration section: {section}")

        try:
            if section == ConfigSection.PATHS:
                for key, value in values.items():
                    if key in ["config_dir", "cache_dir", "data_dir"]:
                        setattr(self, key, Path(value))
            elif section == ConfigSection.APIS:
                for key, value in values.items():
                    if key in ["mal_client_id", "anilist_token"]:
                        setattr(self, key, value)
            elif section == ConfigSection.ANIME:
                if "dirs" in values:
                    self.anime_dirs = [Path(p) for p in values["dirs"]]
            elif section == ConfigSection.PREFERENCES:
                for key, value in values.items():
                    if key in ["theme", "language"]:
                        setattr(self, key, value)
            elif section == ConfigSection.LOGGING:
                for key, value in values.items():
                    if key in ["level", "file"]:
                        setattr(self, key, value)
            else:
                raise ConfigError(f"Unknown configuration section: {section}")

            # Validate and save the updated configuration
            self.validate()
            self.save()

        except Exception as e:
            raise ConfigError(f"Failed to update configuration section {section}: {str(e)}")

    def reset(self) -> None:
        """Reset configuration to defaults."""
        try:
            new_config = Config()

            # Keep the path to the existing config file
            config_path = self.config_path

            # Update attributes
            for attr in self.__dict__:
                if not attr.startswith('_'):
                    setattr(self, attr, getattr(new_config, attr))

            logger.info("Configuration reset to defaults")
            self.save()

        except Exception as e:
            raise ConfigError(f"Failed to reset configuration: {str(e)}")

# Global configuration instance
_config_instance: Optional[Config] = None

def get_config() -> Config:
    """Get the global configuration instance.

    Returns:
        Config instance
    """
    global _config_instance

    if _config_instance is None:
        _config_instance = Config.load()

    return _config_instance
