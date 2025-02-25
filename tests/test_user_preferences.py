#!/usr/bin/env python3
"""
Unit tests for the user preferences module.

These tests verify that the user preferences system correctly stores
and manages user preference data.
"""

import unittest
from datetime import datetime, timedelta

import sys
from pathlib import Path
# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ai.preferences.user_preferences import (
    UserPreferences, RatingScale, Mood, AnimeRating,
    get_user_preferences
)


class TestUserPreferences(unittest.TestCase):
    """Test cases for the user preferences module."""

    def setUp(self):
        """Set up test case with user preferences."""
        # Create user preferences
        self.user_prefs = UserPreferences(user_id="test_user")

    def test_add_rating(self):
        """Test adding anime ratings."""
        # Add a rating
        self.user_prefs.add_rating("anime1", RatingScale.LIKE)

        # Verify rating was added
        self.assertIn("anime1", self.user_prefs.anime_ratings)
        self.assertEqual(self.user_prefs.anime_ratings["anime1"].score, RatingScale.LIKE)

        # Add a rating with notes
        self.user_prefs.add_rating("anime2", RatingScale.FAVORITE, "Loved this!")

        # Verify rating and notes
        self.assertIn("anime2", self.user_prefs.anime_ratings)
        self.assertEqual(self.user_prefs.anime_ratings["anime2"].score, RatingScale.FAVORITE)
        self.assertEqual(self.user_prefs.anime_ratings["anime2"].notes, "Loved this!")

        # Update an existing rating
        old_timestamp = self.user_prefs.anime_ratings["anime1"].timestamp
        self.user_prefs.add_rating("anime1", RatingScale.DISLIKE, "Changed my mind")

        # Verify rating was updated
        self.assertEqual(self.user_prefs.anime_ratings["anime1"].score, RatingScale.DISLIKE)
        self.assertEqual(self.user_prefs.anime_ratings["anime1"].notes, "Changed my mind")
        self.assertGreater(self.user_prefs.anime_ratings["anime1"].timestamp, old_timestamp)

        # Add rating using integer
        self.user_prefs.add_rating("anime3", 4)  # 4 = RatingScale.LOVE
        self.assertEqual(self.user_prefs.anime_ratings["anime3"].score, RatingScale.LOVE)

    def test_update_genre_preference(self):
        """Test updating genre preferences."""
        # Initially no genre preferences
        self.assertEqual(len(self.user_prefs.genre_preferences), 0)

        # Update genre preference
        self.user_prefs.update_genre_preference("action", 0.8)

        # Verify preference was added
        self.assertIn("action", self.user_prefs.genre_preferences)
        self.assertEqual(self.user_prefs.genre_preferences["action"], 0.8)

        # Update existing preference
        self.user_prefs.update_genre_preference("action", 0.9)
        self.assertEqual(self.user_prefs.genre_preferences["action"], 0.9)

        # Add a negative preference
        self.user_prefs.update_genre_preference("horror", -0.7)
        self.assertEqual(self.user_prefs.genre_preferences["horror"], -0.7)

        # Test value clamping (values should be between -1.0 and 1.0)
        self.user_prefs.update_genre_preference("adventure", 1.5)
        self.assertEqual(self.user_prefs.genre_preferences["adventure"], 1.0)

        self.user_prefs.update_genre_preference("drama", -1.5)
        self.assertEqual(self.user_prefs.genre_preferences["drama"], -1.0)

    def test_update_theme_preference(self):
        """Test updating theme preferences."""
        # Initially no theme preferences
        self.assertEqual(len(self.user_prefs.theme_preferences), 0)

        # Update theme preference
        self.user_prefs.update_theme_preference("fantasy", 0.8)

        # Verify preference was added
        self.assertIn("fantasy", self.user_prefs.theme_preferences)
        self.assertEqual(self.user_prefs.theme_preferences["fantasy"], 0.8)

        # Update existing preference
        self.user_prefs.update_theme_preference("fantasy", 0.9)
        self.assertEqual(self.user_prefs.theme_preferences["fantasy"], 0.9)

        # Add a negative preference
        self.user_prefs.update_theme_preference("psychological", -0.7)
        self.assertEqual(self.user_prefs.theme_preferences["psychological"], -0.7)

        # Test value clamping (values should be between -1.0 and 1.0)
        self.user_prefs.update_theme_preference("adventure", 1.5)
        self.assertEqual(self.user_prefs.theme_preferences["adventure"], 1.0)

        self.user_prefs.update_theme_preference("drama", -1.5)
        self.assertEqual(self.user_prefs.theme_preferences["drama"], -1.0)

    def test_set_mood(self):
        """Test setting the user's mood."""
        # Default mood should be ANY
        self.assertEqual(self.user_prefs.current_mood, Mood.ANY)

        # Set mood to HAPPY
        self.user_prefs.set_mood(Mood.HAPPY)
        self.assertEqual(self.user_prefs.current_mood, Mood.HAPPY)

        # Set mood using string
        self.user_prefs.set_mood("sad")
        self.assertEqual(self.user_prefs.current_mood, Mood.SAD)

        # Invalid string should raise ValueError
        with self.assertRaises(ValueError):
            self.user_prefs.set_mood("invalid_mood")

    def test_favorite_studios(self):
        """Test managing favorite studios."""
        # Initially no favorite studios
        self.assertEqual(len(self.user_prefs.favorite_studios), 0)

        # Add a favorite studio
        self.user_prefs.add_favorite_studio("Studio A")
        self.assertIn("Studio A", self.user_prefs.favorite_studios)

        # Add another favorite studio
        self.user_prefs.add_favorite_studio("Studio B")
        self.assertEqual(len(self.user_prefs.favorite_studios), 2)

        # Adding the same studio again should not change anything
        self.user_prefs.add_favorite_studio("Studio A")
        self.assertEqual(len(self.user_prefs.favorite_studios), 2)

        # Remove a studio
        self.user_prefs.remove_favorite_studio("Studio A")
        self.assertNotIn("Studio A", self.user_prefs.favorite_studios)
        self.assertEqual(len(self.user_prefs.favorite_studios), 1)

        # Removing a non-existent studio should not raise an error
        self.user_prefs.remove_favorite_studio("Studio C")
        self.assertEqual(len(self.user_prefs.favorite_studios), 1)

    def test_get_feature_vector(self):
        """Test getting the user's feature vector."""
        # Empty feature vector initially (except for automatically added features)
        features = self.user_prefs.get_feature_vector()
        self.assertIsInstance(features, dict)

        # Add some preferences
        self.user_prefs.update_genre_preference("action", 0.8)
        self.user_prefs.update_theme_preference("fantasy", 0.7)
        self.user_prefs.add_favorite_studio("Studio A")
        self.user_prefs.set_mood(Mood.HAPPY)

        # Get feature vector
        features = self.user_prefs.get_feature_vector()

        # Check for expected features
        self.assertIn("genre_action", features)
        self.assertEqual(features["genre_action"], 0.8)

        self.assertIn("theme_fantasy", features)
        self.assertEqual(features["theme_fantasy"], 0.7)

        self.assertIn("studio_Studio A", features)
        self.assertEqual(features["studio_Studio A"], 1.0)

        self.assertIn("mood_happy", features)
        self.assertEqual(features["mood_happy"], 1.0)

    def test_last_updated(self):
        """Test that last_updated timestamp is updated."""
        # Initially set during creation
        initial_timestamp = self.user_prefs.last_updated

        # Wait a tiny bit to ensure timestamp difference
        import time
        time.sleep(0.001)

        # Update a preference
        self.user_prefs.update_genre_preference("action", 0.8)

        # Timestamp should be updated
        self.assertGreater(self.user_prefs.last_updated, initial_timestamp)

        # Store current timestamp
        previous_timestamp = self.user_prefs.last_updated

        # Wait a tiny bit to ensure timestamp difference
        time.sleep(0.001)

        # Add a rating
        self.user_prefs.add_rating("anime1", RatingScale.LIKE)

        # Timestamp should be updated again
        self.assertGreater(self.user_prefs.last_updated, previous_timestamp)

    def test_get_user_preferences(self):
        """Test getting user preferences from the singleton store."""
        # Get preferences for a user
        user_id = "test_user_1"
        prefs1 = get_user_preferences(user_id)

        # Should create new preferences
        self.assertEqual(prefs1.user_id, user_id)

        # Getting preferences for the same user should return the same object
        prefs2 = get_user_preferences(user_id)
        self.assertIs(prefs1, prefs2)

        # Getting preferences for a different user should return a different object
        prefs3 = get_user_preferences("test_user_2")
        self.assertIsNot(prefs1, prefs3)
        self.assertEqual(prefs3.user_id, "test_user_2")


if __name__ == "__main__":
    unittest.main()
