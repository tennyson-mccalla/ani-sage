#!/bin/bash
# Script to run all components of Ani-Sage

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Ani-Sage System ===${NC}"
echo ""

# Check if environment variables are set
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: Root .env file not found. Creating a sample one...${NC}"
  echo "# API Keys for Anime Services
ANILIST_ACCESS_TOKEN=
MAL_CLIENT_ID=
MAL_CLIENT_SECRET=
TMDB_API_KEY=
YOUTUBE_API_KEY=" > .env
  echo -e "${YELLOW}Please edit .env with your API keys before using the application.${NC}"
fi

# Check for UI environment file
if [ ! -f ui/ui/.env ]; then
  echo -e "${YELLOW}Warning: UI .env file not found. Creating a sample one...${NC}"
  mkdir -p ui/ui
  echo "# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_MOCK_API=true
VITE_ENABLE_ANALYTICS=false" > ui/ui/.env
  echo -e "${YELLOW}Created sample ui/ui/.env file with mock API mode enabled.${NC}"
fi

# Start the API server
echo -e "${GREEN}Starting API Server...${NC}"
npm run start-api &
API_PID=$!
echo "API Server started with PID: $API_PID"

# Wait for API to initialize
sleep 3

# Running UI
echo -e "${GREEN}Starting UI...${NC}"
cd ui/ui && npm run dev > ui_startup.log 2>&1 &
UI_PID=$!
echo "UI started with PID: $UI_PID"

# Wait for UI to start and capture the port
sleep 3
UI_PORT=$(grep "Local: " ui_startup.log | grep -o "localhost:[0-9]*" | cut -d':' -f2)
if [ -z "$UI_PORT" ]; then
  UI_PORT=5173  # Default if not found
fi

echo ""
echo -e "${GREEN}Ani-Sage is running!${NC}"
echo -e "${BLUE}API:${NC} http://localhost:3000/api/v1"
echo -e "${BLUE}UI:${NC} http://localhost:$UI_PORT"
echo ""
echo -e "${YELLOW}NOTE:${NC} Mock API mode is enabled by default. Set VITE_ENABLE_MOCK_API=false in ui/ui/.env to use real API."
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Function to kill processes on exit
cleanup() {
  echo ""
  echo -e "${RED}Shutting down all services...${NC}"
  
  # Kill processes by PID
  kill $UI_PID $API_PID 2>/dev/null
  
  # Kill any remaining node processes related to our app by port and name
  echo "Cleaning up ports..."
  lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5173 | grep node | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5174 | grep node | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5175 | grep node | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  
  # Find and kill any remaining Node processes related to our app
  ps aux | grep "[t]s-node api/server" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  ps aux | grep "[n]pm run dev" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  ps aux | grep "[v]ite" | grep "ani-sage" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  
  # Remove temporary log file
  [ -f ui/ui/ui_startup.log ] && rm ui/ui/ui_startup.log
  
  echo "Verified all Ani-Sage processes stopped and ports freed"
  exit 0
}

# Trap ctrl-c and call cleanup
trap cleanup SIGINT

# Wait until user kills the script
wait