# AWS Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Miniature Painting Tracker to AWS.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public, private, and database subnets
- **RDS**: PostgreSQL database with automated backups and monitoring
- **S3**: Bucket for photo storage with proper CORS configuration
- **ECS**: Fargate service running the containerized application
- **ALB**: Application Load Balancer for high availability
- **CloudFront**: CDN for global content delivery
- **Auto Scaling**: CPU and memory-based scaling policies
- **IAM**: Least-privilege roles and policies
- **Secrets Manager**: Secure database credential storage
- **CloudWatch**: Logging and monitoring

## Prerequisites

1. **AWS CLI**: Configured with appropriate credentials
2. **Node.js**: Version 18 or later
3. **Docker**: For building container images
4. **jq**: For JSON processing in scripts

## Quick Start

1. **Install dependencies**:
```bash
cd infrastructure
npm install
```

2. **Deploy to development**:
```bash
./scripts/deploy.sh -e dev
```

3. **Run database migrations**:
```bash
./scripts/migrate.sh -e dev
```

4. **Access your application** using the CloudFront URL from the deployment outputs.

## Deployment Commands

### Deploy Infrastructure

```bash
# Deploy to development
./scripts/deploy.sh -e dev

# Deploy to production
./scripts/deploy.sh -e prod

# Deploy with specific AWS profile
./scripts/deploy.sh -e dev -p my-aws-profile

# Deploy to different region
./scripts/deploy.sh -e dev -r us-west-2

# Skip Docker build (if image already exists)
./scripts/deploy.sh -e dev --skip-build
```

### Run Database Migrations

```bash
# Migrate development database
./scripts/migrate.sh -e dev

# Migrate production database
./scripts/migrate.sh -e prod
```

### Destroy Infrastructure

```bash
# Destroy development environment
./scripts/destroy.sh -e dev

# Destroy production (requires confirmation)
./scripts/destroy.sh -e prod

# Force destroy without confirmation
./scripts/destroy.sh -e dev -f
```

## Manual CDK Commands

If you prefer to use CDK commands directly:

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy
ENVIRONMENT=dev npx cdk deploy MiniatureTracker-dev

# Destroy
ENVIRONMENT=dev npx cdk destroy MiniatureTracker-dev

# View differences
ENVIRONMENT=dev npx cdk diff MiniatureTracker-dev

# Synthesize CloudFormation
ENVIRONMENT=dev npx cdk synth MiniatureTracker-dev
```

## Environment Configuration

### Development (dev)
- **Database**: t3.micro, single-AZ, 1-day backup retention
- **ECS**: 256 CPU, 512 MB memory, 1 task, max 3 tasks
- **Monitoring**: Basic CloudWatch logs
- **Cost**: Optimized for development use

### Production (prod)
- **Database**: t3.small, multi-AZ, 7-day backup retention, deletion protection
- **ECS**: 512 CPU, 1024 MB memory, 2 tasks, max 10 tasks
- **Monitoring**: Container Insights, detailed monitoring
- **Cost**: Optimized for production reliability

## Outputs

After deployment, the following outputs are available:

- **LoadBalancerDNS**: Direct ALB endpoint
- **CloudFrontURL**: CDN endpoint (recommended for production)
- **S3BucketName**: Photo storage bucket name
- **DatabaseEndpoint**: RDS endpoint
- **DatabaseSecretArn**: Credentials secret ARN

## Cost Optimization

### Development Environment
- Uses t3.micro instances
- Single NAT gateway
- Minimal backup retention
- No detailed monitoring

### Production Environment
- Right-sized instances
- Multi-AZ for high availability
- Automated scaling
- Comprehensive monitoring

## Security

- **Network**: Private subnets for application and database
- **Database**: Isolated subnet, encrypted at rest
- **S3**: Block public access, CORS configured
- **IAM**: Least-privilege roles
- **Secrets**: Database credentials in Secrets Manager
- **HTTPS**: CloudFront enforces HTTPS

## Monitoring

- **CloudWatch Logs**: Application and infrastructure logs
- **CloudWatch Metrics**: CPU, memory, database metrics
- **Health Checks**: ALB health checks for application
- **Auto Scaling**: Based on CPU and memory utilization

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**:
   ```bash
   npx cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

2. **Docker Build Fails**:
   - Ensure Docker is running
   - Check Dockerfile syntax
   - Verify build context

3. **Database Connection Issues**:
   - Check security groups
   - Verify database is running
   - Confirm credentials in Secrets Manager

4. **ECS Service Unhealthy**:
   - Check CloudWatch logs
   - Verify health check endpoint
   - Confirm environment variables

### Useful Commands

```bash
# View ECS service status
aws ecs describe-services --cluster miniature-tracker-dev --services miniature-tracker-dev

# View CloudWatch logs
aws logs tail /ecs/miniature-tracker-dev --follow

# Check database status
aws rds describe-db-instances --db-instance-identifier miniaturetracker-database

# View S3 bucket contents
aws s3 ls s3://miniature-tracker-photos-dev-ACCOUNT-ID/
```

## Cleanup

To completely remove all resources:

```bash
# Destroy the stack
./scripts/destroy.sh -e dev

# Remove any remaining S3 objects (if bucket has versioning)
aws s3 rm s3://BUCKET-NAME --recursive

# Remove CDK bootstrap (optional, affects all CDK apps)
aws cloudformation delete-stack --stack-name CDKToolkit
```