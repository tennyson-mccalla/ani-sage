"""
Sentiment analyzer for anime descriptions and other text.

This module provides functionality to analyze the sentiment, emotional tone,
and thematic elements of anime descriptions and other text content.
"""

import json
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Union

from pydantic import BaseModel, Field

from src.ai.models.openai_client import get_openai_client
from src.utils.errors import AnalysisError
from src.utils.logging import get_logger

logger = get_logger(__name__)


class SentimentResult(BaseModel):
    """Results from a sentiment analysis."""

    # Overall sentiment scores (-1.0 to 1.0)
    positivity: float = Field(..., description="Overall positivity score from -1.0 to 1.0")
    intensity: float = Field(..., description="Emotional intensity from 0.0 to 1.0")

    # Emotional tones (0.0 to 1.0)
    emotions: Dict[str, float] = Field(
        ...,
        description="Dictionary of emotion scores from 0.0 to 1.0"
    )

    # Thematic elements (0.0 to 1.0)
    themes: Dict[str, float] = Field(
        ...,
        description="Dictionary of theme presence scores from 0.0 to 1.0"
    )

    # Targeted audience (0.0 to 1.0)
    target_audience: Dict[str, float] = Field(
        ...,
        description="Dictionary of likely audience appeal scores from 0.0 to 1.0"
    )

    # Raw analysis text
    raw_analysis: str = Field(..., description="Raw analysis text from the AI")


class SentimentAnalyzer:
    """Analyzer for extracting sentiment from anime descriptions and other text."""

    def __init__(self):
        """Initialize the sentiment analyzer."""
        self.client = get_openai_client()
        logger.debug("Sentiment analyzer initialized")

    def analyze(self, text: str) -> SentimentResult:
        """Analyze the sentiment of the given text.

        Args:
            text: The text to analyze.

        Returns:
            SentimentResult: The sentiment analysis results.

        Raises:
            AnalysisError: If there's an error during analysis.
        """
        try:
            logger.debug(f"Analyzing sentiment for text (length: {len(text)})")

            # Define the prompt for sentiment analysis
            prompt = """
            Analyze the following anime description or text for sentiment, emotional tone, themes, and target audience.
            Provide your analysis as a valid JSON object with the following structure (without comments):
            {
                "positivity": <float>,
                "intensity": <float>,
                "emotions": {
                    "joy": <float>,
                    "sadness": <float>,
                    "anger": <float>,
                    "fear": <float>,
                    "surprise": <float>,
                    "anticipation": <float>,
                    "trust": <float>,
                    "disgust": <float>,
                    "melancholy": <float>,
                    "excitement": <float>,
                    "comfort": <float>,
                    "tension": <float>
                },
                "themes": {
                    "action": <float>,
                    "adventure": <float>,
                    "comedy": <float>,
                    "drama": <float>,
                    "fantasy": <float>,
                    "horror": <float>,
                    "mystery": <float>,
                    "romance": <float>,
                    "science_fiction": <float>,
                    "slice_of_life": <float>,
                    "sports": <float>,
                    "supernatural": <float>,
                    "psychological": <float>,
                    "philosophical": <float>,
                    "historical": <float>,
                    "coming_of_age": <float>
                },
                "target_audience": {
                    "children": <float>,
                    "teens": <float>,
                    "young_adults": <float>,
                    "adults": <float>,
                    "male": <float>,
                    "female": <float>,
                    "general": <float>
                }
            }

            For positivity, use a scale from -1.0 (very negative) to 1.0 (very positive).
            For intensity, use a scale from 0.0 (neutral) to 1.0 (intense).
            For all other scores, use values from 0.0 to 1.0.

            Respond with ONLY the valid JSON object, no comments, no additional text.
            Ensure the JSON is properly formatted without any trailing commas.
            """

            # Get analysis from OpenAI
            response = self.client.analyze_text(text, prompt=prompt)

            # Parse JSON response
            try:
                data = json.loads(response)

                # Create and return the result
                return SentimentResult(
                    positivity=data.get("positivity", 0.0),
                    intensity=data.get("intensity", 0.0),
                    emotions=data.get("emotions", {}),
                    themes=data.get("themes", {}),
                    target_audience=data.get("target_audience", {}),
                    raw_analysis=response
                )
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse sentiment analysis response: {e}")
                logger.debug(f"Raw response: {response}")
                raise AnalysisError(f"Failed to parse sentiment analysis response: {e}")

        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            raise AnalysisError(f"Error in sentiment analysis: {e}")


# Singleton instance for reuse
_sentiment_analyzer = None


def get_sentiment_analyzer() -> SentimentAnalyzer:
    """Get a singleton instance of the sentiment analyzer.

    Returns:
        SentimentAnalyzer: The sentiment analyzer instance.
    """
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer
