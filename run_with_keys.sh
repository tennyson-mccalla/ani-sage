#!/bin/bash
# This script sets API keys as environment variables and runs the anime recommendation engine

# Path to the .env file
ENV_FILE="/Users/tendev/ani-sage/worktrees/api-integration/.env"

# Paths to ai-features worktree and its virtual environment
AI_FEATURES_DIR="/Users/tendev/ani-sage/worktrees/ai-features"
VENV_PATH="$AI_FEATURES_DIR/venv/bin/python"

# Flag to track if we're using the ai-features worktree
USING_AI_FEATURES=true

# Display info
echo "=== Ani-Sage Recommendation Engine ==="
echo "Reading keys from: $ENV_FILE"

# Check if ai-features directory exists
if [ ! -d "$AI_FEATURES_DIR" ]; then
  echo "Error: AI features worktree not found at $AI_FEATURES_DIR"
  USING_AI_FEATURES=false

  # Fallback to current directory
  VENV_PATH="./venv/bin/python"
  if [ ! -f "$VENV_PATH" ]; then
    echo "Warning: Virtual environment not found in current directory either."
    echo "Using system Python as fallback"
    VENV_PATH="python3"
  else
    echo "Found virtual environment in current directory."
  fi
else
  # Check if Python virtual environment exists in the worktree
  if [ ! -f "$VENV_PATH" ]; then
    echo "Warning: Python virtual environment not found at $VENV_PATH"
    USING_AI_FEATURES=false

    # Fallback to current directory venv
    VENV_PATH="./venv/bin/python"
    if [ ! -f "$VENV_PATH" ]; then
      echo "Warning: Virtual environment not found in current directory either."
      echo "Using system Python as fallback"
      VENV_PATH="python3"
    else
      echo "Found virtual environment in current directory."
    fi
  else
    echo "Using Python from ai-features worktree: $VENV_PATH"
  fi
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Extract API keys from the .env file
OPENAI_KEY=$(grep "OPENAI_API_KEY" "$ENV_FILE" | cut -d '=' -f2)
YOUTUBE_KEY=$(grep "YOUTUBE_API_KEY" "$ENV_FILE" | cut -d '=' -f2)

# Check if keys were extracted successfully
if [ -z "$OPENAI_KEY" ]; then
  echo "Warning: OPENAI_API_KEY not found in .env file"
fi

if [ -z "$YOUTUBE_KEY" ]; then
  echo "Warning: YOUTUBE_API_KEY not found in .env file"
fi

# Export the API keys as environment variables
export OPENAI_API_KEY="$OPENAI_KEY"
export YOUTUBE_API_KEY="$YOUTUBE_KEY"

# Verify keys are set (show only first 5 characters for security)
echo "OpenAI API Key: ${OPENAI_API_KEY:0:5}... (hidden)"
echo "YouTube API Key: ${YOUTUBE_API_KEY:0:5}... (hidden)"
echo ""

# Parse command line arguments
INTERACTIVE=""
LIMIT="10"
DEMO_MODE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--interactive)
      if [ "$USING_AI_FEATURES" = true ]; then
        echo "Note: --interactive flag is not supported in the ai-features worktree version."
        echo "This flag will be ignored."
      else
        INTERACTIVE="--interactive"
      fi
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --demo-mode)
      if [ "$USING_AI_FEATURES" = true ]; then
        echo "Note: --demo-mode flag is not supported in the ai-features worktree version."
        echo "This flag will be ignored."
      else
        DEMO_MODE="--demo-mode"
      fi
      shift
      ;;
    *)
      # Unknown option
      shift
      ;;
  esac
done

# Run the recommendation script with the environment variables
echo "Running recommendation engine with limit: $LIMIT"

# If we're using the ai-features worktree, cd to that directory before running
if [ "$USING_AI_FEATURES" = true ]; then
  echo "Changing to ai-features worktree directory: $AI_FEATURES_DIR"
  cd "$AI_FEATURES_DIR"
  $VENV_PATH run_all.py recommend --limit "$LIMIT"
else
  # Otherwise just run in the current directory
  $VENV_PATH run_all.py recommend $INTERACTIVE --limit "$LIMIT" $DEMO_MODE
fi
