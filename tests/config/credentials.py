import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class MALCredentials:
    """MyAnimeList API credentials."""
    client_id: str = os.getenv("MAL_CLIENT_ID", "")
    client_secret: str = os.getenv("MAL_CLIENT_SECRET", "")
    redirect_uri: str = os.getenv("MAL_REDIRECT_URI", "http://localhost:8000/callback/mal")
    test_username: str = os.getenv("MAL_TEST_USERNAME", "")
    test_token: Optional[str] = os.getenv("MAL_TEST_TOKEN")

    @classmethod
    def is_configured(cls) -> bool:
        """Check if MAL credentials are configured."""
        return bool(cls.client_id and cls.client_secret)  # Only check essential credentials

class AniListCredentials:
    """AniList API credentials."""
    client_id: str = os.getenv("ANILIST_CLIENT_ID", "")
    client_secret: str = os.getenv("ANILIST_CLIENT_SECRET", "")
    redirect_uri: str = os.getenv("ANILIST_REDIRECT_URI", "http://localhost:8000/callback/anilist")
    test_username: str = os.getenv("ANILIST_TEST_USERNAME", "")
    test_token: Optional[str] = os.getenv("ANILIST_TEST_TOKEN")

    @classmethod
    def is_configured(cls) -> bool:
        """Check if AniList credentials are configured."""
        return bool(cls.client_id and cls.client_secret)  # Only check essential credentials

# Example .env file template
ENV_TEMPLATE = """
# MyAnimeList Credentials
MAL_CLIENT_ID=your_client_id
MAL_CLIENT_SECRET=your_client_secret
MAL_REDIRECT_URI=http://localhost:8000/callback/mal
MAL_TEST_USERNAME=your_test_username
MAL_TEST_TOKEN=your_access_token

# AniList Credentials
ANILIST_CLIENT_ID=your_client_id
ANILIST_CLIENT_SECRET=your_client_secret
ANILIST_REDIRECT_URI=http://localhost:8000/callback/anilist
ANILIST_TEST_USERNAME=your_test_username
ANILIST_TEST_TOKEN=your_access_token
"""

def print_setup_instructions():
    """Print instructions for setting up API credentials."""
    print("API Credentials Setup Instructions:")
    print("\n1. MyAnimeList Setup:")
    print("   - Go to https://myanimelist.net/apiconfig")
    print("   - Create a new API client")
    print("   - Set redirect URI to http://localhost:8000/callback/mal")
    print("   - Save the Client ID and Client Secret")

    print("\n2. AniList Setup:")
    print("   - Go to https://anilist.co/settings/developer")
    print("   - Create a new API client")
    print("   - Set redirect URI to http://localhost:8000/callback/anilist")
    print("   - Save the Client ID and Client Secret")

    print("\n3. Create a .env file in the project root with:")
    print(ENV_TEMPLATE)

    print("\n4. To get access tokens:")
    print("   - Run the authentication flow for each service")
    print("   - Store the obtained tokens in .env")
