"""
YouTube API client implementation.

This module provides a client for the YouTube Data API v3, primarily used to
search for anime trailers and retrieve video information. It requires a valid
YouTube API key with quota available.

Key Components:
- YouTubeClient: Main client class for interacting with YouTube API
- Video: Model representing a YouTube video with its metadata
- VideoSnippet: Contains video metadata like title, description, etc.
- VideoThumbnail: Represents a video thumbnail with URL and dimensions

Usage Examples:
```python
# Basic initialization
from src.api.providers.youtube.client import YouTubeClient
import asyncio

# Initialize with API key
client = YouTubeClient(api_key="your_youtube_api_key")

# Search for anime trailers
async def search_example():
    # Search for "Demon Slayer trailer"
    response = await client.search_videos("Demon Slayer trailer")

    # Get first search result
    if response.data and "items" in response.data:
        video = response.data["items"][0]
        video_id = video["id"]["videoId"]
        title = video["snippet"]["title"]
        print(f"Found: {title} (https://youtube.com/watch?v={video_id})")

# Get specific anime trailer
async def get_trailer():
    response = await client.search_anime_trailer("One Punch Man")

    if response.data and "items" in response.data:
        trailer_info = response.data["items"][0]
        video_id = trailer_info["id"]["videoId"]
        return f"https://youtube.com/watch?v={video_id}"
    return None

# Run async functions
asyncio.run(search_example())
```

API Key Requirements:
- A Google Cloud project with YouTube Data API v3 enabled
- An API key with YouTube Data API access
- Sufficient quota (each search request uses ~100 units)

For more information on the YouTube API, see:
https://developers.google.com/youtube/v3/docs
"""
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
