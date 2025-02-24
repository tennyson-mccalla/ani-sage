# ani-sage Logging and Error Handling

This document describes the logging and error handling conventions for the ani-sage project.

## Logging System

The ani-sage project uses Python's standard `logging` module with additional structure and utilities to ensure consistent logging across all components.

### Basic Usage

```python
from src.utils.logging import get_logger

# Create a module-specific logger
logger = get_logger("ani_sage.your_module")

# Log at different levels
logger.debug("Detailed information for debugging")
logger.info("Normal operation information")
logger.warning("Warning about potential issues")
logger.error("Error that prevented an operation")
logger.critical("Critical error that requires immediate attention")
```

### Pre-configured Loggers

The following loggers are pre-configured for common components:

```python
from src.utils.logging import (
    core_logger,    # "ani_sage.core"
    api_logger,     # "ani_sage.api"
    cli_logger,     # "ani_sage.cli"
    ai_logger,      # "ani_sage.ai"
    mal_logger,     # "ani_sage.api.mal"
    anilist_logger, # "ani_sage.api.anilist"
    youtube_logger, # "ani_sage.api.youtube"
    auth_logger     # "ani_sage.api.auth"
)
```

### Environment Variables

The logging level can be controlled via environment variables:

- `ANI_SAGE_LOG_LEVEL`: Set the log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `DEBUG=1`: Shorthand to enable DEBUG level logging

### Configuration

To configure logging for your application:

```python
from src.utils.logging import setup_logging

# Basic configuration
setup_logging()

# With custom parameters
setup_logging(
    log_level="DEBUG",                        # Override log level
    log_file="~/.cache/ani-sage/ani-sage.log", # Log to file
    log_format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

## Error Handling

ani-sage uses a structured approach to error handling to ensure consistent error reporting and recovery.

### Custom Error Types

All ani-sage errors derive from `AniSageError`:

```python
from src.utils.errors import (
    AniSageError,     # Base class for all errors
    ConfigError,      # Configuration errors
    MetadataError,    # Metadata processing errors
    APIError,         # API interaction errors
    ValidationError   # Data validation errors
)
```

### Creating Custom Errors

To create a custom error:

```python
from src.utils.errors import AniSageError

class MyCustomError(AniSageError):
    """Exception raised for specific errors in my module."""
    pass

# With additional details
raise MyCustomError(
    "Something went wrong",
    code="CUSTOM_ERROR_CODE",
    details={"additional": "information"},
    level="ERROR"  # Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL
)
```

### Handling Errors

The `handle_exception` utility provides consistent error handling:

```python
from src.utils.errors import handle_exception, AniSageError

try:
    # Some code that might raise an error
    process_data()
except AniSageError as e:
    # Handle and log the error
    handle_exception(e)
except ValueError as e:
    # Handle with specific options
    handle_exception(
        e,
        exc_type=ValueError,  # Expected exception type
        reraise=True,         # Re-raise after handling
        log_level="WARNING",  # Log level to use
        exit_code=None        # Exit code (if should exit)
    )
```

## Best Practices

1. **Use Module-Specific Loggers**: Always create a logger specific to your module.

2. **Log at Appropriate Levels**:
   - DEBUG: Detailed information for debugging
   - INFO: Confirmation of normal operation
   - WARNING: Something unexpected but not an error
   - ERROR: Failed operation but program can continue
   - CRITICAL: Program cannot continue

3. **Include Context**: Log messages should include relevant context.

4. **Use Custom Error Types**: Create specific error classes for different error categories.

5. **Include Error Details**: When raising errors, include specific details to aid debugging.

6. **Handle Errors Consistently**: Use `handle_exception` for consistent error handling.

7. **Check Expensive Debug Operations**:
   ```python
   if logger.isEnabledFor(logging.DEBUG):
       logger.debug(f"Expensive operation: {calculate_expensive_value()}")
   ```

## Example

See `docs/logging_example.py` for a complete example of logging and error handling.
