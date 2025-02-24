"""Tests for metadata extraction functionality."""

import pytest
from pathlib import Path
from src.utils.metadata import AnimeMetadata, extract_metadata, clean_text

def test_clean_text():
    """Test text cleaning functionality."""
    assert clean_text("My.Show.Name") == "My Show Name"
    assert clean_text("Show_Name_Here") == "Show Name Here"
    assert clean_text("  Extra  Spaces  ") == "Extra Spaces"
    assert clean_text("Mixed.and_multiple.separators") == "Mixed and multiple separators"

@pytest.mark.parametrize("filename,expected", [
    # Standard format
    (
        "[SubsPlease] My Hero Academia - S05E01 [1080p].mkv",
        AnimeMetadata(
            filename=Path("[SubsPlease] My Hero Academia - S05E01 [1080p].mkv"),
            series="My Hero Academia",
            season="05",
            episode="01",
            quality="1080p",
            group="SubsPlease",
            special=None
        )
    ),
    # Special episode
    (
        "[Group] Demon Slayer - OVA2 [720p].mkv",
        AnimeMetadata(
            filename=Path("[Group] Demon Slayer - OVA2 [720p].mkv"),
            series="Demon Slayer",
            season=None,
            episode=None,
            quality="720p",
            group="Group",
            special="OVA2"
        )
    ),
    # Date format
    (
        "One Piece - 2024-02-25 - [1080p].mp4",
        AnimeMetadata(
            filename=Path("One Piece - 2024-02-25 - [1080p].mp4"),
            series="One Piece",
            season=None,
            episode=None,
            quality="1080p",
            group=None,
            special="DATE-2024-02-25"
        )
    ),
    # Simple episode format
    (
        "Attack on Titan Episode 25.mkv",
        AnimeMetadata(
            filename=Path("Attack on Titan Episode 25.mkv"),
            series="Attack on Titan",
            season=None,
            episode="25",
            quality=None,
            group=None,
            special=None
        )
    ),
    # Three-digit format (season+episode)
    (
        "[Group] Naruto 105 [720p].mkv",
        AnimeMetadata(
            filename=Path("[Group] Naruto 105 [720p].mkv"),
            series="Naruto",
            season="1",
            episode="05",
            quality="720p",
            group="Group",
            special=None
        )
    ),
    # Three-digit format (episode only)
    (
        "[Group] One Piece 1065 [1080p].mkv",
        AnimeMetadata(
            filename=Path("[Group] One Piece 1065 [1080p].mkv"),
            series="One Piece",
            season=None,
            episode="1065",
            quality="1080p",
            group="Group",
            special=None
        )
    ),
])
def test_extract_metadata(filename: str, expected: AnimeMetadata):
    """Test metadata extraction for various filename patterns."""
    result = extract_metadata(Path(filename))
    assert result == expected

def test_special_episodes():
    """Test special episode pattern matching."""
    specials = [
        ("Show Name NCOP.mkv", "NCOP"),
        ("Show Name NCED1.mkv", "NCED1"),
        ("Show Name Special 5.mkv", "Special5"),
        ("Show Name OVA 2.mkv", "OVA2"),
    ]

    for filename, expected_special in specials:
        metadata = extract_metadata(Path(filename))
        assert metadata.special == expected_special
        assert metadata.season is None
        assert metadata.episode is None

def test_edge_cases():
    """Test edge cases and potential problematic filenames."""
    edge_cases = [
        # Filename with multiple numbers
        ("[Group] Show 01 02 03 [1080p].mkv", "01"),  # Should pick first number as episode
        # Multiple quality indicators
        ("[Group] Show 01 [720p][1080p].mkv", "720p"),  # Should pick first quality
        # Multiple bracketed groups
        ("[[Group1][Group2]] Show 01.mkv", "Group1"),  # Should pick first group
        # No episode number
        ("Show Name [1080p].mkv", None),  # Episode should be None
    ]

    for filename, expected_episode in edge_cases:
        metadata = extract_metadata(Path(filename))
        if expected_episode:
            assert metadata.episode == expected_episode
        else:
            assert metadata.episode is None
