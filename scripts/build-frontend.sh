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

# Default values
BUILD_TYPE="production"
SKIP_TESTS=false
SKIP_LINT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            BUILD_TYPE="development"
            shift
            ;;
        --prod)
            BUILD_TYPE="production"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev                Build for development"
            echo "  --prod               Build for production (default)"
            echo "  --skip-tests         Skip running tests"
            echo "  --skip-lint          Skip linting"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Building React frontend..."
print_info "Build type: $BUILD_TYPE"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Install dependencies
print_info "Installing dependencies..."
if npm ci; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Run linting if not skipped
if [[ "$SKIP_LINT" == false ]]; then
    print_info "Running ESLint..."
    if npm run lint; then
        print_status "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
fi

# Run tests if not skipped
if [[ "$SKIP_TESTS" == false ]]; then
    print_info "Running tests..."
    if npm run test; then
        print_status "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
fi

# Build the frontend
print_info "Building frontend..."
if [[ "$BUILD_TYPE" == "development" ]]; then
    # For development, we might want to build with different settings
    # For now, we'll use the same build command
    BUILD_COMMAND="build"
else
    BUILD_COMMAND="build"
fi

if npm run $BUILD_COMMAND; then
    print_status "Frontend build completed successfully!"
    
    # Show build output information
    if [[ -d "dist" ]]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_info "Build output: dist/"
        print_info "Build size: $DIST_SIZE"
        
        # List main files
        print_info "Main files:"
        find dist -name "*.js" -o -name "*.css" -o -name "*.html" | head -10 | while read file; do
            size=$(du -h "$file" | cut -f1)
            echo "  $file ($size)"
        done
    fi
else
    print_error "Frontend build failed!"
    exit 1
fi

cd ..

print_status "Frontend build process completed!"