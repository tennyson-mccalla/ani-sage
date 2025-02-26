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
            logger.debug(f"Raw response from OpenAI: {response}")

            # Parse JSON response - add more robust parsing
            try:
                # Try to extract JSON from response in case there's extra text
                json_start = response.find('{')
                json_end = response.rfind('}') + 1

                if json_start != -1 and json_end > json_start:
                    # Extract the JSON part
                    json_text = response[json_start:json_end]
                    logger.debug(f"Extracted JSON: {json_text}")
                    data = json.loads(json_text)
                else:
                    # If no JSON-like structure found, try the original response
                    logger.debug("No JSON structure found, trying to parse the entire response")
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

                # Try a more lenient JSON parser
                try:
                    import re
                    # Replace invalid character sequences
                    cleaned_response = re.sub(r'[\x00-\x1F\x7F]', '', response)
                    # Try to fix common JSON issues
                    cleaned_response = cleaned_response.replace("'", '"').replace('\n', ' ')
                    logger.debug(f"Trying with cleaned response: {cleaned_response}")

                    # Look for JSON-like structure again
                    match = re.search(r'(\{.*\})', cleaned_response, re.DOTALL)
                    if match:
                        potential_json = match.group(1)
                        logger.debug(f"Found potential JSON: {potential_json}")
                        data = json.loads(potential_json)

                        return SentimentResult(
                            positivity=data.get("positivity", 0.0),
                            intensity=data.get("intensity", 0.0),
                            emotions=data.get("emotions", {}),
                            themes=data.get("themes", {}),
                            target_audience=data.get("target_audience", {}),
                            raw_analysis=response
                        )
                except Exception as fallback_error:
                    logger.error(f"Fallback parsing also failed: {fallback_error}")

                # If all parsing attempts fail, raise the original error
                raise AnalysisError(f"Failed to parse sentiment analysis response: {e}")

        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            raise AnalysisError(f"Error in sentiment analysis: {e}")


class MockSentimentAnalyzer:
    """A mock sentiment analyzer that returns predefined results."""

    def __init__(self):
        """Initialize the mock sentiment analyzer."""
        logger.debug("Mock sentiment analyzer initialized for demo mode")

    def analyze(self, text: str) -> SentimentResult:
        """Return mock sentiment analysis results based on the input text.

        Args:
            text: The text to analyze

        Returns:
            SentimentResult: Mock sentiment analysis results
        """
        # Create a deterministic but varied result based on text length and content
        text_hash = sum(ord(c) for c in text[:100])  # Simple hash of the text

        # Vary positivity based on presence of positive/negative words
        positivity = 0.2
        if "happy" in text.lower() or "fun" in text.lower() or "exciting" in text.lower():
            positivity = 0.8
        elif "sad" in text.lower() or "tragic" in text.lower() or "dark" in text.lower():
            positivity = -0.5

        # Vary intensity based on exclamation marks and question marks
        intensity = 0.5 + (text.count('!') * 0.1) + (text.count('?') * 0.05)
        intensity = min(intensity, 1.0)  # Cap at 1.0

        # Create mock emotions with some variation
        emotions = {
            "joy": max(0.0, min(1.0, 0.5 + positivity * 0.3 + (text_hash % 10) * 0.02)),
            "sadness": max(0.0, min(1.0, 0.5 - positivity * 0.3 + ((text_hash // 10) % 10) * 0.02)),
            "anger": max(0.0, min(1.0, 0.2 + ((text_hash // 100) % 10) * 0.03)),
            "fear": max(0.0, min(1.0, 0.3 + ((text_hash // 1000) % 10) * 0.03)),
            "surprise": max(0.0, min(1.0, 0.4 + ((text_hash // 10000) % 10) * 0.04)),
        }

        # Create mock themes based on text content
        themes = {
            "adventure": 0.7 if "adventure" in text.lower() else 0.3,
            "romance": 0.8 if "love" in text.lower() or "romance" in text.lower() else 0.2,
            "comedy": 0.6 if "funny" in text.lower() or "comedy" in text.lower() else 0.4,
            "action": 0.7 if "battle" in text.lower() or "fight" in text.lower() else 0.3,
            "drama": 0.6 if "drama" in text.lower() or "emotional" in text.lower() else 0.4,
        }

        # Create mock target audience
        target_audience = {
            "children": 0.3,
            "teens": 0.6,
            "adults": 0.5,
            "family": 0.4,
        }

        return SentimentResult(
            positivity=positivity,
            intensity=intensity,
            emotions=emotions,
            themes=themes,
            target_audience=target_audience,
            raw_analysis="[Demo Mode] Mock sentiment analysis generated for demo purposes."
        )


_sentiment_analyzer = None


def get_sentiment_analyzer(demo_mode: bool = False) -> Union[SentimentAnalyzer, MockSentimentAnalyzer]:
    """Get a singleton instance of the sentiment analyzer.

    Args:
        demo_mode: Whether to return a mock analyzer for demo mode

    Returns:
        SentimentAnalyzer or MockSentimentAnalyzer: The sentiment analyzer instance
    """
    global _sentiment_analyzer

    if _sentiment_analyzer is not None:
        return _sentiment_analyzer

    if demo_mode:
        logger.warning("Using mock sentiment analyzer for demo mode")
        _sentiment_analyzer = MockSentimentAnalyzer()
    else:
        try:
            _sentiment_analyzer = SentimentAnalyzer()
        except Exception as e:
            logger.warning(f"Failed to initialize real sentiment analyzer: {e}. Using mock version.")
            _sentiment_analyzer = MockSentimentAnalyzer()

    return _sentiment_analyzer
