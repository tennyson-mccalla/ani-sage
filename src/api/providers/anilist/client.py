from typing import Dict, List, Optional
from ...core.client import BaseAPIClient, APIResponse
from ...core.errors import AuthenticationError, ValidationError
from pydantic import BaseModel

class AnimeDetails(BaseModel):
    """AniList anime details model."""
    id: int
    title: Dict[str, str]  # contains romaji, english, native
    coverImage: Optional[Dict[str, str]] = None
    description: Optional[str] = None
    averageScore: Optional[float] = None
    popularity: Optional[int] = None
    genres: Optional[List[str]] = None

class AnimeStatus(BaseModel):
    """User's anime status model."""
    status: str  # CURRENT, COMPLETED, PAUSED, DROPPED, PLANNING
    score: Optional[float] = None
    progress: Optional[int] = None
    repeat: Optional[int] = None
    updatedAt: Optional[int] = None

class AniListClient(BaseAPIClient):
    """AniList API client implementation."""

    def __init__(
        self,
        access_token: Optional[str] = None,
        **kwargs
    ):
        """Initialize AniList client."""
        super().__init__(
            base_url="https://graphql.anilist.co",
            **kwargs
        )
        self._access_token = access_token

    async def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self._access_token:
            headers["Authorization"] = f"Bearer {self._access_token}"
        return headers

    async def _graphql_request(
        self,
        query: str,
        variables: Optional[Dict] = None
    ) -> APIResponse:
        """Make a GraphQL request."""
        return await self.request(
            method="POST",
            endpoint="",
            data={
                "query": query,
                "variables": variables or {}
            },
            headers=await self._get_headers()
        )

    async def search_anime(
        self,
        query: str,
        limit: int = 10,
    ) -> APIResponse:
        """Search for anime by title."""
        if not query:
            raise ValidationError("Search query cannot be empty")

        gql_query = """
        query ($search: String, $limit: Int) {
            Page(page: 1, perPage: $limit) {
                media(search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        medium
                        large
                    }
                    description
                    averageScore
                    popularity
                    genres
                }
            }
        }
        """

        response = await self._graphql_request(
            query=gql_query,
            variables={"search": query, "limit": min(limit, 50)}
        )

        # Convert response data to AnimeDetails objects
        if response.data and "data" in response.data:
            media_list = response.data["data"]["Page"]["media"]
            response.data = [AnimeDetails(**media) for media in media_list]

        return response

    async def get_anime_details(self, anime_id: int) -> APIResponse:
        """Get detailed information about a specific anime."""
        if not anime_id:
            raise ValidationError("Anime ID is required")

        gql_query = """
        query ($id: Int!) {
            Media(id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    medium
                    large
                }
                description
                averageScore
                popularity
                genres
                format
                episodes
                duration
                status
                startDate {
                    year
                    month
                    day
                }
                studios {
                    nodes {
                        name
                    }
                }
            }
        }
        """

        response = await self._graphql_request(
            query=gql_query,
            variables={"id": anime_id}
        )

        if response.data and "data" in response.data:
            response.data = AnimeDetails(**response.data["data"]["Media"])

        return response

    async def get_user_anime_list(
        self,
        username: str,
        status: Optional[str] = None,
        limit: int = 100
    ) -> APIResponse:
        """Get a user's anime list."""
        gql_query = """
        query ($username: String, $status: MediaListStatus, $limit: Int) {
            MediaListCollection(userName: $username, type: ANIME, status: $status) {
                lists {
                    entries {
                        media {
                            id
                            title {
                                romaji
                                english
                            }
                            coverImage {
                                medium
                            }
                            genres
                            averageScore
                            popularity
                        }
                        status
                        score
                        progress
                        repeat
                        updatedAt
                    }
                }
            }
        }
        """

        response = await self._graphql_request(
            query=gql_query,
            variables={
                "username": username,
                "status": status,
                "limit": min(limit, 500)
            }
        )

        return response

    async def update_anime_status(
        self,
        media_id: int,
        status: str,
        score: Optional[float] = None,
        progress: Optional[int] = None
    ) -> APIResponse:
        """Update anime status in user's list."""
        if not self._access_token:
            raise AuthenticationError("Access token required")

        gql_query = """
        mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int) {
            SaveMediaListEntry(mediaId: $mediaId, status: $status, score: $score, progress: $progress) {
                id
                status
                score
                progress
            }
        }
        """

        return await self._graphql_request(
            query=gql_query,
            variables={
                "mediaId": media_id,
                "status": status,
                "score": score,
                "progress": progress
            }
        )

    async def set_auth_token(self, access_token: str) -> None:
        """Set or update the access token."""
        if not access_token:
            raise AuthenticationError("Access token cannot be empty")
        self._access_token = access_token

    async def get_user_info(self, username: str) -> APIResponse:
        """Get user information."""
        query = """
        query ($name: String) {
            User(name: $name) {
                id
                name
                avatar {
                    large
                    medium
                }
                bannerImage
                about
                createdAt
                statistics {
                    anime {
                        count
                        meanScore
                        minutesWatched
                        episodesWatched
                    }
                }
            }
        }
        """

        return await self._graphql_request(
            query=query,
            variables={"name": username}
        )
