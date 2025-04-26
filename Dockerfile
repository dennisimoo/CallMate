# Multi-stage Dockerfile: Build React frontend, then serve with FastAPI backend

# --- Stage 1: Build React frontend ---
FROM node:20 AS frontend-build
WORKDIR /app/frontend

# Accept environment variables as build args
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_GEMINI_API_KEY
ARG REACT_APP_BLAND_API_KEY

# Set them as environment variables for the build
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_GEMINI_API_KEY=$REACT_APP_GEMINI_API_KEY
ENV REACT_APP_BLAND_API_KEY=$REACT_APP_BLAND_API_KEY

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build FastAPI backend and copy frontend build ---
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./frontend/build
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose port 8000 for the web service
EXPOSE 8000

# Start FastAPI server (serves both API and React static files)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
