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

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ai.models.anime import Anime, AnimeType, AnimeStatus, AnimeSeason
from src.ai.recommendation.engine import get_recommendation_engine, RecommendationOptions
from src.ai.sentiment.analyzer import get_sentiment_analyzer
from src.ai.preferences.user_preferences import get_user_preferences, Mood
from src.utils.logging import get_logger, configure_logging

logger = get_logger(__name__)

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


def analyze_anime_sentiments(anime_list: List[Anime]) -> List[Anime]:
    """Analyze sentiments for a list of anime.

    Args:
        anime_list: List of anime to analyze

    Returns:
        List[Anime]: The analyzed anime with sentiment data
    """
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


def setup_user_preferences() -> str:
    """Set up user preferences interactively.

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


def get_recommendations(user_id: str, anime_list: List[Anime]) -> None:
    """Get and display recommendations for a user.

    Args:
        user_id: User ID to get recommendations for
        anime_list: List of anime to recommend from
    """
    print("\n=== Generating Recommendations ===")

    # Get recommendation engine and user preferences
    engine = get_recommendation_engine()
    user_prefs = get_user_preferences(user_id)

    # Add anime to the recommendation engine
    engine.add_anime_batch(anime_list)

    # Set up recommendation options
    options = RecommendationOptions(
        limit=3,
        include_watched=False,
        mood_weight=0.7,
        genre_weight=0.8,
        sentiment_weight=0.6,
        generate_explanations=True
    )

    # Get recommendations
    print(f"Getting recommendations for user with mood: {user_prefs.current_mood.value}")
    recs = engine.get_recommendations(user_prefs, options)

    # Display recommendations
    print(f"\nTop {len(recs)} Recommendations:")
    for i, rec in enumerate(recs):
        print(f"\n{i+1}. {rec.anime.title} (Score: {rec.score:.2f})")
        print(f"   Genres: {', '.join(rec.anime.genres)}")
        print(f"   Studio: {', '.join(rec.anime.studios)}")
        if rec.explanation:
            print(f"   Why: {rec.explanation}")

    # Display genre preferences for reference
    print("\nYour genre preferences:")
    for genre, weight in sorted(user_prefs.genre_preferences.items()):
        if abs(weight) > 0.1:
            print(f"  {genre}: {weight:.1f}")


def main():
    """Run the recommendation demo."""
    # Configure logging
    configure_logging(log_level="INFO")

    print("===================================================")
    print("  ani-sage AI Features Demo: Recommendation Engine  ")
    print("===================================================")

    # Check if OpenAI API key is available
    if not os.environ.get("OPENAI_API_KEY"):
        print("\nWarning: No OpenAI API key found in environment variables.")
        print("For best results, please set the OPENAI_API_KEY environment variable.")
        print("You can also set up the API key using the setup_openai.py script.")

        key = input("\nWould you like to enter an OpenAI API key now? (y/n): ")
        if key.lower() == 'y':
            api_key = input("Enter OpenAI API key: ")
            os.environ["OPENAI_API_KEY"] = api_key
        else:
            print("Running without API key. Demo will use mock data.")

    # Create anime objects
    anime_list = [create_anime_object(anime) for anime in SAMPLE_ANIME]

    # Analyze sentiment for each anime
    anime_list = analyze_anime_sentiments(anime_list)

    # Set up user preferences
    user_id = setup_user_preferences()

    # Get recommendations
    get_recommendations(user_id, anime_list)

    print("\nDemo completed successfully!")


if __name__ == "__main__":
    main()
