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
PARALLEL=false

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
        --parallel)
            PARALLEL=true
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
            echo "  --parallel           Build frontend and backend in parallel"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Building Miniature Painting Tracker"
print_info "Build type: $BUILD_TYPE"

# Prepare build flags
FRONTEND_FLAGS=""
BACKEND_FLAGS=""

if [[ "$BUILD_TYPE" == "development" ]]; then
    FRONTEND_FLAGS="--dev"
    BACKEND_FLAGS="--debug"
else
    FRONTEND_FLAGS="--prod"
    BACKEND_FLAGS="--release"
fi

if [[ "$SKIP_TESTS" == true ]]; then
    FRONTEND_FLAGS="$FRONTEND_FLAGS --skip-tests"
fi

if [[ "$SKIP_LINT" == true ]]; then
    FRONTEND_FLAGS="$FRONTEND_FLAGS --skip-lint"
fi

# Build function for parallel execution
build_frontend() {
    print_info "Starting frontend build..."
    if ./scripts/build-frontend.sh $FRONTEND_FLAGS; then
        print_status "Frontend build completed"
        return 0
    else
        print_error "Frontend build failed"
        return 1
    fi
}

build_backend() {
    print_info "Starting backend build..."
    if ./scripts/build-backend.sh $BACKEND_FLAGS; then
        print_status "Backend build completed"
        return 0
    else
        print_error "Backend build failed"
        return 1
    fi
}

# Execute builds
if [[ "$PARALLEL" == true ]]; then
    print_info "Building frontend and backend in parallel..."
    
    # Start builds in background
    build_frontend &
    FRONTEND_PID=$!
    
    build_backend &
    BACKEND_PID=$!
    
    # Wait for both to complete
    FRONTEND_SUCCESS=true
    BACKEND_SUCCESS=true
    
    if ! wait $FRONTEND_PID; then
        FRONTEND_SUCCESS=false
    fi
    
    if ! wait $BACKEND_PID; then
        BACKEND_SUCCESS=false
    fi
    
    # Check results
    if [[ "$FRONTEND_SUCCESS" == true && "$BACKEND_SUCCESS" == true ]]; then
        print_status "Both builds completed successfully!"
    else
        if [[ "$FRONTEND_SUCCESS" == false ]]; then
            print_error "Frontend build failed"
        fi
        if [[ "$BACKEND_SUCCESS" == false ]]; then
            print_error "Backend build failed"
        fi
        exit 1
    fi
else
    print_info "Building sequentially..."
    
    # Build frontend first
    build_frontend
    
    # Build backend
    build_backend
fi

# Create build info file
BUILD_INFO_FILE="build-info.json"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

cat > "$BUILD_INFO_FILE" << EOF
{
  "buildTime": "$BUILD_TIME",
  "buildType": "$BUILD_TYPE",
  "gitCommit": "$GIT_COMMIT",
  "gitBranch": "$GIT_BRANCH",
  "version": "1.0.0"
}
EOF

print_status "Build information saved to $BUILD_INFO_FILE"

print_status "All builds completed successfully!"
print_info "Next steps:"
echo "  - For local deployment: ./scripts/docker-prod.sh"
echo "  - For AWS deployment: cd infrastructure && ./scripts/deploy.sh"