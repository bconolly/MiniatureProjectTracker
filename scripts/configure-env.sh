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
ENVIRONMENT="local"
OUTPUT_FILE=".env"
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Environment configuration (local, docker, aws-dev, aws-prod)"
            echo "  -o, --output FILE        Output file (default: .env)"
            echo "  -f, --force             Overwrite existing file"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Available environments:"
            echo "  local      - Local development with SQLite"
            echo "  docker     - Docker deployment with SQLite"
            echo "  aws-dev    - AWS development environment"
            echo "  aws-prod   - AWS production environment"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Configuring environment: $ENVIRONMENT"
print_info "Output file: $OUTPUT_FILE"

# Check if environment file exists
ENV_FILE="config/environments/$ENVIRONMENT.env"
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file not found: $ENV_FILE"
    print_info "Available environments:"
    ls config/environments/*.env 2>/dev/null | sed 's/config\/environments\///g' | sed 's/\.env//g' | sed 's/^/  /'
    exit 1
fi

# Check if output file exists
if [[ -f "$OUTPUT_FILE" && "$FORCE" == false ]]; then
    print_warning "Output file already exists: $OUTPUT_FILE"
    read -p "Overwrite? (y/N): " confirmation
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        print_info "Configuration cancelled"
        exit 0
    fi
fi

# Copy environment file
print_info "Copying environment configuration..."
cp "$ENV_FILE" "$OUTPUT_FILE"

# Add timestamp and source information
cat >> "$OUTPUT_FILE" << EOF

# Configuration generated on $(date)
# Source: $ENV_FILE
# Environment: $ENVIRONMENT
EOF

print_status "Environment configured successfully!"
print_info "Configuration file: $OUTPUT_FILE"

# Show environment-specific instructions
case $ENVIRONMENT in
    local)
        print_info "Local development setup:"
        echo "  1. Make sure you have Rust and Node.js installed"
        echo "  2. Run: ./scripts/setup-local.sh"
        echo "  3. Start development: ./scripts/dev-start.sh"
        ;;
    docker)
        print_info "Docker setup:"
        echo "  1. Make sure Docker is running"
        echo "  2. Build: ./scripts/docker-build.sh"
        echo "  3. Run: ./scripts/docker-prod.sh"
        ;;
    aws-dev|aws-prod)
        print_info "AWS deployment setup:"
        echo "  1. Configure AWS CLI with appropriate credentials"
        echo "  2. Build application: ./scripts/build-all.sh --prod"
        echo "  3. Deploy: cd infrastructure && ./scripts/deploy.sh -e ${ENVIRONMENT#aws-}"
        ;;
esac