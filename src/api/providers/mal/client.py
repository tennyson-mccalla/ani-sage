from typing import Dict, List, Optional, Any, Union
from ...core.client import BaseAPIClient, APIResponse
from ...core.errors import AuthenticationError, ValidationError
from pydantic import BaseModel, Field

class AlternativeTitles(BaseModel):
    """Alternative titles for an anime."""
    synonyms: Optional[List[str]] = None
    en: Optional[str] = None
    ja: Optional[str] = None

class MainPicture(BaseModel):
    """Main picture URLs for an anime."""
    medium: Optional[str] = None
    large: Optional[str] = None

class Genre(BaseModel):
    """Genre information."""
    id: int
    name: str

class UserPicture(BaseModel):
    """User picture URLs."""
    medium: Optional[str] = None
    large: Optional[str] = None

class UserStatistics(BaseModel):
    """User statistics."""
    anime_statistics: Optional[Dict[str, Any]] = Field(None, alias="anime")
    manga_statistics: Optional[Dict[str, Any]] = Field(None, alias="manga")

class UserInfo(BaseModel):
    """MAL user information model."""
    id: int
    name: str
    picture: Optional[UserPicture] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    location: Optional[str] = None
    joined_at: Optional[str] = None
    statistics: Optional[UserStatistics] = None

class AnimeDetails(BaseModel):
    """MAL anime details model."""
    id: int
    title: str
    main_picture: Optional[MainPicture] = None
    alternative_titles: Optional[AlternativeTitles] = None
    synopsis: Optional[str] = None
    mean: Optional[float] = None
    rank: Optional[int] = None
    genres: Optional[List[Genre]] = None
    media_type: Optional[str] = None
    status: Optional[str] = None
    num_episodes: Optional[int] = None
    start_season: Optional[Dict[str, Any]] = None
    broadcast: Optional[Dict[str, Any]] = None
    source: Optional[str] = None
    average_episode_duration: Optional[int] = None
    rating: Optional[str] = None
    studios: Optional[List[Dict[str, Any]]] = None
    statistics: Optional[Dict[str, Any]] = None

class AnimeStatus(BaseModel):
    """User's anime status model."""
    status: str  # watching, completed, on_hold, dropped, plan_to_watch
    score: Optional[int] = None
    num_episodes_watched: Optional[int] = None
    is_rewatching: Optional[bool] = None
    updated_at: Optional[str] = None

class MALClient(BaseAPIClient):
    """MyAnimeList API client implementation."""

    def __init__(
        self,
        client_id: str,
        client_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        **kwargs
    ):
        """Initialize MAL client with authentication."""
        super().__init__(
            base_url="https://api.myanimelist.net/v2",
            **kwargs
        )
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token = access_token

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication."""
        headers = {"X-MAL-CLIENT-ID": self.client_id}
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"
        return headers

    async def search_anime(
        self,
        query: str,
        limit: int = 10,
        fields: Optional[List[str]] = None
    ) -> APIResponse:
        """Search for anime by title."""
        if not query:
            raise ValidationError("Search query cannot be empty")

        params = {
            "q": query,
            "limit": min(limit, 100),  # MAL maximum
            "fields": ",".join(fields or [
                "id", "title", "main_picture", "alternative_titles",
                "synopsis", "mean", "rank", "genres"
            ])
        }

        response = await self.request(
            method="GET",
            endpoint="anime",
            params=params,
            headers=await self._get_headers()
        )

        # Convert response data to AnimeDetails objects
        if response.data and "data" in response.data:
            response.data = [
                AnimeDetails(**node["node"])
                for node in response.data["data"]
            ]

        return response

    async def get_anime_details(self, anime_id: int) -> APIResponse:
        """Get detailed information about a specific anime."""
        if not anime_id:
            raise ValidationError("Anime ID is required")

        params = {
            "fields": ",".join([
                "id", "title", "main_picture", "alternative_titles",
                "synopsis", "mean", "rank", "genres", "media_type",
                "status", "num_episodes", "start_season", "broadcast",
                "source", "average_episode_duration", "rating",
                "studios", "statistics"
            ])
        }

        response = await self.request(
            method="GET",
            endpoint=f"anime/{anime_id}",
            params=params,
            headers=await self._get_headers()
        )

        if response.data:
            response.data = AnimeDetails(**response.data)

        return response

    async def set_auth_token(self, access_token: str) -> None:
        """Set or update the OAuth access token."""
        if not access_token:
            raise AuthenticationError("Access token cannot be empty")
        self._access_token = access_token

    async def get_user_info(self, username: str = "@me") -> APIResponse:
        """Get user information."""
        if not self._access_token and username == "@me":
            raise AuthenticationError("Access token required for personal info")

        params = {
            "fields": "id,name,picture,gender,birthday,location,joined_at,statistics"
        }

        response = await self.request(
            method="GET",
            endpoint=f"users/{username}",
            params=params,
            headers=await self._get_headers()
        )

        if response.data:
            response.data = UserInfo(**response.data)

        return response

    async def get_user_anime_list(
        self,
        username: str = "@me",
        status: Optional[str] = None,
        sort: str = "list_score",
        limit: int = 100,
        offset: int = 0
    ) -> APIResponse:
        """Get a user's anime list."""
        if not self._access_token and username == "@me":
            raise AuthenticationError("Access token required for personal list")

        params = {
            "fields": "list_status,num_episodes,genres,mean,rank,popularity",
            "limit": min(limit, 1000),
            "offset": offset,
            "sort": sort
        }
        if status:
            params["status"] = status

        response = await self.request(
            method="GET",
            endpoint=f"users/{username}/animelist",
            params=params,
            headers=await self._get_headers()
        )

        return response

    async def update_anime_status(
        self,
        anime_id: int,
        status: str,
        score: Optional[int] = None,
        num_watched_episodes: Optional[int] = None
    ) -> APIResponse:
        """Update anime status in user's list."""
        if not self._access_token:
            raise AuthenticationError("Access token required")

        data = {
            "status": status,
            "score": score,
            "num_watched_episodes": num_watched_episodes
        }
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        response = await self.request(
            method="PATCH",
            endpoint=f"anime/{anime_id}/my_list_status",
            data=data,
            headers=await self._get_headers()
        )

        if response.data:
            response.data = AnimeStatus(**response.data)

        return response

    async def get_seasonal_anime(
        self,
        year: int,
        season: str,
        sort: str = "anime_score",
        limit: int = 100,
        offset: int = 0
    ) -> APIResponse:
        """Get seasonal anime list."""
        params = {
            "sort": sort,
            "limit": min(limit, 500),
            "offset": offset,
            "fields": "id,title,main_picture,synopsis,mean,rank,popularity,genres"
        }

        response = await self.request(
            method="GET",
            endpoint=f"anime/season/{year}/{season}",
            params=params,
            headers=await self._get_headers()
        )

        if response.data and "data" in response.data:
            response.data = [
                AnimeDetails(**node["node"])
                for node in response.data["data"]
            ]

        return response

    async def get_suggested_anime(
        self,
        limit: int = 100,
        offset: int = 0,
        fields: Optional[List[str]] = None
    ) -> APIResponse:
        """Get anime suggestions based on user's list."""
        if not self._access_token:
            raise AuthenticationError("Access token required")

        params = {
            "limit": min(limit, 100),
            "offset": offset,
            "fields": ",".join(fields or [
                "id", "title", "main_picture", "synopsis",
                "mean", "rank", "popularity", "genres"
            ])
        }

        return await self.request(
            method="GET",
            endpoint="anime/suggestions",
            params=params,
            headers=await self._get_headers()
        )
