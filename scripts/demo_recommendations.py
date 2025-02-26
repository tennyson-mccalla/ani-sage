#!/usr/bin/env python3
"""
Recommendation Engine Demo Script

This script demonstrates the complete workflow of the ani-sage AI features,
from sentiment analysis to personalized recommendations.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional
import argparse

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import dotenv for environment variable management
try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

# Import pyfzf for interactive selection
try:
    from pyfzf import FzfPrompt
    FZF_AVAILABLE = True
except ImportError:
    FZF_AVAILABLE = False

from src.ai.models.anime import Anime, AnimeType, AnimeStatus, AnimeSeason
from src.ai.recommendation.engine import get_recommendation_engine, RecommendationOptions
from src.ai.sentiment.analyzer import get_sentiment_analyzer
from src.ai.preferences.user_preferences import get_user_preferences, Mood
from src.utils.logging import get_logger, configure_logging

logger = get_logger(__name__)

# ANSI color codes for terminal formatting
RESET = "\033[0m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"

# Sample anime descriptions for demo purposes
SAMPLE_ANIME = [
    {
        "id": "1",
        "title": "Attack on Titan",
        "synopsis": "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason, a young boy named Eren Yeager dreams of exploring the outside world beyond the walls. But his peaceful life is shattered when a Titan breaches the wall and his mother is eaten. Vowing revenge and to reclaim the world from the Titans, Eren and his friends Mikasa and Armin enlist in the Scout Regiment, an elite group of soldiers who fight Titans outside the walls.",
        "genres": ["action", "drama", "fantasy", "shounen"],
        "studios": ["Wit Studio", "MAPPA"],
        "type": "TV",
        "episodes": 75,
        "year": 2013
    },
    {
        "id": "2",
        "title": "Your Lie in April",
        "synopsis": "Piano prodigy Kousei Arima dominated the competition and all child musicians knew his name. But after his mother, who was also his instructor, passed away, he had a mental breakdown while performing at a recital. This resulted in him no longer being able to hear the sound of his piano even though his hearing was perfectly fine. Even two years later, Kousei hasn't touched the piano and views the world in monotone. He was content living out his life with his good friends Tsubaki and Watari until, one day, a girl changed everything. Kaori Miyazono is a violinist whose playing style reflects her personality. This free-spirited girl helps Kousei return to the music world and shows that it should be free and mold-breaking unlike the structured and rigid style Kousei was used to.",
        "genres": ["drama", "music", "romance", "slice_of_life"],
        "studios": ["A-1 Pictures"],
        "type": "TV",
        "episodes": 22,
        "year": 2014
    },
    {
        "id": "3",
        "title": "My Hero Academia",
        "synopsis": "In a world where people with superpowers known as 'Quirks' are the norm, Izuku Midoriya has dreams of one day becoming a hero, despite being bullied by his classmates for not having a Quirk. After being the only one to try and save his childhood friend from a villain, the world's greatest hero, All Might, bestows upon him his own Quirk, 'One For All'. The story follows Izuku's entrance into U.A. High School, a school that cultivates the next generation of heroes.",
        "genres": ["action", "comedy", "shounen", "super_power"],
        "studios": ["Bones"],
        "type": "TV",
        "episodes": 88,
        "year": 2016
    },
    {
        "id": "4",
        "title": "Violet Evergarden",
        "synopsis": "The Great War finally came to an end after four long years of conflict; fractured and worn, the continent of Telesis slowly began to flourish once again. Caught up in the bloodshed was Violet Evergarden, a young girl raised for the sole purpose of decimating enemy lines. Hospitalized and maimed in a bloody skirmish during the War's final leg, she was left with only words from the person she held dearest, but with no understanding of their meaning. Recovering from her wounds, Violet starts a new life working at CH Postal Services after a falling out with her new intended guardian family. There, she witnesses by pure chance the work of an 'Auto Memory Doll,' amanuenses that transcribe people's thoughts and feelings into words on paper. Moved by the notion, Violet begins work as an Auto Memory Doll, a trade that will take her on an adventure, one that will reshape the lives of her clients and perhaps even her own.",
        "genres": ["drama", "fantasy", "slice_of_life"],
        "studios": ["Kyoto Animation"],
        "type": "TV",
        "episodes": 13,
        "year": 2018
    },
    {
        "id": "5",
        "title": "Demon Slayer",
        "synopsis": "Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado's shoulders. Though living impoverished on a remote mountain, the Kamado family are able to enjoy a relatively peaceful and happy life. One day, Tanjirou decides to go down to the local village to make a little money selling charcoal. On his way back, night falls, forcing Tanjirou to take shelter in the house of a strange man, who warns him of the existence of flesh-eating demons that lurk in the woods at night. When he finally arrives back home the next day, he is met with a horrifying sight—his whole family has been slaughtered. Worse still, the sole survivor is his sister Nezuko, who has been turned into a bloodthirsty demon. Consumed by rage and hatred, Tanjirou swears to avenge his family and stay by his only remaining sibling. Alongside the mysterious group calling themselves the Demon Slayer Corps, Tanjirou will do whatever it takes to slay the demons and protect the remnants of his beloved sister's humanity.",
        "genres": ["action", "demons", "historical", "shounen", "supernatural"],
        "studios": ["ufotable"],
        "type": "TV",
        "episodes": 26,
        "year": 2019
    },
    {
        "id": "6",
        "title": "A Place Further Than The Universe",
        "synopsis": "Filled with an overwhelming sense of wonder for the world around her, Mari Tamaki has always dreamed of what lies beyond the reaches of the universe. However, despite harboring such large aspirations on the inside, her fear of the unknown and anxiety over her own possible limitations have always held her back from chasing them. But now, in her second year of high school, Mari is more determined than ever to not let any more of her youth go to waste. Still, her fear continues to prevent her from taking that ambitious step forward—that is, until she has a chance encounter with a girl who has grand dreams of her own. Spurred by her mother's disappearance, Shirase Kobuchizawa has been working hard to fund her trip to Antarctica. Despite facing doubt and ridicule from virtually everyone, Shirase is determined to embark on this expedition to search for her mother in a place further than the universe itself. Inspired by Shirase's resolve, Mari jumps at the chance to join her. Soon, their efforts attract the attention of the bubbly Hinata Miyake, who is eager to stand out, and Yuzuki Shiraishi, a polite girl from a high-class background. Together, they set sail toward the frozen south.",
        "genres": ["adventure", "comedy", "drama", "slice_of_life"],
        "studios": ["Madhouse"],
        "type": "TV",
        "episodes": 13,
        "year": 2018
    },
    {
        "id": "7",
        "title": "March Comes in Like a Lion",
        "synopsis": "Rei Kiriyama is a 17-year-old boy who recently started living alone, financed by his salary as a professional shogi player. Despite his independence, however, he's yet to mature emotionally, and his problems continue to haunt him in his daily life. His relationship with his adoptive family is strained, and he has difficulties interacting with his fellow high school students. Meanwhile, his professional career has entered a slump. Burdened with the heavy expectations placed on him as the fifth to become a professional in middle school, his wins and losses are fluctuating as his record and progression into the ranks begin to stagnate. Acquainted with Rei are the three Kawamoto sisters: Akari, Hinata, and Momo. Unlike Rei, they live happily in their modest home, which they warmly welcome Rei into as if he were one of their own. Despite his reservations about becoming too close to the family, he frequently visits, interacting with them and receiving the kind of care and affection he never quite had while under his foster home. This is the story of Rei's triumphs and failures, relationships new and old, and his growth as a person.",
        "genres": ["drama", "seinen", "slice_of_life"],
        "studios": ["Shaft"],
        "type": "TV",
        "episodes": 44,
        "year": 2016
    },
    {
        "id": "8",
        "title": "One Punch Man",
        "synopsis": "The seemingly ordinary and unimpressive Saitama has a rather unique hobby: being a hero. In order to pursue his childhood dream, he trained relentlessly for three years—and lost all of his hair in the process. Now, Saitama is incredibly powerful, so much so that no enemy is able to defeat him in battle. In fact, all it takes to defeat evildoers with just one punch has led to an unexpected problem—he is no longer able to enjoy the thrill of battling and has become quite bored. This all changes with the arrival of Genos, a 19-year-old cyborg, who wishes to be Saitama's disciple after seeing what he is capable of. Genos proposes that the two join the Hero Association in order to become certified heroes that will be recognized for their positive contributions to society, and Saitama, shocked that no one knows who he is, quickly agrees. And thus begins the story of One Punch Man, an action-comedy that follows an eccentric individual who longs to fight strong enemies that can hopefully give him the excitement he once felt and just maybe, he'll become popular in the process.",
        "genres": ["action", "comedy", "parody", "sci-fi", "seinen", "super_power", "supernatural"],
        "studios": ["Madhouse"],
        "type": "TV",
        "episodes": 12,
        "year": 2015
    }
]


def create_anime_object(anime_data: Dict) -> Anime:
    """Convert dictionary data to an Anime object.

    Args:
        anime_data: Dictionary containing anime data

    Returns:
        Anime: Created anime object
    """
    anime_type = AnimeType.TV
    if anime_data["type"] == "Movie":
        anime_type = AnimeType.MOVIE
    elif anime_data["type"] == "OVA":
        anime_type = AnimeType.OVA

    return Anime(
        id=anime_data["id"],
        title=anime_data["title"],
        synopsis=anime_data["synopsis"],
        genres=anime_data["genres"],
        studios=anime_data["studios"],
        type=anime_type,
        episodes=anime_data["episodes"],
        year=anime_data["year"],
        status=AnimeStatus.FINISHED
    )


def create_sample_anime() -> List[Anime]:
    """Create sample anime objects from the SAMPLE_ANIME data.

    Returns:
        List[Anime]: List of anime objects
    """
    print("\n=== Creating Sample Anime Database ===")
    anime_list = [create_anime_object(anime) for anime in SAMPLE_ANIME]
    print(f"Created {len(anime_list)} sample anime entries")
    return anime_list


def analyze_anime_sentiments(anime_list: List[Anime], engine=None) -> List[Anime]:
    """Analyze sentiments for a list of anime.

    Args:
        anime_list: List of anime to analyze
        engine: Optional recommendation engine instance to use

    Returns:
        List[Anime]: The analyzed anime with sentiment data
    """
    if engine is None:
        engine = get_recommendation_engine()

    print("\n=== Analyzing Anime Sentiments ===")
    for i, anime in enumerate(anime_list):
        print(f"\nAnalyzing ({i+1}/{len(anime_list)}): {anime.title}")
        try:
            # Analyze and update the anime
            analyzed_anime = engine.analyze_anime_sentiment(anime)

            # Print some sentiment results
            print(f"  Positivity: {analyzed_anime.features.sentiment.get('positivity', 0):.2f}")
            print(f"  Intensity: {analyzed_anime.features.sentiment.get('intensity', 0):.2f}")

            # Print top emotions
            emotions = sorted(
                analyzed_anime.features.emotion_profile.items(),
                key=lambda x: x[1],
                reverse=True
            )
            if emotions:
                print("  Top emotions:")
                for emotion, score in emotions[:3]:
                    if score > 0.2:
                        print(f"    - {emotion}: {score:.2f}")

            anime_list[i] = analyzed_anime
        except Exception as e:
            print(f"  Error analyzing {anime.title}: {str(e)}")

    return anime_list


def setup_user_preferences(interactive=False) -> str:
    """Set up user preferences interactively.

    Args:
        interactive: Whether to use FZF interactive interface for selection

    Returns:
        str: The user ID
    """
    print("\n=== Setting Up User Preferences ===")

    # Create a unique user ID
    import uuid
    user_id = str(uuid.uuid4())[:8]

    # Get user preferences
    user_prefs = get_user_preferences(user_id)

    # Set up some preferences
    print("\nLet's set up some genre preferences...")
    genres = ["action", "adventure", "comedy", "drama", "fantasy", "horror",
             "mystery", "romance", "sci-fi", "slice_of_life", "sports", "supernatural"]

    # Use FZF for genre selection if interactive mode and FZF available
    if interactive and FZF_AVAILABLE:
        try:
            fzf = FzfPrompt()
            print("\nSelect genres you like (TAB to select multiple, ENTER to confirm):")
            selected_genres = fzf.prompt(genres, "--multi --header='Select genres you LIKE (TAB to select multiple)'")
            for genre in selected_genres:
                user_prefs.update_genre_preference(genre.lower(), 1.0)
                print(f"Added {genre} to liked genres.")

            print("\nSelect genres you dislike (TAB to select multiple, ENTER to confirm):")
            disliked_genres = fzf.prompt(genres, "--multi --header='Select genres you DISLIKE (TAB to select multiple)'")
            for genre in disliked_genres:
                user_prefs.update_genre_preference(genre.lower(), -1.0)
                print(f"Added {genre} to disliked genres.")
        except Exception as e:
            print(f"Error using FZF: {e}. Falling back to standard input.")
            interactive = False

    # Standard input method for genre selection
    if not interactive or not FZF_AVAILABLE:
        for genre in genres:
            try:
                rating = input(f"How do you feel about {genre}? (-1 to 1, or skip): ")
                if rating.strip():
                    user_prefs.update_genre_preference(genre, float(rating))
            except ValueError:
                print("Invalid input, skipping.")

    # Set mood
    print("\nWhat's your current mood?")
    moods = {
        "1": Mood.HAPPY,
        "2": Mood.SAD,
        "3": Mood.RELAXED,
        "4": Mood.EXCITED,
        "5": Mood.THOUGHTFUL,
        "6": Mood.ADVENTUROUS,
        "7": Mood.ROMANTIC,
        "8": Mood.MYSTERIOUS,
        "9": Mood.ANY
    }

    # Use FZF for mood selection if interactive mode and FZF available
    if interactive and FZF_AVAILABLE:
        try:
            mood_options = [f"{num}: {mood.value}" for num, mood in moods.items()]
            fzf = FzfPrompt()
            print("\nSelect your current mood:")
            selected_mood = fzf.prompt(mood_options, "--header='Select your current mood'")[0]
            mood_num = selected_mood.split(":")[0]
            if mood_num in moods:
                user_prefs.set_mood(moods[mood_num])
                print(f"Mood set to: {moods[mood_num].value}")
            else:
                print("Invalid choice, defaulting to ANY")
                user_prefs.set_mood(Mood.ANY)
        except Exception as e:
            print(f"Error using FZF: {e}. Falling back to standard input.")
            for num, mood in moods.items():
                print(f"{num}: {mood.value}")
            mood_choice = input("Select a mood (1-9): ")
            if mood_choice in moods:
                user_prefs.set_mood(moods[mood_choice])
            else:
                print("Invalid choice, defaulting to ANY")
                user_prefs.set_mood(Mood.ANY)
    else:
        for num, mood in moods.items():
            print(f"{num}: {mood.value}")
        mood_choice = input("Select a mood (1-9): ")
        if mood_choice in moods:
            user_prefs.set_mood(moods[mood_choice])
        else:
            print("Invalid choice, defaulting to ANY")
            user_prefs.set_mood(Mood.ANY)

    print(f"\nUser preferences set up with ID: {user_id}")
    return user_id


def get_recommendations(user_id, anime_list, include_trailers=True, limit=5, engine=None):
    """Get recommendations for the user.

    Args:
        user_id: User ID to get recommendations for
        anime_list: List of anime objects
        include_trailers: Whether to include trailers in results
        limit: Maximum number of recommendations
        engine: Optional recommendation engine instance to use
    """
    if not engine:
        # Attempt to get regular engine or fall back to simplified
        try:
            engine = get_recommendation_engine()
        except Exception:
            engine = get_fallback_recommendation_engine()

    print("\n=== Getting Recommendations ===")

    try:
        # Get user preferences
        user_prefs = get_user_preferences(user_id)

        # Check if engine has add_anime_batch method (real engine)
        if hasattr(engine, 'add_anime_batch'):
            # Add anime to the recommendation engine
            engine.add_anime_batch(anime_list)

            # Set up recommendation options
            options = RecommendationOptions(
                limit=limit,
                include_watched=False,
                mood_weight=0.7,
                genre_weight=0.8,
                sentiment_weight=0.6,
                generate_explanations=True,
                include_trailers=include_trailers
            )

            # Get recommendations using the standard interface
            recommendations = engine.get_recommendations(user_prefs, options)
        else:
            # Using our simplified engine that takes different parameters
            recommendations = engine.get_recommendations(
                anime_list=anime_list,
                user_id=user_id,
                limit=limit,
                include_trailers=include_trailers
            )

        # Display recommendations
        if not recommendations:
            print("No recommendations found.")
            return

        print(f"\nTop {len(recommendations)} Recommendations:")

        # Check the type of recommendations to determine how to display them
        if hasattr(engine, 'add_anime_batch'):  # Real engine returns recommendation objects
            for i, rec in enumerate(recommendations):
                print(f"\n{i+1}. {rec.anime.title} (Score: {rec.score:.2f})")
                print(f"   Genres: {', '.join(rec.anime.genres)}")
                print(f"   Studio: {', '.join(rec.anime.studios)}")
                if rec.explanation:
                    print(f"   Why: {rec.explanation}")

                # Display trailer information if available
                if rec.trailer_url:
                    print(f"\n   {GREEN}Trailer:{RESET} {rec.trailer_title}")
                    print(f"   {GREEN}Channel:{RESET} {rec.trailer_channel}")
                    print(f"   {GREEN}Watch:{RESET} {rec.trailer_url}")
                    print(f"   {GREEN}Thumbnail:{RESET} {rec.trailer_thumbnail}")
        else:  # Simplified engine returns anime objects directly
            for i, anime in enumerate(recommendations):
                print(f"\n{i+1}. {anime.title} ({anime.year})")

                # Print attributes
                print(f"   Genres: {', '.join(anime.genres)}")
                if hasattr(anime, 'themes') and anime.themes:
                    print(f"   Themes: {', '.join(anime.themes)}")

                # Print score if available
                if hasattr(anime, 'recommendation_score'):
                    print(f"   Match Score: {anime.recommendation_score:.2f}")

                # Print sentiment if available
                if hasattr(anime, 'features') and anime.features and anime.features.sentiment:
                    print("   Sentiment Analysis:")
                    for key, value in anime.features.sentiment.items():
                        print(f"     {key.capitalize()}: {value:.2f}")

                # Print emotions if available
                if hasattr(anime, 'features') and anime.features and anime.features.emotion_profile:
                    top_emotions = sorted(
                        anime.features.emotion_profile.items(),
                        key=lambda x: x[1],
                        reverse=True
                    )[:3]

                    if top_emotions:
                        emotions_str = ", ".join([f"{e} ({s:.2f})" for e, s in top_emotions])
                        print(f"   Top Emotions: {emotions_str}")

                # Print trailer if available
                if hasattr(anime, 'trailer_url') and anime.trailer_url:
                    print(f"   Trailer: {anime.trailer_url}")

        # Display genre preferences for reference
        print("\nYour genre preferences:")
        for genre, weight in sorted(user_prefs.genre_preferences.items()):
            if abs(weight) > 0.1:
                print(f"  {genre}: {weight:.1f}")

    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        import traceback
        traceback.print_exc()

    return


def check_api_keys():
    """Check for required API keys and log warnings if missing."""
    # Check if OpenAI API key is available
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        print(f"\n{YELLOW}Warning: No OpenAI API key found in environment variables.{RESET}")
        print("For best results, please set the OPENAI_API_KEY in your .env file.")
        print("Some features may not work correctly without a valid API key.")
    else:
        print(f"{GREEN}OpenAI API key found in environment.{RESET}")

    # Check if YouTube API key is available
    youtube_api_key = os.environ.get("YOUTUBE_API_KEY")
    if not youtube_api_key:
        print(f"\n{YELLOW}Warning: No YouTube API key found in environment variables.{RESET}")
        print("Trailer recommendations require a YouTube API key in your .env file.")
        print("Trailer lookups will be disabled.")
    else:
        print(f"{GREEN}YouTube API key found in environment.{RESET}")


def get_fallback_recommendation_engine():
    """Get a simplified recommendation engine that doesn't require API keys.

    This is used when no API keys are available but we still want to run the demo.

    Returns:
        A simplified recommendation engine object
    """
    print(f"\n{YELLOW}Using simplified recommendation engine without API integrations.{RESET}")

    # Import necessary modules
    from src.ai.recommendation.models import Recommendation

    # Create a simple object with the necessary methods for the demo
    class SimplifiedEngine:
        def __init__(self):
            self.anime_list = []

        def add_anime_batch(self, anime_list):
            """Add a batch of anime to the engine.

            Args:
                anime_list: List of anime to add
            """
            self.anime_list.extend(anime_list)
            print(f"Added {len(anime_list)} anime to recommendation engine.")

        def get_recommendations(self, user_prefs, options=None):
            """Return recommendations based on user preferences.

            Args:
                user_prefs: User preferences object
                options: Optional recommendation options

            Returns:
                List of recommendation objects
            """
            # Handle the case where the old interface is used
            if isinstance(user_prefs, str) and 'anime_list' in options:
                # This is a call from our simplified version
                user_id = user_prefs
                user_prefs = get_user_preferences(user_id)
                self.anime_list = options['anime_list']

            # Get limit from options
            limit = 10
            if options and hasattr(options, 'limit'):
                limit = options.limit

            # Filter anime based on preferences
            scores = []

            # Simple filtering logic
            for anime in self.anime_list:
                score = 0.5  # Base score

                # Check genres
                for genre in anime.genres:
                    if genre in user_prefs.genre_preferences:
                        score += user_prefs.genre_preferences[genre] * 0.2

                # Add a mood bonus if mood matches
                if user_prefs.current_mood == Mood.ANY:
                    # No specific mood preference
                    score += 0.1
                elif user_prefs.current_mood == Mood.HAPPY and hasattr(anime, 'features') and anime.features.sentiment:
                    # Bonus for happy anime when in happy mood
                    score += anime.features.sentiment.get('positivity', 0) * 0.2
                elif user_prefs.current_mood == Mood.SAD and hasattr(anime, 'features') and anime.features.sentiment:
                    # Bonus for emotional anime when in sad mood
                    score += anime.features.sentiment.get('intensity', 0) * 0.2

                # Create a recommendation object
                rec = Recommendation(
                    anime=anime,
                    score=min(1.0, max(0.0, score)),  # Clamp between 0 and 1
                    explanation=f"Matches {len([g for g in anime.genres if g in user_prefs.genre_preferences])} of your preferred genres."
                )

                scores.append(rec)

            # Sort by score
            scores.sort(key=lambda x: x.score, reverse=True)

            # Return top N results
            return scores[:limit]

    return SimplifiedEngine()


def main():
    """Run the recommendation engine demo."""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Anime recommendation demo")
    parser.add_argument("--no-trailers", action="store_true", help="Skip trailer lookup")
    parser.add_argument("--limit", type=int, default=10, help="Number of recommendations to show")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("-i", "--interactive", action="store_true", help="Use interactive FZF interface for selection")
    parser.add_argument("--demo-mode", action="store_true", help="Run in demo mode without API calls")

    args = parser.parse_args()

    # Configure logging
    log_level = "DEBUG" if args.verbose else "INFO"
    configure_logging(log_level=log_level)

    # Check if FZF is available when interactive mode is requested
    if args.interactive and not FZF_AVAILABLE:
        print("Warning: Interactive mode requested but pyfzf module not available.")
        print("Install with: pip install pyfzf")
        print("Falling back to standard input mode.\n")
        args.interactive = False

    # Load environment variables from .env file if dotenv is available
    if DOTENV_AVAILABLE:
        print("Loading environment variables from .env file...")
        load_dotenv()
    else:
        print(f"{YELLOW}Warning: python-dotenv is not installed. Environment variables will not be loaded from .env file.{RESET}")
        print("Install with: pip install python-dotenv")

    # Run the demo
    try:
        # Create sample anime objects
        anime_list = create_sample_anime()

        # Check if API keys are available in the environment (from .env)
        if not args.demo_mode:
            check_api_keys()
        else:
            print("\n=== Running in Demo Mode - Skipping API Key Checks ===")
            os.environ["OPENAI_API_KEY"] = "dummy-key"
            os.environ["YOUTUBE_API_KEY"] = "dummy-key"

        # Get the appropriate recommendation engine based on available API keys
        has_openai_api_key = bool(os.environ.get("OPENAI_API_KEY"))

        if has_openai_api_key and not args.demo_mode:
            try:
                engine = get_recommendation_engine()
            except Exception as e:
                print(f"{YELLOW}Error initializing recommendation engine: {str(e)}{RESET}")
                print("Falling back to simplified recommendation engine.")
                engine = get_fallback_recommendation_engine()
        else:
            engine = get_fallback_recommendation_engine()

        # Check if we should do sentiment analysis
        should_analyze_sentiments = not args.demo_mode and has_openai_api_key

        # Analyze sentiment for each anime (if we have an API key)
        if should_analyze_sentiments:
            try:
                anime_list = analyze_anime_sentiments(anime_list, engine)
            except Exception as e:
                print(f"{YELLOW}Error during sentiment analysis: {str(e)}{RESET}")
                print("Continuing with dummy sentiment data.")
                # Add dummy sentiment data
                for anime in anime_list:
                    anime.features.sentiment = {"positivity": 0.8, "intensity": 0.7}
                    anime.features.emotion_profile = {"joy": 0.7, "anticipation": 0.6, "trust": 0.5}
        else:
            if args.demo_mode:
                print("\n=== Demo Mode: Skipping Sentiment Analysis ===")
            else:
                print("\n=== Skipping Sentiment Analysis (No OpenAI API Key) ===")

            # Add some dummy sentiment data
            for anime in anime_list:
                anime.features.sentiment = {"positivity": 0.8, "intensity": 0.7}
                anime.features.emotion_profile = {"joy": 0.7, "anticipation": 0.6, "trust": 0.5}

        # Set up user preferences
        user_id = setup_user_preferences(args.interactive)

        # Determine if we should include trailers
        include_trailers = (
            not args.no_trailers and
            not args.demo_mode and
            os.environ.get("YOUTUBE_API_KEY") is not None
        )

        # Get recommendations
        get_recommendations(
            user_id=user_id,
            anime_list=anime_list,
            include_trailers=include_trailers,
            limit=args.limit,
            engine=engine
        )

        print("\nDemo completed successfully!")
        return 0

    except KeyboardInterrupt:
        print("\nDemo interrupted by user.")
        return 1
    except Exception as e:
        logger.exception("Error running demo")
        print(f"\nError: {e}")
        return 1


if __name__ == "__main__":
    main()
