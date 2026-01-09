# Deployment Guide

This guide covers different deployment options for the Miniature Painting Tracker application.

## Local Development

### Prerequisites

- Rust 1.75+ with Cargo
- Node.js 18+ with npm
- Git

### Quick Setup

1. Clone the repository and run the setup script:
```bash
./scripts/setup-local.sh
```

2. Start the development environment:
```bash
./quick-start.sh
```

### Manual Setup

1. **Environment Configuration**
```bash
# Copy environment templates
cp .env.local .env
cp backend/.env.example backend/.env
```

2. **Backend Setup**
```bash
cd backend
cargo build
cargo run -- --migrate  # Run database migrations
cd ..
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cd ..
```

4. **Start Development Servers**
```bash
./scripts/dev-start.sh
```

## Docker Deployment

### Development with Docker

For development with hot reload:
```bash
./scripts/docker-dev.sh
```

This starts both frontend and backend in development mode with file watching.

### Production with Docker

For production-like local deployment:
```bash
./scripts/docker-prod.sh
```

This builds optimized versions and serves the frontend from the backend.

### PostgreSQL Testing

To test with PostgreSQL (similar to AWS setup):
```bash
./scripts/docker-postgres.sh
```

## Environment Configuration

### Local Development (.env.local)
- SQLite database
- Local file storage
- Debug logging
- CORS enabled for development

### Docker Production (.env.docker)
- SQLite database in container
- Local file storage in container
- Info logging
- Production CORS settings

### PostgreSQL Testing (.env.postgres)
- PostgreSQL database
- Local file storage
- Info logging
- Development CORS settings

## File Structure

```
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev            # Development Docker image
├── docker-compose.yml        # Docker Compose configuration
├── .dockerignore            # Docker build exclusions
├── .env.local               # Local development environment
├── .env.docker              # Docker environment
├── .env.postgres            # PostgreSQL environment
├── scripts/
│   ├── setup-local.sh       # Local setup script
│   ├── dev-start.sh         # Native development servers
│   ├── docker-dev.sh        # Docker development
│   ├── docker-prod.sh       # Docker production
│   └── docker-postgres.sh   # Docker with PostgreSQL
└── quick-start.sh           # Interactive startup script
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 5173 are available
2. **Database locked**: Stop all running instances before starting new ones
3. **Permission errors**: Ensure scripts are executable (`chmod +x scripts/*.sh`)
4. **Docker issues**: Try `docker-compose down` and restart

### Logs

- **Native development**: Logs appear in terminal
- **Docker**: Use `docker-compose logs` to view logs
- **Backend logs**: Controlled by `RUST_LOG` environment variable

### Database Reset

To reset the database:
```bash
# For SQLite
rm backend/miniature_tracker.db*

# For PostgreSQL
docker-compose --profile postgres down -v
```

## Next Steps

After local deployment is working, proceed to AWS deployment configuration in the next task.