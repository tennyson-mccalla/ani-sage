"""Tests for the anime promotions service."""

import pytest
from unittest.mock import Mock, patch
from src.api.services.promotions import PromotionService, AnimePromotion
from src.api.providers.mal.client import MALClient, AnimeDetails
from src.api.providers.youtube.client import YouTubeClient, Video, VideoSnippet
from src.api.core.errors import APIError

@pytest.fixture
def mock_mal_client():
    """Create a mock MAL client."""
    return Mock(spec=MALClient)

@pytest.fixture
def mock_youtube_client():
    """Create a mock YouTube client."""
    return Mock(spec=YouTubeClient)

@pytest.fixture
def promotion_service(mock_mal_client, mock_youtube_client):
    """Create a promotion service with mock clients."""
    return PromotionService(
        mal_client=mock_mal_client,
        youtube_client=mock_youtube_client
    )

@pytest.mark.asyncio
async def test_get_top_anime_with_trailers(promotion_service, mock_mal_client, mock_youtube_client):
    """Test getting top anime with trailers."""
    # Mock MAL response
    mock_mal_client.get_top_anime.return_value.data = [
        AnimeDetails(
            id=1,
            title="Test Anime",
            rank=1
        )
    ]

    # Mock YouTube response
    mock_youtube_client.search_anime_trailer.return_value.data = [
        Video(
            id="video123",
            snippet=VideoSnippet(
                title="Test Anime - Official Trailer",
                description="Official trailer",
                publishedAt="2024-02-24T00:00:00Z",
                channelId="channel123",
                channelTitle="Official Channel",
                thumbnails={
                    "default": {
                        "url": "https://example.com/thumb.jpg",
                        "width": 120,
                        "height": 90
                    }
                }
            )
        )
    ]

    result = await promotion_service.get_top_anime_with_trailers(limit=1)

    assert len(result) == 1
    assert isinstance(result[0], AnimePromotion)
    assert result[0].anime.id == 1
    assert result[0].trailer.id == "video123"

@pytest.mark.asyncio
async def test_get_top_anime_with_failed_trailer_search(
    promotion_service,
    mock_mal_client,
    mock_youtube_client
):
    """Test handling failed trailer searches."""
    # Mock MAL response
    mock_mal_client.get_top_anime.return_value.data = [
        AnimeDetails(
            id=1,
            title="Test Anime",
            rank=1
        )
    ]

    # Mock YouTube client to raise an error
    mock_youtube_client.search_anime_trailer.side_effect = APIError("API Error")

    result = await promotion_service.get_top_anime_with_trailers(limit=1)

    assert len(result) == 1
    assert isinstance(result[0], AnimePromotion)
    assert result[0].anime.id == 1
    assert result[0].trailer is None

@pytest.mark.asyncio
async def test_get_seasonal_promotions(promotion_service, mock_mal_client, mock_youtube_client):
    """Test getting seasonal anime with trailers."""
    # Mock MAL response
    mock_mal_client.get_seasonal_anime.return_value.data = [
        AnimeDetails(
            id=1,
            title="Test Seasonal Anime",
            rank=1
        )
    ]

    # Mock YouTube response
    mock_youtube_client.search_anime_trailer.return_value.data = [
        Video(
            id="video123",
            snippet=VideoSnippet(
                title="Test Seasonal Anime - Official Trailer",
                description="Official trailer",
                publishedAt="2024-02-24T00:00:00Z",
                channelId="channel123",
                channelTitle="Official Channel",
                thumbnails={
                    "default": {
                        "url": "https://example.com/thumb.jpg",
                        "width": 120,
                        "height": 90
                    }
                }
            )
        )
    ]

    result = await promotion_service.get_seasonal_promotions(
        year=2024,
        season="winter",
        limit=1
    )

    assert len(result) == 1
    assert isinstance(result[0], AnimePromotion)
    assert result[0].anime.id == 1
    assert result[0].trailer.id == "video123"
