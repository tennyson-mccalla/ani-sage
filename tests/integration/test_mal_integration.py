"""Integration tests for MyAnimeList API client."""
import os
import pytest
from src.api.providers.mal.client import MALClient
from src.api.providers.mal.auth import MALAuth
from tests.config.credentials import MALCredentials

# Skip all tests if credentials not configured
pytestmark = pytest.mark.skipif(
    not MALCredentials.is_configured(),
    reason="MAL credentials not configured"
)

@pytest.fixture
async def mal_client():
    """Create an authenticated MAL client for testing."""
    client = MALClient(
        client_id=MALCredentials.client_id,
        client_secret=MALCredentials.client_secret,
        access_token=MALCredentials.test_token
    )
    return client

@pytest.mark.asyncio
async def test_mal_user_profile(mal_client):
    """Test fetching the user's profile."""
    response = await mal_client.get_user_info(MALCredentials.test_username)
    assert response.status_code == 200
    assert response.data is not None
    assert "id" in response.data
    assert "name" in response.data
    assert response.data["name"] == MALCredentials.test_username

@pytest.mark.asyncio
async def test_mal_anime_search(mal_client):
    """Test searching for anime."""
    response = await mal_client.search_anime("One Piece")
    assert response.status_code == 200
    assert response.data is not None
    assert "data" in response.data
    assert len(response.data["data"]) > 0
    assert "node" in response.data["data"][0]
    assert "id" in response.data["data"][0]["node"]
    assert "title" in response.data["data"][0]["node"]

@pytest.mark.asyncio
async def test_mal_anime_details(mal_client):
    """Test fetching anime details."""
    # One Piece ID
    anime_id = 21
    response = await mal_client.get_anime_details(anime_id)
    assert response.status_code == 200
    assert response.data is not None
    assert "id" in response.data
    assert response.data["id"] == anime_id
    assert "title" in response.data
    assert "main_picture" in response.data