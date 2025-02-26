# Ani-Sage

An AI-powered anime recommendation system that understands your mood and preferences.

![Ani-Sage Status](https://img.shields.io/badge/status-early%20development-orange)

## Overview

Ani-Sage combines AI sentiment analysis, user preference tracking, and anime metadata to provide personalized anime recommendations. The system analyzes anime content and matches it to your current mood and preferences for highly relevant suggestions.

## Origins

This project evolved from contributions to the ani-cli project, specifically the local source feature implementation. While working on adding AI features to ani-cli, it became clear that these features deserved their own focused project.

## Features

- 🧠 **AI-powered recommendations** based on your mood and preferences
- 🎬 **Trailer integration** through YouTube API
- 🔍 **Sentiment analysis** of anime descriptions and reviews
- 🎨 **Color analysis** (coming soon) for visual preference matching
- 📊 **User preference tracking** for personalized suggestions
- 🔄 **Integration** with MyAnimeList and AniList APIs (planned)
- 🎮 **Interactive CLI** with easy-to-use commands

## Installation

### Prerequisites

- Python 3.8 or higher
- OpenAI API key (for AI recommendations)
- YouTube API key (for trailer fetching)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ani-sage.git
   cd ani-sage
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. Run the setup script to verify your environment:
   ```bash
   python run_all.py setup
   ```

## Usage

### Basic Recommendation

To get anime recommendations:

```bash
python run_all.py recommend
```

This will start an interactive session to collect your preferences and then provide personalized recommendations.

### Options

```bash
# Limit the number of recommendations
python run_all.py recommend --limit 5

# Skip trailer fetching
python run_all.py recommend --no-trailers

# Run the full demo with all features
python run_all.py demo

# Set up your OpenAI API key
python run_all.py setup
```

### Advanced Usage

For detailed sentiment analysis:

```bash
python run_all.py sentiment "I want something uplifting with action and a good story."
```

## CLI Reference

| Command | Description |
|---------|-------------|
| `recommend` | Generate anime recommendations |
| `demo` | Run the full demo with all features |
| `sentiment` | Analyze text sentiment for anime matching |
| `setup` | Configure API keys and environment |
| `test` | Run test suite |

### Command Options

#### `recommend` command
- `--limit N`: Limit to N recommendations (default: 10)
- `--no-trailers`: Skip fetching trailers
- `--include-watched`: Include anime you've already watched

#### `demo` command
- `--quick`: Run a simplified demo

#### `test` command
- `--test NAME`: Run specific test module
- `--verbose`: Show detailed test output

## Configuration

Ani-Sage can be configured via:

1. Environment variables in `.env` file
2. Command-line arguments
3. User preference files (stored in `~/.config/ani-sage/`)

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `YOUTUBE_API_KEY`: Your YouTube API key
- `ANI_SAGE_LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `ANI_SAGE_CONFIG_DIR`: Custom configuration directory

## Development Status

🚧 Currently in early development. Core features are working but expect changes.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
