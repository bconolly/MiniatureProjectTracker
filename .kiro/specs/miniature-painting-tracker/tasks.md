# Implementation Plan: Miniature Painting Tracker

## Overview

This implementation plan breaks down the miniature painting tracker into discrete coding tasks, building from core infrastructure through to complete functionality. The approach emphasizes incremental development with early validation through testing, ensuring each component works correctly before building dependent features.

## Tasks

- [x] 1. Set up project structure and development environment
  - Create Rust workspace with backend and shared types
  - Set up React frontend with TypeScript
  - Configure development tooling (linting, formatting, testing)
  - Set up database migration system with SQLx
  - _Requirements: 5.1, 7.1, 6.1_

- [x] 2. Implement core data models and database schema
  - [x] 2.1 Create database schema with migration files
    - Define tables for projects, miniatures, recipes, and photos
    - Set up foreign key relationships and constraints
    - Create initial migration with proper indexes
    - _Requirements: 5.1_

  - [x] 2.2 Implement Rust data models with validation
    - Create structs for Project, Miniature, PaintingRecipe, and Photo
    - Implement enums for GameSystem, MiniatureType, and ProgressStatus
    - Add Serde serialization and SQLx integration
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 2.3 Write property test for data model validation
    - **Property 1: Project creation requires system and army**
    - **Validates: Requirements 1.1**

  - [x] 2.4 Write property test for miniature validation
    - **Property 5: Miniature creation validation**
    - **Validates: Requirements 2.1**

- [x] 3. Implement database layer and connection management
  - [x] 3.1 Create database connection pool and configuration
    - Set up SQLx connection pool with environment-based configuration
    - Implement database URL selection (SQLite vs PostgreSQL)
    - Add connection health checks and error handling
    - _Requirements: 5.2, 5.3_

  - [x] 3.2 Implement repository pattern for data access
    - Create ProjectRepository with CRUD operations
    - Create MiniatureRepository with project association
    - Create RecipeRepository with type filtering
    - Create PhotoRepository with miniature association
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 4.1, 4.3, 4.4_

  - [x] 3.3 Write property tests for repository operations
    - **Property 3: Project update persistence**
    - **Property 4: Project cascade deletion**
    - **Property 7: Miniature cascade deletion**
    - **Validates: Requirements 1.3, 1.4, 2.4**

- [x] 4. Checkpoint - Database layer validation
  - Ensure all database tests pass, ask the user if questions arise.

- [-] 5. Implement REST API endpoints and request handling
  - [x] 5.1 Set up Axum web server with middleware
    - Configure CORS, logging, and error handling middleware
    - Set up JSON request/response handling
    - Implement structured error response format
    - _Requirements: 7.1, 7.4_

  - [x] 5.2 Implement project management endpoints
    - GET /api/projects - list projects with organization
    - POST /api/projects - create new project
    - GET /api/projects/:id - get project details
    - PUT /api/projects/:id - update project
    - DELETE /api/projects/:id - delete project with cascade
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 5.3 Implement miniature management endpoints
    - GET /api/projects/:id/miniatures - list miniatures in project
    - POST /api/projects/:id/miniatures - add miniature to project
    - GET /api/miniatures/:id - get miniature details
    - PUT /api/miniatures/:id - update miniature progress
    - DELETE /api/miniatures/:id - delete miniature
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.4 Implement recipe management endpoints
    - GET /api/recipes - list recipes with optional type filtering
    - POST /api/recipes - create new recipe
    - GET /api/recipes/:id - get recipe details
    - PUT /api/recipes/:id - update recipe
    - DELETE /api/recipes/:id - delete recipe
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.5 Write property tests for API validation
    - **Property 16: API input validation**
    - **Property 17: HTTP status code compliance**
    - **Property 18: Structured error responses**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 6. Implement file upload and photo management
  - [x] 6.1 Create file storage abstraction layer
    - Implement local filesystem storage handler
    - Implement S3 storage handler with AWS SDK
    - Create storage configuration based on deployment environment
    - _Requirements: 4.1, 4.4_

  - [x] 6.2 Implement photo upload endpoints
    - POST /api/miniatures/:id/photos - upload photo with validation
    - GET /api/miniatures/:id/photos - list photos for miniature
    - DELETE /api/photos/:id - delete photo from storage and database
    - Add file type validation and size limits
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.3 Write property tests for photo management
    - **Property 10: Photo-miniature association**
    - **Property 11: Image format validation**
    - **Property 12: Photo chronological ordering**
    - **Property 13: Photo storage deletion**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 7. Checkpoint - Backend API completion
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 8. Implement React frontend foundation
  - [x] 8.1 Set up React application structure
    - Create React app with TypeScript and routing
    - Set up component structure and shared types
    - Configure API client with Axios
    - Add styling framework (Material-UI or Tailwind)
    - _Requirements: 6.1_

  - [x] 8.2 Create shared TypeScript types and API client
    - Define TypeScript interfaces matching Rust models
    - Implement API client functions for all endpoints
    - Add error handling and loading states
    - _Requirements: 6.2_

  - [x] 8.3 Implement routing and navigation
    - Set up React Router with all required routes
    - Create navigation components and layout
    - Add route guards and error boundaries
    - _Requirements: 6.1_

- [x] 9. Implement project management UI
  - [x] 9.1 Create project list and organization components
    - ProjectList component with system/army organization
    - Project creation form with validation
    - Project card components with actions
    - _Requirements: 1.1, 1.2, 6.2_

  - [x] 9.2 Create project detail and editing components
    - ProjectDetail component showing miniatures
    - Project editing form with validation
    - Project deletion with confirmation
    - _Requirements: 1.3, 1.4, 6.2_

  - [x] 9.3 Write unit tests for project components
    - Test project creation form validation
    - Test project list organization
    - Test project update workflows
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 10. Implement miniature tracking UI
  - [x] 10.1 Create miniature management components
    - MiniatureCard component with progress display
    - Miniature creation form with type selection
    - Progress update controls with status tracking
    - _Requirements: 2.1, 2.2, 2.3, 6.2_

  - [x] 10.2 Create miniature detail and photo display
    - MiniatureDetail component with photo gallery
    - Photo upload component with drag-and-drop
    - Photo display with chronological ordering
    - _Requirements: 4.1, 4.3, 6.2_

  - [x] 10.3 Write unit tests for miniature components
    - Test miniature creation and validation
    - Test progress tracking updates
    - Test photo upload workflows
    - _Requirements: 2.1, 2.2, 4.1_

- [x] 11. Implement recipe management UI
  - [x] 11.1 Create recipe management components
    - RecipeList component with type filtering
    - Recipe creation form with steps and paints
    - Recipe detail view with editing capabilities
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.2_

  - [x] 11.2 Write unit tests for recipe components
    - Test recipe creation and validation
    - Test recipe filtering by type
    - Test recipe editing workflows
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 12. Checkpoint - Frontend completion
  - Ensure all frontend tests pass, ask the user if questions arise.

- [x] 13. Implement deployment configurations
  - [x] 13.1 Create local deployment setup
    - Docker configuration for local development
    - Environment configuration for SQLite
    - Local file storage configuration
    - Development server setup scripts
    - _Requirements: 8.1, 8.3_

  - [x] 13.2 Create AWS infrastructure as code
    - AWS CDK stack for complete infrastructure
    - RDS PostgreSQL database configuration
    - S3 bucket for photo storage with proper permissions
    - ECS service configuration for application hosting
    - Application Load Balancer and CloudFront setup
    - _Requirements: 8.2, 8.4_

  - [x] 13.3 Create deployment scripts and CI/CD
    - Build scripts for both frontend and backend
    - Docker images for production deployment
    - Environment-specific configuration management
    - Database migration scripts for production
    - _Requirements: 8.1, 8.2_

- [x] 14. Write integration tests for complete workflows
  - End-to-end tests for project creation to completion
  - Photo upload and management workflows
  - Recipe creation and usage workflows
  - Error handling and recovery scenarios
  - _Requirements: 9.4_

- [x] 15. Final checkpoint and documentation
  - Ensure all tests pass across all layers
  - Verify deployment works in both local and AWS environments
  - Ask the user if questions arise before completion.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally from data layer through API to UI