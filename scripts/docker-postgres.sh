#!/bin/bash

echo "🐳 Starting Miniature Painting Tracker with PostgreSQL..."

# Function to cleanup
cleanup() {
    echo "🛑 Shutting down Docker PostgreSQL environment..."
    docker-compose --profile postgres down
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Copy PostgreSQL environment file
if [ ! -f .env ]; then
    cp .env.postgres .env
    echo "📝 Created .env file from .env.postgres template"
fi

# Start PostgreSQL first
echo "🐘 Starting PostgreSQL..."
docker-compose --profile postgres up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
cd backend
cargo run --bin migrate || echo "⚠️  Migration failed - database might already be initialized"
cd ..

# Start the application
echo "🚀 Starting application..."
docker-compose --profile postgres up app

echo "✅ Docker PostgreSQL environment stopped."