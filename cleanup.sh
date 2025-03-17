#!/bin/bash
# Script to clean up Ani-Sage processes and ports

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Cleaning up Ani-Sage processes ===${NC}"

# Kill any processes using our ports
echo -e "${YELLOW}Checking for processes using Ani-Sage ports...${NC}"
PORT_PROCESSES=$(lsof -i :3000,5173-5175 2>/dev/null)

if [ -n "$PORT_PROCESSES" ]; then
  echo -e "${RED}Found processes using Ani-Sage ports:${NC}"
  echo "$PORT_PROCESSES"
  echo -e "${YELLOW}Terminating these processes...${NC}"
  lsof -i :3000 | grep -v "PID" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5173 | grep -v "PID" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5174 | grep -v "PID" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  lsof -i :5175 | grep -v "PID" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}Ports freed.${NC}"
else
  echo -e "${GREEN}No processes found using these ports.${NC}"
fi

# Find and kill any Ani-Sage processes
echo -e "${YELLOW}Checking for Ani-Sage related processes...${NC}"
ANI_PROCESSES=$(ps aux | grep -E "(ts-node.*api/server|vite.*ani-sage|npm run dev)" | grep -v grep)

if [ -n "$ANI_PROCESSES" ]; then
  echo -e "${RED}Found Ani-Sage related processes:${NC}"
  echo "$ANI_PROCESSES"
  echo -e "${YELLOW}Terminating these processes...${NC}"
  ps aux | grep "[t]s-node.*api/server" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  ps aux | grep "[v]ite.*ani-sage" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  ps aux | grep "[n]pm run dev" | grep "ani-sage" | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}Ani-Sage processes terminated.${NC}"
else
  echo -e "${GREEN}No Ani-Sage related processes found.${NC}"
fi

# Clean up any temporary files
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
find /Users/tendev/ani-sage -name "ui_startup.log" -delete 2>/dev/null
echo -e "${GREEN}Temporary files removed.${NC}"

echo -e "${BLUE}Cleanup complete!${NC}"
echo -e "${GREEN}You can now start Ani-Sage again with ./start-ani-sage.sh${NC}"