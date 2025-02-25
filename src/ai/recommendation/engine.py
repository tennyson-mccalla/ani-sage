"""
Recommendation engine for anime suggestions.

This module provides the core functionality for generating anime recommendations
based on user preferences, sentiment analysis, and content features.
"""

import math
import os
from typing import Dict, List, Optional, Set, Tuple, Union
import asyncio
import numpy as np
from pydantic import BaseModel, Field

from src.ai.models.anime import Anime
from src.ai.preferences.user_preferences import UserPreferences, Mood
from src.ai.sentiment.analyzer import get_sentiment_analyzer, SentimentResult
from src.ai.models.openai_client import get_openai_client
from src.utils.logging import get_logger
from src.utils.errors import AnalysisError

# Import YouTube client for trailer lookups
try:
    from src.api.providers.youtube.client import YouTubeClient
    YOUTUBE_CLIENT_AVAILABLE = True
except ImportError:
    YOUTUBE_CLIENT_AVAILABLE = False

logger = get_logger(__name__)


class RecommendationResult(BaseModel):
    """Result of a recommendation query."""
    anime: Anime
    score: float = Field(..., description="Recommendation score from 0.0 to 1.0")
    explanation: Optional[str] = None
    trailer_url: Optional[str] = Field(None, description="URL to the anime trailer on YouTube")
    trailer_thumbnail: Optional[str] = Field(None, description="URL to the trailer thumbnail image")
    trailer_title: Optional[str] = Field(None, description="Title of the trailer video")
    trailer_channel: Optional[str] = Field(None, description="YouTube channel that published the trailer")


class RecommendationOptions(BaseModel):
    """Options for generating recommendations."""
    limit: int = Field(10, description="Maximum number of recommendations to return")
    include_watched: bool = Field(False, description="Whether to include already watched anime")
    mood_weight: float = Field(0.5, description="Weight for mood-based recommendations")
    genre_weight: float = Field(0.5, description="Weight for genre-based recommendations")
    studio_weight: float = Field(0.2, description="Weight for studio-based recommendations")
    sentiment_weight: float = Field(0.5, description="Weight for sentiment-based recommendations")
    generate_explanations: bool = Field(True, description="Whether to generate explanations")
    include_trailers: bool = Field(False, description="Whether to fetch trailer information from YouTube")


class RecommendationEngine:
    """Engine for generating anime recommendations."""

    def __init__(self):
        """Initialize the recommendation engine."""
        self._anime_catalog: Dict[str, Anime] = {}
        self.sentiment_analyzer = get_sentiment_analyzer()
        self.openai_client = get_openai_client()

        # Initialize YouTube client if available
        self.youtube_client = None
        self._trailer_cache = {}  # Cache for trailer lookups
        self._event_loop = None  # Shared event loop for async operations
        self._closing = False  # Flag to track if we're shutting down

        if YOUTUBE_CLIENT_AVAILABLE:
            api_key = os.environ.get("YOUTUBE_API_KEY")
            if api_key:
                self.youtube_client = YouTubeClient(api_key=api_key)
                logger.debug("YouTube client initialized for trailer lookups")
            else:
                logger.warning("YOUTUBE_API_KEY environment variable not set, trailer lookups disabled")

        logger.debug("Recommendation engine initialized")

    def __del__(self):
        """Clean up resources when the engine is destroyed."""
        self._cleanup_event_loop()

    def _cleanup_event_loop(self):
        """Clean up the async event loop if it exists."""
        # Mark as closing to prevent new operations
        self._closing = True

        # First, close the YouTube client session if it exists
        if self.youtube_client and hasattr(self.youtube_client, 'close'):
            try:
                # Create a temp event loop if needed to close the YouTube client
                if not self._event_loop or self._event_loop.is_closed():
                    temp_loop = asyncio.new_event_loop()
                    temp_loop.run_until_complete(self.youtube_client.close())
                    temp_loop.close()
                else:
                    # Use existing event loop
                    self._event_loop.run_until_complete(self.youtube_client.close())
                logger.debug("YouTube client session closed")
            except Exception as e:
                logger.warning(f"Error closing YouTube client session: {e}")

        # Then close the event loop if it exists and is not closed
        if self._event_loop and not self._event_loop.is_closed():
            try:
                pending = asyncio.all_tasks(self._event_loop)
                if pending:
                    # Cancel any pending tasks
                    for task in pending:
                        task.cancel()
                    # Run the event loop until tasks are cancelled
                    self._event_loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

                # Finally close the loop
                self._event_loop.close()
                logger.debug("Event loop closed and cleaned up")
            except Exception as e:
                logger.warning(f"Error during event loop cleanup: {e}")
            finally:
                self._event_loop = None

        # Reset closing flag
        self._closing = False

    def add_anime(self, anime: Anime) -> None:
        """Add an anime to the recommendation catalog.

        Args:
            anime: The anime to add
        """
        self._anime_catalog[anime.id] = anime
        logger.debug(f"Added anime {anime.id} to recommendation catalog")

    def add_anime_batch(self, animes: List[Anime]) -> None:
        """Add multiple anime to the recommendation catalog.

        Args:
            animes: List of anime to add
        """
        for anime in animes:
            self._anime_catalog[anime.id] = anime
        logger.debug(f"Added {len(animes)} anime to recommendation catalog")

    def _compute_similarity(self, anime1: Anime, anime2: Anime) -> float:
        """Compute similarity between two anime based on their features.

        Args:
            anime1: First anime
            anime2: Second anime

        Returns:
            float: Similarity score from 0.0 to 1.0
        """
        # Check cache
        cache_key = f"{anime1.id}:{anime2.id}"
        if cache_key in anime1._similarity_cache:
            return anime1._similarity_cache[cache_key]

        # Get feature vectors
        v1 = anime1.get_feature_vector()
        v2 = anime2.get_feature_vector()

        # Pad shorter vector if needed
        if len(v1) < len(v2):
            v1 += [0.0] * (len(v2) - len(v1))
        elif len(v2) < len(v1):
            v2 += [0.0] * (len(v1) - len(v2))

        # Compute cosine similarity
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(b * b for b in v2))

        # Avoid division by zero
        if magnitude1 * magnitude2 == 0:
            similarity = 0.0
        else:
            similarity = dot_product / (magnitude1 * magnitude2)

        # Cache result
        anime1._similarity_cache[cache_key] = similarity
        anime2._similarity_cache[f"{anime2.id}:{anime1.id}"] = similarity

        return similarity

    def _calculate_mood_relevance(self, anime: Anime, mood: Mood) -> float:
        """Calculate how relevant an anime is for a particular mood.

        Args:
            anime: The anime to evaluate
            mood: The target mood

        Returns:
            float: Relevance score from 0.0 to 1.0
        """
        if mood == Mood.ANY:
            return 1.0

        # Map moods to emotions and themes
        mood_mappings = {
            Mood.HAPPY: {
                "emotions": ["joy", "excitement", "comfort"],
                "themes": ["comedy", "slice_of_life"]
            },
            Mood.SAD: {
                "emotions": ["sadness", "melancholy"],
                "themes": ["drama"]
            },
            Mood.RELAXED: {
                "emotions": ["comfort", "trust"],
                "themes": ["slice_of_life", "iyashikei"]
            },
            Mood.EXCITED: {
                "emotions": ["excitement", "anticipation"],
                "themes": ["action", "adventure", "sports"]
            },
            Mood.THOUGHTFUL: {
                "emotions": ["melancholy", "trust"],
                "themes": ["psychological", "philosophical"]
            },
            Mood.ADVENTUROUS: {
                "emotions": ["excitement", "anticipation", "surprise"],
                "themes": ["adventure", "fantasy", "science_fiction"]
            },
            Mood.ROMANTIC: {
                "emotions": ["joy", "anticipation", "trust"],
                "themes": ["romance"]
            },
            Mood.MYSTERIOUS: {
                "emotions": ["surprise", "anticipation", "tension"],
                "themes": ["mystery", "supernatural", "horror"]
            }
        }

        # Get relevant emotions and themes for this mood
        target_emotions = mood_mappings.get(mood, {}).get("emotions", [])
        target_themes = mood_mappings.get(mood, {}).get("themes", [])

        # Calculate emotion match
        emotion_scores = [
            anime.features.emotion_profile.get(e, 0.0) for e in target_emotions
        ]
        theme_scores = [
            anime.features.themes.get(t, 0.0) for t in target_themes
        ]

        # Average the scores
        emotion_score = sum(emotion_scores) / len(emotion_scores) if emotion_scores else 0.0
        theme_score = sum(theme_scores) / len(theme_scores) if theme_scores else 0.0

        # Combine with weights
        return 0.6 * emotion_score + 0.4 * theme_score

    def _generate_explanation(self, anime: Anime, user_prefs: UserPreferences) -> str:
        """Generate an explanation for why this anime was recommended.

        Args:
            anime: The recommended anime
            user_prefs: The user's preferences

        Returns:
            str: Explanation text
        """
        # Prompt for the explanation
        prompt = f"""
        Generate a short, personalized explanation (1-2 sentences) for why the anime "{anime.title}"
        is being recommended to a user with the following preferences:

        Current mood: {user_prefs.current_mood.value}
        Favorite genres: {', '.join(k for k, v in user_prefs.genre_preferences.items() if v > 0.5)}
        Disliked genres: {', '.join(k for k, v in user_prefs.genre_preferences.items() if v < -0.5)}
        Favorite studios: {', '.join(user_prefs.favorite_studios)}

        The anime has these features:
        Genres: {', '.join(anime.genres)}
        Themes: {', '.join(anime.themes)}
        Studios: {', '.join(anime.studios)}

        Make the explanation personal, specific, and highlight why this anime matches their preferences.
        """

        try:
            return self.openai_client.analyze_text(prompt)
        except Exception as e:
            logger.warning(f"Failed to generate explanation: {e}")
            # Fallback explanation
            genres = [g for g in anime.genres if g in user_prefs.genre_preferences and user_prefs.genre_preferences[g] > 0]
            studios = [s for s in anime.studios if s in user_prefs.favorite_studios]

            if genres and studios:
                return f"Recommended because it's in your preferred genre ({genres[0]}) and from a studio you like ({studios[0]})."
            elif genres:
                return f"Recommended because it's in your preferred genre ({genres[0]})."
            elif studios:
                return f"Recommended because it's from a studio you like ({studios[0]})."
            else:
                return "Recommended based on your viewing history and preferences."

    async def _fetch_anime_trailer(self, anime_title: str) -> Dict[str, Optional[str]]:
        """Fetch trailer information for an anime from YouTube.

        Args:
            anime_title: Title of the anime to find a trailer for

        Returns:
            Dict containing trailer information (URL, thumbnail, title, channel)
        """
        # Initialize empty result
        trailer_info = {
            "url": None,
            "thumbnail": None,
            "title": None,
            "channel": None
        }

        # Check cache first
        if anime_title in self._trailer_cache:
            return self._trailer_cache[anime_title]

        # Make sure YouTube client is available
        if not self.youtube_client:
            return trailer_info

        try:
            # Search for trailer
            response = await self.youtube_client.search_anime_trailer(
                anime_title=anime_title,
                max_results=1
            )

            # Extract trailer info if found
            if response.data and len(response.data) > 0:
                video = response.data[0]
                trailer_info = {
                    "url": f"https://www.youtube.com/watch?v={video.id}",
                    "thumbnail": video.snippet.thumbnails.get('high', video.snippet.thumbnails.get('default')).url,
                    "title": video.snippet.title,
                    "channel": video.snippet.channelTitle
                }

                # Cache the result
                self._trailer_cache[anime_title] = trailer_info
                logger.debug(f"Found trailer for {anime_title}")
            else:
                logger.debug(f"No trailer found for {anime_title}")

        except Exception as e:
            logger.warning(f"Error finding trailer for {anime_title}: {e}")

        return trailer_info

    def _fetch_trailer_sync(self, anime_title: str) -> Dict[str, Optional[str]]:
        """Synchronous wrapper for _fetch_anime_trailer.

        Args:
            anime_title: Title of the anime to find a trailer for

        Returns:
            Dict containing trailer information
        """
        # If no YouTube client or we're shutting down, return empty result
        if not self.youtube_client or self._closing:
            return {
                "url": None,
                "thumbnail": None,
                "title": None,
                "channel": None
            }

        # Check cache first
        if anime_title in self._trailer_cache:
            return self._trailer_cache[anime_title]

        # Create a singleton event loop for all trailer lookups if needed
        need_new_loop = False
        if self._event_loop is None or self._event_loop.is_closed():
            need_new_loop = True
            self._event_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._event_loop)

        # Run the async method in the shared event loop
        try:
            result = self._event_loop.run_until_complete(self._fetch_anime_trailer(anime_title))
            # Don't close the loop - keep it for future trailer lookups
            return result
        except Exception as e:
            logger.warning(f"Error in trailer lookup: {e}")
            return {
                "url": None,
                "thumbnail": None,
                "title": None,
                "channel": None
            }

    def get_recommendations(
        self,
        user_prefs: UserPreferences,
        options: Optional[RecommendationOptions] = None
    ) -> List[RecommendationResult]:
        """Generate anime recommendations for a user.

        Args:
            user_prefs: The user's preferences
            options: Recommendation options

        Returns:
            List[RecommendationResult]: Recommended anime with scores
        """
        options = options or RecommendationOptions()
        results = []

        # Skip already watched anime if specified
        watched_ids = set(user_prefs.anime_ratings.keys()) if not options.include_watched else set()

        # Calculate scores for each anime
        for anime_id, anime in self._anime_catalog.items():
            # Skip already watched
            if anime_id in watched_ids:
                continue

            # Calculate genre similarity
            genre_score = 0.0
            for genre in anime.genres:
                genre_score += user_prefs.genre_preferences.get(genre, 0.0)
            genre_score = max(0.0, genre_score / max(1, len(anime.genres)))

            # Calculate studio match
            studio_score = 0.0
            for studio in anime.studios:
                if studio in user_prefs.favorite_studios:
                    studio_score = 1.0
                    break

            # Calculate mood relevance
            mood_score = self._calculate_mood_relevance(anime, user_prefs.current_mood)

            # Calculate overall sentiment match (simplified)
            sentiment_score = 0.0
            if anime.features.sentiment:
                user_positivity = 0.0
                for anime_id, rating in user_prefs.anime_ratings.items():
                    if rating.score.value >= 4:  # LOVE or FAVORITE
                        rated_anime = self._anime_catalog.get(anime_id)
                        if rated_anime and rated_anime.features.sentiment:
                            user_positivity += rated_anime.features.sentiment.get("positivity", 0.0)

                # Average positivity of highly-rated anime
                if user_prefs.anime_ratings:
                    user_positivity /= len(user_prefs.anime_ratings)

                    # Compare to this anime's positivity
                    anime_positivity = anime.features.sentiment.get("positivity", 0.0)
                    sentiment_score = 1.0 - abs(user_positivity - anime_positivity)

            # Combine scores with weights
            total_score = (
                options.genre_weight * genre_score +
                options.studio_weight * studio_score +
                options.mood_weight * mood_score +
                options.sentiment_weight * sentiment_score
            ) / (options.genre_weight + options.studio_weight + options.mood_weight + options.sentiment_weight)

            # Generate explanation if needed
            explanation = None
            if options.generate_explanations:
                explanation = self._generate_explanation(anime, user_prefs)

            # Fetch trailer information if requested
            trailer_url = None
            trailer_thumbnail = None
            trailer_title = None
            trailer_channel = None

            if options.include_trailers and YOUTUBE_CLIENT_AVAILABLE:
                trailer_info = self._fetch_trailer_sync(anime.title)
                trailer_url = trailer_info["url"]
                trailer_thumbnail = trailer_info["thumbnail"]
                trailer_title = trailer_info["title"]
                trailer_channel = trailer_info["channel"]

            # Add to results
            results.append(RecommendationResult(
                anime=anime,
                score=total_score,
                explanation=explanation,
                trailer_url=trailer_url,
                trailer_thumbnail=trailer_thumbnail,
                trailer_title=trailer_title,
                trailer_channel=trailer_channel
            ))

        # Sort by score and limit
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:options.limit]

    def analyze_anime_sentiment(self, anime: Anime) -> Anime:
        """Analyze the sentiment of an anime's synopsis and update its features.

        Args:
            anime: The anime to analyze

        Returns:
            Anime: The updated anime with sentiment features

        Raises:
            AnalysisError: If the analysis fails
        """
        if not anime.synopsis:
            logger.warning(f"Cannot analyze sentiment for anime {anime.id}: no synopsis")
            return anime

        try:
            # Get sentiment analysis result
            result = self.sentiment_analyzer.analyze(anime.synopsis)

            # Update anime features
            anime.features.sentiment = {
                "positivity": result.positivity,
                "intensity": result.intensity
            }
            anime.features.emotion_profile = result.emotions
            anime.features.themes.update({
                theme: score for theme, score in result.themes.items()
                if score > 0.5  # Only add high-confidence themes
            })
            anime.features.target_demographic = result.target_audience

            logger.debug(f"Updated sentiment features for anime {anime.id}")
            return anime

        except Exception as e:
            logger.error(f"Failed to analyze sentiment for anime {anime.id}: {e}")
            raise AnalysisError(f"Failed to analyze sentiment for anime {anime.id}", details={"anime_id": anime.id})


# Singleton instance
_recommendation_engine = None


def get_recommendation_engine() -> RecommendationEngine:
    """Get the singleton recommendation engine instance.

    Returns:
        RecommendationEngine: The recommendation engine
    """
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine
