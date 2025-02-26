# Contributing to Ani-Sage

Thank you for your interest in contributing to Ani-Sage! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Environment](#development-environment)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

We expect all contributors to adhere to the project's code of conduct. Please be respectful and considerate of others when participating in this project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally: `git clone https://github.com/yourusername/ani-sage.git`
3. Install development dependencies: `pip install -r requirements-dev.txt`
4. Create a branch for your changes: `git checkout -b feature/your-feature-name`

## Project Structure

The project is organized as follows:

```
ani-sage/
├── docs/                # Documentation files
├── scripts/             # Utility scripts and demos
│   ├── demo_recommendations.py   # Main demo script
│   └── ...
├── src/                 # Source code
│   ├── ai/              # AI-related functionality
│   │   ├── models/      # Data models for AI
│   │   ├── recommendation/  # Recommendation engine
│   │   ├── sentiment/   # Sentiment analysis
│   │   └── preferences/ # User preference handling
│   ├── api/             # API clients
│   │   └── providers/   # API provider implementations
│   ├── cli/             # CLI interface
│   ├── data/            # Data management
│   └── utils/           # Utility functions
├── tests/               # Test suite
├── run_all.py           # Main entry point
└── requirements.txt     # Dependencies
```

## Development Environment

We recommend using a virtual environment for development:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Coding Standards

We follow these coding standards:

1. **PEP 8**: Follow the [PEP 8 style guide](https://www.python.org/dev/peps/pep-0008/).
2. **Docstrings**: Use Google-style docstrings for all functions, classes, and modules.
3. **Type Hints**: Include type hints for function parameters and return values.
4. **Tests**: Write tests for new functionality. We use unittest.
5. **Imports**: Organize imports alphabetically within their groups.

Example function with proper formatting:

```python
def process_anime_data(data: Dict[str, Any], include_metadata: bool = True) -> List[Anime]:
    """Process raw anime data into Anime objects.

    Args:
        data: The raw anime data dictionary.
        include_metadata: Whether to include additional metadata.

    Returns:
        A list of processed Anime objects.

    Raises:
        ValueError: If the data is malformed.
    """
    # Function implementation
```

## Submitting Changes

1. Write clear, concise commit messages that explain your changes
2. Push your changes to your fork
3. Submit a pull request to the main repository
4. Respond to any review feedback

## Issue Reporting

When reporting issues, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Any relevant logs or error messages
- Your environment information (OS, Python version, etc.)

## Feature Requests

Feature requests are welcome! When submitting a feature request:

1. Explain the problem that your feature solves
2. Describe the functionality you'd like to see
3. Provide examples of how the feature would be used
4. Indicate if you're willing to implement the feature yourself

Thank you for contributing to Ani-Sage!
