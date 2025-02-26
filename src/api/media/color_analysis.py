"""
Color Analysis Module

This module provides functionality to extract and analyze color palettes from anime
thumbnails and trailer screenshots.
"""

import os
import requests
from io import BytesIO
from typing import Dict, List, Tuple, Optional
import logging
from PIL import Image
from colorthief import ColorThief

from src.ai.preferences.color_preferences import ColorPalette, AnimeVisualProfile
from src.utils.logging import get_logger

logger = get_logger(__name__)

def download_image(url: str) -> Optional[bytes]:
    """Download an image from a URL.

    Args:
        url: The URL of the image to download

    Returns:
        Optional[bytes]: The image data or None if download failed
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.error(f"Failed to download image from {url}: {str(e)}")
        return None

def extract_colors(image_data: bytes, color_count: int = 5) -> List[Tuple[int, int, int]]:
    """Extract dominant colors from image data.

    Args:
        image_data: Raw image data bytes
        color_count: Number of dominant colors to extract

    Returns:
        List[Tuple[int, int, int]]: List of RGB color tuples
    """
    try:
        img = Image.open(BytesIO(image_data))
        # Convert to RGB mode if necessary (e.g. if it's RGBA)
        if img.mode != "RGB":
            img.convert("RGB")

        # Save to a temporary file since ColorThief needs a file path
        temp_path = "temp_image.jpg"
        img.save(temp_path)

        # Extract colors
        color_thief = ColorThief(temp_path)
        palette = color_thief.get_palette(color_count=color_count, quality=10)

        # Clean up
        os.remove(temp_path)

        return palette
    except Exception as e:
        logger.error(f"Failed to extract colors: {str(e)}")
        return []

def get_color_brightness(color: Tuple[int, int, int]) -> float:
    """Calculate the brightness of a color on a scale from 0.0 to 1.0.

    Args:
        color: RGB color tuple

    Returns:
        float: Brightness value from 0.0 (darkest) to 1.0 (brightest)
    """
    r, g, b = color
    # Human eye perceives green as brighter than red, and red as brighter than blue
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255

def get_color_saturation(color: Tuple[int, int, int]) -> float:
    """Calculate the saturation of a color on a scale from 0.0 to 1.0.

    Args:
        color: RGB color tuple

    Returns:
        float: Saturation value from 0.0 (grayscale) to 1.0 (fully saturated)
    """
    r, g, b = color
    maximum = max(r, g, b)
    minimum = min(r, g, b)

    if maximum == 0:
        return 0.0

    delta = maximum - minimum
    saturation = delta / maximum

    return saturation

def determine_color_palette(colors: List[Tuple[int, int, int]]) -> Dict[ColorPalette, float]:
    """Determine which color palettes are present based on a set of colors.

    Args:
        colors: List of RGB color tuples

    Returns:
        Dict[ColorPalette, float]: Dictionary mapping palettes to their presence (0.0-1.0)
    """
    palette_scores = {palette: 0.0 for palette in ColorPalette}

    if not colors:
        return palette_scores

    # Calculate average brightness and saturation
    avg_brightness = sum(get_color_brightness(color) for color in colors) / len(colors)
    avg_saturation = sum(get_color_saturation(color) for color in colors) / len(colors)

    # Calculate contrast
    if len(colors) >= 2:
        brightnesses = [get_color_brightness(color) for color in colors]
        contrast = max(brightnesses) - min(brightnesses)
    else:
        contrast = 0.0

    # Analyze hues
    reds = []
    greens = []
    blues = []

    for r, g, b in colors:
        reds.append(r)
        greens.append(g)
        blues.append(b)

    # Check for vibrant colors
    if avg_saturation > 0.7 and avg_brightness > 0.5:
        palette_scores[ColorPalette.VIBRANT] = min(1.0, avg_saturation * 1.2)

    # Check for pastel colors
    if avg_saturation < 0.5 and avg_brightness > 0.7:
        palette_scores[ColorPalette.PASTEL] = min(1.0, (1.0 - avg_saturation) * avg_brightness * 1.5)

    # Check for dark colors
    if avg_brightness < 0.3:
        palette_scores[ColorPalette.DARK] = min(1.0, (1.0 - avg_brightness) * 2.0)

    # Check for monochrome
    color_variance = sum(abs(r - g) + abs(g - b) + abs(b - r) for r, g, b in colors) / len(colors)
    if color_variance < 100:  # This threshold can be tuned
        palette_scores[ColorPalette.MONOCHROME] = min(1.0, (300 - color_variance) / 300)

    # Check for high contrast
    if contrast > 0.7:
        palette_scores[ColorPalette.HIGH_CONTRAST] = min(1.0, contrast * 1.2)

    # Check for muted colors
    if avg_saturation < 0.4 and avg_brightness < 0.7:
        palette_scores[ColorPalette.MUTED] = min(1.0, (1.0 - avg_saturation) * (1.0 - avg_brightness) * 2.0)

    # Check for neon colors
    neon_score = 0.0
    for r, g, b in colors:
        # Neon colors typically have one very high channel and sometimes a second high channel
        max_val = max(r, g, b)
        if max_val > 200 and avg_saturation > 0.8:
            neon_score += 0.2
    palette_scores[ColorPalette.NEON] = min(1.0, neon_score)

    # Check for warm colors (reds, oranges, yellows)
    warm_score = 0.0
    for r, g, b in colors:
        if r > max(g, b) + 50 or (r > 150 and g > 150 and b < 100):
            warm_score += 0.2
    palette_scores[ColorPalette.WARM] = min(1.0, warm_score)

    # Check for cool colors (blues, greens, purples)
    cool_score = 0.0
    for r, g, b in colors:
        if b > max(r, g) + 50 or g > max(r, b) + 50:
            cool_score += 0.2
    palette_scores[ColorPalette.COOL] = min(1.0, cool_score)

    # Check for earthy colors (browns, greens, tans)
    earthy_score = 0.0
    for r, g, b in colors:
        # Brown and tan tones have red and green higher than blue, with moderate saturation
        if r > b + 20 and g > b + 20 and avg_saturation < 0.6:
            earthy_score += 0.2
    palette_scores[ColorPalette.EARTHY] = min(1.0, earthy_score)

    return palette_scores

def create_visual_profile_from_thumbnail(thumbnail_url: str) -> Optional[AnimeVisualProfile]:
    """Create a visual profile from an anime thumbnail.

    Args:
        thumbnail_url: URL of the anime thumbnail

    Returns:
        Optional[AnimeVisualProfile]: Visual profile or None if processing failed
    """
    # Download the image
    image_data = download_image(thumbnail_url)
    if not image_data:
        return None

    # Extract colors
    colors = extract_colors(image_data)
    if not colors:
        return None

    # Create visual profile
    profile = AnimeVisualProfile()

    # Set dominant colors
    profile.dominant_colors = colors

    # Determine color palettes
    profile.color_palettes = determine_color_palette(colors)

    # Calculate average brightness and saturation
    profile.brightness = sum(get_color_brightness(color) for color in colors) / len(colors)
    profile.saturation = sum(get_color_saturation(color) for color in colors) / len(colors)

    # Calculate contrast
    brightnesses = [get_color_brightness(color) for color in colors]
    profile.contrast = max(brightnesses) - min(brightnesses)

    # For visual styles, we would need more complex analysis
    # This is a simplified placeholder
    profile.visual_styles = {
        "detailed": 0.5,
        "modern": 0.7
    }

    return profile

def rgb_to_ansi(r: int, g: int, b: int) -> str:
    """Convert RGB values to ANSI color code for terminal output.

    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)

    Returns:
        str: ANSI color code
    """
    return f"\033[38;2;{r};{g};{b}m"

def rgb_to_ansi_bg(r: int, g: int, b: int) -> str:
    """Convert RGB values to ANSI background color code for terminal output.

    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)

    Returns:
        str: ANSI background color code
    """
    return f"\033[48;2;{r};{g};{b}m"
