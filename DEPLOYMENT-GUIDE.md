# Complete Deployment Guide

This guide covers all deployment scenarios for the Miniature Painting Tracker application.

## Quick Start

1. **Local Development**:
   ```bash
   ./scripts/setup-local.sh
   ./quick-start.sh
   ```

2. **Docker Deployment**:
   ```bash
   ./scripts/docker-build.sh
   ./scripts/docker-prod.sh
   ```

3. **AWS Deployment**:
   ```bash
   ./scripts/build-all.sh --prod
   cd infrastructure
   ./scripts/deploy.sh -e prod
   ```

## Build Process

### Build Scripts

- `./scripts/build-backend.sh` - Build Rust backend
- `./scripts/build-frontend.sh` - Build React frontend  
- `./scripts/build-all.sh` - Build both components
- `./scripts/docker-build.sh` - Build Docker images

### Build Options

```bash
# Development builds
./scripts/build-all.sh --dev

# Production builds
./scripts/build-all.sh --prod

# Skip tests and linting
./scripts/build-all.sh --prod --skip-tests --skip-lint

# Parallel builds (faster)
./scripts/build-all.sh --prod --parallel
```

## Environment Configuration

### Configure Environment

```bash
# Local development
./scripts/configure-env.sh -e local

# Docker deployment
./scripts/configure-env.sh -e docker

# AWS development
./scripts/configure-env.sh -e aws-dev

# AWS production
./scripts/configure-env.sh -e aws-prod
```

### Available Environments

| Environment | Database | Storage | Use Case |
|-------------|----------|---------|----------|
| `local` | SQLite | Local files | Development |
| `docker` | SQLite | Local files | Local testing |
| `aws-dev` | PostgreSQL | S3 | AWS development |
| `aws-prod` | PostgreSQL | S3 | AWS production |

## Local Deployment

### Native Development

1. **Setup**:
   ```bash
   ./scripts/setup-local.sh
   ```

2. **Start Development Servers**:
   ```bash
   ./scripts/dev-start.sh
   ```

3. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Docker Development

1. **Build and Run**:
   ```bash
   ./scripts/docker-dev.sh
   ```

2. **Access Application**:
   - Application: http://localhost:3000

### Docker Production

1. **Build Image**:
   ```bash
   ./scripts/docker-build.sh --name miniature-tracker --tag latest
   ```

2. **Run Container**:
   ```bash
   ./scripts/docker-prod.sh
   ```

## AWS Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed and running
- Node.js 18+ for CDK

### Infrastructure Deployment

1. **Build Application**:
   ```bash
   ./scripts/build-all.sh --prod
   ```

2. **Deploy Infrastructure**:
   ```bash
   cd infrastructure
   ./scripts/deploy.sh -e dev  # or -e prod
   ```

3. **Run Database Migrations**:
   ```bash
   ./scripts/migrate.sh -e dev  # or -e prod
   ```

### AWS Resources Created

- **VPC**: Multi-AZ with public/private subnets
- **RDS**: PostgreSQL database with backups
- **S3**: Photo storage bucket
- **ECS**: Fargate service with auto-scaling
- **ALB**: Application Load Balancer
- **CloudFront**: CDN for global delivery
- **IAM**: Roles and policies
- **Secrets Manager**: Database credentials

### Environment Differences

| Resource | Development | Production |
|----------|-------------|------------|
| Database | t3.micro, single-AZ | t3.small, multi-AZ |
| ECS Tasks | 1 task, max 3 | 2 tasks, max 10 |
| Monitoring | Basic logs | Container Insights |
| Backups | 1 day retention | 7 day retention |

## CI/CD Pipeline

### GitHub Actions

The repository includes two workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Runs on push/PR to main/develop
   - Tests backend and frontend
   - Runs integration tests
   - Builds Docker image
   - Security audits

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`):
   - Runs on push to main or manual trigger
   - Builds and pushes Docker image to ECR
   - Deploys infrastructure with CDK
   - Runs database migrations
   - Performs smoke tests

### Required Secrets

Configure these secrets in your GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Manual Deployment

You can trigger deployments manually:

1. Go to Actions tab in GitHub
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Choose environment (dev/prod)

## Database Management

### Local Migrations

```bash
./scripts/migrate-local.sh
```

### AWS Migrations

```bash
cd infrastructure
./scripts/migrate.sh -e dev  # or -e prod
```

### Database Reset

```bash
# Local SQLite
rm backend/miniature_tracker.db*

# AWS (requires infrastructure redeploy)
./scripts/destroy.sh -e dev
./scripts/deploy.sh -e dev
```

## Monitoring and Logs

### Local Development

- Backend logs: Terminal output
- Frontend logs: Browser console

### Docker

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
```

### AWS

```bash
# View ECS logs
aws logs tail /ecs/miniature-tracker-dev --follow

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=miniature-tracker-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Docker Build Fails**:
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t miniature-tracker .
   ```

3. **AWS Deployment Fails**:
   ```bash
   # Check CDK diff
   cd infrastructure
   npx cdk diff MiniatureTracker-dev
   
   # View CloudFormation events
   aws cloudformation describe-stack-events \
     --stack-name MiniatureTracker-dev
   ```

4. **Database Connection Issues**:
   ```bash
   # Test local database
   sqlite3 backend/miniature_tracker.db ".tables"
   
   # Test AWS database (requires VPN or bastion)
   psql $DATABASE_URL -c "\dt"
   ```

### Health Checks

```bash
# Local health check
curl http://localhost:3000/health

# AWS health check (replace with your URL)
curl https://your-cloudfront-url.cloudfront.net/health
```

### Performance Testing

```bash
# Simple load test
ab -n 100 -c 10 http://localhost:3000/api/projects

# More comprehensive testing with wrk
wrk -t12 -c400 -d30s http://localhost:3000/api/projects
```

## Security Considerations

### Local Development

- Use HTTPS in production
- Keep dependencies updated
- Use environment variables for secrets

### AWS Production

- Enable WAF for CloudFront
- Use VPC endpoints for S3 access
- Enable GuardDuty for threat detection
- Regular security audits with AWS Config

### Best Practices

1. **Secrets Management**:
   - Never commit secrets to git
   - Use AWS Secrets Manager in production
   - Rotate credentials regularly

2. **Network Security**:
   - Database in private subnets
   - Use security groups for access control
   - Enable VPC Flow Logs

3. **Application Security**:
   - Input validation on all endpoints
   - CORS configuration
   - Rate limiting (consider AWS API Gateway)

## Cost Optimization

### Development Environment

- Use t3.micro instances
- Single NAT gateway
- Minimal backup retention
- Stop resources when not in use

### Production Environment

- Right-size instances based on usage
- Use Reserved Instances for predictable workloads
- Enable S3 lifecycle policies
- Monitor costs with AWS Cost Explorer

### Cost Monitoring

```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Backup and Recovery

### Local Development

- Database: File-based SQLite backups
- Photos: Local file system backups

### AWS Production

- Database: Automated RDS backups (7 days)
- Photos: S3 versioning and cross-region replication
- Infrastructure: CDK code in version control

### Disaster Recovery

1. **Database Recovery**:
   ```bash
   # Restore from RDS snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier miniature-tracker-restored \
     --db-snapshot-identifier miniature-tracker-snapshot
   ```

2. **Infrastructure Recovery**:
   ```bash
   # Redeploy from CDK
   cd infrastructure
   ./scripts/deploy.sh -e prod
   ```

## Scaling Considerations

### Horizontal Scaling

- ECS auto-scaling based on CPU/memory
- CloudFront for global content delivery
- RDS read replicas for read-heavy workloads

### Vertical Scaling

- Increase ECS task CPU/memory
- Upgrade RDS instance type
- Optimize database queries

### Performance Monitoring

- CloudWatch metrics and alarms
- Application Performance Monitoring (APM)
- Database performance insights

This guide should cover all aspects of deploying and managing the Miniature Painting Tracker application across different environments.