# ani-sage Configuration System

This document describes the configuration system for the ani-sage project.

## Overview

The ani-sage configuration system provides a centralized way to manage application settings. It supports:

- Loading/saving configuration from TOML files
- Environment variable overrides
- Organized configuration sections
- Validation of configuration values
- Error handling and logging integration

## Basic Usage

```python
from src.utils.config import get_config

# Get the global configuration instance
config = get_config()

# Access configuration values
print(f"Cache directory: {config.cache_dir}")
print(f"Theme: {config.theme}")

# Modify configuration values
config.theme = "light"
config.save()  # Save changes to disk

# Add an anime directory
from pathlib import Path
config.add_anime_dir(Path("~/anime").expanduser())
```

## Configuration Sections

Configuration is organized into logical sections:

```python
from src.utils.config import get_config, ConfigSection

config = get_config()

# Get configuration sections
paths = config.get_section(ConfigSection.PATHS)
preferences = config.get_section(ConfigSection.PREFERENCES)
api_settings = config.get_section(ConfigSection.APIS)

# String form also works
anime_settings = config.get_section("anime")

# Update a section
config.update_section(
    ConfigSection.PREFERENCES,
    {
        "theme": "dark",
        "language": "en"
    }
)
```

Available sections:
- `PATHS`: Directory paths
- `APIS`: API credentials and settings
- `ANIME`: Anime directories and settings
- `PREFERENCES`: User preferences
- `LOGGING`: Logging configuration

## Environment Variables

Configuration values can be overridden with environment variables:

| Environment Variable | Configuration Property |
|----------------------|------------------------|
| `ANI_SAGE_CONFIG_DIR` | `config_dir` |
| `ANI_SAGE_CACHE_DIR` | `cache_dir` |
| `ANI_SAGE_DATA_DIR` | `data_dir` |
| `ANI_SAGE_MAL_CLIENT_ID` | `mal_client_id` |
| `ANI_SAGE_ANILIST_TOKEN` | `anilist_token` |
| `ANI_SAGE_THEME` | `theme` |
| `ANI_SAGE_LANGUAGE` | `language` |
| `ANI_SAGE_LOG_LEVEL` | `log_level` |
| `ANI_SAGE_LOG_FILE` | `log_file` |

Example:
```bash
# Set log level to DEBUG for development
export ANI_SAGE_LOG_LEVEL=DEBUG

# Use custom directories
export ANI_SAGE_DATA_DIR=~/custom/data/dir
```

## File Location

The configuration file follows XDG specifications:

- Default location: `~/.config/ani-sage/config.toml`
- Override with `XDG_CONFIG_HOME`: `$XDG_CONFIG_HOME/ani-sage/config.toml`

## File Format

Configuration is stored in TOML format:

```toml
[paths]
config_dir = "/home/user/.config/ani-sage"
cache_dir = "/home/user/.cache/ani-sage"
data_dir = "/home/user/.local/share/ani-sage"

[anime]
dirs = [
    "/home/user/anime",
    "/media/external/anime"
]

[apis]
mal_client_id = "your_client_id"
anilist_token = "your_token"

[preferences]
theme = "dark"
language = "en"

[logging]
level = "INFO"
file = "/home/user/.cache/ani-sage/ani-sage.log"
```

## Error Handling

Configuration errors are handled using the ani-sage error system:

```python
from src.utils.config import get_config
from src.utils.errors import ConfigError, handle_exception

try:
    config = get_config()
    config.add_anime_dir("/path/that/does/not/exist")
except ConfigError as e:
    handle_exception(e, exit_code=1)
```

## API Reference

### Functions

- `get_config()`: Get the global configuration instance

### Classes

#### `Config`

Main configuration class with these key methods:

- `load()`: Load configuration from file and environment
- `save()`: Save configuration to file
- `validate()`: Validate configuration values
- `add_anime_dir(directory)`: Add an anime directory
- `remove_anime_dir(directory)`: Remove an anime directory
- `clear_anime_dirs()`: Clear all anime directories
- `get_section(section)`: Get a configuration section
- `update_section(section, values)`: Update a section
- `reset()`: Reset configuration to defaults

#### `ConfigSection` (Enum)

Enumeration of configuration sections:

- `PATHS`: Directory paths
- `APIS`: API credentials and settings
- `ANIME`: Anime directories and settings
- `PREFERENCES`: User preferences
- `LOGGING`: Logging configuration

## Example

See `docs/config_example.py` for a complete example of the configuration system.
