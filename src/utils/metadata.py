"""Metadata extraction utilities for ani-sage."""

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

@dataclass
class AnimeMetadata:
    """Structured metadata extracted from anime filenames."""

    filename: Path
    series: str
    season: Optional[str] = None
    episode: Optional[str] = None
    quality: Optional[str] = None  # e.g. "720p", "1080p"
    group: Optional[str] = None    # Release group name
    special: Optional[str] = None  # OVA, Special, NCOP, NCED, or date

def clean_text(text: str) -> str:
    """Clean and normalize text by removing dots, underscores and extra spaces.

    Args:
        text: Text to clean

    Returns:
        Cleaned text with normalized spacing
    """
    # Remove dots and underscores, replace with spaces
    text = text.replace('.', ' ').replace('_', ' ')
    # Remove leading/trailing spaces and normalize internal spaces
    return ' '.join(text.split())

def extract_metadata(filepath: Path) -> AnimeMetadata:
    """Extract metadata from anime filename using regex patterns.

    Args:
        filepath: Path to the anime video file

    Returns:
        AnimeMetadata object containing extracted information
    """
    filename = filepath.name
    clean_name = re.sub(r'\[[^\]]*\]', '', filename)  # Remove bracketed content
    clean_name = clean_text(clean_name)

    # Initialize metadata fields
    series = ""
    season: Optional[str] = None
    episode: Optional[str] = None
    quality = re.search(r'([0-9]+p)', filename)  # Extract quality (e.g. "720p", "1080p")
    quality_str = quality.group(1) if quality else None

    # Extract release group from brackets [GroupName]
    group = re.search(r'\[(.*?)\]', filename)
    group_str = group.group(1) if group else None

    special: Optional[str] = None

    # Pattern matching in order of specificity
    patterns = [
        # 1. Special episodes (OVA, Special, NCOP, NCED)
        (r'(.+)\s+(OVA|Special|NCOP|NCED)\s*([0-9]*)',
         lambda m: (m.group(1), None, None, f"{m.group(2)}{m.group(3)}")),

        # 2. Standard "S01E01" format with dash separator
        (r'(.+)\s+-\s+s([0-9]+)e([0-9]+)\s+-',
         lambda m: (m.group(1), m.group(2), m.group(3), None)),

        # 3. Date-based episodes (YYYY-MM-DD format)
        (r'(.+)\s+-\s+(20[0-9]{2})-([0-9]{2})-([0-9]{2})\s+-',
         lambda m: (m.group(1), None, None, f"DATE-{m.group(2)}-{m.group(3)}-{m.group(4)}")),

        # 4. Standard "SxxExx" format
        (r'(.+)\s+S([0-9]+)\s*E([0-9]+)',
         lambda m: (m.group(1), m.group(2), m.group(3), None)),

        # 5. "Season X Episode Y" format
        (r'(.+)\s+Season\s*([0-9]+)\s*Episode\s*([0-9]+)',
         lambda m: (m.group(1), m.group(2), m.group(3), None)),

        # 6. Simple episode formats (E01, Episode 01)
        (r'(.+)\s+E([0-9]+)',
         lambda m: (m.group(1), None, m.group(2), None)),

        (r'(.+)\s+Episode\s*([0-9]+)',
         lambda m: (m.group(1), None, m.group(2), None)),

        # 7. Dash separator with episode number
        (r'(.+)\s+-\s*([0-9]+)',
         lambda m: (m.group(1), None, m.group(2), None)),

        # 8. Three-digit episode numbers (can indicate season+episode)
        (r'(.+)\s+([0-9]{3})(v[0-9]+)?\s+',
         lambda m: process_three_digit(m.group(1), m.group(2)))
    ]

    # Try each pattern in order
    for pattern, handler in patterns:
        match = re.search(pattern, clean_name)
        if match:
            series, season, episode, special = handler(match)
            break
    else:
        # Fallback: Try to extract series name and episode number
        series = re.sub(r' - [0-9]+.*', '', clean_name)
        episode_match = re.search(r'[0-9]+', clean_name)
        episode = episode_match.group(0) if episode_match else None

    # Clean up series name
    series = series.strip()

    # Pad season and episode numbers with leading zeros
    if season is not None:
        season = f"{int(season):02d}"
    if episode is not None:
        episode = f"{int(episode):02d}"

    return AnimeMetadata(
        filename=filepath,
        series=series,
        season=season,
        episode=episode,
        quality=quality_str,
        group=group_str,
        special=special
    )

def process_three_digit(series: str, number: str) -> tuple[str, Optional[str], Optional[str], None]:
    """Process three-digit episode numbers that may encode season+episode.

    Args:
        series: Series name
        number: Three-digit number

    Returns:
        Tuple of (series, season, episode, special)
    """
    num = int(number)
    if num > 100:
        return series, None, number, None
    else:
        return series, number[0], number[1:], None

def format_metadata_display(metadata: AnimeMetadata) -> str:
    """Format metadata for display in file selection.

    Args:
        metadata: AnimeMetadata object

    Returns:
        Formatted string for display
    """
    if metadata.special:
        display_text = f"{metadata.series} - {metadata.special}"
    else:
        if metadata.season:
            display_text = f"{metadata.series} - S{metadata.season}E{metadata.episode}"
        else:
            display_text = f"{metadata.series} - Episode {metadata.episode}"

        if metadata.quality:
            display_text = f"{display_text} [{metadata.quality}]"

    if metadata.group:
        display_text = f"[{metadata.group}] {display_text}"

    return display_text
