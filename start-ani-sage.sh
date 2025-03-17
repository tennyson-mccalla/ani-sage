#!/bin/bash
# Script to run all components of Ani-Sage

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Ani-Sage System ===${NC}"
echo ""

# Check if environment variables are set
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found. Please create it with the API keys.${NC}"
  exit 1
fi

# Running UI
echo -e "${GREEN}Starting UI...${NC}"
cd ui/ui && npm run dev &
UI_PID=$!
echo "UI started with PID: $UI_PID"

# Wait for UI to start
sleep 2

echo ""
echo -e "${GREEN}Ani-Sage is running!${NC}"
echo -e "${BLUE}UI:${NC} http://localhost:5173"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Function to kill processes on exit
cleanup() {
  echo ""
  echo -e "${RED}Shutting down all services...${NC}"
  kill $UI_PID
  echo "Ani-Sage stopped"
  exit 0
}

# Trap ctrl-c and call cleanup
trap cleanup SIGINT

# Wait until user kills the script
wait