"""YouTube API client implementation."""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from ...core.client import BaseAPIClient, APIResponse
from ...core.errors import ValidationError, QuotaExceededError

class VideoThumbnail(BaseModel):
    """YouTube video thumbnail."""
    url: str
    width: int
    height: int

class VideoSnippet(BaseModel):
    """YouTube video snippet information."""
    title: str
    description: str
    publishedAt: str
    channelId: str
    channelTitle: str
    thumbnails: Dict[str, VideoThumbnail]

class Video(BaseModel):
    """YouTube video model."""
    id: str
    snippet: VideoSnippet

class YouTubeClient(BaseAPIClient):
    """YouTube Data API client implementation."""

    def __init__(self, api_key: str, **kwargs):
        """Initialize YouTube client with API key."""
        super().__init__(
            base_url="https://www.googleapis.com/youtube/v3",
            **kwargs
        )
        self.api_key = api_key

    async def _handle_response(self, response: APIResponse) -> APIResponse:
        """Handle YouTube API response and check for quota errors."""
        if response.status_code == 403:
            raise QuotaExceededError("YouTube API quota exceeded")
        return response

    async def search_videos(
        self,
        query: str,
        max_results: int = 10,
        type: str = "video",
        part: str = "snippet"
    ) -> APIResponse:
        """Search for videos on YouTube."""
        if not query:
            raise ValidationError("Search query cannot be empty")

        params = {
            "q": query,
            "maxResults": min(max_results, 50),  # YouTube maximum
            "type": type,
            "part": part,
            "key": self.api_key
        }

        response = await self.request(
            method="GET",
            endpoint="search",
            params=params
        )
        response = await self._handle_response(response)

        # Convert response data to Video objects
        if response.data and "items" in response.data:
            response.data = [
                Video(
                    id=item["id"]["videoId"],
                    snippet=VideoSnippet(**item["snippet"])
                )
                for item in response.data["items"]
            ]

        return response

    async def search_anime_trailer(
        self,
        anime_title: str,
        max_results: int = 5
    ) -> APIResponse:
        """Search for anime trailers on YouTube."""
        if not anime_title:
            raise ValidationError("Anime title cannot be empty")

        # Craft a search query optimized for finding official trailers
        query = f"{anime_title} official trailer anime"

        return await self.search_videos(
            query=query,
            max_results=max_results
        )

    async def get_video_details(
        self,
        video_id: str,
        part: str = "snippet,statistics"
    ) -> APIResponse:
        """Get detailed information about a specific video."""
        if not video_id:
            raise ValidationError("Video ID cannot be empty")

        params = {
            "id": video_id,
            "part": part,
            "key": self.api_key
        }

        response = await self.request(
            method="GET",
            endpoint="videos",
            params=params
        )
        return await self._handle_response(response)
