#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "Running local database migrations..."

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found, using default SQLite configuration"
    export DATABASE_URL="sqlite:./miniature_tracker.db"
else
    # Load environment variables
    set -a
    source .env
    set +a
    print_info "Loaded configuration from .env"
fi

print_info "Database URL: $DATABASE_URL"

# Navigate to backend directory
cd backend

# Run migrations
print_info "Executing migrations..."
if cargo run --bin miniature-painting-tracker-backend -- --migrate; then
    print_status "Database migrations completed successfully!"
else
    print_error "Database migrations failed!"
    exit 1
fi

cd ..

print_status "Local migration process completed!"