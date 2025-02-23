# Development Setup

## Requirements
- Python 3.8+
- Poetry or pip for dependency management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ani-sage.git
cd ani-sage
```

2. Install dependencies:
```bash
# Using pip
pip install -r requirements.txt -r requirements-dev.txt

# Using Poetry
poetry install
```

3. Set up pre-commit hooks:
```bash
pre-commit install
```

## Development Environment

### Environment Variables
- `DEBUG=1` - Enable debug logging
- `ANI_SAGE_LOG_LEVEL` - Set logging level (DEBUG, INFO, WARNING, ERROR)
- `XDG_CONFIG_HOME` - Override config directory location
- `XDG_CACHE_HOME` - Override cache directory location
- `XDG_DATA_HOME` - Override data directory location

### Running Tests
```bash
pytest
```

### Code Style
This project uses:
- black for code formatting
- flake8 for linting
- mypy for type checking
