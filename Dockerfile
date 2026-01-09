# Multi-stage build for Rust backend
FROM rust:1.75 as backend-builder

WORKDIR /app

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY backend/Cargo.toml ./backend/
COPY shared-types/Cargo.toml ./shared-types/

# Copy source code
COPY backend/src ./backend/src
COPY shared-types/src ./shared-types/src

# Build the backend
RUN cargo build --release --bin miniature-painting-tracker-backend

# Frontend build stage
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Final runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/target/release/miniature-painting-tracker-backend ./backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy migrations
COPY backend/migrations ./migrations

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV DATABASE_URL=sqlite:./miniature_tracker.db
ENV PORT=3000
ENV STORAGE_TYPE=local
ENV LOCAL_STORAGE_PATH=./uploads
ENV RUST_LOG=info

# Expose port
EXPOSE 3000

# Run the application
CMD ["./backend"]