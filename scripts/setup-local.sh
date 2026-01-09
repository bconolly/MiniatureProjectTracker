#!/bin/bash

echo "🔧 Setting up Miniature Painting Tracker for Local Development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Rust
if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi
print_status "Rust/Cargo found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi
print_status "Node.js found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm"
    exit 1
fi
print_status "npm found"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads data
print_status "Created uploads and data directories"

# Set up environment file
if [ ! -f .env ]; then
    cp .env.local .env
    print_status "Created .env file from .env.local template"
else
    print_warning ".env file already exists, skipping"
fi

# Set up backend environment
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_status "Created backend/.env file"
else
    print_warning "backend/.env file already exists, skipping"
fi

# Install backend dependencies and run initial setup
echo "🦀 Setting up Rust backend..."
cd backend

# Build backend (this will download and compile dependencies)
if cargo build; then
    print_status "Backend dependencies installed and built successfully"
else
    print_error "Failed to build backend"
    exit 1
fi

# Run database migrations
echo "🗄️  Setting up database..."
if cargo run --bin miniature-painting-tracker-backend -- --migrate; then
    print_status "Database migrations completed"
else
    print_warning "Database migration failed - this might be normal if database already exists"
fi

cd ..

# Install frontend dependencies
echo "⚛️  Setting up React frontend..."
cd frontend

if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create a quick start script
cat > quick-start.sh << 'EOF'
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
EOF

chmod +x quick-start.sh

print_status "Created quick-start.sh script"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run './quick-start.sh' to start the development environment"
echo "   2. Or run individual scripts:"
echo "      - './scripts/dev-start.sh' for native development"
echo "      - './scripts/docker-dev.sh' for Docker development"
echo "      - './scripts/docker-postgres.sh' for PostgreSQL testing"
echo ""
echo "🌐 Once started, access the application at:"
echo "   - Frontend: http://localhost:5173 (development) or http://localhost:3000 (production)"
echo "   - Backend API: http://localhost:3000"
echo ""
echo "📚 For more information, see the README.md file"