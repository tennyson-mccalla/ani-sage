"""
User preference models and management.

This module provides the data structures and functionality for storing,
updating, and retrieving user preferences for anime recommendations.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set, Union

from pydantic import BaseModel, Field

from src.utils.logging import get_logger

logger = get_logger(__name__)


class RatingScale(int, Enum):
    """Rating scale for user preferences."""
    DISLIKE = 1
    NEUTRAL = 2
    LIKE = 3
    LOVE = 4
    FAVORITE = 5


class Mood(str, Enum):
    """Mood options for preference filtering."""
    HAPPY = "happy"
    SAD = "sad"
    RELAXED = "relaxed"
    EXCITED = "excited"
    THOUGHTFUL = "thoughtful"
    ADVENTUROUS = "adventurous"
    ROMANTIC = "romantic"
    MYSTERIOUS = "mysterious"
    ANY = "any"


class AnimeRating(BaseModel):
    """User rating for a specific anime."""
    anime_id: str = Field(..., description="ID of the rated anime")
    score: RatingScale = Field(..., description="User's rating")
    timestamp: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = Field(None, description="User notes about this anime")


class GenrePreference(BaseModel):
    """User preference for a specific genre."""
    genre: str = Field(..., description="Genre name")
    weight: float = Field(..., description="Preference weight from -1.0 to 1.0")


class UserPreferences(BaseModel):
    """User preferences for anime recommendations."""

    # User identification
    user_id: str = Field(..., description="Unique identifier for the user")

    # Explicit ratings
    anime_ratings: Dict[str, AnimeRating] = Field(
        default_factory=dict,
        description="User ratings for specific anime"
    )

    # Genre preferences
    genre_preferences: Dict[str, float] = Field(
        default_factory=dict,
        description="User genre preferences from -1.0 (dislike) to 1.0 (like)"
    )

    # Theme preferences
    theme_preferences: Dict[str, float] = Field(
        default_factory=dict,
        description="User theme preferences from -1.0 (dislike) to 1.0 (like)"
    )

    # Current mood (for contextual recommendations)
    current_mood: Mood = Field(
        default=Mood.ANY,
        description="User's current mood for contextual recommendations"
    )

    # Favorite studios
    favorite_studios: Set[str] = Field(
        default_factory=set,
        description="Set of user's favorite studios"
    )

    # Demographic preferences (optional)
    target_demographic: Dict[str, float] = Field(
        default_factory=dict,
        description="User demographic preferences"
    )

    # Last updated timestamp
    last_updated: datetime = Field(
        default_factory=datetime.now,
        description="Timestamp of the last update to preferences"
    )

    def add_rating(self, anime_id: str, score: Union[RatingScale, int], notes: Optional[str] = None) -> None:
        """Add or update a rating for an anime.

        Args:
            anime_id: ID of the anime being rated
            score: Rating score (1-5)
            notes: Optional notes about the rating
        """
        if isinstance(score, int):
            score = RatingScale(score)

        rating = AnimeRating(
            anime_id=anime_id,
            score=score,
            timestamp=datetime.now(),
            notes=notes
        )

        self.anime_ratings[anime_id] = rating
        self.last_updated = datetime.now()
        logger.debug(f"Added rating {score} for anime {anime_id}")

    def update_genre_preference(self, genre: str, weight: float) -> None:
        """Update preference weight for a genre.

        Args:
            genre: The genre to update
            weight: Preference weight from -1.0 (dislike) to 1.0 (like)
        """
        # Ensure weight is within valid range
        weight = max(-1.0, min(1.0, weight))

        self.genre_preferences[genre] = weight
        self.last_updated = datetime.now()
        logger.debug(f"Updated preference for genre {genre} to {weight}")

    def update_theme_preference(self, theme: str, weight: float) -> None:
        """Update preference weight for a theme.

        Args:
            theme: The theme to update
            weight: Preference weight from -1.0 (dislike) to 1.0 (like)
        """
        # Ensure weight is within valid range
        weight = max(-1.0, min(1.0, weight))

        self.theme_preferences[theme] = weight
        self.last_updated = datetime.now()
        logger.debug(f"Updated preference for theme {theme} to {weight}")

    def set_mood(self, mood: Union[Mood, str]) -> None:
        """Set the user's current mood for contextual recommendations.

        Args:
            mood: The mood to set
        """
        if isinstance(mood, str):
            mood = Mood(mood)

        self.current_mood = mood
        self.last_updated = datetime.now()
        logger.debug(f"Set current mood to {mood}")

    def add_favorite_studio(self, studio: str) -> None:
        """Add a studio to the user's favorites.

        Args:
            studio: The studio to add
        """
        self.favorite_studios.add(studio)
        self.last_updated = datetime.now()
        logger.debug(f"Added {studio} to favorite studios")

    def remove_favorite_studio(self, studio: str) -> None:
        """Remove a studio from the user's favorites.

        Args:
            studio: The studio to remove
        """
        if studio in self.favorite_studios:
            self.favorite_studios.remove(studio)
            self.last_updated = datetime.now()
            logger.debug(f"Removed {studio} from favorite studios")

    def get_feature_vector(self) -> Dict[str, float]:
        """Get a feature vector representing the user's preferences.

        Returns:
            Dict[str, float]: Dictionary mapping feature names to preference weights
        """
        features = {}

        # Add genre preferences
        for genre, weight in self.genre_preferences.items():
            features[f"genre_{genre}"] = weight

        # Add theme preferences
        for theme, weight in self.theme_preferences.items():
            features[f"theme_{theme}"] = weight

        # Add studio preferences (binary)
        for studio in self.favorite_studios:
            features[f"studio_{studio}"] = 1.0

        # Add demographic preferences
        for demo, weight in self.target_demographic.items():
            features[f"demographic_{demo}"] = weight

        # Add mood information
        if self.current_mood != Mood.ANY:
            features[f"mood_{self.current_mood.value}"] = 1.0

        return features


# Singleton for preference storage
_preference_store: Dict[str, UserPreferences] = {}


def get_user_preferences(user_id: str) -> UserPreferences:
    """Get preferences for a specific user.

    Creates new preferences if none exist.

    Args:
        user_id: The user ID to get preferences for

    Returns:
        UserPreferences: The user's preference object
    """
    if user_id not in _preference_store:
        _preference_store[user_id] = UserPreferences(user_id=user_id)
        logger.debug(f"Created new preferences for user {user_id}")

    return _preference_store[user_id]
