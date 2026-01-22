# Requirements Document

## Introduction

The iOS Miniature Painting Tracker is a native mobile application designed to help Warhammer miniature painters organize and track their painting projects across multiple game systems. The app operates entirely offline, storing all data locally on the device using Core Data, with full camera integration for photo capture and management. The application provides comprehensive tracking capabilities for painting progress, recipe management, and photo documentation while maintaining data portability through export functionality.

## Glossary

- **App**: The iOS Miniature Painting Tracker application
- **Core_Data**: Apple's object graph and persistence framework for iOS
- **Photo_Library**: iOS Photos framework for accessing user's photo library
- **Camera**: iOS AVFoundation camera capture functionality
- **Export_System**: Data export functionality that creates structured files with photo references
- **Game_System**: Warhammer game variants (Age of Sigmar, 40K, Horus Heresy)
- **Progress_Status**: Painting completion stages (unpainted, primed, basecoated, detailed, completed)
- **Recipe**: Step-by-step painting instructions with materials and techniques
- **Project**: Collection of miniatures organized by game system and army
- **Miniature**: Individual model being painted with progress tracking
- **Photo_Reference**: File path or identifier pointing to stored photo without embedding the image data

## Requirements

### Requirement 1: Project Management

**User Story:** As a miniature painter, I want to create and manage painting projects organized by game system and army, so that I can keep my different collections organized.

#### Acceptance Criteria

1. WHEN creating a new project, THE App SHALL require both game_system and army fields to be provided and non-empty
2. WHEN displaying projects, THE App SHALL organize them first by game_system, then by army within each system
3. WHEN updating a project, THE App SHALL persist changes to Core_Data immediately and update the display
4. WHEN deleting a project, THE App SHALL remove all associated miniatures and their photo references from Core_Data
5. THE App SHALL support the game systems: Age of Sigmar, Warhammer 40K, and Horus Heresy

### Requirement 2: Miniature Tracking

**User Story:** As a painter, I want to track individual miniatures within projects with progress status, so that I can monitor my painting workflow.

#### Acceptance Criteria

1. WHEN adding a miniature to a project, THE App SHALL require name and miniature_type fields to be provided and non-empty
2. WHEN updating miniature progress, THE App SHALL record both the new progress_status and update timestamp in Core_Data
3. THE App SHALL support progress statuses: unpainted, primed, basecoated, detailed, completed
4. WHEN deleting a miniature, THE App SHALL remove all associated photo references from Core_Data and the file system
5. THE App SHALL support miniature types: troop and character

### Requirement 3: Recipe Management

**User Story:** As a painter, I want to create and manage painting recipes with steps and materials, so that I can replicate successful painting techniques.

#### Acceptance Criteria

1. WHEN creating a recipe, THE App SHALL require the name field to be provided and non-empty
2. THE App SHALL store recipe steps, paints_used, and techniques as structured data in Core_Data
3. WHEN filtering recipes by type, THE App SHALL return only recipes matching the specified miniature_type
4. THE App SHALL allow recipes to be updated and deleted independently of projects and miniatures

### Requirement 4: Photo Management

**User Story:** As a painter, I want to capture and manage photos of my miniatures using the device camera or photo library, so that I can document my painting progress.

#### Acceptance Criteria

1. WHEN adding a photo to a miniature, THE App SHALL associate the photo with the correct miniature in Core_Data
2. WHEN capturing or selecting photos, THE App SHALL accept only image formats: JPEG, PNG, and HEIC
3. WHEN displaying miniature photos, THE App SHALL order them chronologically by capture or selection timestamp
4. WHEN deleting a photo, THE App SHALL remove both the Core_Data record and the physical file from device storage
5. THE App SHALL store photos in the app's document directory with unique filenames

### Requirement 5: Camera Integration

**User Story:** As a painter, I want to use my device's camera to capture photos of miniatures directly within the app, so that I can quickly document my work.

#### Acceptance Criteria

1. WHEN accessing camera functionality, THE App SHALL request camera permission from the user
2. WHEN camera permission is denied, THE App SHALL display an appropriate message and disable camera features
3. WHEN capturing a photo, THE App SHALL save the image to the app's document directory with a unique filename
4. WHEN the camera is unavailable, THE App SHALL gracefully disable camera functionality and show photo library option only
5. THE App SHALL provide a camera interface that allows photo capture with standard iOS camera controls

### Requirement 6: Photo Library Integration

**User Story:** As a painter, I want to select existing photos from my device's photo library, so that I can add previously taken photos to my miniatures.

#### Acceptance Criteria

1. WHEN accessing photo library, THE App SHALL request photo library permission from the user
2. WHEN photo library permission is denied, THE App SHALL display an appropriate message and disable photo selection
3. WHEN selecting a photo from the library, THE App SHALL copy the image to the app's document directory
4. THE App SHALL provide a standard iOS photo picker interface for photo selection
5. WHEN copying photos from the library, THE App SHALL maintain original image quality

### Requirement 7: Offline Data Storage

**User Story:** As a user, I want all my data stored locally on my device, so that I can use the app without internet connectivity.

#### Acceptance Criteria

1. THE App SHALL use Core_Data for all persistent data storage
2. THE App SHALL store all photos in the app's local document directory
3. THE App SHALL function completely without network connectivity
4. WHEN the app launches, THE App SHALL load all data from local Core_Data storage
5. THE App SHALL never attempt to connect to external servers or APIs

### Requirement 8: Data Export

**User Story:** As a user, I want to export my project data with photo references, so that I can backup or share my painting information.

#### Acceptance Criteria

1. WHEN exporting data, THE App SHALL create structured files (JSON or CSV) containing all project, miniature, and recipe information
2. WHEN exporting data, THE App SHALL include photo file references but not embed the actual photo data
3. THE App SHALL provide export options for individual projects or complete data export
4. WHEN exporting, THE App SHALL use iOS share functionality to allow users to save or send the export files
5. THE Export_System SHALL create human-readable file formats that can be opened on other devices

### Requirement 9: Data Persistence and Integrity

**User Story:** As a user, I want my data to be reliably saved and maintained, so that I don't lose my painting progress and information.

#### Acceptance Criteria

1. THE App SHALL automatically save all changes to Core_Data immediately upon user input
2. WHEN Core_Data operations fail, THE App SHALL display appropriate error messages to the user
3. THE App SHALL maintain referential integrity between projects, miniatures, recipes, and photos
4. WHEN the app is terminated unexpectedly, THE App SHALL preserve all previously saved data
5. THE App SHALL handle Core_Data migration if the data model changes in future versions

### Requirement 10: User Interface and Navigation

**User Story:** As a user, I want an intuitive iOS interface that follows platform conventions, so that the app feels familiar and easy to use.

#### Acceptance Criteria

1. THE App SHALL use SwiftUI for all user interface components
2. THE App SHALL follow iOS Human Interface Guidelines for navigation and interaction patterns
3. WHEN displaying lists of items, THE App SHALL provide standard iOS list interactions (swipe to delete, pull to refresh)
4. THE App SHALL use iOS navigation patterns with proper back button functionality
5. THE App SHALL provide appropriate loading states and user feedback for all operations

### Requirement 11: Permission Handling

**User Story:** As a user, I want the app to properly request and handle device permissions, so that I understand what access the app needs and why.

#### Acceptance Criteria

1. WHEN first accessing camera functionality, THE App SHALL display iOS permission request with clear usage description
2. WHEN first accessing photo library, THE App SHALL display iOS permission request with clear usage description
3. WHEN permissions are denied, THE App SHALL provide clear instructions on how to enable them in Settings
4. THE App SHALL gracefully degrade functionality when permissions are not granted
5. THE App SHALL check permission status before attempting to use camera or photo library features

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when errors occur, so that I understand what went wrong and how to resolve issues.

#### Acceptance Criteria

1. WHEN Core_Data operations fail, THE App SHALL display user-friendly error messages
2. WHEN photo operations fail, THE App SHALL provide specific error information and suggested actions
3. WHEN device storage is full, THE App SHALL notify the user and prevent further photo additions
4. THE App SHALL provide loading indicators for operations that take time to complete
5. THE App SHALL use iOS standard alert and notification patterns for user feedback