# Ani-Sage Project Roadmap

## 1. Adding FZF Interface

**Current State:**
- The CLI already has basic command-line options (`--no-trailers`, `--limit`)
- Recommendation display uses ANSI colors for better terminal output

**Implementation Plan:**
- Install `pyfzf` or similar Python FZF wrapper
- Add to `requirements.txt`: `pyfzf-python>=0.2.0`
- Create an interactive selector in `run_all.py` and `demo_recommendations.py`
- Key files to modify:
  - `scripts/demo_recommendations.py` - Add FZF interface for selecting genres/preferences
  - `run_all.py` - Enhance CLI with interactive options

**Example Implementation:**
```python
from pyfzf.pyfzf import FzfPrompt
fzf = FzfPrompt()

# For genre selection
genres = ["Action", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi"]
selected_genres = fzf.prompt(genres, "--multi --header='Select genres (TAB to select multiple)'")
```

## 2. Update Documentation

**Current Gaps:**
- Missing installation instructions
- Lacking usage examples
- No CLI documentation
- Missing configuration guidance

**Documentation Plan:**
- Create comprehensive `README.md` with:
  - Project overview and purpose
  - Installation instructions (dependencies, API keys)
  - Usage examples for each main feature
  - CLI reference
  - Configuration options
- Add inline docstrings to key classes and methods
- Create example configuration files

**Priority Files to Document:**
- `README.md` (main project overview)
- `CONTRIBUTING.md` (for future contributors)
- `src/ai/recommendation/engine.py` (core recommendation logic)
- `src/api/providers/youtube/` (YouTube integration)

## 3. Color Palette Analysis from Thumbnails/Trailers

**Current State:**
- Trailer data is fetched but not analyzed for colors
- Terminal output uses predefined ANSI colors

**Implementation Plan:**
- Add image processing dependencies: `pillow`, `colorthief`
- Create a new module `src/api/media/color_analysis.py`
- Implement thumbnail downloading and color extraction
- Apply extracted colors to CLI output

**Key Implementation Components:**
```python
from colorthief import ColorThief
from PIL import Image
from io import BytesIO
import requests

def extract_colors(image_url, color_count=5):
    """Extract dominant colors from an image URL."""
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content))
    color_thief = ColorThief(img)
    palette = color_thief.get_palette(color_count=color_count)
    return palette

def rgb_to_ansi(r, g, b):
    """Convert RGB values to closest ANSI color code."""
    # Implementation to map RGB to ANSI
```

## 4. End-to-End User Experience

**Current Status:**
- Basic recommendation engine works
- Trailer fetching is implemented
- CLI options exist but need more user-friendly integration

**Implementation Plan:**
- Create a guided interview process for preferences
- Add option to automatically open trailers in browser
- Implement session persistence for repeated usage
- Add rating/feedback mechanism

**Specific Enhancements:**
1. Implement a `TUI` class for terminal UI management
2. Add browser opening functionality:
```python
import webbrowser

def open_trailer(url):
    """Open a trailer URL in the default browser."""
    webbrowser.open(url)
```
3. Save user preferences to a local JSON file for future recommendations
4. Create a more conversational flow in the CLI

## Key Files Overview

- `src/ai/recommendation/engine.py` - Core recommendation logic
- `src/api/providers/youtube/__init__.py` - YouTube API integration
- `scripts/demo_recommendations.py` - Main demo script
- `run_all.py` - CLI entry point

## Environment Requirements

- OpenAI API key (for recommendations)
- YouTube API key (for trailers)
- Python 3.8+ environment
- All dependencies from `requirements.txt`
