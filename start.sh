#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting CallMate Application...${NC}"

# Check if running in production mode
PROD_MODE=false
if [ "$1" == "--prod" ] || [ "$1" == "-p" ]; then
  PROD_MODE=true
  echo -e "${YELLOW}Running in PRODUCTION mode${NC}"
else
  echo -e "${YELLOW}Running in DEVELOPMENT mode${NC}"
fi

# Check for required environment variables
if [ -z "$BLAND_API_KEY" ]; then
  echo -e "${YELLOW}⚠️ BLAND_API_KEY environment variable not set${NC}"
  echo -e "Please set it with: ${BLUE}export BLAND_API_KEY=your_key_here${NC}"
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${YELLOW}⚠️ GEMINI_API_KEY environment variable not set${NC}"
  echo -e "Please set it with: ${BLUE}export GEMINI_API_KEY=your_key_here${NC}"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}⚠️ Supabase environment variables not set${NC}"
  echo -e "Please set them with: ${BLUE}export SUPABASE_URL=your_url_here${NC}"
  echo -e "                       ${BLUE}export SUPABASE_ANON_KEY=your_key_here${NC}"
fi

# Kill any processes running on port 3000 and 8000
echo "Cleaning up existing processes..."
kill -9 $(lsof -ti:3000,8000) 2>/dev/null || true

# Start the backend
echo -e "${GREEN}Starting backend server...${NC}"
cd backend
python -m pip install -r requirements.txt > /dev/null

# Start backend in background
if [ "$PROD_MODE" = true ]; then
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
else
  python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
fi
BACKEND_PID=$!

# Start the frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd ../frontend

if [ "$PROD_MODE" = true ]; then
  # Build and serve the frontend for production
  npm ci --silent
  npm run build
  npx serve -s build -l 3000 &
else
  # Start development server
  npm start &
fi
FRONTEND_PID=$!

echo -e "${GREEN}✓ CallMate is running!${NC}"
echo -e "Backend: ${BLUE}http://localhost:8000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Capture SIGINT and kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for processes to complete
wait $BACKEND_PID $FRONTEND_PID
