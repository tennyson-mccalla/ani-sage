#!/usr/bin/env python3
"""
Unit tests for the recommendation engine.

These tests verify that the recommendation engine correctly processes
user preferences and generates appropriate recommendations.
"""

import unittest
from unittest.mock import patch, MagicMock

import sys
from pathlib import Path
# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ai.recommendation.engine import (
    RecommendationEngine, RecommendationOptions, RecommendationResult
)
from src.ai.models.anime import Anime, AnimeType, AnimeStatus, AnimeFeatures
from src.ai.preferences.user_preferences import UserPreferences, Mood


class TestRecommendationEngine(unittest.TestCase):
    """Test cases for the recommendation engine."""

    def setUp(self):
        """Set up test case with sample anime and user preferences."""
        # Create a recommendation engine
        self.engine = RecommendationEngine()

        # Create sample anime
        self.anime1 = Anime(
            id="1",
            title="Test Anime 1",
            genres=["action", "adventure"],
            studios=["Studio A"],
            type=AnimeType.TV,
            episodes=24,
            status=AnimeStatus.FINISHED
        )
        self.anime1.features.sentiment = {"positivity": 0.8, "intensity": 0.7}
        self.anime1.features.emotion_profile = {
            "joy": 0.8, "excitement": 0.7, "anticipation": 0.6
        }
        self.anime1.features.themes = {
            "adventure": 0.9, "action": 0.8
        }

        self.anime2 = Anime(
            id="2",
            title="Test Anime 2",
            genres=["drama", "romance"],
            studios=["Studio B"],
            type=AnimeType.TV,
            episodes=12,
            status=AnimeStatus.FINISHED
        )
        self.anime2.features.sentiment = {"positivity": 0.2, "intensity": 0.9}
        self.anime2.features.emotion_profile = {
            "sadness": 0.7, "melancholy": 0.6, "comfort": 0.5
        }
        self.anime2.features.themes = {
            "drama": 0.9, "romance": 0.8
        }

        self.anime3 = Anime(
            id="3",
            title="Test Anime 3",
            genres=["comedy", "slice_of_life"],
            studios=["Studio A"],
            type=AnimeType.TV,
            episodes=13,
            status=AnimeStatus.FINISHED
        )
        self.anime3.features.sentiment = {"positivity": 0.9, "intensity": 0.4}
        self.anime3.features.emotion_profile = {
            "joy": 0.9, "comfort": 0.8, "trust": 0.7
        }
        self.anime3.features.themes = {
            "comedy": 0.9, "slice_of_life": 0.8
        }

        # Add anime to the engine
        self.engine.add_anime(self.anime1)
        self.engine.add_anime(self.anime2)
        self.engine.add_anime(self.anime3)

        # Create user preferences
        self.user_prefs = UserPreferences(user_id="test_user")

    def test_add_anime(self):
        """Test adding anime to the recommendation engine."""
        # Create a new engine and add anime
        engine = RecommendationEngine()
        self.assertEqual(len(engine._anime_catalog), 0)

        # Add one anime
        engine.add_anime(self.anime1)
        self.assertEqual(len(engine._anime_catalog), 1)
        self.assertIn(self.anime1.id, engine._anime_catalog)

        # Add batch of anime
        engine.add_anime_batch([self.anime2, self.anime3])
        self.assertEqual(len(engine._anime_catalog), 3)
        self.assertIn(self.anime2.id, engine._anime_catalog)
        self.assertIn(self.anime3.id, engine._anime_catalog)

    def test_compute_similarity(self):
        """Test computing similarity between anime."""
        # Compute similarity between anime1 and anime2 (different genres)
        similarity = self.engine._compute_similarity(self.anime1, self.anime2)
        self.assertGreaterEqual(similarity, 0.0)
        self.assertLessEqual(similarity, 1.0)

        # Compute similarity between anime1 and anime1 (same anime)
        similarity = self.engine._compute_similarity(self.anime1, self.anime1)
        self.assertAlmostEqual(similarity, 1.0)

        # Similarity should be cached
        self.assertIn(f"{self.anime1.id}:{self.anime2.id}", self.anime1._similarity_cache)
        self.assertIn(f"{self.anime2.id}:{self.anime1.id}", self.anime2._similarity_cache)

    def test_calculate_mood_relevance(self):
        """Test calculating mood relevance."""
        # The ANY mood should always return 1.0
        relevance = self.engine._calculate_mood_relevance(self.anime1, Mood.ANY)
        self.assertEqual(relevance, 1.0)

        # Excited mood should match anime1 well (action, excitement)
        relevance = self.engine._calculate_mood_relevance(self.anime1, Mood.EXCITED)
        self.assertGreater(relevance, 0.5)

        # Sad mood should match anime2 better (drama, sadness)
        relevance1 = self.engine._calculate_mood_relevance(self.anime1, Mood.SAD)
        relevance2 = self.engine._calculate_mood_relevance(self.anime2, Mood.SAD)
        self.assertGreater(relevance2, relevance1)

        # Happy mood should match anime3 better (comedy, joy)
        relevance1 = self.engine._calculate_mood_relevance(self.anime1, Mood.HAPPY)
        relevance3 = self.engine._calculate_mood_relevance(self.anime3, Mood.HAPPY)
        self.assertGreater(relevance3, relevance1)

    @patch('src.ai.models.openai_client.OpenAIClient')
    def test_generate_explanation(self, mock_client_class):
        """Test generating recommendation explanations."""
        # Mock the OpenAI client
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.analyze_text.return_value = "This is a mock explanation."

        # Set client on the engine
        self.engine.openai_client = mock_client

        # Set up user preferences
        self.user_prefs.update_genre_preference("action", 0.8)
        self.user_prefs.set_mood(Mood.EXCITED)

        # Generate explanation
        explanation = self.engine._generate_explanation(self.anime1, self.user_prefs)

        # Should get the mock response
        self.assertEqual(explanation, "This is a mock explanation.")

        # Mock a client error
        mock_client.analyze_text.side_effect = Exception("API error")

        # Should fall back to a generic explanation
        explanation = self.engine._generate_explanation(self.anime1, self.user_prefs)
        self.assertIn("preferred genre", explanation)

    def test_get_recommendations_by_genre(self):
        """Test getting recommendations based on genre preferences."""
        # Set up user preferences for action/adventure
        self.user_prefs.update_genre_preference("action", 0.9)
        self.user_prefs.update_genre_preference("adventure", 0.8)
        self.user_prefs.update_genre_preference("drama", -0.5)

        # Get recommendations with genre preferences emphasized
        options = RecommendationOptions(
            limit=3,
            mood_weight=0.1,
            genre_weight=0.9,
            studio_weight=0.1,
            sentiment_weight=0.1,
            generate_explanations=False
        )

        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should recommend anime1 first (has action, adventure)
        self.assertEqual(len(recs), 3)
        self.assertEqual(recs[0].anime.id, self.anime1.id)

        # anime2 should be last (has drama which user dislikes)
        self.assertEqual(recs[2].anime.id, self.anime2.id)

    def test_get_recommendations_by_mood(self):
        """Test getting recommendations based on mood."""
        # Set mood to HAPPY
        self.user_prefs.set_mood(Mood.HAPPY)

        # Get recommendations with mood emphasized
        options = RecommendationOptions(
            limit=3,
            mood_weight=0.9,
            genre_weight=0.1,
            studio_weight=0.1,
            sentiment_weight=0.1,
            generate_explanations=False
        )

        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should recommend anime3 first (comedy, joy)
        self.assertEqual(len(recs), 3)
        self.assertEqual(recs[0].anime.id, self.anime3.id)

        # Set mood to SAD
        self.user_prefs.set_mood(Mood.SAD)
        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should recommend anime2 first (drama, sadness)
        self.assertEqual(recs[0].anime.id, self.anime2.id)

    def test_get_recommendations_by_studio(self):
        """Test getting recommendations based on studio preferences."""
        # Set favorite studio
        self.user_prefs.add_favorite_studio("Studio A")

        # Get recommendations with studio emphasized
        options = RecommendationOptions(
            limit=3,
            mood_weight=0.1,
            genre_weight=0.1,
            studio_weight=0.9,
            sentiment_weight=0.1,
            generate_explanations=False
        )

        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should recommend anime from Studio A first
        self.assertEqual(len(recs), 3)
        self.assertIn(recs[0].anime.id, ["1", "3"])  # Both anime 1 and 3 are from Studio A
        self.assertEqual(recs[2].anime.id, "2")      # anime2 is from Studio B

    def test_exclude_watched_anime(self):
        """Test excluding watched anime from recommendations."""
        # Mark anime1 as watched
        self.user_prefs.add_rating("1", 4)

        # Get recommendations excluding watched
        options = RecommendationOptions(
            limit=3,
            include_watched=False,
            generate_explanations=False
        )

        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should only recommend anime2 and anime3
        self.assertEqual(len(recs), 2)
        self.assertNotIn("1", [rec.anime.id for rec in recs])

        # Get recommendations including watched
        options.include_watched = True
        recs = self.engine.get_recommendations(self.user_prefs, options)

        # Should recommend all three anime
        self.assertEqual(len(recs), 3)

    def test_get_recommendation_engine_singleton(self):
        """Test that get_recommendation_engine returns a singleton instance."""
        from src.ai.recommendation.engine import get_recommendation_engine

        engine1 = get_recommendation_engine()
        engine2 = get_recommendation_engine()

        # Both should be the same instance
        self.assertIs(engine1, engine2)


if __name__ == "__main__":
    unittest.main()
