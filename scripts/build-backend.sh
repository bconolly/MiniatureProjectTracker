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
BUILD_TYPE="release"
TARGET_DIR="target"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            BUILD_TYPE="debug"
            shift
            ;;
        --release)
            BUILD_TYPE="release"
            shift
            ;;
        --target-dir)
            TARGET_DIR="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --debug              Build in debug mode"
            echo "  --release            Build in release mode (default)"
            echo "  --target-dir DIR     Target directory for build artifacts"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Building Rust backend..."
print_info "Build type: $BUILD_TYPE"
print_info "Target directory: $TARGET_DIR"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Navigate to backend directory
cd backend

# Clean previous builds if requested
if [[ "$CLEAN" == "true" ]]; then
    print_info "Cleaning previous builds..."
    cargo clean
fi

# Set build flags
BUILD_FLAGS=""
if [[ "$BUILD_TYPE" == "release" ]]; then
    BUILD_FLAGS="--release"
fi

# Build the backend
print_info "Compiling Rust code..."
if cargo build $BUILD_FLAGS; then
    print_status "Backend build completed successfully!"
    
    # Show binary location
    if [[ "$BUILD_TYPE" == "release" ]]; then
        BINARY_PATH="target/release/miniature-painting-tracker-backend"
    else
        BINARY_PATH="target/debug/miniature-painting-tracker-backend"
    fi
    
    if [[ -f "$BINARY_PATH" ]]; then
        BINARY_SIZE=$(du -h "$BINARY_PATH" | cut -f1)
        print_info "Binary location: $BINARY_PATH"
        print_info "Binary size: $BINARY_SIZE"
    fi
else
    print_error "Backend build failed!"
    exit 1
fi

# Run tests if in debug mode
if [[ "$BUILD_TYPE" == "debug" ]]; then
    print_info "Running tests..."
    if cargo test; then
        print_status "All tests passed!"
    else
        print_warning "Some tests failed, but build completed"
    fi
fi

cd ..

print_status "Backend build process completed!"