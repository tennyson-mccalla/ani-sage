"""
Recommendation models for the anime recommendation engine.

This module contains the data structures for recommendations.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.ai.models.anime import Anime


class Recommendation(BaseModel):
    """A recommendation of an anime with matching score and rationale."""

    anime: Anime
    score: float
    rationale: str
    match_factors: Dict[str, float] = {}

    # Trailer-related fields with default values
    trailer_url: Optional[str] = None
    trailer_title: Optional[str] = None
    trailer_channel: Optional[str] = None
    trailer_thumbnail: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert the recommendation to a dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation of the recommendation
        """
        return {
            "anime": self.anime.to_dict() if self.anime else None,
            "score": self.score,
            "rationale": self.rationale,
            "match_factors": self.match_factors,
            "trailer_url": self.trailer_url,
            "trailer_title": self.trailer_title,
            "trailer_channel": self.trailer_channel,
            "trailer_thumbnail": self.trailer_thumbnail
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Recommendation":
        """Create a recommendation from a dictionary.

        Args:
            data: Dictionary containing recommendation data

        Returns:
            Recommendation: Created recommendation object
        """
        return cls(
            anime=Anime.from_dict(data["anime"]) if data.get("anime") else None,
            score=data.get("score", 0.0),
            rationale=data.get("rationale", ""),
            match_factors=data.get("match_factors", {}),
            trailer_url=data.get("trailer_url"),
            trailer_title=data.get("trailer_title"),
            trailer_channel=data.get("trailer_channel"),
            trailer_thumbnail=data.get("trailer_thumbnail")
        )


class RecommendationList(BaseModel):
    """A list of recommendations."""

    recommendations: List[Recommendation] = []

    def add_recommendation(self, recommendation: Recommendation) -> None:
        """Add a recommendation to the list.

        Args:
            recommendation: Recommendation to add
        """
        self.recommendations.append(recommendation)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the recommendation list to a dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation of the recommendation list
        """
        return {
            "recommendations": [rec.to_dict() for rec in self.recommendations]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RecommendationList":
        """Create a recommendation list from a dictionary.

        Args:
            data: Dictionary containing recommendation list data

        Returns:
            RecommendationList: Created recommendation list object
        """
        rec_list = cls()
        for rec_data in data.get("recommendations", []):
            rec_list.add_recommendation(Recommendation.from_dict(rec_data))
        return rec_list
