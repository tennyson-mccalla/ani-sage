#!/usr/bin/env python3
"""
Color Palette Demo Script

This script demonstrates the color palette analysis capabilities of the ani-sage
recommendation engine by visualizing different anime color palettes in the terminal.
"""

import os
import sys
import time
from enum import Enum
from pathlib import Path
from typing import Dict, List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ai.preferences.color_preferences import ColorPalette, VisualStyle
from src.utils.logging import get_logger, configure_logging

logger = get_logger(__name__)

# ANSI escape codes for colors and formatting
RESET = "\033[0m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"

# Function to create an ANSI color block
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

# Sample colors for each palette
PALETTE_COLORS = {
    ColorPalette.VIBRANT: [
        (255, 50, 50),    # Bright red
        (50, 255, 50),    # Bright green
        (50, 50, 255),    # Bright blue
        (255, 255, 50),   # Bright yellow
        (255, 50, 255),   # Bright magenta
    ],
    ColorPalette.PASTEL: [
        (255, 182, 193),  # Light pink
        (173, 216, 230),  # Light blue
        (144, 238, 144),  # Light green
        (255, 255, 224),  # Light yellow
        (221, 160, 221),  # Light purple
    ],
    ColorPalette.DARK: [
        (80, 0, 0),       # Dark red
        (0, 80, 0),       # Dark green
        (0, 0, 80),       # Dark blue
        (80, 80, 0),      # Dark yellow
        (80, 0, 80),      # Dark purple
    ],
    ColorPalette.MONOCHROME: [
        (0, 0, 0),        # Black
        (50, 50, 50),     # Dark gray
        (100, 100, 100),  # Medium gray
        (150, 150, 150),  # Light gray
        (255, 255, 255),  # White
    ],
    ColorPalette.HIGH_CONTRAST: [
        (255, 255, 255),  # White
        (0, 0, 0),        # Black
        (255, 0, 0),      # Pure red
        (0, 255, 0),      # Pure green
        (0, 0, 255),      # Pure blue
    ],
    ColorPalette.MUTED: [
        (128, 128, 105),  # Sage
        (169, 169, 169),  # Dark gray
        (160, 82, 45),    # Sienna
        (107, 142, 35),   # Olive drab
        (70, 130, 180),   # Steel blue
    ],
    ColorPalette.NEON: [
        (255, 0, 102),    # Neon pink
        (0, 255, 255),    # Neon cyan
        (255, 255, 0),    # Neon yellow
        (0, 255, 0),      # Neon green
        (255, 0, 255),    # Neon purple
    ],
    ColorPalette.WARM: [
        (255, 69, 0),     # Red-orange
        (255, 165, 0),    # Orange
        (255, 215, 0),    # Gold
        (210, 105, 30),   # Chocolate
        (233, 116, 81),   # Burnt sienna
    ],
    ColorPalette.COOL: [
        (0, 128, 128),    # Teal
        (100, 149, 237),  # Cornflower blue
        (106, 90, 205),   # Slate blue
        (72, 209, 204),   # Medium turquoise
        (123, 104, 238),  # Medium slate blue
    ],
    ColorPalette.EARTHY: [
        (85, 107, 47),    # Dark olive green
        (139, 69, 19),    # Saddle brown
        (160, 82, 45),    # Sienna
        (205, 133, 63),   # Peru
        (210, 180, 140),  # Tan
    ],
}

# Example anime titles for each color palette
ANIME_EXAMPLES = {
    ColorPalette.VIBRANT: ["Promare", "No Game No Life", "The Night is Short, Walk on Girl"],
    ColorPalette.PASTEL: ["My Neighbor Totoro", "Laid-Back Camp", "A Place Further Than the Universe"],
    ColorPalette.DARK: ["Attack on Titan", "Psycho-Pass", "Death Note"],
    ColorPalette.MONOCHROME: ["Afro Samurai", "Ping Pong The Animation", "Paprika (certain scenes)"],
    ColorPalette.HIGH_CONTRAST: ["Kill la Kill", "Mob Psycho 100", "One Punch Man"],
    ColorPalette.MUTED: ["Mushishi", "March Comes in Like a Lion", "Violet Evergarden"],
    ColorPalette.NEON: ["Redline", "Akira", "Promare"],
    ColorPalette.WARM: ["Samurai Champloo", "Cowboy Bebop", "The Tale of The Princess Kaguya"],
    ColorPalette.COOL: ["Ghost in the Shell", "Neon Genesis Evangelion", "Serial Experiments Lain"],
    ColorPalette.EARTHY: ["Princess Mononoke", "Mushishi", "Spice and Wolf"],
}

def display_color_palette(palette: ColorPalette):
    """Display a color palette with example colors.

    Args:
        palette: The color palette to display
    """
    palette_name = palette.value.upper()
    colors = PALETTE_COLORS[palette]
    examples = ANIME_EXAMPLES[palette]

    print(f"\n{BOLD}{UNDERLINE}{palette_name} COLOR PALETTE{RESET}\n")

    # Display color blocks
    color_row = ""
    for color in colors:
        color_row += color_block(color[0], color[1], color[2], "    ")
    print(color_row)
    print()

    # Display examples
    print(f"Example anime with {palette_name} palette:")
    for example in examples:
        print(f"  • {example}")
    print()

    # Display preference information
    print("User preference insight:")
    if palette == ColorPalette.VIBRANT:
        print("  Users who prefer vibrant colors often enjoy energetic, action-packed anime.")
    elif palette == ColorPalette.PASTEL:
        print("  Users who prefer pastel colors often enjoy slice-of-life, healing anime.")
    elif palette == ColorPalette.DARK:
        print("  Users who prefer dark colors often enjoy serious, psychological anime.")
    elif palette == ColorPalette.MONOCHROME:
        print("  Users who prefer monochrome often enjoy artistic, experimental anime.")
    elif palette == ColorPalette.HIGH_CONTRAST:
        print("  Users who prefer high contrast colors often enjoy visually striking anime.")
    elif palette == ColorPalette.MUTED:
        print("  Users who prefer muted colors often enjoy atmospheric, contemplative anime.")
    elif palette == ColorPalette.NEON:
        print("  Users who prefer neon colors often enjoy sci-fi, cyberpunk anime.")
    elif palette == ColorPalette.WARM:
        print("  Users who prefer warm colors often enjoy nostalgic, character-driven anime.")
    elif palette == ColorPalette.COOL:
        print("  Users who prefer cool colors often enjoy sci-fi, mysterious anime.")
    elif palette == ColorPalette.EARTHY:
        print("  Users who prefer earthy colors often enjoy historical, nature-themed anime.")
    print()

def display_visual_styles():
    """Display information about visual styles."""
    print(f"\n{BOLD}{UNDERLINE}VISUAL STYLES{RESET}\n")

    for style in VisualStyle:
        style_name = style.value.upper()
        print(f"{BOLD}{style_name}{RESET}")

        if style == VisualStyle.REALISTIC:
            print("  Examples: Monster, Vinland Saga, Jin-Roh")
            print("  Characterized by realistic proportions and detailed artwork.")
        elif style == VisualStyle.STYLIZED:
            print("  Examples: Gurren Lagann, Kill la Kill, Panty & Stocking")
            print("  Characterized by exaggerated features and unique visual flair.")
        elif style == VisualStyle.MINIMALIST:
            print("  Examples: Ping Pong The Animation, Tatami Galaxy, Kaiba")
            print("  Characterized by simplified character designs and backgrounds.")
        elif style == VisualStyle.DETAILED:
            print("  Examples: Violet Evergarden, Garden of Words, Demon Slayer")
            print("  Characterized by high level of detail in characters and backgrounds.")
        elif style == VisualStyle.SKETCH:
            print("  Examples: The Tatami Galaxy, Ping Pong The Animation, Mind Game")
            print("  Characterized by rough, sketch-like quality to the art.")
        elif style == VisualStyle.WATERCOLOR:
            print("  Examples: The Tale of The Princess Kaguya, Children of the Sea")
            print("  Characterized by soft, watercolor-like appearance and textures.")
        elif style == VisualStyle.CHIBI:
            print("  Examples: Lucky Star, Himouto! Umaru-chan, Nichijou (certain scenes)")
            print("  Characterized by super-deformed, cute style with large heads.")
        elif style == VisualStyle.RETRO:
            print("  Examples: Lupin III, Cowboy Bebop, City Hunter")
            print("  Characterized by classic anime look typical of older productions.")
        elif style == VisualStyle.MODERN:
            print("  Examples: Demon Slayer, Jujutsu Kaisen, My Hero Academia")
            print("  Characterized by contemporary style with digital enhancements.")
        elif style == VisualStyle.EXPERIMENTAL:
            print("  Examples: Mind Game, Angel's Egg, Paprika")
            print("  Characterized by unique, unusual approaches to animation.")
        print()

def explain_importance():
    """Explain the importance of color preference processing."""
    print(f"\n{BOLD}{UNDERLINE}WHY COLOR PREFERENCES MATTER{RESET}\n")
    print("Color palette and visual style preferences provide valuable insights into user taste:")
    print("  • Visual appeal is often the first thing that attracts viewers to an anime")
    print("  • Color palettes can evoke specific emotions and set the tone")
    print("  • Visual styles often correlate with genre and content preferences")
    print("  • Studios tend to have signature visual styles that appeal to specific audiences")
    print()
    print("Our recommendation engine can use these preferences to:")
    print("  • Find visually similar anime to users' favorites")
    print("  • Recommend anime with complementary visual styles")
    print("  • Balance content and visual preferences for better matches")
    print("  • Discover hidden gems with appealing aesthetics")
    print()

def explain_technical_implementation():
    """Explain the technical implementation of color preference processing."""
    print(f"\n{BOLD}{UNDERLINE}TECHNICAL IMPLEMENTATION{RESET}\n")
    print("The color preference system uses several advanced techniques:")
    print()
    print("1. Image Analysis")
    print("   • Extract frames from anime videos")
    print("   • Analyze color histograms to identify dominant colors")
    print("   • Classify scenes based on brightness, saturation, and contrast")
    print()
    print("2. Palette Classification")
    print("   • Map extracted colors to predefined palettes")
    print("   • Determine percentage of scenes using each palette")
    print("   • Identify transitions between color schemes")
    print()
    print("3. Visual Style Detection")
    print("   • Analyze line density and complexity")
    print("   • Measure detail level in character designs")
    print("   • Detect signature styles of studios and directors")
    print()
    print("4. Preference Matching")
    print("   • Calculate similarity between user color preferences and anime profiles")
    print("   • Weigh visual factors alongside genre and content preferences")
    print("   • Adjust recommendations based on seasonal viewing patterns")
    print()

def main():
    """Run the color palette demo."""
    # Configure logging
    configure_logging(log_level="INFO")

    print("===================================================")
    print("  ani-sage AI Features Demo: Color Palette Analysis  ")
    print("===================================================")
    print()
    print("This demo showcases how the ani-sage recommendation engine")
    print("analyzes and utilizes color palettes and visual styles to")
    print("enhance anime recommendations.")
    print()

    # Check if terminal supports colors
    if os.environ.get("TERM") == "dumb" or not sys.stdout.isatty():
        print("Warning: Your terminal may not support ANSI colors.")
        print("Colors might not display correctly.")
        print()

    input("Press Enter to begin the demo...")

    # Display all color palettes
    for palette in ColorPalette:
        display_color_palette(palette)
        time.sleep(0.5)  # Pause between palettes

    # Display visual styles
    display_visual_styles()

    # Explain importance
    explain_importance()

    # Explain technical implementation
    explain_technical_implementation()

    print("\nDemo completed successfully!")


if __name__ == "__main__":
    main()
