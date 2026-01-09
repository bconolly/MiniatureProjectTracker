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
SKIP_BUILD=false

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
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Environment to deploy (dev, prod) [default: dev]"
            echo "  -r, --region REGION      AWS region [default: us-east-1]"
            echo "  -p, --profile PROFILE    AWS profile to use"
            echo "  --skip-build            Skip Docker image build"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Deploying Miniature Tracker to AWS"
print_info "Environment: $ENVIRONMENT"
print_info "Region: $REGION"

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Environment must be 'dev' or 'prod'"
    exit 1
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

# Bootstrap CDK if needed
print_info "Checking CDK bootstrap..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$REGION" > /dev/null 2>&1; then
    print_warning "CDK not bootstrapped in this region. Bootstrapping..."
    npx cdk bootstrap aws://"$ACCOUNT_ID"/"$REGION"
    print_status "CDK bootstrapped successfully"
fi

# Build Docker image if not skipping
if [[ "$SKIP_BUILD" == false ]]; then
    print_info "Building Docker image..."
    cd ..
    docker build -t miniature-tracker:latest .
    cd infrastructure
    print_status "Docker image built successfully"
fi

# Deploy the stack
print_info "Deploying CDK stack..."
npx cdk deploy MiniatureTracker-"$ENVIRONMENT" \
    --require-approval never \
    --outputs-file outputs-"$ENVIRONMENT".json

if [[ $? -eq 0 ]]; then
    print_status "Deployment completed successfully!"
    
    # Display outputs
    if [[ -f "outputs-$ENVIRONMENT.json" ]]; then
        print_info "Deployment outputs:"
        cat "outputs-$ENVIRONMENT.json" | jq -r '.["MiniatureTracker-'$ENVIRONMENT'"] | to_entries[] | "  \(.key): \(.value)"'
    fi
    
    print_info "Next steps:"
    echo "  1. Wait for the ECS service to become healthy (may take 5-10 minutes)"
    echo "  2. Run database migrations: ./scripts/migrate.sh -e $ENVIRONMENT"
    echo "  3. Access your application via the CloudFront URL above"
else
    print_error "Deployment failed!"
    exit 1
fi