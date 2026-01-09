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
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV    Environment (dev, prod) [default: dev]"
            echo "  -r, --region REGION      AWS region [default: us-east-1]"
            echo "  -p, --profile PROFILE    AWS profile to use"
            echo "  -h, --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_info "Running database migrations for Miniature Tracker"
print_info "Environment: $ENVIRONMENT"
print_info "Region: $REGION"

# Set AWS profile if provided
if [[ -n "$PROFILE" ]]; then
    export AWS_PROFILE="$PROFILE"
    print_info "Using AWS profile: $PROFILE"
fi

# Check if outputs file exists
OUTPUTS_FILE="outputs-$ENVIRONMENT.json"
if [[ ! -f "$OUTPUTS_FILE" ]]; then
    print_error "Outputs file not found: $OUTPUTS_FILE"
    print_info "Make sure you have deployed the infrastructure first"
    exit 1
fi

# Extract database information from outputs
SECRET_ARN=$(cat "$OUTPUTS_FILE" | jq -r '.["MiniatureTracker-'$ENVIRONMENT'"].DatabaseSecretArn')
DB_ENDPOINT=$(cat "$OUTPUTS_FILE" | jq -r '.["MiniatureTracker-'$ENVIRONMENT'"].DatabaseEndpoint')

if [[ "$SECRET_ARN" == "null" || "$DB_ENDPOINT" == "null" ]]; then
    print_error "Could not extract database information from outputs"
    exit 1
fi

print_info "Database endpoint: $DB_ENDPOINT"
print_info "Secret ARN: $SECRET_ARN"

# Get database credentials from Secrets Manager
print_info "Retrieving database credentials..."
SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$REGION" --query SecretString --output text)

if [[ $? -ne 0 ]]; then
    print_error "Failed to retrieve database credentials"
    exit 1
fi

# Parse credentials
DB_USERNAME=$(echo "$SECRET_VALUE" | jq -r .username)
DB_PASSWORD=$(echo "$SECRET_VALUE" | jq -r .password)

if [[ "$DB_USERNAME" == "null" || "$DB_PASSWORD" == "null" ]]; then
    print_error "Could not parse database credentials"
    exit 1
fi

# Construct database URL
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/miniature_tracker"

print_info "Running migrations..."

# Run migrations using the backend binary
cd ../backend

# Set environment variables
export DATABASE_URL="$DATABASE_URL"
export RUST_LOG=info

# Run migrations
if cargo run --bin miniature-painting-tracker-backend -- --migrate; then
    print_status "Database migrations completed successfully!"
else
    print_error "Database migrations failed!"
    exit 1
fi

cd ../infrastructure

print_status "Migration process completed!"