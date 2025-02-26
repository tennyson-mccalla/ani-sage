import secrets
import urllib.parse
from typing import Dict, Optional
from ...core.errors import AuthenticationError
from ...core.client import BaseAPIClient

class AniListAuth(BaseAPIClient):
    """AniList OAuth authentication handler."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        **kwargs
    ):
        """Initialize AniList auth handler."""
        super().__init__(
            base_url="https://anilist.co/api/v2",
            **kwargs
        )
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    def generate_auth_url(self) -> str:
        """Generate the OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": secrets.token_urlsafe(32)
        }
        return f"https://anilist.co/api/v2/oauth/authorize?{urllib.parse.urlencode(params)}"

    async def get_access_token(self, code: str) -> Dict[str, str]:
        """Exchange authorization code for access token."""
        if not code:
            raise AuthenticationError("Authorization code is required")

        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "code": code
        }

        response = await self.request(
            method="POST",
            endpoint="oauth/token",
            data=data
        )

        if not response.data or "access_token" not in response.data:
            raise AuthenticationError("Failed to obtain access token")

        return {
            "access_token": response.data["access_token"],
            "token_type": response.data.get("token_type", "Bearer"),
            "expires_in": response.data.get("expires_in")
        }
