#!/bin/bash

echo "🐳 Starting Miniature Painting Tracker with Docker (Development Mode)..."

# Function to cleanup
cleanup() {
    echo "🛑 Shutting down Docker development environment..."
    docker-compose --profile dev down
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Build and start development containers
docker-compose --profile dev up --build

echo "✅ Docker development environment stopped."