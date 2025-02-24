import base64
import secrets
import urllib.parse
from typing import Dict, Optional
from ...core.errors import AuthenticationError
from ...core.client import BaseAPIClient

class MALAuth(BaseAPIClient):
    """MyAnimeList OAuth2 authentication handler."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        **kwargs
    ):
        """Initialize MAL auth handler."""
        super().__init__(
            base_url="https://myanimelist.net/v1/oauth2",
            **kwargs
        )
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self._code_verifier = None

    def _generate_code_verifier(self) -> str:
        """Generate a code verifier for PKCE."""
        return secrets.token_urlsafe(32)

    def _get_code_challenge(self, code_verifier: str) -> str:
        """Get code challenge from verifier."""
        # For simplicity, we're using plain transformation
        # In production, you might want to use S256
        return code_verifier

    def generate_auth_url(self) -> str:
        """Generate the OAuth2 authorization URL."""
        self._code_verifier = self._generate_code_verifier()
        code_challenge = self._get_code_challenge(self._code_verifier)

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": "plain",
            "state": secrets.token_urlsafe(32)
        }
        return f"https://myanimelist.net/v1/oauth2/authorize?{urllib.parse.urlencode(params)}"

    async def get_access_token(self, code: str) -> Dict[str, str]:
        """Exchange authorization code for access token."""
        if not code:
            raise AuthenticationError("Authorization code is required")
        if not self._code_verifier:
            raise AuthenticationError("Code verifier not found. Generate auth URL first.")

        # Form-encode the data for MAL
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "code_verifier": self._code_verifier,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }

        # Add proper content-type header
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = await self.request(
            method="POST",
            endpoint="token",
            data=urllib.parse.urlencode(data),  # Form-encode the data
            headers=headers
        )

        if not response.data or "access_token" not in response.data:
            raise AuthenticationError("Failed to obtain access token")

        return {
            "access_token": response.data["access_token"],
            "refresh_token": response.data.get("refresh_token"),
            "token_type": response.data.get("token_type", "Bearer"),
            "expires_in": response.data.get("expires_in")
        }

    async def refresh_token(self, refresh_token: str) -> Dict[str, str]:
        """Refresh an expired access token."""
        if not refresh_token:
            raise AuthenticationError("Refresh token is required")

        # Form-encode the data for MAL
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }

        # Add proper content-type header
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        response = await self.request(
            method="POST",
            endpoint="token",
            data=urllib.parse.urlencode(data),  # Form-encode the data
            headers=headers
        )

        if not response.data or "access_token" not in response.data:
            raise AuthenticationError("Failed to refresh access token")

        return {
            "access_token": response.data["access_token"],
            "refresh_token": response.data.get("refresh_token", refresh_token),
            "token_type": response.data.get("token_type", "Bearer"),
            "expires_in": response.data.get("expires_in")
        }
