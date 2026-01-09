#!/bin/bash

echo "🐳 Starting Miniature Painting Tracker with Docker (Production Mode)..."

# Function to cleanup
cleanup() {
    echo "🛑 Shutting down Docker production environment..."
    docker-compose down
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Create necessary directories
mkdir -p data uploads

# Copy environment file
if [ ! -f .env ]; then
    cp .env.docker .env
    echo "📝 Created .env file from .env.docker template"
fi

# Build and start production containers
docker-compose up --build

echo "✅ Docker production environment stopped."