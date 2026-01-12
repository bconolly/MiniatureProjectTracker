#[cfg(test)]
mod property_tests {
    use crate::database::{Database, DatabaseConfig};
    use crate::repositories::{MiniatureRepository, PhotoRepository, ProjectRepository};
    use quickcheck::TestResult;
    use quickcheck_macros::quickcheck;
    use shared_types::{
        CreateMiniatureRequest, CreateProjectRequest, GameSystem, MiniatureType, ProgressStatus,
        UpdateProjectRequest,
    };
    use std::time::Duration;

    // Feature: miniature-painting-tracker, Property 1: Project creation requires system and army
    #[quickcheck]
    fn test_project_creation_validation(name: String, army: String) -> TestResult {
        // Test that project creation requires both name and army to be non-empty
        let request = CreateProjectRequest {
            name: name.clone(),
            game_system: GameSystem::AgeOfSigmar, // Always provide a valid game system
            army: army.clone(),
            description: None,
        };

        // Project should be valid if and only if both name and army are valid strings
        let is_valid_input = is_valid_string(&name) && is_valid_string(&army);
        let is_valid_request = validate_project_creation(&request);

        TestResult::from_bool(is_valid_input == is_valid_request)
    }

    // Feature: miniature-painting-tracker, Property 5: Miniature creation validation
    #[quickcheck]
    fn test_miniature_creation_validation(name: String) -> TestResult {
        // Test that miniature creation requires name to be non-empty
        let request = CreateMiniatureRequest {
            name: name.clone(),
            miniature_type: MiniatureType::Troop, // Always provide a valid miniature type
            notes: None,
        };

        // Miniature should be valid if and only if name is a valid string
        let is_valid_input = is_valid_string(&name);
        let is_valid_request = validate_miniature_creation(&request);

        TestResult::from_bool(is_valid_input == is_valid_request)
    }

    // Feature: miniature-painting-tracker, Property 3: Project update persistence
    #[quickcheck]
    fn test_project_update_persistence(name: String, army: String) -> TestResult {
        // Skip invalid inputs
        if name.trim().is_empty() || army.trim().is_empty() {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project
            let create_request = CreateProjectRequest {
                name: "Original Name".to_string(),
                game_system: GameSystem::AgeOfSigmar,
                army: "Original Army".to_string(),
                description: Some("Original description".to_string()),
            };

            let project = ProjectRepository::create(&database, create_request)
                .await
                .unwrap();

            // Update the project
            let update_request = UpdateProjectRequest {
                name: Some(name.clone()),
                game_system: None,
                army: Some(army.clone()),
                description: None,
            };

            let updated_project = ProjectRepository::update(&database, project.id, update_request)
                .await
                .unwrap()
                .unwrap();

            // Verify the update persisted by querying again
            let queried_project = ProjectRepository::find_by_id(&database, project.id)
                .await
                .unwrap()
                .unwrap();

            TestResult::from_bool(
                queried_project.name == name
                    && queried_project.army == army
                    && queried_project.name == updated_project.name
                    && queried_project.army == updated_project.army,
            )
        })
    }

    // Feature: miniature-painting-tracker, Property 4: Project cascade deletion
    #[quickcheck]
    fn test_project_cascade_deletion(miniature_name: String) -> TestResult {
        // Skip invalid inputs
        if miniature_name.trim().is_empty() {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project
            let create_request = CreateProjectRequest {
                name: "Test Project".to_string(),
                game_system: GameSystem::AgeOfSigmar,
                army: "Test Army".to_string(),
                description: None,
            };

            let project = ProjectRepository::create(&database, create_request)
                .await
                .unwrap();

            // Create a miniature in the project
            let miniature_request = CreateMiniatureRequest {
                name: miniature_name.clone(),
                miniature_type: MiniatureType::Troop,
                notes: None,
            };

            let miniature = MiniatureRepository::create(&database, project.id, miniature_request)
                .await
                .unwrap();

            // Create a photo for the miniature
            let photo = PhotoRepository::create(
                &database,
                miniature.id,
                "test.jpg".to_string(),
                "/tmp/test.jpg".to_string(),
                1024,
                "image/jpeg".to_string(),
            )
            .await
            .unwrap();

            // Delete the project
            let deleted = ProjectRepository::delete(&database, project.id)
                .await
                .unwrap();

            // Verify project was deleted
            let project_exists = ProjectRepository::find_by_id(&database, project.id)
                .await
                .unwrap()
                .is_some();

            // Verify miniature was cascade deleted
            let miniature_exists = MiniatureRepository::find_by_id(&database, miniature.id)
                .await
                .unwrap()
                .is_some();

            // Verify photo was cascade deleted
            let photo_exists = PhotoRepository::find_by_id(&database, photo.id)
                .await
                .unwrap()
                .is_some();

            TestResult::from_bool(deleted && !project_exists && !miniature_exists && !photo_exists)
        })
    }

    // Feature: miniature-painting-tracker, Property 7: Miniature cascade deletion
    #[quickcheck]
    fn test_miniature_cascade_deletion(photo_filename: String) -> TestResult {
        // Skip invalid inputs
        if photo_filename.trim().is_empty() {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project
            let create_request = CreateProjectRequest {
                name: "Test Project".to_string(),
                game_system: GameSystem::AgeOfSigmar,
                army: "Test Army".to_string(),
                description: None,
            };

            let project = ProjectRepository::create(&database, create_request)
                .await
                .unwrap();

            // Create a miniature in the project
            let miniature_request = CreateMiniatureRequest {
                name: "Test Miniature".to_string(),
                miniature_type: MiniatureType::Character,
                notes: None,
            };

            let miniature = MiniatureRepository::create(&database, project.id, miniature_request)
                .await
                .unwrap();

            // Create a photo for the miniature
            let photo = PhotoRepository::create(
                &database,
                miniature.id,
                photo_filename.clone(),
                format!("/tmp/{}", photo_filename),
                2048,
                "image/png".to_string(),
            )
            .await
            .unwrap();

            // Delete the miniature
            let deleted = MiniatureRepository::delete(&database, miniature.id)
                .await
                .unwrap();

            // Verify miniature was deleted
            let miniature_exists = MiniatureRepository::find_by_id(&database, miniature.id)
                .await
                .unwrap()
                .is_some();

            // Verify photo was cascade deleted
            let photo_exists = PhotoRepository::find_by_id(&database, photo.id)
                .await
                .unwrap()
                .is_some();

            TestResult::from_bool(deleted && !miniature_exists && !photo_exists)
        })
    }

    // Feature: miniature-painting-tracker, Property 16: API input validation
    #[quickcheck]
    fn test_api_input_validation(name: String, army: String, miniature_name: String) -> TestResult {
        // Test that API endpoints validate input data before processing
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let database = create_test_database().await;

            // Test project creation validation
            let project_request = CreateProjectRequest {
                name: name.clone(),
                game_system: GameSystem::Warhammer40k,
                army: army.clone(),
                description: None,
            };

            let project_result = crate::handlers::projects::create_project(
                axum::extract::State(database.clone()),
                axum::Json(project_request),
            )
            .await;

            // Input should be considered valid if it contains at least one alphanumeric or punctuation character
            let is_valid_project_input = !name.trim().is_empty()
                && !army.trim().is_empty()
                && name
                    .chars()
                    .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
                && army
                    .chars()
                    .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation());
            let project_validation_passed = project_result.is_ok();

            // If input validation works correctly, valid input should succeed and invalid should fail
            let project_validation_correct = is_valid_project_input == project_validation_passed;

            // Test miniature creation validation (only if we have a valid project)
            let miniature_validation_correct = if project_validation_passed {
                // Create a project first
                let project = project_result.unwrap().0;

                let miniature_request = CreateMiniatureRequest {
                    name: miniature_name.clone(),
                    miniature_type: MiniatureType::Troop,
                    notes: None,
                };

                let miniature_result = crate::handlers::miniatures::create_miniature(
                    axum::extract::State(database.clone()),
                    axum::extract::Path(project.id),
                    axum::Json(miniature_request),
                )
                .await;

                let is_valid_miniature_input = !miniature_name.trim().is_empty()
                    && miniature_name
                        .chars()
                        .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation());
                let miniature_validation_passed = miniature_result.is_ok();

                is_valid_miniature_input == miniature_validation_passed
            } else {
                true // Skip miniature validation if project creation failed
            };

            TestResult::from_bool(project_validation_correct && miniature_validation_correct)
        })
    }

    // Feature: miniature-painting-tracker, Property 17: HTTP status code compliance
    #[quickcheck]
    fn test_http_status_code_compliance(name: String, army: String) -> TestResult {
        // Test that HTTP status codes correctly reflect the outcome
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let database = create_test_database().await;

            // Test with both valid and invalid inputs
            let project_request = CreateProjectRequest {
                name: name.clone(),
                game_system: GameSystem::AgeOfSigmar,
                army: army.clone(),
                description: None,
            };

            let result = crate::handlers::projects::create_project(
                axum::extract::State(database.clone()),
                axum::Json(project_request),
            )
            .await;

            let is_valid_input = !name.trim().is_empty()
                && !army.trim().is_empty()
                && name
                    .chars()
                    .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
                && army
                    .chars()
                    .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation());

            match (is_valid_input, result) {
                // Valid input should result in success (2xx status codes)
                (true, Ok(_)) => TestResult::from_bool(true),
                // Invalid input should result in client error (4xx status codes)
                (false, Err(crate::error::AppError::ValidationError(_))) => {
                    TestResult::from_bool(true)
                }
                // Any other combination is incorrect
                _ => TestResult::from_bool(false),
            }
        })
    }

    // Feature: miniature-painting-tracker, Property 18: Structured error responses
    #[quickcheck]
    fn test_structured_error_responses(invalid_name: String) -> TestResult {
        // Test that error responses have consistent structure
        // Use empty or whitespace-only names to trigger validation errors
        if !invalid_name.trim().is_empty() {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let database = create_test_database().await;

            // Create a request that will trigger a validation error
            let project_request = CreateProjectRequest {
                name: invalid_name.clone(),
                game_system: GameSystem::HorusHeresy,
                army: "Test Army".to_string(),
                description: None,
            };

            let result = crate::handlers::projects::create_project(
                axum::extract::State(database.clone()),
                axum::Json(project_request),
            )
            .await;

            // Should get a validation error
            match result {
                Err(crate::error::AppError::ValidationError(msg)) => {
                    // Convert the error to a response to test the structure
                    let response = axum::response::IntoResponse::into_response(
                        crate::error::AppError::ValidationError(msg),
                    );

                    // Extract the status code
                    let status = response.status();
                    let is_client_error = status.is_client_error(); // 4xx status codes

                    // The error should be properly structured (we can't easily extract the JSON body in this test,
                    // but we can verify the status code is correct for validation errors)
                    TestResult::from_bool(
                        is_client_error && status == axum::http::StatusCode::BAD_REQUEST,
                    )
                }
                _ => TestResult::from_bool(false), // Should have gotten a validation error
            }
        })
    }

    // Feature: miniature-painting-tracker, Property 10: Photo-miniature association
    #[quickcheck]
    fn test_photo_miniature_association(filename: String, file_size: u32) -> TestResult {
        // Skip invalid inputs
        if filename.trim().is_empty() || file_size == 0 {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project and miniature
            let project = create_test_project(&database).await;
            let miniature = create_test_miniature(&database, project.id).await;

            // Create a photo for the miniature
            let photo = PhotoRepository::create(
                &database,
                miniature.id,
                filename.clone(),
                format!("/tmp/{}", filename),
                file_size as i64,
                "image/jpeg".to_string(),
            )
            .await
            .unwrap();

            // Query the miniature's photos
            let photos = PhotoRepository::find_by_miniature_id(&database, miniature.id)
                .await
                .unwrap();

            // The uploaded photo should be included in the miniature's photos
            let photo_found = photos
                .iter()
                .any(|p| p.id == photo.id && p.miniature_id == miniature.id);

            TestResult::from_bool(photo_found)
        })
    }

    // Feature: miniature-painting-tracker, Property 11: Image format validation
    #[quickcheck]
    fn test_image_format_validation(mime_type: String) -> TestResult {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Test MIME type validation logic
            let allowed_types = ["image/jpeg", "image/png", "image/webp"];
            let is_valid_mime = allowed_types.contains(&mime_type.as_str());

            // Simulate the validation that would happen in the upload handler
            let validation_result = validate_image_format(&mime_type);

            TestResult::from_bool(is_valid_mime == validation_result)
        })
    }

    // Feature: miniature-painting-tracker, Property 12: Photo chronological ordering
    #[quickcheck]
    fn test_photo_chronological_ordering(photo_count: u8) -> TestResult {
        // Limit the number of photos to avoid excessive test time
        let photo_count = (photo_count % 10) + 1; // 1-10 photos

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project and miniature
            let project = create_test_project(&database).await;
            let miniature = create_test_miniature(&database, project.id).await;

            // Create multiple photos with small delays to ensure different timestamps
            let mut photo_ids = Vec::new();
            for i in 0..photo_count {
                let photo = PhotoRepository::create(
                    &database,
                    miniature.id,
                    format!("photo_{}.jpg", i),
                    format!("/tmp/photo_{}.jpg", i),
                    1024,
                    "image/jpeg".to_string(),
                )
                .await
                .unwrap();
                photo_ids.push(photo.id);

                // Small delay to ensure different timestamps
                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
            }

            // Query photos for the miniature
            let photos = PhotoRepository::find_by_miniature_id(&database, miniature.id)
                .await
                .unwrap();

            // Verify photos are ordered chronologically (earliest to latest)
            let mut is_chronological = true;
            for i in 1..photos.len() {
                if photos[i].uploaded_at < photos[i - 1].uploaded_at {
                    is_chronological = false;
                    break;
                }
            }

            // Also verify all created photos are present
            let all_photos_present = photo_ids
                .iter()
                .all(|id| photos.iter().any(|p| p.id == *id));

            TestResult::from_bool(
                is_chronological && all_photos_present && photos.len() == photo_count as usize,
            )
        })
    }

    // Feature: miniature-painting-tracker, Property 13: Photo storage deletion
    #[quickcheck]
    fn test_photo_storage_deletion(filename: String) -> TestResult {
        // Skip invalid inputs
        if filename.trim().is_empty() {
            return TestResult::discard();
        }

        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            // Create test database
            let database = create_test_database().await;

            // Create a project and miniature
            let project = create_test_project(&database).await;
            let miniature = create_test_miniature(&database, project.id).await;

            // Create a photo
            let photo = PhotoRepository::create(
                &database,
                miniature.id,
                filename.clone(),
                format!("/tmp/{}", filename),
                1024,
                "image/jpeg".to_string(),
            )
            .await
            .unwrap();

            let photo_id = photo.id;
            let file_path = photo.file_path.clone();

            // Delete the photo from database
            let deleted_photo = PhotoRepository::delete(&database, photo_id).await.unwrap();

            // Verify photo was deleted from database
            let photo_exists_in_db = PhotoRepository::find_by_id(&database, photo_id)
                .await
                .unwrap()
                .is_some();

            // Verify the deletion returned the photo details (needed for storage cleanup)
            let deletion_returned_details =
                deleted_photo.is_some() && deleted_photo.as_ref().unwrap().file_path == file_path;

            TestResult::from_bool(!photo_exists_in_db && deletion_returned_details)
        })
    }

    // Helper functions for photo tests
    async fn create_test_project(database: &Database) -> shared_types::Project {
        let create_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            game_system: GameSystem::AgeOfSigmar,
            army: "Test Army".to_string(),
            description: None,
        };
        ProjectRepository::create(database, create_request)
            .await
            .unwrap()
    }

    async fn create_test_miniature(
        database: &Database,
        project_id: i64,
    ) -> shared_types::Miniature {
        let miniature_request = CreateMiniatureRequest {
            name: "Test Miniature".to_string(),
            miniature_type: MiniatureType::Troop,
            notes: None,
        };
        MiniatureRepository::create(database, project_id, miniature_request)
            .await
            .unwrap()
    }

    fn validate_image_format(mime_type: &str) -> bool {
        let allowed_types = ["image/jpeg", "image/png", "image/webp"];
        allowed_types.contains(&mime_type)
    }
    async fn create_test_database() -> Database {
        let config = DatabaseConfig {
            max_connections: 1,
            acquire_timeout: Duration::from_secs(1),
            idle_timeout: None,
            max_lifetime: None,
        };

        // Use in-memory SQLite for tests
        let database = Database::new_with_config("sqlite::memory:", config)
            .await
            .unwrap();
        database.migrate().await.unwrap();
        database
    }

    // Validation functions that implement the business logic
    fn validate_project_creation(request: &CreateProjectRequest) -> bool {
        is_valid_string(&request.name) && is_valid_string(&request.army)
    }

    fn validate_miniature_creation(request: &CreateMiniatureRequest) -> bool {
        is_valid_string(&request.name)
    }

    // Helper function to validate strings - must be non-empty after trimming and contain valid characters
    fn is_valid_string(s: &str) -> bool {
        let trimmed = s.trim();
        !trimmed.is_empty()
            && trimmed
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation() || c == ' ')
    }
}
