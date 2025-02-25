#!/usr/bin/env python3
"""
Top Anime Trailers Script

This script demonstrates how to fetch top anime from MyAnimeList
and find their official trailers on YouTube. It can use real API data
or sample data for demonstration purposes.
"""

import os
import sys
import json
import time
import asyncio
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.utils.logging import get_logger, configure_logging

# Try to import API clients
try:
    from src.api.providers.mal.client import MALClient, AnimeDetails
    from src.api.providers.youtube.client import YouTubeClient, Video
    API_IMPORTS_AVAILABLE = True
except ImportError:
    API_IMPORTS_AVAILABLE = False
    print("Warning: API client imports failed. Will use sample data only.")

logger = get_logger(__name__)

# Constants
TOP_ANIME_COUNT = 10

# Try to load MAL Client ID from environment
# First check standard environment variable
MAL_CLIENT_ID = os.environ.get("MAL_CLIENT_ID", "")

# If not found, try to load from .env file in api-integration worktree
if not MAL_CLIENT_ID:
    env_path = Path(__file__).resolve().parent.parent.parent.parent / "api-integration" / ".env"
    if env_path.exists():
        logger.info(f"Loading API keys from {env_path}")
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("MAL_CLIENT_ID="):
                    MAL_CLIENT_ID = line.strip().split("=", 1)[1]
                    break

# Similarly try to find YouTube API Key
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")

# ANSI color codes for terminal output
RESET = "\033[0m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"

# Sample data for demonstration
SAMPLE_TOP_ANIME = [
    {
        "id": 5114,
        "title": "Fullmetal Alchemist: Brotherhood",
        "rank": 1,
        "mean": 9.11,
        "synopsis": "After a horrific alchemy experiment goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic new reality. Ignoring the alchemical principle banning human transmutation, the boys attempted to bring their recently deceased mother back to life. Instead, they suffered brutal personal loss: Alphonse's body disintegrated while Edward lost a leg and then sacrificed an arm to keep Alphonse's soul in the physical realm by binding it to a hulking suit of armor.",
        "genres": ["Action", "Adventure", "Drama", "Fantasy"],
        "image": "https://cdn.myanimelist.net/images/anime/1223/96541.jpg"
    },
    {
        "id": 9253,
        "title": "Steins;Gate",
        "rank": 2,
        "mean": 9.08,
        "synopsis": "The self-proclaimed mad scientist Rintarou Okabe rents out a room in a rickety old building in Akihabara, where he indulges himself in his hobby of inventing prospective \"future gadgets\" with fellow lab members: Mayuri Shiina, his air-headed childhood friend, and Hashida Itaru, a perverted hacker nicknamed \"Daru.\" The three pass the time by tinkering with their most promising contraption yet, a machine dubbed the \"Phone Microwave,\" which performs the strange function of morphing bananas into piles of green gel.",
        "genres": ["Drama", "Sci-Fi", "Suspense"],
        "image": "https://cdn.myanimelist.net/images/anime/1935/127974.jpg"
    },
    {
        "id": 28977,
        "title": "Gintama°",
        "rank": 3,
        "mean": 9.06,
        "synopsis": "Gintoki, Shinpachi, and Kagura return as the fun-loving but broke members of the Yorozuya team! Living in an alternate-reality Edo, where swords are prohibited and alien overlords have conquered Japan, they try to thrive on doing whatever work they can get their hands on. However, Shinpachi and Kagura still haven't been paid... Does Gin-chan really spend all that cash playing pachinko?",
        "genres": ["Action", "Comedy", "Sci-Fi"],
        "image": "https://cdn.myanimelist.net/images/anime/3/72078.jpg"
    },
    {
        "id": 38524,
        "title": "Shingeki no Kyojin Season 3 Part 2",
        "rank": 4,
        "mean": 9.05,
        "synopsis": "Seeking to restore humanity's diminishing hope, the Survey Corps embark on a mission to retake Wall Maria, where the battle against the merciless \"Titans\" takes the stage once again. Returning to the tattered Shiganshina District that was once his home, Eren Yeager and the Corps find the town oddly unoccupied by Titans. Even after the outer gate is plugged, they strangely encounter no opposition.",
        "genres": ["Action", "Drama"],
        "image": "https://cdn.myanimelist.net/images/anime/1517/100633.jpg"
    },
    {
        "id": 9969,
        "title": "Gintama'",
        "rank": 5,
        "mean": 9.03,
        "synopsis": "In the Edo period, Japan is suddenly invaded by alien creatures known as the \"Amanto.\" Despite the samurai's attempts to combat the extraterrestrial menace, the Shogun quickly surrenders and places a ban on all swords, allowing the aliens to settle in Japan.",
        "genres": ["Action", "Comedy", "Sci-Fi"],
        "image": "https://cdn.myanimelist.net/images/anime/4/50361.jpg"
    },
    {
        "id": 11061,
        "title": "Hunter x Hunter (2011)",
        "rank": 6,
        "mean": 9.03,
        "synopsis": "Hunters devote themselves to accomplishing hazardous tasks, all from traversing the world's uncharted territories to locating rare items and monsters. Before becoming a Hunter, one must pass the Hunter Examination—a high-risk selection process in which most applicants end up handicapped or worse, deceased.",
        "genres": ["Action", "Adventure", "Fantasy"],
        "image": "https://cdn.myanimelist.net/images/anime/1337/99013.jpg"
    },
    {
        "id": 820,
        "title": "Ginga Eiyuu Densetsu",
        "rank": 7,
        "mean": 9.02,
        "synopsis": "The 150-year-long stalemate between the two interstellar superpowers, the Galactic Empire and the Free Planets Alliance, comes to an end when a new generation of leaders arises: the idealistic military genius Reinhard von Lohengramm, and the FPA's reserved historian, Yang Wenli.",
        "genres": ["Drama", "Sci-Fi"],
        "image": "https://cdn.myanimelist.net/images/anime/13/13225.jpg"
    },
    {
        "id": 15417,
        "title": "Gintama': Enchousen",
        "rank": 8,
        "mean": 9.00,
        "synopsis": "While Gintoki Sakata was away, the Yorozuya found themselves a new leader: Katsura Kotarou, who is normally battling the forces of the Bakufu. Katsura's former comrade Takechi Henpeita appears, claiming to be fighting for the education of Japan's youth, but actually intends on gathering funds for an illegal cause.",
        "genres": ["Action", "Comedy", "Sci-Fi"],
        "image": "https://cdn.myanimelist.net/images/anime/1452/123686.jpg"
    },
    {
        "id": 19,
        "title": "Monster",
        "rank": 9,
        "mean": 8.89,
        "synopsis": "Dr. Kenzou Tenma, an elite neurosurgeon, finds his life in utter turmoil after getting involved with a psychopathic former patient. What was supposed to be a regular hospital visit becomes a twisted murder case that leads Dr. Tenma to give up his promising career and devote himself to finding the killer, Johan Liebert.",
        "genres": ["Drama", "Mystery", "Suspense"],
        "image": "https://cdn.myanimelist.net/images/anime/10/18793.jpg"
    },
    {
        "id": 918,
        "title": "Gintama",
        "rank": 10,
        "mean": 8.93,
        "synopsis": "The Amanto, aliens from outer space, have invaded Earth and taken over feudal Japan. As a result, a prohibition on swords has been established, and the samurai of Japan are treated with disregard as a consequence. However one man, Gintoki Sakata, still possesses the heart of the samurai, although from his love of sweets and work as a yorozuya, one might not expect it.",
        "genres": ["Action", "Comedy", "Sci-Fi"],
        "image": "https://cdn.myanimelist.net/images/anime/10/73274.jpg"
    }
]

# Sample YouTube trailer data
SAMPLE_TRAILERS = {
    "Fullmetal Alchemist: Brotherhood": {
        "id": "--IcmZkvL0Q",
        "title": "Fullmetal Alchemist: Brotherhood - Official Trailer",
        "channel": "Aniplex USA",
        "thumbnail": "https://i.ytimg.com/vi/--IcmZkvL0Q/hqdefault.jpg"
    },
    "Steins;Gate": {
        "id": "27OZc-ku6is",
        "title": "STEINS;GATE - Official Trailer",
        "channel": "Funimation",
        "thumbnail": "https://i.ytimg.com/vi/27OZc-ku6is/hqdefault.jpg"
    },
    "Gintama°": {
        "id": "YQC3z_fqIQI",
        "title": "Gintama Season 3 - Official Trailer",
        "channel": "Crunchyroll Collection",
        "thumbnail": "https://i.ytimg.com/vi/YQC3z_fqIQI/hqdefault.jpg"
    },
    "Shingeki no Kyojin Season 3 Part 2": {
        "id": "hKHepjfj5Tw",
        "title": "Attack on Titan Season 3 Part 2 - Official Trailer",
        "channel": "Anime News Network",
        "thumbnail": "https://i.ytimg.com/vi/hKHepjfj5Tw/hqdefault.jpg"
    },
    "Gintama'": {
        "id": "4DWAtg7YQn0",
        "title": "Gintama' - Official Trailer",
        "channel": "Funimation",
        "thumbnail": "https://i.ytimg.com/vi/4DWAtg7YQn0/hqdefault.jpg"
    },
    "Hunter x Hunter (2011)": {
        "id": "D9iTQRB4XRk",
        "title": "Hunter x Hunter (2011) - Official Trailer",
        "channel": "VIZ Media",
        "thumbnail": "https://i.ytimg.com/vi/D9iTQRB4XRk/hqdefault.jpg"
    },
    "Ginga Eiyuu Densetsu": {
        "id": "G7grjXe2Xdo",
        "title": "Legend of the Galactic Heroes: Die Neue These - Official Trailer",
        "channel": "Sentai Filmworks",
        "thumbnail": "https://i.ytimg.com/vi/G7grjXe2Xdo/hqdefault.jpg"
    },
    "Gintama': Enchousen": {
        "id": "aqUeG2vA6MA",
        "title": "Gintama Enchousen - PV",
        "channel": "GintamaFR",
        "thumbnail": "https://i.ytimg.com/vi/aqUeG2vA6MA/hqdefault.jpg"
    },
    "Monster": {
        "id": "9aS-EgdAq6U",
        "title": "Monster Anime - Official Trailer",
        "channel": "AnimeStudioTrailers",
        "thumbnail": "https://i.ytimg.com/vi/9aS-EgdAq6U/hqdefault.jpg"
    },
    "Gintama": {
        "id": "YQC3z_fqIQI",
        "title": "Gintama - Official Trailer",
        "channel": "Crunchyroll Collection",
        "thumbnail": "https://i.ytimg.com/vi/YQC3z_fqIQI/hqdefault.jpg"
    }
}

async def get_top_anime(client) -> List[dict]:
    """
    Get the top anime from MyAnimeList using the API.

    Args:
        client: The MAL API client

    Returns:
        List of top anime details
    """
    try:
        # Get current season's top anime
        current_year = 2025  # Using current year
        current_season = "winter"  # winter, spring, summer, fall

        logger.info(f"Fetching seasonal anime for {current_season} {current_year}")
        response = await client.get_seasonal_anime(
            year=current_year,
            season=current_season,
            sort="anime_score",  # Sort by score
            limit=50  # Get more than we need to filter
        )

        if not response.data:
            logger.error("Failed to get seasonal anime, using sample data")
            return convert_sample_to_dict()

        # Filter and sort by rank
        anime_list = response.data
        anime_list.sort(key=lambda a: a.rank if a.rank else 9999)

        # Return top N anime
        top_anime = anime_list[:TOP_ANIME_COUNT]

        # Convert to dictionary format
        result = []
        for anime in top_anime:
            # Convert pydantic model to dict for consistent display
            anime_dict = {
                "id": anime.id,
                "title": anime.title,
                "rank": anime.rank if anime.rank else 999,
                "mean": anime.mean if anime.mean else 0,
                "synopsis": anime.synopsis if anime.synopsis else "",
                "genres": [g.name for g in (anime.genres or [])],
                "image": anime.main_picture.large if anime.main_picture else ""
            }
            result.append(anime_dict)

        return result
    except Exception as e:
        logger.error(f"Error fetching anime data: {e}")
        return convert_sample_to_dict()

async def get_anime_trailer(client, anime_title) -> Optional[dict]:
    """
    Search for an anime trailer on YouTube using the API.

    Args:
        client: The YouTube API client
        anime_title: Anime title to search for

    Returns:
        Video details if found, None otherwise
    """
    try:
        logger.info(f"Searching for trailer: {anime_title}")
        response = await client.search_anime_trailer(
            anime_title=anime_title,
            max_results=1
        )

        if response.data and len(response.data) > 0:
            video = response.data[0]
            # Convert to dict format
            return {
                "id": video.id,
                "title": video.snippet.title,
                "channel": video.snippet.channelTitle,
                "thumbnail": video.snippet.thumbnails.get("high", video.snippet.thumbnails.get("default")).url
            }

        return None
    except Exception as e:
        logger.error(f"Error fetching trailer: {e}")
        return SAMPLE_TRAILERS.get(anime_title)

def convert_sample_to_dict() -> List[dict]:
    """Convert sample data to dictionary format for consistent display."""
    return SAMPLE_TOP_ANIME

def display_anime_with_trailer(anime, trailer) -> None:
    """
    Display anime information with trailer link.

    Args:
        anime: Anime details dictionary
        trailer: Trailer details dictionary
    """
    # Print anime details
    print(f"\n{BOLD}{MAGENTA}#{anime['rank']} {anime['title']}{RESET}")
    print(f"{BLUE}Score:{RESET} {anime['mean']}/10")

    # Print genres
    if anime['genres']:
        print(f"{BLUE}Genres:{RESET} {', '.join(anime['genres'])}")

    # Print synopsis (truncated)
    if anime['synopsis']:
        synopsis = anime['synopsis'][:150] + "..." if len(anime['synopsis']) > 150 else anime['synopsis']
        print(f"\n{YELLOW}{synopsis}{RESET}")

    # Print image URL
    if 'image' in anime and anime['image']:
        print(f"{BLUE}Image:{RESET} {anime['image']}")

    # Print trailer information
    if trailer:
        print(f"\n{GREEN}Trailer:{RESET} {trailer['title']}")
        print(f"{GREEN}Channel:{RESET} {trailer['channel']}")
        print(f"{GREEN}URL:{RESET} https://www.youtube.com/watch?v={trailer['id']}")
        print(f"{GREEN}Thumbnail:{RESET} {trailer['thumbnail']}")
    else:
        print(f"\n{YELLOW}No trailer found{RESET}")

    print(f"\n{CYAN}{'=' * 80}{RESET}")

async def run_with_real_data():
    """Run the demo using real API data."""
    if not API_IMPORTS_AVAILABLE:
        print(f"{YELLOW}API clients not available. Using sample data instead.{RESET}")
        run_with_sample_data()
        return

    print(f"{BOLD}{'=' * 80}{RESET}")
    print(f"{BOLD}{CYAN}Top 10 Anime on MyAnimeList with YouTube Trailers (LIVE DATA){RESET}")
    print(f"{BOLD}{'=' * 80}{RESET}")

    if not MAL_CLIENT_ID:
        print(f"{YELLOW}Warning: MAL_CLIENT_ID not found. Using sample data instead.{RESET}")
        run_with_sample_data()
        return

    # Initialize clients
    mal_client = MALClient(client_id=MAL_CLIENT_ID)
    youtube_client = YouTubeClient(api_key=YOUTUBE_API_KEY) if YOUTUBE_API_KEY else None

    try:
        # Get top anime
        top_anime = await get_top_anime(mal_client)

        print(f"\nFound {len(top_anime)} top anime on MyAnimeList.")
        print("Searching for trailers on YouTube...\n")

        # Get trailers and display results
        for anime in top_anime:
            # If YouTube API key is available, get real trailer data
            if youtube_client:
                trailer = await get_anime_trailer(youtube_client, anime['title'])
            else:
                # Otherwise use sample data
                trailer = SAMPLE_TRAILERS.get(anime['title'])
                print(f"{YELLOW}Using sample trailer data (no YouTube API key){RESET}")

            display_anime_with_trailer(anime, trailer)
            await asyncio.sleep(0.5)  # Pause between API calls

        print(f"\n{GREEN}Demo with real data completed successfully!{RESET}")

    except Exception as e:
        logger.error(f"Error in API demo: {e}")
        print(f"\n{YELLOW}Error: {e}. Falling back to sample data.{RESET}")
        run_with_sample_data()

def run_with_sample_data():
    """Run the demo using sample data."""
    print(f"{BOLD}{'=' * 80}{RESET}")
    print(f"{BOLD}{CYAN}Top 10 Anime on MyAnimeList with YouTube Trailers (DEMO DATA){RESET}")
    print(f"{BOLD}{'=' * 80}{RESET}")

    print("\nNote: This is using sample data for demonstration purposes.")
    print("In a production environment, this would fetch real data from MAL and YouTube APIs.\n")

    print(f"Found {len(SAMPLE_TOP_ANIME)} top anime on MyAnimeList.")
    print("Matching with trailers on YouTube...\n")

    # Display anime with trailers
    for anime in SAMPLE_TOP_ANIME:
        # Get trailer data if available
        trailer = SAMPLE_TRAILERS.get(anime['title'])

        # Display anime with trailer
        display_anime_with_trailer(anime, trailer)
        time.sleep(0.5)  # Pause for readability

    print(f"\n{GREEN}Demo completed successfully!{RESET}")
    print(f"\n{BOLD}In a real implementation, this would:{RESET}")
    print("1. Fetch the latest top anime rankings from MyAnimeList API")
    print("2. Search for each anime's official trailer on YouTube")
    print("3. Store this data for enhancing recommendation quality")
    print("4. Use trailer content for additional sentiment analysis")
    print("5. Include video thumbnails and links in the recommendation UI\n")

async def main_async(use_api: bool = False):
    """Async main function."""
    # Configure logging
    configure_logging(log_level="INFO")

    if use_api:
        await run_with_real_data()
    else:
        run_with_sample_data()

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Top Anime Trailers Demo")
    parser.add_argument("--use-api", action="store_true", help="Use real API data instead of sample data")
    args = parser.parse_args()

    if args.use_api:
        print(f"{BOLD}Using real API data...{RESET}")
        asyncio.run(main_async(use_api=True))
    else:
        run_with_sample_data()

if __name__ == "__main__":
    main()
