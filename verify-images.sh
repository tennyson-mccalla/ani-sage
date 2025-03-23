#!/bin/bash
# Script to validate all our TMDb image URLs and test recommendations

echo "Checking environment variables..."
if [ -z "$TMDB_API_KEY" ]; then
  echo "Warning: TMDB_API_KEY is not set in the environment"
  # Try to get it from .env file
  if [ -f .env ]; then
    TMDB_API_KEY=$(grep TMDB_API_KEY .env | cut -d '=' -f2)
    if [ -n "$TMDB_API_KEY" ]; then
      echo "Found TMDB_API_KEY in .env file"
      export TMDB_API_KEY
    else
      echo "Error: TMDB_API_KEY not found in .env file"
      echo "Please set the TMDB_API_KEY environment variable or add it to .env"
      exit 1
    fi
  else
    echo "Error: .env file not found"
    echo "Please set the TMDB_API_KEY environment variable or create .env file"
    exit 1
  fi
fi

echo "==== Step 1: Run reconcile-tmdb-data.js to validate TMDb image URLs ===="
node reconcile-tmdb-data.js

echo "==== Step 2: Test recommendation API if server is running ===="
echo "To test the recommendation API with our new changes:"
echo "1. Start the development server in another terminal with 'npm run dev'"
echo "2. Then run 'node test-recommendations-api.js'"
echo ""
echo "Note: The test script will make HTTP requests to the local server to verify"
echo "that our recommendations now properly include TMDb images."
echo ""
echo "All high-quality TMDb image URLs for popular anime titles have been added to"
echo "the manual-mappings.ts file, and the code now uses them in multiple places:"
echo "1. In the recommendations/route.ts file when generating recommendations"
echo "2. In the AnimeCard.tsx component as a fallback mechanism"
echo "3. In the mock data for offline testing"
echo ""
echo "This ensures that popular anime titles will always have high-quality images"
echo "regardless of any API or network issues."