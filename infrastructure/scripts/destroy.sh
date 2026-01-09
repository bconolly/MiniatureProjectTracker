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
ENVIRONMENT="dev"
REGION="us-east-1"
PROFILE=""
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
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
            echo "  -e, --environment ENV    Environment to destroy (dev, prod) [default: dev]"
            echo "  -r, --region REGION      AWS region [default: us-east-1]"
            echo "  -p, --profile PROFILE    AWS profile to use"
            echo "  -f, --force             Skip confirmation prompt"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_warning "This will destroy the Miniature Tracker infrastructure"
print_info "Environment: $ENVIRONMENT"
print_info "Region: $REGION"

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Environment must be 'dev' or 'prod'"
    exit 1
fi

# Extra confirmation for production
if [[ "$ENVIRONMENT" == "prod" && "$FORCE" == false ]]; then
    print_warning "You are about to destroy the PRODUCTION environment!"
    read -p "Type 'DELETE PRODUCTION' to confirm: " confirmation
    if [[ "$confirmation" != "DELETE PRODUCTION" ]]; then
        print_info "Destruction cancelled"
        exit 0
    fi
elif [[ "$FORCE" == false ]]; then
    read -p "Are you sure you want to destroy the $ENVIRONMENT environment? (y/N): " confirmation
    if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
        print_info "Destruction cancelled"
        exit 0
    fi
fi

# Set AWS profile if provided
if [[ -n "$PROFILE" ]]; then
    export AWS_PROFILE="$PROFILE"
    print_info "Using AWS profile: $PROFILE"
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI not configured or credentials invalid"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_info "AWS Account: $ACCOUNT_ID"

# Set environment variables for CDK
export CDK_DEFAULT_ACCOUNT="$ACCOUNT_ID"
export CDK_DEFAULT_REGION="$REGION"
export ENVIRONMENT="$ENVIRONMENT"

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_info "Installing dependencies..."
    npm install
fi

# Build TypeScript
print_info "Building CDK app..."
npm run build

# Destroy the stack
print_info "Destroying CDK stack..."
npx cdk destroy MiniatureTracker-"$ENVIRONMENT" --force

if [[ $? -eq 0 ]]; then
    print_status "Infrastructure destroyed successfully!"
    
    # Clean up outputs file
    if [[ -f "outputs-$ENVIRONMENT.json" ]]; then
        rm "outputs-$ENVIRONMENT.json"
    fi
else
    print_error "Destruction failed!"
    exit 1
fi