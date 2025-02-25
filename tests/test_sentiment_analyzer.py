#!/usr/bin/env python3
"""
Unit tests for the sentiment analyzer module.

These tests verify that the sentiment analyzer correctly processes
anime descriptions and extracts sentiment data.
"""

import os
import unittest
from unittest.mock import patch, MagicMock

import sys
from pathlib import Path
# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ai.sentiment.analyzer import SentimentAnalyzer, SentimentResult
from src.utils.errors import AnalysisError


class TestSentimentAnalyzer(unittest.TestCase):
    """Test cases for the sentiment analyzer."""

    def setUp(self):
        """Set up test case."""
        # If OPENAI_API_KEY is not set, skip tests that require it
        if not os.environ.get("OPENAI_API_KEY"):
            self.skipTest("OPENAI_API_KEY not set in environment")

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_analyze_success(self, mock_client_class):
        """Test successfully analyzing text."""
        # Mock the OpenAI client response
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Set up the mock to return a valid JSON response
        mock_response = '''{
            "positivity": 0.7,
            "intensity": 0.8,
            "emotions": {
                "joy": 0.8,
                "excitement": 0.7,
                "anticipation": 0.6
            },
            "themes": {
                "adventure": 0.9,
                "fantasy": 0.8,
                "action": 0.7
            },
            "target_audience": {
                "teens": 0.8,
                "young_adults": 0.7,
                "general": 0.6
            }
        }'''
        mock_client.analyze_text.return_value = mock_response

        # Create analyzer and test
        analyzer = SentimentAnalyzer()
        analyzer.client = mock_client

        result = analyzer.analyze("Test anime description")

        # Verify the result
        self.assertIsInstance(result, SentimentResult)
        self.assertEqual(result.positivity, 0.7)
        self.assertEqual(result.intensity, 0.8)
        self.assertEqual(result.emotions["joy"], 0.8)
        self.assertEqual(result.themes["adventure"], 0.9)
        self.assertEqual(result.target_audience["teens"], 0.8)
        self.assertEqual(result.raw_analysis, mock_response)

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_analyze_invalid_json(self, mock_client_class):
        """Test handling invalid JSON response."""
        # Mock the OpenAI client response
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Set up the mock to return an invalid JSON response
        mock_client.analyze_text.return_value = "Not valid JSON"

        # Create analyzer and test
        analyzer = SentimentAnalyzer()
        analyzer.client = mock_client

        # Should raise AnalysisError
        with self.assertRaises(AnalysisError):
            analyzer.analyze("Test anime description")

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_analyze_client_error(self, mock_client_class):
        """Test handling client errors."""
        # Mock the OpenAI client to raise an exception
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Set up the mock to raise an exception
        mock_client.analyze_text.side_effect = Exception("API error")

        # Create analyzer and test
        analyzer = SentimentAnalyzer()
        analyzer.client = mock_client

        # Should raise AnalysisError
        with self.assertRaises(AnalysisError):
            analyzer.analyze("Test anime description")

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_sentiment_positive(self, mock_client_class):
        """Test analysis of a positive description."""
        # Mock the OpenAI client response
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Set up the mock to return a positive response
        mock_response = '''{
            "positivity": 0.9,
            "intensity": 0.7,
            "emotions": {
                "joy": 0.9,
                "excitement": 0.8,
                "anticipation": 0.7
            },
            "themes": {
                "adventure": 0.8,
                "comedy": 0.7
            },
            "target_audience": {
                "general": 0.8
            }
        }'''
        mock_client.analyze_text.return_value = mock_response

        # Create analyzer and test
        analyzer = SentimentAnalyzer()
        analyzer.client = mock_client

        result = analyzer.analyze("A heartwarming story about friendship and adventure.")

        # Verify the result is positive
        self.assertGreater(result.positivity, 0.5)
        self.assertIn("joy", result.emotions)
        self.assertGreater(result.emotions["joy"], 0.5)

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_sentiment_negative(self, mock_client_class):
        """Test analysis of a negative description."""
        # Mock the OpenAI client response
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        # Set up the mock to return a negative response
        mock_response = '''{
            "positivity": -0.7,
            "intensity": 0.8,
            "emotions": {
                "sadness": 0.8,
                "fear": 0.7,
                "disgust": 0.6
            },
            "themes": {
                "drama": 0.9,
                "psychological": 0.8,
                "horror": 0.7
            },
            "target_audience": {
                "adults": 0.9
            }
        }'''
        mock_client.analyze_text.return_value = mock_response

        # Create analyzer and test
        analyzer = SentimentAnalyzer()
        analyzer.client = mock_client

        result = analyzer.analyze("A tragic story of loss and betrayal.")

        # Verify the result is negative
        self.assertLess(result.positivity, 0)
        self.assertIn("sadness", result.emotions)
        self.assertGreater(result.emotions["sadness"], 0.5)

    def test_get_sentiment_analyzer_singleton(self):
        """Test that get_sentiment_analyzer returns a singleton instance."""
        from src.ai.sentiment.analyzer import get_sentiment_analyzer

        analyzer1 = get_sentiment_analyzer()
        analyzer2 = get_sentiment_analyzer()

        # Both should be the same instance
        self.assertIs(analyzer1, analyzer2)


if __name__ == "__main__":
    unittest.main()
