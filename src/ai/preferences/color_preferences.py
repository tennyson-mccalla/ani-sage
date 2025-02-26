"""
Color preference processing for anime recommendations.

This module provides functionality to analyze, store, and apply user color preferences
to enhance anime recommendations based on visual style and color palette.
"""

from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Union
import math

from pydantic import BaseModel, Field

from src.utils.logging import get_logger

logger = get_logger(__name__)


class ColorPalette(str, Enum):
    """Common anime color palettes."""
    VIBRANT = "vibrant"          # Bright, saturated colors
    PASTEL = "pastel"            # Soft, desaturated colors
    DARK = "dark"                # Dark, low-key colors
    MONOCHROME = "monochrome"    # Black and white or single color
    HIGH_CONTRAST = "high_contrast"  # Sharp contrasts between colors
    MUTED = "muted"              # Subdued, natural colors
    NEON = "neon"                # Extremely bright, often unnatural colors
    WARM = "warm"                # Red, orange, yellow dominant
    COOL = "cool"                # Blue, green, purple dominant
    EARTHY = "earthy"            # Brown, green, tan dominant


class VisualStyle(str, Enum):
    """Common anime visual styles."""
    REALISTIC = "realistic"      # Detailed, realistic proportions
    STYLIZED = "stylized"        # Exaggerated features
    MINIMALIST = "minimalist"    # Simple, clean designs
    DETAILED = "detailed"        # High level of detail
    SKETCH = "sketch"            # Rough, sketch-like quality
    WATERCOLOR = "watercolor"    # Soft, watercolor-like appearance
    CHIBI = "chibi"              # Super-deformed, cute style
    RETRO = "retro"              # Classic anime look
    MODERN = "modern"            # Contemporary style
    EXPERIMENTAL = "experimental"  # Unique, unusual approaches


class ColorPreference(BaseModel):
    """User preference for color palettes and visual styles."""
    palette: ColorPalette
    weight: float = Field(..., description="Preference weight from -1.0 to 1.0")


class VisualStylePreference(BaseModel):
    """User preference for visual styles."""
    style: VisualStyle
    weight: float = Field(..., description="Preference weight from -1.0 to 1.0")


class AnimeVisualProfile(BaseModel):
    """Visual profile of an anime's color and style characteristics."""

    # Color information
    color_palettes: Dict[ColorPalette, float] = Field(
        default_factory=dict,
        description="Presence of different color palettes from 0.0 to 1.0"
    )

    # Style information
    visual_styles: Dict[VisualStyle, float] = Field(
        default_factory=dict,
        description="Presence of different visual styles from 0.0 to 1.0"
    )

    # Dominant colors (RGB values)
    dominant_colors: List[Tuple[int, int, int]] = Field(
        default_factory=list,
        description="List of dominant RGB colors"
    )

    # Brightness and saturation overall
    brightness: float = Field(
        0.0,
        description="Overall brightness from 0.0 (dark) to 1.0 (bright)"
    )
    saturation: float = Field(
        0.0,
        description="Overall color saturation from 0.0 (desaturated) to 1.0 (vivid)"
    )
    contrast: float = Field(
        0.0,
        description="Overall contrast from 0.0 (low) to 1.0 (high)"
    )


class ColorPreferenceProcessor:
    """Processor for managing and applying color preferences."""

    def __init__(self):
        """Initialize the color preference processor."""
        logger.debug("Color preference processor initialized")

    def analyze_image(self, image_data: bytes) -> AnimeVisualProfile:
        """Analyze an image to extract its visual profile.

        Args:
            image_data: Raw image data bytes

        Returns:
            AnimeVisualProfile: The extracted visual profile

        Note:
            This is a placeholder for actual image analysis. In a real implementation,
            this would use computer vision libraries like OpenCV to analyze the image.
        """
        # This is a placeholder - actual implementation would analyze the image
        logger.debug("Image analysis placeholder called")

        # Return an empty profile (would be filled with actual data)
        return AnimeVisualProfile()

    def extract_palette_from_screenshots(self, screenshots: List[bytes]) -> AnimeVisualProfile:
        """Extract a visual profile from multiple anime screenshots.

        Args:
            screenshots: List of screenshot image data

        Returns:
            AnimeVisualProfile: The consolidated visual profile
        """
        # Analyze each screenshot
        profiles = [self.analyze_image(img) for img in screenshots]

        # Combine profiles
        combined_profile = AnimeVisualProfile()

        # Average color palettes
        palette_sums = {}
        for profile in profiles:
            for palette, value in profile.color_palettes.items():
                palette_sums[palette] = palette_sums.get(palette, 0.0) + value

        # Average across all screenshots
        for palette, total in palette_sums.items():
            combined_profile.color_palettes[palette] = total / len(profiles)

        # Similarly for visual styles
        style_sums = {}
        for profile in profiles:
            for style, value in profile.visual_styles.items():
                style_sums[style] = style_sums.get(style, 0.0) + value

        for style, total in style_sums.items():
            combined_profile.visual_styles[style] = total / len(profiles)

        # Average brightness, saturation, contrast
        combined_profile.brightness = sum(p.brightness for p in profiles) / len(profiles)
        combined_profile.saturation = sum(p.saturation for p in profiles) / len(profiles)
        combined_profile.contrast = sum(p.contrast for p in profiles) / len(profiles)

        # For dominant colors, take the most common across all screenshots
        # This is simplified - a real implementation would use clustering
        combined_profile.dominant_colors = []
        for profile in profiles:
            combined_profile.dominant_colors.extend(profile.dominant_colors)

        # Limit to most common colors
        if combined_profile.dominant_colors:
            combined_profile.dominant_colors = combined_profile.dominant_colors[:5]

        return combined_profile

    def calculate_visual_similarity(self, profile1: AnimeVisualProfile, profile2: AnimeVisualProfile) -> float:
        """Calculate visual similarity between two anime profiles.

        Args:
            profile1: First visual profile
            profile2: Second visual profile

        Returns:
            float: Similarity score from 0.0 to 1.0
        """
        # Calculate palette similarity
        palette_similarity = 0.0
        palette_count = 0

        for palette in ColorPalette:
            value1 = profile1.color_palettes.get(palette, 0.0)
            value2 = profile2.color_palettes.get(palette, 0.0)

            if value1 > 0 or value2 > 0:
                palette_similarity += 1.0 - abs(value1 - value2)
                palette_count += 1

        if palette_count > 0:
            palette_similarity /= palette_count

        # Calculate style similarity
        style_similarity = 0.0
        style_count = 0

        for style in VisualStyle:
            value1 = profile1.visual_styles.get(style, 0.0)
            value2 = profile2.visual_styles.get(style, 0.0)

            if value1 > 0 or value2 > 0:
                style_similarity += 1.0 - abs(value1 - value2)
                style_count += 1

        if style_count > 0:
            style_similarity /= style_count

        # Calculate property similarity
        property_similarity = (
            (1.0 - abs(profile1.brightness - profile2.brightness)) +
            (1.0 - abs(profile1.saturation - profile2.saturation)) +
            (1.0 - abs(profile1.contrast - profile2.contrast))
        ) / 3.0

        # Combine similarities with weights
        return (0.4 * palette_similarity + 0.4 * style_similarity + 0.2 * property_similarity)

    def calculate_preference_match(self, profile: AnimeVisualProfile, color_preferences: Dict[ColorPalette, float],
                                style_preferences: Dict[VisualStyle, float]) -> float:
        """Calculate how well an anime's visual profile matches user preferences.

        Args:
            profile: The anime's visual profile
            color_preferences: User's color palette preferences (-1.0 to 1.0)
            style_preferences: User's visual style preferences (-1.0 to 1.0)

        Returns:
            float: Match score from 0.0 to 1.0
        """
        # Calculate color palette match
        palette_match = 0.0
        palette_weight_sum = 0.0

        for palette, pref_value in color_preferences.items():
            # Convert preference (-1 to 1) to weight (0 to 1)
            weight = abs(pref_value)
            palette_weight_sum += weight

            # Get profile value
            profile_value = profile.color_palettes.get(palette, 0.0)

            # For negative preferences, we want low profile values
            if pref_value < 0:
                match_value = 1.0 - profile_value
            else:
                match_value = profile_value

            palette_match += weight * match_value

        if palette_weight_sum > 0:
            palette_match /= palette_weight_sum

        # Calculate visual style match
        style_match = 0.0
        style_weight_sum = 0.0

        for style, pref_value in style_preferences.items():
            # Convert preference (-1 to 1) to weight (0 to 1)
            weight = abs(pref_value)
            style_weight_sum += weight

            # Get profile value
            profile_value = profile.visual_styles.get(style, 0.0)

            # For negative preferences, we want low profile values
            if pref_value < 0:
                match_value = 1.0 - profile_value
            else:
                match_value = profile_value

            style_match += weight * match_value

        if style_weight_sum > 0:
            style_match /= style_weight_sum

        # Combine matches with weights
        if palette_weight_sum > 0 and style_weight_sum > 0:
            return (0.6 * palette_match + 0.4 * style_match)
        elif palette_weight_sum > 0:
            return palette_match
        elif style_weight_sum > 0:
            return style_match
        else:
            return 0.5  # Neutral score if no preferences


# Singleton instance
_color_processor = None


def get_color_processor() -> ColorPreferenceProcessor:
    """Get the singleton color preference processor.

    Returns:
        ColorPreferenceProcessor: The processor instance
    """
    global _color_processor
    if _color_processor is None:
        _color_processor = ColorPreferenceProcessor()
    return _color_processor
