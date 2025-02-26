#!/usr/bin/env python3
"""
Simple script to test imports of MALClient and YouTubeClient.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

print("Testing imports...")

try:
    from src.api.providers.mal.client import MALClient
    print("✅ MALClient imported successfully")
except ImportError as e:
    print(f"❌ Error importing MALClient: {e}")

try:
    from src.api.providers.youtube.client import YouTubeClient
    print("✅ YouTubeClient imported successfully")
except ImportError as e:
    print(f"❌ Error importing YouTubeClient: {e}")

# Try to import BaseAPIClient
try:
    from src.api.core.client import BaseAPIClient
    print("✅ BaseAPIClient imported successfully")
except ImportError as e:
    print(f"❌ Error importing BaseAPIClient: {e}")

# Print Python path
print("\nPython path:")
for p in sys.path:
    print(f"  {p}")

print("\nDone.")
