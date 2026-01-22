# Implementation Plan: iOS Miniature Painting Tracker

## Overview

This implementation plan breaks down the iOS Miniature Painting Tracker into discrete coding tasks that build incrementally. The approach follows iOS development best practices with Core Data for persistence, SwiftUI for UI, and proper separation of concerns using MVVM architecture. Each task builds upon previous work to create a fully functional offline-first miniature painting tracking application.

## Tasks

- [x] 1. Set up project structure and Core Data stack
  - Create new iOS project with SwiftUI and Core Data
  - Configure Core Data model with Project, Miniature, Recipe, and Photo entities
  - Set up Core Data stack with persistent container and contexts
  - Create base enumerations (GameSystem, MiniatureType, ProgressStatus)
  - Configure Info.plist with camera and photo library usage descriptions
  - _Requirements: 7.1, 9.3, 11.1, 11.2_

- [x] 1.1 Write property test for Core Data stack initialization
  - **Property 14: App initialization data loading**
  - **Validates: Requirements 7.4**

- [x] 2. Implement Core Data entities and relationships
  - [x] 2.1 Create Project Core Data entity with validation
    - Implement Project NSManagedObject subclass with computed properties
    - Add validation for required fields (name, gameSystem, army)
    - Set up cascade delete relationship to miniatures
    - _Requirements: 1.1, 1.4_
  
  - [x] 2.2 Write property test for Project entity validation
    - **Property 1: Input validation consistency**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 Create Miniature Core Data entity with relationships
    - Implement Miniature NSManagedObject subclass with computed properties
    - Add validation for required fields (name, miniatureType)
    - Set up relationships to Project and Photos with cascade delete
    - _Requirements: 2.1, 2.4_
  
  - [ ]* 2.4 Write property test for Miniature entity validation
    - **Property 1: Input validation consistency**
    - **Validates: Requirements 2.1**
  
  - [x] 2.5 Create Recipe Core Data entity with JSON storage
    - Implement Recipe NSManagedObject subclass with JSON encoding/decoding
    - Add validation for required name field
    - Implement computed properties for steps, paintsUsed, and techniques arrays
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 2.6 Write property test for Recipe entity validation
    - **Property 1: Input validation consistency**
    - **Validates: Requirements 3.1**
  
  - [x] 2.7 Create Photo Core Data entity with file system integration
    - Implement Photo NSManagedObject subclass with file URL computation
    - Set up relationship to Miniature with cascade delete
    - Add file size and MIME type validation
    - _Requirements: 4.1, 4.2_

- [ ]* 2.8 Write property test for cascade deletion
  - **Property 4: Cascade deletion completeness**
  - **Validates: Requirements 1.4, 2.4**

- [ ] 3. Implement service layer architecture
  - [ ] 3.1 Create CoreDataService with CRUD operations
    - Implement CoreDataServiceProtocol with save, fetch, delete methods
    - Add background context support for data operations
    - Implement error handling for Core Data operations
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 3.2 Write property test for data persistence immediacy
    - **Property 3: Data persistence immediacy**
    - **Validates: Requirements 1.3, 2.2, 9.1**
  
  - [ ] 3.3 Create PhotoService for file management
    - Implement PhotoServiceProtocol with save, load, delete methods
    - Add unique filename generation for photo storage
    - Implement photo directory management in document directory
    - Add image format validation (JPEG, PNG, HEIC)
    - _Requirements: 4.2, 4.4, 4.5, 5.3, 7.2_
  
  - [ ]* 3.4 Write property test for photo storage consistency
    - **Property 11: Photo storage consistency**
    - **Validates: Requirements 4.5, 5.3, 7.2**
  
  - [ ] 3.5 Create PermissionService for camera and photo library access
    - Implement permission checking for camera and photo library
    - Add permission request methods with proper error handling
    - Implement permission status monitoring
    - _Requirements: 11.5_
  
  - [ ]* 3.6 Write property test for permission status checking
    - **Property 19: Permission status checking**
    - **Validates: Requirements 11.5**

- [ ] 4. Checkpoint - Core services and data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement camera integration with AVFoundation
  - [ ] 5.1 Create CameraController using UIViewControllerRepresentable
    - Implement AVCaptureSession setup with photo output
    - Add camera preview layer integration with SwiftUI
    - Implement photo capture functionality with quality settings
    - Add flash control and focus/exposure management
    - _Requirements: 5.5_
  
  - [ ] 5.2 Create CameraViewModel for camera state management
    - Implement ObservableObject for camera state and captured images
    - Add permission handling integration with PermissionService
    - Implement error handling for camera unavailability
    - Add flash toggle and capture methods
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ] 5.3 Create CameraView SwiftUI interface
    - Implement SwiftUI view wrapping CameraController
    - Add camera controls (capture button, flash toggle, cancel/done)
    - Implement permission denied state with user guidance
    - Add loading states and error handling UI
    - _Requirements: 5.2, 5.5_

- [ ]* 5.4 Write unit tests for camera integration
  - Test camera permission handling and error states
  - Test photo capture and storage integration
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Implement photo library integration
  - [ ] 6.1 Create PhotoPickerController using PHPickerViewController
    - Implement PHPickerViewControllerDelegate for photo selection
    - Add image format filtering and validation
    - Implement photo copying to app document directory
    - Add quality preservation during photo copying
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ] 6.2 Create PhotoPickerView SwiftUI wrapper
    - Implement UIViewControllerRepresentable for PHPickerViewController
    - Add permission handling integration
    - Implement error handling for permission denied states
    - Add completion handling for selected photos
    - _Requirements: 6.1, 6.2, 6.4_

- [ ]* 6.3 Write property test for photo library copying fidelity
  - **Property 12: Photo library copying fidelity**
  - **Validates: Requirements 6.3, 6.5**

- [ ] 7. Implement core ViewModels with MVVM pattern
  - [ ] 7.1 Create ProjectListViewModel
    - Implement ObservableObject with @Published properties for projects
    - Add CRUD operations using CoreDataService
    - Implement search and filtering functionality
    - Add project organization by game system and army
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 7.2 Write property test for project organization consistency
    - **Property 2: Project organization consistency**
    - **Validates: Requirements 1.2**
  
  - [ ] 7.3 Create MiniatureDetailViewModel
    - Implement ObservableObject for miniature state management
    - Add progress tracking with timestamp updates
    - Integrate photo capture and selection functionality
    - Add photo management (add, delete, reorder)
    - _Requirements: 2.2, 4.1, 4.3, 4.4_
  
  - [ ]* 7.4 Write property test for photo-miniature association integrity
    - **Property 8: Photo-miniature association integrity**
    - **Validates: Requirements 4.1**
  
  - [ ] 7.5 Create RecipeListViewModel
    - Implement ObservableObject for recipe management
    - Add CRUD operations for recipes
    - Implement filtering by miniature type
    - Add recipe independence validation
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [ ]* 7.6 Write property test for recipe filtering accuracy
    - **Property 6: Recipe filtering accuracy**
    - **Validates: Requirements 3.3**

- [ ] 8. Implement SwiftUI views and navigation
  - [ ] 8.1 Create ProjectListView with navigation
    - Implement SwiftUI List with project cards
    - Add navigation to ProjectDetailView
    - Implement search bar and game system filtering
    - Add swipe-to-delete functionality
    - Add floating action button for new project creation
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [ ] 8.2 Create ProjectDetailView with miniature management
    - Implement miniature list with progress indicators
    - Add navigation to MiniatureDetailView
    - Implement add miniature functionality
    - Add project editing capabilities
    - _Requirements: 10.2, 10.4_
  
  - [ ] 8.3 Create MiniatureDetailView with photo gallery
    - Implement photo gallery with chronological ordering
    - Add camera and photo library integration
    - Implement progress status picker
    - Add notes editing functionality
    - _Requirements: 4.3, 10.2_
  
  - [ ]* 8.4 Write property test for photo chronological ordering
    - **Property 10: Photo chronological ordering**
    - **Validates: Requirements 4.3**
  
  - [ ] 8.5 Create RecipeListView and RecipeDetailView
    - Implement recipe list with type filtering
    - Add recipe creation and editing forms
    - Implement step-by-step recipe display
    - Add paint and technique management
    - _Requirements: 3.2, 3.3_

- [ ] 9. Checkpoint - Core UI and functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement data export functionality
  - [ ] 10.1 Create ExportService with data serialization
    - Implement ExportServiceProtocol with JSON export
    - Add individual project export functionality
    - Implement complete data export with all entities
    - Add photo reference inclusion without embedding image data
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 10.2 Write property test for export data completeness
    - **Property 15: Export data completeness**
    - **Validates: Requirements 8.1, 8.2, 8.5**
  
  - [ ] 10.3 Create ExportView with sharing integration
    - Implement export options UI (individual vs complete)
    - Add iOS share sheet integration
    - Implement export progress indicators
    - Add export format selection (JSON/CSV)
    - _Requirements: 8.4_
  
  - [ ]* 10.4 Write property test for export scope accuracy
    - **Property 16: Export scope accuracy**
    - **Validates: Requirements 8.3**

- [ ] 11. Implement offline functionality and validation
  - [ ] 11.1 Add network isolation validation
    - Implement network monitoring to ensure no external connections
    - Add offline functionality testing across all features
    - Validate app works without network connectivity
    - _Requirements: 7.3, 7.5_
  
  - [ ]* 11.2 Write property test for offline functionality completeness
    - **Property 13: Offline functionality completeness**
    - **Validates: Requirements 7.3, 7.5**
  
  - [ ] 11.3 Implement enum validation across all entities
    - Add validation for GameSystem, MiniatureType, and ProgressStatus enums
    - Implement enum value checking in all CRUD operations
    - Add error handling for invalid enum values
    - _Requirements: 1.5, 2.3, 2.5_
  
  - [ ]* 11.4 Write property test for enum value validation
    - **Property 5: Enum value validation**
    - **Validates: Requirements 1.5, 2.3, 2.5**

- [ ] 12. Implement comprehensive error handling and user feedback
  - [ ] 12.1 Create ErrorHandler service for centralized error management
    - Implement error categorization and user-friendly messages
    - Add error recovery strategies for Core Data failures
    - Implement file system error handling with cleanup
    - Add permission error handling with user guidance
    - _Requirements: 9.2, 12.1, 12.2_
  
  - [ ] 12.2 Add loading states and user feedback across all views
    - Implement loading indicators for long-running operations
    - Add success/failure feedback for user actions
    - Implement iOS standard alert patterns
    - Add storage space monitoring and warnings
    - _Requirements: 12.3, 12.4, 12.5_

- [ ]* 12.3 Write property test for referential integrity maintenance
  - **Property 17: Referential integrity maintenance**
  - **Validates: Requirements 9.3**

- [ ] 13. Implement data persistence and app lifecycle handling
  - [ ] 13.1 Add app lifecycle data persistence validation
    - Implement background/foreground state handling
    - Add data persistence verification across app termination
    - Implement Core Data save on app backgrounding
    - Add data recovery on app launch
    - _Requirements: 9.4_
  
  - [ ]* 13.2 Write property test for data persistence across app lifecycle
    - **Property 18: Data persistence across app lifecycle**
    - **Validates: Requirements 9.4**
  
  - [ ] 13.3 Add image format validation across all photo operations
    - Implement MIME type checking for photo capture and selection
    - Add file format validation in PhotoService
    - Implement error handling for unsupported formats
    - _Requirements: 4.2_
  
  - [ ]* 13.4 Write property test for image format validation
    - **Property 9: Image format validation**
    - **Validates: Requirements 4.2**

- [ ] 14. Final integration and testing
  - [ ] 14.1 Implement recipe independence validation
    - Add testing to ensure recipe operations don't affect other entities
    - Implement isolation testing for recipe CRUD operations
    - Validate recipe filtering doesn't impact other data
    - _Requirements: 3.4_
  
  - [ ]* 14.2 Write property test for recipe independence
    - **Property 7: Recipe independence**
    - **Validates: Requirements 3.4**
  
  - [ ] 14.3 Add comprehensive integration testing
    - Test complete user workflows from UI to Core Data
    - Validate camera and photo library integration end-to-end
    - Test export functionality with real data
    - Validate app performance with large datasets
    - _Requirements: All requirements integration_

- [ ] 15. Final checkpoint - Complete application ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and integration points
- The implementation follows iOS best practices with MVVM architecture
- Core Data is used for all persistent storage with proper relationship management
- Camera and photo library integration follows iOS permission patterns
- Export functionality provides data portability without embedding photos