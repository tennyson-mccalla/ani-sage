import asyncio
import webbrowser
import os
from aiohttp import web
from tests.config.credentials import MALCredentials
from src.api.providers.mal.auth import MALAuth
from src.api.core.logging import auth_logger

logger = auth_logger

# Global auth instance to maintain state between URL generation and callback
mal_auth = None

async def handle_callback(request):
    """Handle OAuth callback and token exchange."""
    global mal_auth
    code = request.query.get("code")
    logger.info("Received MAL callback")

    if not code:
        logger.error("No authorization code in MAL callback")
        return web.Response(text="No authorization code received")

    if not mal_auth:
        logger.error("MAL auth instance not found")
        return web.Response(text="Error: Authentication flow not properly initialized")

    try:
        logger.info("Processing MAL authorization code")
        token_data = await mal_auth.get_access_token(code)
        logger.info("Successfully obtained MAL access token")

        return web.Response(
            text=f"Access token received! Add this to your .env file:\n\n"
                f"MAL_TEST_TOKEN={token_data['access_token']}"
        )

    except Exception as e:
        logger.error(f"Error during token exchange: {str(e)}")
        return web.Response(text=f"Error: {str(e)}")

async def main():
    """Run the token acquisition server."""
    global mal_auth
    print("Token Acquisition Server")
    print("=======================")

    # Start the web server
    app = web.Application()
    app.router.add_get("/callback/mal", handle_callback)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", 8000)
    await site.start()
    logger.info("Authentication server started on http://localhost:8000")

    if MALCredentials.is_configured():
        logger.info("Initiating MAL authentication")
        # Create the auth instance and store it globally
        mal_auth = MALAuth(
            client_id=MALCredentials.client_id,
            client_secret=MALCredentials.client_secret,
            redirect_uri="http://localhost:8000/callback/mal"
        )
        url = mal_auth.generate_auth_url()
        print("\nMyAnimeList Authentication:")
        print(f"Opening browser for MAL authentication...")
        webbrowser.open(url)
    else:
        logger.warning("MAL credentials not configured. Skipping.")
        print("\nMAL credentials not configured. Skipping.")

    print("\nWaiting for authentication callback...")
    print("Press Ctrl+C to exit")

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down authentication server")
        print("\nShutting down...")
        await runner.cleanup()

if __name__ == "__main__":
    # Set log level to DEBUG for development
    os.environ["ANI_SAGE_LOG_LEVEL"] = "DEBUG"
    asyncio.run(main())
