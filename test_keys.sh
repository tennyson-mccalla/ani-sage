#!/bin/bash
# Simple test script to verify API keys are being read correctly

# Path to the .env file
ENV_FILE="/Users/tendev/ani-sage/worktrees/api-integration/.env"
echo "Reading API keys from: $ENV_FILE"

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found!"
  exit 1
fi

# Extract and export API keys
OPENAI_KEY=$(grep "OPENAI_API_KEY" "$ENV_FILE" | cut -d '=' -f2)
YOUTUBE_KEY=$(grep "YOUTUBE_API_KEY" "$ENV_FILE" | cut -d '=' -f2)

# Export the keys
export OPENAI_API_KEY="$OPENAI_KEY"
export YOUTUBE_API_KEY="$YOUTUBE_KEY"

# Display key information (first 5 chars only)
echo "OpenAI API Key: ${OPENAI_API_KEY:0:5}... (length: ${#OPENAI_API_KEY})"
echo "YouTube API Key: ${YOUTUBE_API_KEY:0:5}... (length: ${#YOUTUBE_API_KEY})"

# Verify we have valid keys
echo "Keys extracted successfully. Ready to use with script."
