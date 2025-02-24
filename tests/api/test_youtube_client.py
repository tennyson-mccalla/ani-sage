"""Unit tests for YouTube API client."""
import pytest
from unittest.mock import patch
from src.api.providers.youtube.client import YouTubeClient, Video, VideoSnippet
from src.api.core.errors import ValidationError, QuotaExceededError

@pytest.fixture
def youtube_client():
    """Create a test YouTube client."""
    return YouTubeClient(api_key="test_api_key")

@pytest.mark.asyncio
async def test_search_videos_validation(youtube_client):
    """Test video search input validation."""
    with pytest.raises(ValidationError):
        await youtube_client.search_videos("")

@pytest.mark.asyncio
async def test_search_videos_success(youtube_client):
    """Test successful video search."""
    mock_response = {
        "items": [
            {
                "id": {"videoId": "test123"},
                "snippet": {
                    "title": "Test Video",
                    "description": "Test Description",
                    "publishedAt": "2024-02-24T00:00:00Z",
                    "channelId": "channel123",
                    "channelTitle": "Test Channel",
                    "thumbnails": {
                        "default": {
                            "url": "https://example.com/thumb.jpg",
                            "width": 120,
                            "height": 90
                        }
                    }
                }
            }
        ]
    }

    with patch.object(youtube_client, 'request') as mock_request:
        mock_request.return_value.data = mock_response
        mock_request.return_value.status_code = 200

        response = await youtube_client.search_videos("test query")

        assert len(response.data) == 1
        assert isinstance(response.data[0], Video)
        assert response.data[0].id == "test123"
        assert response.data[0].snippet.title == "Test Video"

@pytest.mark.asyncio
async def test_search_videos_quota_exceeded(youtube_client):
    """Test quota exceeded error handling."""
    with patch.object(youtube_client, 'request') as mock_request:
        mock_request.return_value.status_code = 403

        with pytest.raises(QuotaExceededError):
            await youtube_client.search_videos("test query")

@pytest.mark.asyncio
async def test_search_anime_trailer(youtube_client):
    """Test anime trailer search."""
    mock_response = {
        "items": [
            {
                "id": {"videoId": "trailer123"},
                "snippet": {
                    "title": "Anime Title - Official Trailer",
                    "description": "Official trailer for Anime Title",
                    "publishedAt": "2024-02-24T00:00:00Z",
                    "channelId": "channel123",
                    "channelTitle": "Official Channel",
                    "thumbnails": {
                        "default": {
                            "url": "https://example.com/trailer.jpg",
                            "width": 120,
                            "height": 90
                        }
                    }
                }
            }
        ]
    }

    with patch.object(youtube_client, 'request') as mock_request:
        mock_request.return_value.data = mock_response
        mock_request.return_value.status_code = 200

        response = await youtube_client.search_anime_trailer("Anime Title")

        assert len(response.data) == 1
        assert isinstance(response.data[0], Video)
        assert response.data[0].id == "trailer123"
        assert "Official Trailer" in response.data[0].snippet.title

@pytest.mark.asyncio
async def test_get_video_details_validation(youtube_client):
    """Test video details input validation."""
    with pytest.raises(ValidationError):
        await youtube_client.get_video_details("")

@pytest.mark.asyncio
async def test_get_video_details_success(youtube_client):
    """Test successful video details retrieval."""
    mock_response = {
        "items": [
            {
                "id": "video123",
                "snippet": {
                    "title": "Test Video",
                    "description": "Test Description",
                    "publishedAt": "2024-02-24T00:00:00Z",
                    "channelId": "channel123",
                    "channelTitle": "Test Channel",
                    "thumbnails": {
                        "default": {
                            "url": "https://example.com/thumb.jpg",
                            "width": 120,
                            "height": 90
                        }
                    }
                },
                "statistics": {
                    "viewCount": "1000",
                    "likeCount": "100"
                }
            }
        ]
    }

    with patch.object(youtube_client, 'request') as mock_request:
        mock_request.return_value.data = mock_response
        mock_request.return_value.status_code = 200

        response = await youtube_client.get_video_details("video123")

        assert response.data["items"][0]["id"] == "video123"
        assert "statistics" in response.data["items"][0]
