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
IMAGE_NAME="miniature-tracker"
TAG="latest"
DOCKERFILE="Dockerfile"
PUSH=false
REGISTRY=""
PLATFORM=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --dockerfile)
            DOCKERFILE="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --name NAME          Image name (default: miniature-tracker)"
            echo "  --tag TAG            Image tag (default: latest)"
            echo "  --dockerfile FILE    Dockerfile to use (default: Dockerfile)"
            echo "  --push               Push image to registry after build"
            echo "  --registry REGISTRY  Registry to push to (e.g., your-account.dkr.ecr.region.amazonaws.com)"
            echo "  --platform PLATFORM  Target platform (e.g., linux/amd64,linux/arm64)"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Construct full image name
if [[ -n "$REGISTRY" ]]; then
    FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$TAG"
else
    FULL_IMAGE_NAME="$IMAGE_NAME:$TAG"
fi

print_info "Building Docker image..."
print_info "Image name: $FULL_IMAGE_NAME"
print_info "Dockerfile: $DOCKERFILE"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Dockerfile exists
if [[ ! -f "$DOCKERFILE" ]]; then
    print_error "Dockerfile not found: $DOCKERFILE"
    exit 1
fi

# Build Docker image
BUILD_ARGS=""
if [[ -n "$PLATFORM" ]]; then
    BUILD_ARGS="--platform $PLATFORM"
fi

print_info "Starting Docker build..."
if docker build $BUILD_ARGS -t "$FULL_IMAGE_NAME" -f "$DOCKERFILE" .; then
    print_status "Docker image built successfully!"
    
    # Show image information
    IMAGE_SIZE=$(docker images "$FULL_IMAGE_NAME" --format "table {{.Size}}" | tail -n 1)
    print_info "Image size: $IMAGE_SIZE"
    
    # Show image ID
    IMAGE_ID=$(docker images "$FULL_IMAGE_NAME" --format "table {{.ID}}" | tail -n 1)
    print_info "Image ID: $IMAGE_ID"
else
    print_error "Docker build failed!"
    exit 1
fi

# Push image if requested
if [[ "$PUSH" == true ]]; then
    if [[ -z "$REGISTRY" ]]; then
        print_error "Registry must be specified when pushing"
        exit 1
    fi
    
    print_info "Pushing image to registry..."
    
    # Login to registry if it's ECR
    if [[ "$REGISTRY" == *".ecr."* ]]; then
        print_info "Logging in to ECR..."
        REGION=$(echo "$REGISTRY" | cut -d'.' -f4)
        aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"
    fi
    
    if docker push "$FULL_IMAGE_NAME"; then
        print_status "Image pushed successfully!"
    else
        print_error "Failed to push image"
        exit 1
    fi
fi

print_status "Docker build process completed!"
print_info "Image: $FULL_IMAGE_NAME"

# Show next steps
print_info "Next steps:"
echo "  - Run locally: docker run -p 3000:3000 $FULL_IMAGE_NAME"
echo "  - Deploy to AWS: cd infrastructure && ./scripts/deploy.sh"