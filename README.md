# Miniature Painting Tracker

A comprehensive project tracking system for Warhammer miniature painting projects across Age of Sigmar, Horus Heresy, and Warhammer 40K systems. Built with Rust backend and React TypeScript frontend.

## 🎯 Features

- **Project Management** - Organize projects by game system (Age of Sigmar, 40K, Horus Heresy) and army
- **Miniature Tracking** - Track individual models with progress status (unpainted → primed → basecoated → detailed → completed)
- **Photo Documentation** - Upload and manage progress photos for each miniature
- **Recipe Management** - Save and organize painting techniques, color schemes, and step-by-step guides
- **Flexible Deployment** - Run locally with SQLite or deploy to AWS with RDS/S3

## 🚀 Quick Start

The easiest way to get started:

```bash
# 1. Set up the project (one-time setup)
./scripts/setup-local.sh

# 2. Start the application
./quick-start.sh
```

Choose option 1 (Native development) for the best development experience.

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📁 Project Structure

```
├── backend/              # Rust backend API with Axum
│   ├── src/
│   │   ├── handlers/     # API route handlers
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   └── storage/      # File storage abstraction
│   └── migrations/       # Database migrations
├── frontend/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── api/          # API client
├── infrastructure/       # AWS CDK infrastructure as code
├── scripts/              # Development and deployment scripts
├── shared-types/         # Shared Rust type definitions
└── .kiro/specs/          # Project specifications and design docs
```

## 🛠 Development

### Prerequisites

- **Rust** (latest stable) - [Install from rustup.rs](https://rustup.rs/)
- **Node.js** (18+) - [Install from nodejs.org](https://nodejs.org/)
- **Docker** (optional) - For containerized deployment

### Manual Setup

If you prefer to set up manually:

```bash
# Backend setup
cd backend
cp .env.example .env
cargo build
cargo run  # Starts on http://localhost:3000

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

### Available Scripts

**Root level:**
```bash
./scripts/setup-local.sh     # One-time project setup
./scripts/dev-start.sh       # Start both frontend and backend
./scripts/docker-dev.sh      # Run with Docker
./scripts/build-all.sh       # Build both components
```

**Backend (Rust):**
```bash
cargo run                    # Start development server
cargo test                   # Run all tests (including property-based tests)
cargo fmt                    # Format code
cargo clippy                 # Run linter
```

**Frontend (React):**
```bash
npm run dev                  # Start development server
npm run build                # Build for production
npm test                     # Run tests
npm run lint                 # Run ESLint
```

## 🧪 Testing

The project includes comprehensive testing:

- **Backend**: 16 tests including property-based tests for correctness validation
- **Frontend**: 130+ tests covering components and integration
- **Property-Based Testing**: Validates universal correctness properties using QuickCheck

```bash
# Run all backend tests
cd backend && cargo test

# Run frontend tests
cd frontend && npm test
```

## 🐳 Docker Deployment

### Development with Docker
```bash
./scripts/docker-dev.sh
```

### Production with Docker
```bash
./scripts/docker-build.sh
./scripts/docker-prod.sh
```

### Docker with PostgreSQL (cloud-like testing)
```bash
./scripts/docker-postgres.sh
```

## ☁️ AWS Deployment

Complete AWS infrastructure using CDK:

```bash
# Build the application
./scripts/build-all.sh --prod

# Deploy infrastructure
cd infrastructure
./scripts/deploy.sh -e prod

# Run database migrations
./scripts/migrate.sh -e prod
```

**AWS Resources:**
- **RDS PostgreSQL** - Production database
- **S3** - Photo storage with proper permissions
- **ECS Fargate** - Container hosting with auto-scaling
- **Application Load Balancer** - Traffic distribution
- **CloudFront** - Global CDN
- **VPC** - Secure networking

## 📊 Architecture

### Backend (Rust)
- **Framework**: Axum web framework
- **Database**: SQLx with SQLite (local) / PostgreSQL (production)
- **Storage**: Abstracted storage layer (Local FS / S3)
- **Testing**: Property-based testing with QuickCheck

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router
- **UI**: Material-UI components
- **State**: React hooks with custom API hooks
- **Build**: Vite for fast development and building

### Database Schema
- **Projects**: Game system, army, description
- **Miniatures**: Name, type, progress status, notes
- **Recipes**: Steps, paints, techniques by miniature type
- **Photos**: File metadata with miniature association

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=sqlite:miniature_tracker.db
STORAGE_TYPE=local
UPLOAD_DIR=uploads
PORT=3000
```

**Production (AWS):**
```env
DATABASE_URL=postgresql://...
STORAGE_TYPE=s3
S3_BUCKET=miniature-tracker-photos
AWS_REGION=us-east-1
```

## 📝 API Documentation

The API follows REST conventions:

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/miniatures` - Add miniature to project
- `GET /api/recipes` - List recipes
- `POST /api/miniatures/:id/photos` - Upload photo

See `openapi.yaml` for complete API specification.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`cargo test && npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎨 Screenshots

*Screenshots will be added as the UI is finalized*

## 🚧 Roadmap

- [ ] Advanced filtering and search
- [ ] Batch operations for miniatures
- [ ] Export/import functionality
- [ ] Mobile app (React Native)
- [ ] Community recipe sharing

---

**Built with ❤️ for the Warhammer painting community**