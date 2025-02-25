import pytest
from unittest.mock import Mock, patch
from src.api.providers.mal.client import MALClient, AnimeDetails
from src.api.core.errors import ValidationError, AuthenticationError

@pytest.fixture
def mal_client():
    """Create a test MAL client."""
    return MALClient(
        client_id="test_client_id",
        client_secret="test_client_secret"
    )

@pytest.mark.asyncio
async def test_search_anime_validation():
    """Test anime search input validation."""
    client = MALClient(client_id="test")
    with pytest.raises(ValidationError):
        await client.search_anime("")

@pytest.mark.asyncio
async def test_search_anime_success(mal_client):
    """Test successful anime search."""
    mock_response = {
        "data": [
            {
                "node": {
                    "id": 1,
                    "title": "Test Anime",
                    "main_picture": {
                        "medium": "https://example.com/image.jpg"
                    },
                    "synopsis": "Test synopsis",
                    "mean": 8.5,
                    "rank": 100
                }
            }
        ]
    }

    with patch.object(mal_client, 'request') as mock_request:
        mock_request.return_value.data = mock_response
        response = await mal_client.search_anime("test")

        assert response.data["data"][0].id == 1
        assert response.data["data"][0].title == "Test Anime"
        assert isinstance(response.data["data"][0], AnimeDetails)

@pytest.mark.asyncio
async def test_get_anime_details_validation():
    """Test anime details input validation."""
    client = MALClient(client_id="test")
    with pytest.raises(ValidationError):
        await client.get_anime_details(0)

@pytest.mark.asyncio
async def test_get_anime_details_success(mal_client):
    """Test successful anime details retrieval."""
    mock_response = {
        "id": 1,
        "title": "Test Anime",
        "main_picture": {
            "medium": "https://example.com/image.jpg"
        },
        "synopsis": "Test synopsis",
        "mean": 8.5,
        "rank": 100
    }

    with patch.object(mal_client, 'request') as mock_request:
        mock_request.return_value.data = mock_response
        response = await mal_client.get_anime_details(1)

        assert response.data.id == 1
        assert response.data.title == "Test Anime"
        assert isinstance(response.data, AnimeDetails)

@pytest.mark.asyncio
async def test_auth_token_validation():
    """Test authentication token validation."""
    client = MALClient(client_id="test")
    with pytest.raises(AuthenticationError):
        await client.set_auth_token("")

@pytest.mark.asyncio
async def test_headers_with_token(mal_client):
    """Test headers with authentication token."""
    test_token = "test_token"
    await mal_client.set_auth_token(test_token)
    headers = await mal_client._get_headers()

    assert headers["Authorization"] == f"Bearer {test_token}"
    assert headers["X-MAL-CLIENT-ID"] == "test_client_id"
