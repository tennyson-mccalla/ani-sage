"""
Data models for anime representations in the recommendation engine.

This module defines the core data structures used to represent anime and their features
for recommendation purposes.
"""

from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Union
from datetime import date

from pydantic import BaseModel, Field


class AnimeType(str, Enum):
    """Types of anime content."""
    TV = "TV"
    MOVIE = "Movie"
    OVA = "OVA"
    ONA = "ONA"
    SPECIAL = "Special"
    MUSIC = "Music"
    UNKNOWN = "Unknown"


class AnimeStatus(str, Enum):
    """Status of anime release."""
    AIRING = "Airing"
    FINISHED = "Finished"
    NOT_YET_AIRED = "Not Yet Aired"
    CANCELED = "Canceled"
    UNKNOWN = "Unknown"


class AnimeSeason(str, Enum):
    """Anime seasons throughout the year."""
    WINTER = "Winter"
    SPRING = "Spring"
    SUMMER = "Summer"
    FALL = "Fall"
    UNKNOWN = "Unknown"


class AnimeFeatures(BaseModel):
    """Extracted features used for anime recommendation."""

    # Content-based features
    genres: Dict[str, float] = Field(default_factory=dict)
    themes: Dict[str, float] = Field(default_factory=dict)

    # Sentiment-based features
    sentiment: Dict[str, float] = Field(default_factory=dict)
    emotion_profile: Dict[str, float] = Field(default_factory=dict)

    # Demographic features
    target_demographic: Dict[str, float] = Field(default_factory=dict)

    # Text embeddings (when available)
    synopsis_embedding: Optional[List[float]] = None
    title_embedding: Optional[List[float]] = None

    class Config:
        """Pydantic configuration."""
        arbitrary_types_allowed = True


class Anime(BaseModel):
    """Core representation of an anime for recommendation purposes."""

    # Basic identifiers
    id: str = Field(..., description="Unique identifier for the anime")
    title: str = Field(..., description="Primary title of the anime")
    alternative_titles: Dict[str, str] = Field(
        default_factory=dict,
        description="Alternative titles keyed by language code"
    )

    # Basic metadata
    type: AnimeType = Field(default=AnimeType.UNKNOWN, description="Type of anime content")
    episodes: Optional[int] = Field(
        None,
        description="Number of episodes (None for movies or unknown)"
    )
    status: AnimeStatus = Field(
        default=AnimeStatus.UNKNOWN,
        description="Current airing status"
    )

    # Release information
    aired_from: Optional[date] = Field(None, description="Start date of airing")
    aired_to: Optional[date] = Field(None, description="End date of airing")
    season: Optional[AnimeSeason] = Field(None, description="Season of initial release")
    year: Optional[int] = Field(None, description="Year of initial release")

    # Content details
    synopsis: Optional[str] = Field(None, description="Plot synopsis")
    genres: List[str] = Field(default_factory=list, description="List of genres")
    themes: List[str] = Field(default_factory=list, description="List of themes")
    studios: List[str] = Field(default_factory=list, description="List of production studios")

    # External IDs
    mal_id: Optional[int] = Field(None, description="MyAnimeList ID")
    anilist_id: Optional[int] = Field(None, description="AniList ID")

    # Extracted features for recommendation
    features: AnimeFeatures = Field(default_factory=AnimeFeatures)

    # Cache field for similarity scores
    _similarity_cache: Dict[str, float] = {}

    class Config:
        """Pydantic configuration."""
        arbitrary_types_allowed = True

    def get_feature_vector(self) -> List[float]:
        """Get a flattened feature vector for this anime.

        This combines all numerical features into a single vector that can be used
        for similarity calculations or model input.

        Returns:
            List[float]: The feature vector.
        """
        # This is a simplified version - we would want to normalize and weight these properly
        vector = []

        # Add genre features
        for genre in sorted(self.features.genres.keys()):
            vector.append(self.features.genres.get(genre, 0.0))

        # Add theme features
        for theme in sorted(self.features.themes.keys()):
            vector.append(self.features.themes.get(theme, 0.0))

        # Add sentiment features
        for sentiment in sorted(self.features.sentiment.keys()):
            vector.append(self.features.sentiment.get(sentiment, 0.0))

        # Add emotion features
        for emotion in sorted(self.features.emotion_profile.keys()):
            vector.append(self.features.emotion_profile.get(emotion, 0.0))

        # Add demographic features
        for demo in sorted(self.features.target_demographic.keys()):
            vector.append(self.features.target_demographic.get(demo, 0.0))

        return vector
