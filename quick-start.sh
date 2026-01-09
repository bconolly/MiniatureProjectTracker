#!/bin/bash
echo "🚀 Quick Start - Miniature Painting Tracker"
echo ""
echo "Choose your preferred development method:"
echo "1) Native development (recommended for development)"
echo "2) Docker development (good for testing)"
echo "3) Docker with PostgreSQL (cloud-like testing)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🏃 Starting native development servers..."
        ./scripts/dev-start.sh
        ;;
    2)
        echo "🐳 Starting Docker development environment..."
        ./scripts/docker-dev.sh
        ;;
    3)
        echo "🐳🐘 Starting Docker with PostgreSQL..."
        ./scripts/docker-postgres.sh
        ;;
    *)
        echo "Invalid choice. Please run ./quick-start.sh again."
        exit 1
        ;;
esac
