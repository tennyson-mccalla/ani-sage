# ani-sage AI Features

This document provides an overview of the AI features implemented in ani-sage.

## Overview

The AI features in ani-sage provide intelligent recommendation, sentiment analysis, and preference processing capabilities to enhance the anime discovery experience. These features utilize OpenAI's powerful AI models to analyze anime descriptions, understand user preferences, and generate personalized recommendations.

## Components

### 1. Sentiment Analysis System

The sentiment analysis system extracts meaningful insights from anime descriptions, including:

- Overall positivity/negativity score
- Emotional intensity
- Emotional tone profiles (joy, sadness, tension, etc.)
- Thematic elements (action, adventure, psychological, etc.)
- Target audience assessment

**Usage Example:**

```bash
# From the command line
python -m src.cli.sentiment_cli -t "In a world where magic is everything, Asta and Yuno are orphans who dream of becoming the Wizard King. While Yuno excels in magic, Asta cannot use it at all and desperately trains physically to make up for it."

# From Python code
from src.ai.sentiment.analyzer import get_sentiment_analyzer

analyzer = get_sentiment_analyzer()
result = analyzer.analyze("In a world where magic is everything...")

print(f"Positivity: {result.positivity}")
print(f"Top emotion: {max(result.emotions.items(), key=lambda x: x[1])[0]}")
```

### 2. Basic Recommendation Engine

The recommendation engine combines multiple factors to suggest anime based on:

- User genre/theme preferences
- Previous anime ratings
- Current mood
- Studio preferences
- Sentiment profile matching

**Usage Example:**

```python
from src.ai.recommendation.engine import get_recommendation_engine
from src.ai.preferences.user_preferences import get_user_preferences, Mood

# Get or create user preferences
user_prefs = get_user_preferences("user123")
user_prefs.update_genre_preference("fantasy", 0.8)
user_prefs.update_genre_preference("horror", -0.5)
user_prefs.set_mood(Mood.EXCITED)

# Get recommendations
engine = get_recommendation_engine()
recommendations = engine.get_recommendations(user_prefs)

for rec in recommendations:
    print(f"{rec.anime.title} - Score: {rec.score:.2f}")
    print(f"Why: {rec.explanation}")
    print()
```

### 3. User Preference System

The user preference system stores and manages user preferences, including:

- Explicit anime ratings (1-5 scale)
- Genre preferences (-1.0 to 1.0 scale)
- Theme preferences (-1.0 to 1.0 scale)
- Current mood for contextual recommendations
- Favorite studios

### 4. Color Preference Processing

The color preference processing system analyzes visual aspects of anime, including:

- Color palettes (vibrant, pastel, dark, etc.)
- Visual styles (realistic, minimalist, etc.)
- Visual properties (brightness, saturation, contrast)

## Setup

### OpenAI API Configuration

The AI features require an OpenAI API key to function. You can set up the API key using the provided script:

```bash
# Interactive setup
./scripts/setup_openai.py

# Non-interactive setup
./scripts/setup_openai.py --api-key "your-api-key"
```

Alternatively, you can set the `OPENAI_API_KEY` environment variable:

```bash
export OPENAI_API_KEY="your-api-key"
```

### Configuration Options

The AI features can be customized through these configuration options:

- **OpenAI Models**: Control which models are used for sentiment analysis and embeddings
- **Recommendation Weights**: Adjust the importance of different factors in recommendations
- **Temperature**: Control the creativity of explanations generated

## Integration Points

The AI features integrate with other ani-sage components:

- **Metadata Core**: Provides anime metadata for sentiment analysis
- **API Integration**: Fetches anime information from MyAnimeList and AniList
- **CLI**: Provides user interfaces for testing and using AI features
