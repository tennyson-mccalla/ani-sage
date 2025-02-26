#!/usr/bin/env python3
"""
No API Keys Demo - Color-Based Anime Recommendation

This script demonstrates the color palette analysis and visual style recommendation
features in the ani-sage recommendation engine. It is specifically designed
to run without requiring any API keys (OpenAI, YouTube), making it easy to test
the core functionality.
"""

import os
import sys
import time
import argparse
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import random

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pyfzf.pyfzf import FzfPrompt

from src.ai.recommendation.engine import (
    get_recommendation_engine,
    RecommendationOptions,
    RecommendationResult
)
from src.ai.preferences.user_preferences import UserPreferences, Mood
from src.ai.preferences.color_preferences import ColorPalette, VisualStyle, ColorPreference, VisualStylePreference
from src.ai.models.anime import Anime, AnimeFeatures
from src.utils.logging import get_logger, configure_logging

# Import our color analysis module
from src.api.media.color_analysis import rgb_to_ansi, rgb_to_ansi_bg, create_visual_profile_from_thumbnail

# Configure logging
configure_logging(log_level="INFO")
logger = get_logger(__name__)

# ANSI escape codes for colors and formatting
RESET = "\033[0m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"

def color_block(r: int, g: int, b: int, text: str = "  ") -> str:
    """Create a colored block using ANSI escape codes.

    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)
        text: Text to display in the colored block

    Returns:
        str: ANSI-colored text
    """
    return f"\033[48;2;{r};{g};{b}m{text}{RESET}"

def display_header():
    """Display the application header."""
    header = f"""
{BOLD}{MAGENTA}═════════════════════════════════════════════════{RESET}
  {BOLD}{CYAN}Ani-Sage{RESET} {YELLOW}Color-Based Recommendation Engine{RESET}
{BOLD}{MAGENTA}═════════════════════════════════════════════════{RESET}
"""
    print(header)

def create_sample_anime_database(count: int = 8) -> Dict[str, Anime]:
    """Create a sample database of anime for demonstration purposes.

    Args:
        count: Number of anime to create

    Returns:
        Dict[str, Anime]: Dictionary of anime indexed by ID
    """
    print(f"Creating sample anime database with {count} entries...")

    anime_db = {}

    # Sample anime data (real anime)
    samples = [
        {
            "id": "1",
            "title": "Attack on Titan",
            "genres": ["action", "drama", "fantasy", "horror"],
            "studios": ["Wit Studio", "MAPPA"],
            "synopsis": "Humans are nearly extinct due to giant humanoid Titans. Those that remain live in cities surrounded by enormous walls.",
            "image_url": "https://cdn.myanimelist.net/images/anime/10/47347.jpg"
        },
        {
            "id": "2",
            "title": "Violet Evergarden",
            "genres": ["drama", "fantasy", "slice_of_life"],
            "studios": ["Kyoto Animation"],
            "synopsis": "A former soldier learns about emotional connections through her work as a ghostwriter creating letters for others.",
            "image_url": "https://cdn.myanimelist.net/images/anime/1329/94657.jpg"
        },
        {
            "id": "3",
            "title": "My Neighbor Totoro",
            "genres": ["adventure", "fantasy", "slice_of_life", "supernatural"],
            "studios": ["Studio Ghibli"],
            "synopsis": "Two young girls find that their new country home is in a magical forest inhabited by friendly spirits.",
            "image_url": "https://cdn.myanimelist.net/images/anime/4/75923.jpg"
        },
        {
            "id": "4",
            "title": "Cowboy Bebop",
            "genres": ["action", "adventure", "comedy", "drama", "sci-fi", "space"],
            "studios": ["Sunrise"],
            "synopsis": "A ragtag group of bounty hunters chase down criminals in the far future.",
            "image_url": "https://cdn.myanimelist.net/images/anime/4/19644.jpg"
        },
        {
            "id": "5",
            "title": "Your Name",
            "genres": ["drama", "romance", "supernatural"],
            "studios": ["CoMix Wave Films"],
            "synopsis": "Two strangers find they are linked in a bizarre way as they occasionally switch bodies.",
            "image_url": "https://cdn.myanimelist.net/images/anime/5/87048.jpg"
        },
        {
            "id": "6",
            "title": "One Punch Man",
            "genres": ["action", "comedy", "parody", "sci-fi", "seinen", "super_power", "supernatural"],
            "studios": ["Madhouse"],
            "synopsis": "A hero who is unbeatable and can defeat any enemy with one punch becomes bored with his overwhelming power.",
            "image_url": "https://cdn.myanimelist.net/images/anime/12/76049.jpg"
        },
        {
            "id": "7",
            "title": "Akira",
            "genres": ["action", "horror", "sci-fi", "supernatural", "psychological"],
            "studios": ["Tokyo Movie Shinsha"],
            "synopsis": "A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic psychopath.",
            "image_url": "https://cdn.myanimelist.net/images/anime/1/2951.jpg"
        },
        {
            "id": "8",
            "title": "A Place Further Than The Universe",
            "genres": ["adventure", "comedy", "drama", "slice_of_life"],
            "studios": ["Madhouse"],
            "synopsis": "Four girls form an unlikely friendship as they embark on a journey to Antarctica.",
            "image_url": "https://cdn.myanimelist.net/images/anime/1522/90464.jpg"
        },
        {
            "id": "9",
            "title": "March Comes in Like a Lion",
            "genres": ["drama", "seinen", "slice_of_life"],
            "studios": ["Shaft"],
            "synopsis": "A professional shogi player deals with depression and finding meaning in his life.",
            "image_url": "https://cdn.myanimelist.net/images/anime/6/82898.jpg"
        },
        {
            "id": "10",
            "title": "Demon Slayer",
            "genres": ["action", "fantasy", "historical", "shounen"],
            "studios": ["ufotable"],
            "synopsis": "A young man hunts down demons after his family is slaughtered and his sister is turned into a demon.",
            "image_url": "https://cdn.myanimelist.net/images/anime/1286/99889.jpg"
        },
        {
            "id": "11",
            "title": "Spirited Away",
            "genres": ["adventure", "fantasy", "supernatural"],
            "studios": ["Studio Ghibli"],
            "synopsis": "A young girl enters a world of spirits and must work to free herself and her parents.",
            "image_url": "https://cdn.myanimelist.net/images/anime/6/79597.jpg"
        },
        {
            "id": "12",
            "title": "Ghost in the Shell",
            "genres": ["action", "psychological", "sci-fi", "seinen"],
            "studios": ["Production I.G"],
            "synopsis": "A cyborg policewoman and her partner hunt a mysterious and powerful hacker.",
            "image_url": "https://cdn.myanimelist.net/images/anime/10/82594.jpg"
        }
    ]

    # Select a subset of samples based on count
    selected = random.sample(samples, min(count, len(samples)))

    # Create Anime objects
    for sample in selected:
        anime = Anime(
            id=sample["id"],
            title=sample["title"],
            synopsis=sample["synopsis"],
            genres=sample["genres"],
            studios=sample["studios"],
            features=AnimeFeatures(),
            image_url=sample["image_url"]
        )
        anime_db[anime.id] = anime

    return anime_db

def setup_color_preferences(fzf: FzfPrompt) -> List:
    """Set up color preferences using FZF multi-select.

    Args:
        fzf: FZF prompt instance

    Returns:
        List of ColorPreference objects
    """
    print(f"\n{BOLD}{CYAN}=== Setting Up Color Preferences ==={RESET}")
    print("Let's select your preferred color palettes...")

    # Sample colors for each palette - simplified to work better with FZF
    palette_color_names = {
        ColorPalette.VIBRANT: "🔴🟢🔵🟡 VIBRANT",
        ColorPalette.PASTEL: "🌸🌊🌿🍑 PASTEL",
        ColorPalette.DARK: "⚫️🌑⚫️🌑 DARK",
        ColorPalette.MONOCHROME: "⬛️⚪️⬛️⚪️ MONOCHROME",
        ColorPalette.HIGH_CONTRAST: "⬛️⬜️🔴🔵 HIGH_CONTRAST",
        ColorPalette.MUTED: "🟤🟢🟣🟡 MUTED",
        ColorPalette.NEON: "🟣🟦🟨🟩 NEON",
        ColorPalette.WARM: "🔴🟠🟡🟤 WARM",
        ColorPalette.COOL: "🔵🟢🟣🟦 COOL",
        ColorPalette.EARTHY: "🟤🟢🟤🟠 EARTHY",
    }

    # Create palette choices
    palette_choices = list(palette_color_names.values())

    # Use FZF to select preferred palettes
    selected_palettes = fzf.prompt(
        palette_choices,
        "--multi --no-sort --layout=reverse --header='Select color palettes you like (TAB to select multiple, ENTER to confirm)'"
    )

    # Use FZF to select disliked palettes
    disliked_palettes = fzf.prompt(
        palette_choices,
        "--multi --no-sort --layout=reverse --header='Select color palettes you dislike (TAB to select multiple, ENTER to confirm)'"
    )

    # Create preference objects
    preferences = []

    # Inverse mapping for lookups
    palette_name_to_enum = {value: key for key, value in palette_color_names.items()}

    # Add liked palettes with positive weight
    for palette_choice in selected_palettes:
        palette = palette_name_to_enum.get(palette_choice)
        if palette:
            print(f"Added {palette.value} to liked color palettes.")
            preferences.append(ColorPreference(
                palette=palette,
                weight=1.0
            ))

    # Add disliked palettes with negative weight
    for palette_choice in disliked_palettes:
        palette = palette_name_to_enum.get(palette_choice)
        if palette:
            print(f"Added {palette.value} to disliked color palettes.")
            preferences.append(ColorPreference(
                palette=palette,
                weight=-1.0
            ))

    # Also set up visual style preferences
    print("\nNow let's select your preferred visual styles...")

    # Create style choices with emoji icons
    style_emoji_map = {
        VisualStyle.REALISTIC: "🖼️ REALISTIC",
        VisualStyle.STYLIZED: "🎭 STYLIZED",
        VisualStyle.MINIMALIST: "⚪️ MINIMALIST",
        VisualStyle.DETAILED: "🔍 DETAILED",
        VisualStyle.SKETCH: "✏️ SKETCH",
        VisualStyle.WATERCOLOR: "🌊 WATERCOLOR",
        VisualStyle.CHIBI: "👶 CHIBI",
        VisualStyle.RETRO: "📺 RETRO",
        VisualStyle.MODERN: "🌇 MODERN",
        VisualStyle.EXPERIMENTAL: "🧪 EXPERIMENTAL",
    }

    style_choices = list(style_emoji_map.values())

    # Use FZF to select preferred styles
    selected_styles = fzf.prompt(
        style_choices,
        "--multi --no-sort --layout=reverse --header='Select visual styles you like (TAB to select multiple, ENTER to confirm)'"
    )

    # Style name to enum mapping for lookups
    style_name_to_enum = {value: key for key, value in style_emoji_map.items()}

    # Create style preference objects
    for style_choice in selected_styles:
        style = style_name_to_enum.get(style_choice)
        if style:
            print(f"Added {style.value} to liked visual styles.")
            preferences.append(VisualStylePreference(
                style=style,
                weight=1.0
            ))

    return preferences

def setup_user_preferences(fzf: FzfPrompt, interactive: bool) -> UserPreferences:
    """Set up user preferences for the recommendation engine.

    Args:
        fzf: FZF prompt instance
        interactive: Whether to use interactive prompts

    Returns:
        UserPreferences: User preferences object
    """
    print(f"\n{BOLD}{CYAN}=== Setting Up User Preferences ==={RESET}")

    # Create a new user preference profile
    user_prefs = UserPreferences(user_id=f"{random.randint(1, 10000):08x}")

    if interactive:
        # Set up genre preferences
        print("Let's set up some genre preferences...")

        # Define all available genres
        all_genres = [
            "action", "adventure", "comedy", "drama", "fantasy",
            "horror", "mystery", "romance", "sci-fi", "slice_of_life",
            "supernatural", "thriller"
        ]

        # Use FZF to select liked genres
        liked_genres = fzf.prompt(
            all_genres,
            "--multi --no-sort --layout=reverse --header='Select genres you like (TAB to select multiple, ENTER to confirm)'"
        )

        # Add liked genres to preferences
        for genre in liked_genres:
            user_prefs.genre_preferences[genre] = 1.0
            print(f"Added {genre} to liked genres.")

        # Use FZF to select disliked genres
        disliked_genres = fzf.prompt(
            all_genres,
            "--multi --no-sort --layout=reverse --header='Select genres you dislike (TAB to select multiple, ENTER to confirm)'"
        )

        # Add disliked genres to preferences
        for genre in disliked_genres:
            user_prefs.genre_preferences[genre] = -1.0
            print(f"Added {genre} to disliked genres.")

        # Set current mood
        print("What's your current mood?")
        mood_choices = [mood.value for mood in Mood]
        selected_mood = fzf.prompt(
            mood_choices,
            "--no-sort --layout=reverse --header='Select your current mood:'"
        )[0]

        # Find the matching Mood enum
        for mood in Mood:
            if mood.value == selected_mood:
                user_prefs.current_mood = mood
                print(f"Mood set to: {mood.value}")
                break

        # Set up color preferences
        # Instead of trying to set directly (which doesn't exist on UserPreferences),
        # we'll pass the color preferences to the recommendation engine separately
        visual_preferences = setup_color_preferences(fzf)

        # Add a custom attribute to store the preferences
        # This is a workaround since the field doesn't exist in the model
        user_prefs.__dict__['color_preferences'] = visual_preferences
    else:
        # Set default preferences for non-interactive mode
        user_prefs.genre_preferences = {
            "adventure": 1.0,
            "fantasy": 1.0,
            "sci-fi": 1.0,
            "horror": -1.0
        }
        user_prefs.current_mood = Mood.HAPPY

        # Add some default color preferences via __dict__
        user_prefs.__dict__['color_preferences'] = [
            ColorPreference(palette=ColorPalette.VIBRANT, weight=1.0),
            ColorPreference(palette=ColorPalette.PASTEL, weight=0.5),
            ColorPreference(palette=ColorPalette.DARK, weight=-1.0),
            VisualStylePreference(style=VisualStyle.DETAILED, weight=1.0)
        ]

    print(f"User preferences set up with ID: {user_prefs.user_id}")
    return user_prefs

def display_color_profile(recommendation: RecommendationResult):
    """Display a visualization of the anime's color profile.

    Args:
        recommendation: The recommendation result to display
    """
    print(f"\n{BOLD}Color Profile:{RESET}")

    # Get the visual profile if it exists
    if hasattr(recommendation.anime, 'visual_profile') and recommendation.anime.visual_profile:
        profile = recommendation.anime.visual_profile

        # Display dominant colors
        if profile.dominant_colors:
            print("  Dominant Colors:")
            color_row = "  "
            for color in profile.dominant_colors:
                color_row += color_block(color[0], color[1], color[2], "    ")
            print(color_row)

        # Display top color palettes
        print("\n  Color Palettes:")
        sorted_palettes = sorted(
            profile.color_palettes.items(),
            key=lambda x: x[1],
            reverse=True
        )
        for palette, score in sorted_palettes[:3]:
            if score > 0.2:  # Only show significant palettes
                print(f"    • {palette.value.title()}: {score:.2f}")

        # Display brightness and saturation
        print(f"\n  Brightness: {profile.brightness:.2f}")
        print(f"  Saturation: {profile.saturation:.2f}")
        print(f"  Contrast: {profile.contrast:.2f}")

    else:
        print("  No color profile available for this anime.")

def display_recommendations(recommendations: List[RecommendationResult], user_prefs: UserPreferences):
    """Display the recommendations with color information.

    Args:
        recommendations: List of recommendation results
        user_prefs: User preferences
    """
    print(f"\n{BOLD}{CYAN}=== Your Color-Enhanced Recommendations ==={RESET}\n")

    if not recommendations:
        print("No recommendations found that match your preferences.")
        return

    print(f"Top {len(recommendations)} Recommendations:\n")

    for i, rec in enumerate(recommendations):
        # Create a header with the score
        score_color = GREEN if rec.score > 0.7 else (YELLOW if rec.score > 0.4 else RED)
        header = f"{BOLD}{i+1}. {rec.anime.title}{RESET} (Score: {score_color}{rec.score:.2f}{RESET})"
        print(header)

        # Display basic info
        genres = ", ".join(rec.anime.genres)
        print(f"   Genres: {genres}")

        if rec.anime.studios:
            studios = ", ".join(rec.anime.studios)
            print(f"   Studio: {studios}")

        # Display explanation if available
        if rec.explanation:
            print(f"   Why: {rec.explanation}")

        # Display color profile visualization
        display_color_profile(rec)

        # Display trailer info if available
        if rec.trailer_url:
            print(f"\n   {BOLD}Trailer:{RESET} {rec.trailer_title}")
            print(f"   Channel: {rec.trailer_channel}")
            print(f"   Watch: {BLUE}{rec.trailer_url}{RESET}")
            print(f"   Thumbnail: {rec.trailer_thumbnail}")

        print("\n" + "─" * 50 + "\n")

    # Print user's genre preferences for reference
    print(f"{BOLD}Your genre preferences:{RESET}")
    for genre, weight in user_prefs.genre_preferences.items():
        print(f"  {genre}: {weight}")

    # Print user's color preferences
    print(f"\n{BOLD}Your color preferences:{RESET}")
    for pref in user_prefs.color_preferences:
        if hasattr(pref, 'palette'):
            weight_color = GREEN if pref.weight > 0 else RED
            print(f"  {pref.palette.value}: {weight_color}{pref.weight}{RESET}")
        elif hasattr(pref, 'style'):
            weight_color = GREEN if pref.weight > 0 else RED
            print(f"  Style - {pref.style.value}: {weight_color}{pref.weight}{RESET}")

def main():
    """Main entry point for the script."""
    # Parse command line arguments - simplified for no-API demo
    parser = argparse.ArgumentParser(description="No API Keys Demo - Color-Based Anime Recommendation")
    parser.add_argument("-i", "--interactive", action="store_true", help="Use interactive prompts")
    parser.add_argument("--limit", type=int, default=3, help="Number of recommendations to display")
    args = parser.parse_args()

    # Display header
    display_header()

    print(f"\n{BOLD}{CYAN}Demo Version - No API Keys Required{RESET}")
    print("\nThis demo showcases the color palette analysis capabilities of the ani-sage")
    print("recommendation engine, making personalized recommendations based on your")
    print("color preferences and visual style preferences.")
    print(f"\n{YELLOW}Note: Running in demo mode without API keys - some features will use simulated data{RESET}")

    if args.interactive:
        input("Press Enter to begin the demo...")

    # Set up FZF prompt
    fzf = FzfPrompt()

    # Always create recommendation engine in demo mode
    engine = get_recommendation_engine(demo_mode=True)

    # Create sample anime database with all entries to have more choice
    anime_db = create_sample_anime_database(12)

    # Add anime to recommendation engine
    for anime_id, anime in anime_db.items():
        engine.add_anime(anime)

    # Set up user preferences
    user_prefs = setup_user_preferences(fzf, args.interactive)

    # Set up recommendation options
    print(f"\n{BOLD}{CYAN}=== Getting Recommendations ==={RESET}")
    options = RecommendationOptions(
        limit=args.limit,
        include_watched=False,
        mood_weight=0.3,
        genre_weight=0.3,
        studio_weight=0.1,
        sentiment_weight=0.1,
        color_weight=0.5,  # Higher weight for color-based recommendations
        generate_explanations=True,
        include_trailers=True,  # Include mock trailers in demo mode
        demo_mode=True  # Always use demo mode
    )

    print(f"{YELLOW}Running in demo mode - using simulated data{RESET}")

    # Get recommendations
    recommendations = engine.get_recommendations(user_prefs, options)

    # Display recommendations
    display_recommendations(recommendations, user_prefs)

    print(f"\n{GREEN}Demo completed successfully!{RESET}")

if __name__ == "__main__":
    # Configure logging
    configure_logging(log_level="INFO")
    logger = get_logger(__name__)

    # Run main function
    main()
