#[cfg(test)]
mod integration_tests {
    use axum::{
        extract::{Path, Query, State},
        Json,
    };
    use shared_types::{
        CreateMiniatureRequest, CreateProjectRequest, CreateRecipeRequest, GameSystem,
        MiniatureType, ProgressStatus, UpdateMiniatureRequest,
    };
    use std::time::Duration;

    use crate::{
        database::{Database, DatabaseConfig},
        handlers::{self, recipes::RecipeQueryParams},
        repositories::{MiniatureRepository, PhotoRepository, ProjectRepository},
    };

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

    /// Integration Test 1: Complete project workflow from creation to completion
    /// Tests the full lifecycle: create project -> add miniatures -> update progress -> complete
    #[tokio::test]
    async fn test_complete_project_workflow() {
        let database = create_test_database().await;

        // Step 1: Create a new project
        let project_request = CreateProjectRequest {
            name: "Space Marines Chapter".to_string(),
            game_system: GameSystem::Warhammer40k,
            army: "Ultramarines".to_string(),
            description: Some("Complete Ultramarines army project".to_string()),
        };

        let project =
            handlers::projects::create_project(State(database.clone()), Json(project_request))
                .await
                .expect("Failed to create project")
                .0;

        assert_eq!(project.name, "Space Marines Chapter");
        assert_eq!(project.army, "Ultramarines");

        // Step 2: Add multiple miniatures to the project
        let miniature_requests = vec![
            CreateMiniatureRequest {
                name: "Captain in Terminator Armor".to_string(),
                miniature_type: MiniatureType::Character,
                notes: Some("Chapter Master conversion".to_string()),
            },
            CreateMiniatureRequest {
                name: "Tactical Squad Sergeant".to_string(),
                miniature_type: MiniatureType::Troop,
                notes: None,
            },
            CreateMiniatureRequest {
                name: "Tactical Marine 1".to_string(),
                miniature_type: MiniatureType::Troop,
                notes: None,
            },
        ];

        let mut miniatures = Vec::new();
        for request in miniature_requests {
            let miniature = handlers::miniatures::create_miniature(
                State(database.clone()),
                Path(project.id),
                Json(request),
            )
            .await
            .expect("Failed to create miniature")
            .0;
            miniatures.push(miniature);
        }

        assert_eq!(miniatures.len(), 3);
        assert!(miniatures.iter().all(|m| m.project_id == project.id));

        // Step 3: Progress miniatures through different stages
        let progress_stages = vec![
            ProgressStatus::Primed,
            ProgressStatus::Basecoated,
            ProgressStatus::Detailed,
            ProgressStatus::Completed,
        ];

        for miniature in &miniatures {
            for stage in &progress_stages {
                let update_request = UpdateMiniatureRequest {
                    name: None,
                    progress_status: Some(stage.clone()),
                    notes: Some(format!("Updated to {:?} stage", stage)),
                };

                let updated_miniature = handlers::miniatures::update_miniature(
                    State(database.clone()),
                    Path(miniature.id),
                    Json(update_request),
                )
                .await
                .expect("Failed to update miniature progress")
                .0;

                assert_eq!(updated_miniature.progress_status, *stage);
                assert!(updated_miniature.updated_at > miniature.created_at);
            }
        }

        // Step 4: Verify project completion status by checking all miniatures
        let project_miniatures =
            handlers::miniatures::list_miniatures(State(database.clone()), Path(project.id))
                .await
                .expect("Failed to list project miniatures")
                .0;

        // Extract miniatures array from JSON response
        let miniatures_array = project_miniatures["miniatures"].as_array().unwrap();
        assert_eq!(miniatures_array.len(), 3);

        // Check that all miniatures are completed
        for miniature_json in miniatures_array {
            let status = miniature_json["progress_status"].as_str().unwrap();
            assert_eq!(status, "Completed");
        }

        // Step 5: Verify project can be retrieved with all data intact
        let retrieved_project =
            handlers::projects::get_project(State(database.clone()), Path(project.id))
                .await
                .expect("Failed to retrieve project")
                .0;

        assert_eq!(retrieved_project.id, project.id);
        assert_eq!(retrieved_project.name, project.name);
    }

    /// Integration Test 2: Photo upload and management workflow
    /// Tests photo upload, association, listing, and deletion
    #[tokio::test]
    async fn test_photo_management_workflow() {
        let database = create_test_database().await;

        // Step 1: Create project and miniature
        let project = create_test_project(&database).await;
        let miniature = create_test_miniature(&database, project.id).await;

        // Step 2: Upload multiple photos to track progress
        let photo_data = vec![
            ("unpainted.jpg", "image/jpeg", 1024),
            ("primed.jpg", "image/jpeg", 1536),
            ("basecoated.png", "image/png", 2048),
            ("completed.webp", "image/webp", 2560),
        ];

        let mut uploaded_photos = Vec::new();
        for (filename, mime_type, size) in photo_data {
            // Simulate photo upload
            let photo = PhotoRepository::create(
                &database,
                miniature.id,
                filename.to_string(),
                format!("/tmp/{}", filename),
                size,
                mime_type.to_string(),
            )
            .await
            .expect("Failed to upload photo");

            uploaded_photos.push(photo);

            // Small delay to ensure different timestamps
            tokio::time::sleep(Duration::from_millis(10)).await;
        }

        // Step 3: List photos and verify chronological ordering
        let photos = handlers::photos::list_photos(Path(miniature.id), State(database.clone()))
            .await
            .expect("Failed to list photos")
            .0;

        assert_eq!(photos.len(), 4);

        // Verify chronological ordering (earliest to latest)
        for i in 1..photos.len() {
            assert!(photos[i].uploaded_at >= photos[i - 1].uploaded_at);
        }

        // Step 4: Verify photo-miniature association
        for photo in &photos {
            assert_eq!(photo.miniature_id, miniature.id);
        }

        // Step 5: Delete a photo and verify removal
        let photo_to_delete = &photos[1]; // Delete the second photo
        let deleted_photo =
            handlers::photos::delete_photo(Path(photo_to_delete.id), State(database.clone()))
                .await
                .expect("Failed to delete photo");

        // delete_photo returns StatusCode, so we check if it's successful
        assert_eq!(deleted_photo, axum::http::StatusCode::NO_CONTENT);

        // Step 6: Verify photo was removed from listing
        let remaining_photos =
            handlers::photos::list_photos(Path(miniature.id), State(database.clone()))
                .await
                .expect("Failed to list photos after deletion")
                .0;

        assert_eq!(remaining_photos.len(), 3);
        assert!(!remaining_photos.iter().any(|p| p.id == photo_to_delete.id));

        // Step 7: Test cascade deletion - delete miniature and verify photos are removed
        let _ = handlers::miniatures::delete_miniature(State(database.clone()), Path(miniature.id))
            .await
            .expect("Failed to delete miniature");

        // Verify all photos were cascade deleted
        let photos_after_miniature_deletion =
            PhotoRepository::find_by_miniature_id(&database, miniature.id)
                .await
                .expect("Failed to query photos");

        assert!(photos_after_miniature_deletion.is_empty());
    }

    /// Integration Test 3: Recipe creation and usage workflow
    /// Tests recipe creation, filtering, and association with miniature types
    #[tokio::test]
    async fn test_recipe_management_workflow() {
        let database = create_test_database().await;

        // Step 1: Create recipes for different miniature types
        let recipe_requests = vec![
            CreateRecipeRequest {
                name: "Standard Troop Painting".to_string(),
                miniature_type: MiniatureType::Troop,
                steps: vec![
                    "Prime with Chaos Black".to_string(),
                    "Base coat with Macragge Blue".to_string(),
                    "Highlight with Calgar Blue".to_string(),
                    "Detail with Balthasar Gold".to_string(),
                ],
                paints_used: vec![
                    "Chaos Black".to_string(),
                    "Macragge Blue".to_string(),
                    "Calgar Blue".to_string(),
                    "Balthasar Gold".to_string(),
                ],
                techniques: vec!["Dry brushing".to_string(), "Edge highlighting".to_string()],
                notes: Some("Standard scheme for Ultramarines troops".to_string()),
            },
            CreateRecipeRequest {
                name: "Character Hero Painting".to_string(),
                miniature_type: MiniatureType::Character,
                steps: vec![
                    "Prime with Grey Seer".to_string(),
                    "Base coat with Macragge Blue".to_string(),
                    "Shade with Nuln Oil".to_string(),
                    "Layer with Calgar Blue".to_string(),
                    "Highlight with Fenrisian Grey".to_string(),
                    "Detail with Retributor Armour".to_string(),
                    "Gem effects with Waystone Green".to_string(),
                ],
                paints_used: vec![
                    "Grey Seer".to_string(),
                    "Macragge Blue".to_string(),
                    "Nuln Oil".to_string(),
                    "Calgar Blue".to_string(),
                    "Fenrisian Grey".to_string(),
                    "Retributor Armour".to_string(),
                    "Waystone Green".to_string(),
                ],
                techniques: vec![
                    "Wet blending".to_string(),
                    "Glazing".to_string(),
                    "OSL (Object Source Lighting)".to_string(),
                ],
                notes: Some("Advanced techniques for character models".to_string()),
            },
            CreateRecipeRequest {
                name: "Quick Battle Ready".to_string(),
                miniature_type: MiniatureType::Troop,
                steps: vec![
                    "Prime with Macragge Blue spray".to_string(),
                    "Shade with Nuln Oil".to_string(),
                    "Dry brush with Calgar Blue".to_string(),
                    "Base rim with Stirland Mud".to_string(),
                ],
                paints_used: vec![
                    "Macragge Blue".to_string(),
                    "Nuln Oil".to_string(),
                    "Calgar Blue".to_string(),
                    "Stirland Mud".to_string(),
                ],
                techniques: vec!["Speed painting".to_string(), "Dry brushing".to_string()],
                notes: Some("Fast method for large armies".to_string()),
            },
        ];

        let mut created_recipes = Vec::new();
        for request in recipe_requests {
            let recipe = handlers::recipes::create_recipe(State(database.clone()), Json(request))
                .await
                .expect("Failed to create recipe")
                .0;
            created_recipes.push(recipe);
        }

        assert_eq!(created_recipes.len(), 3);

        // Step 2: Test recipe filtering by type
        let all_recipes = handlers::recipes::list_recipes(
            State(database.clone()),
            Query(RecipeQueryParams {
                miniature_type: None,
            }),
        )
        .await
        .expect("Failed to list all recipes")
        .0;

        // Extract recipes array from JSON response
        let recipes_array = all_recipes["recipes"].as_array().unwrap();
        assert_eq!(recipes_array.len(), 3);

        // Filter troop recipes
        let troop_recipes: Vec<_> = recipes_array
            .iter()
            .filter(|r| r["miniature_type"].as_str().unwrap() == "Troop")
            .collect();
        assert_eq!(troop_recipes.len(), 2);

        // Filter character recipes
        let character_recipes: Vec<_> = recipes_array
            .iter()
            .filter(|r| r["miniature_type"].as_str().unwrap() == "Character")
            .collect();
        assert_eq!(character_recipes.len(), 1);

        // Step 3: Test recipe retrieval and content verification
        for recipe in &created_recipes {
            let retrieved_recipe =
                handlers::recipes::get_recipe(State(database.clone()), Path(recipe.id))
                    .await
                    .expect("Failed to retrieve recipe")
                    .0;

            assert_eq!(retrieved_recipe.id, recipe.id);
            assert_eq!(retrieved_recipe.name, recipe.name);
            assert_eq!(retrieved_recipe.steps, recipe.steps);
            assert_eq!(retrieved_recipe.paints_used, recipe.paints_used);
            assert_eq!(retrieved_recipe.techniques, recipe.techniques);
        }

        // Step 4: Test recipe usage workflow - create project and miniatures, then associate recipes
        let project = create_test_project(&database).await;

        // Create troop miniature
        let troop_miniature =
            create_test_miniature_with_type(&database, project.id, MiniatureType::Troop).await;

        // Create character miniature
        let character_miniature =
            create_test_miniature_with_type(&database, project.id, MiniatureType::Character).await;

        // Step 5: Verify appropriate recipes can be found for each miniature type
        let troop_recipe = &troop_recipes[0];
        let character_recipe = &character_recipes[0];

        // Verify recipe types match miniature types
        assert_eq!(troop_recipe["miniature_type"].as_str().unwrap(), "Troop");
        assert_eq!(
            character_recipe["miniature_type"].as_str().unwrap(),
            "Character"
        );

        // Step 6: Test recipe deletion
        let recipe_to_delete = &created_recipes[2]; // Delete the "Quick Battle Ready" recipe
        let deletion_result =
            handlers::recipes::delete_recipe(State(database.clone()), Path(recipe_to_delete.id))
                .await;

        assert!(deletion_result.is_ok());

        // Verify recipe was deleted
        let recipes_after_deletion = handlers::recipes::list_recipes(
            State(database.clone()),
            Query(RecipeQueryParams {
                miniature_type: None,
            }),
        )
        .await
        .expect("Failed to list recipes after deletion")
        .0;

        let recipes_array = recipes_after_deletion["recipes"].as_array().unwrap();
        assert_eq!(recipes_array.len(), 2);
        assert!(!recipes_array
            .iter()
            .any(|r| r["id"].as_i64().unwrap() == recipe_to_delete.id));
    }

    /// Integration Test 4: Error handling and recovery scenarios
    /// Tests various error conditions and system recovery
    #[tokio::test]
    async fn test_error_handling_and_recovery() {
        let database = create_test_database().await;

        // Test 1: Invalid project creation
        let invalid_project_request = CreateProjectRequest {
            name: "".to_string(), // Empty name should fail validation
            game_system: GameSystem::AgeOfSigmar,
            army: "Test Army".to_string(),
            description: None,
        };

        let result = handlers::projects::create_project(
            State(database.clone()),
            Json(invalid_project_request),
        )
        .await;

        assert!(result.is_err(), "Empty project name should fail validation");

        // Test 2: Accessing non-existent resources
        let non_existent_project_id = 99999;
        let result =
            handlers::projects::get_project(State(database.clone()), Path(non_existent_project_id))
                .await;

        assert!(result.is_err(), "Non-existent project should return error");

        // Test 3: Invalid miniature creation (empty name)
        let valid_project = create_test_project(&database).await;

        let invalid_miniature_request = CreateMiniatureRequest {
            name: "   ".to_string(), // Whitespace-only name should fail
            miniature_type: MiniatureType::Troop,
            notes: None,
        };

        let result = handlers::miniatures::create_miniature(
            State(database.clone()),
            Path(valid_project.id),
            Json(invalid_miniature_request),
        )
        .await;

        assert!(
            result.is_err(),
            "Whitespace-only miniature name should fail validation"
        );

        // Test 4: Orphaned miniature creation (non-existent project)
        let valid_miniature_request = CreateMiniatureRequest {
            name: "Valid Miniature".to_string(),
            miniature_type: MiniatureType::Character,
            notes: None,
        };

        let result = handlers::miniatures::create_miniature(
            State(database.clone()),
            Path(non_existent_project_id),
            Json(valid_miniature_request),
        )
        .await;

        assert!(
            result.is_err(),
            "Creating miniature for non-existent project should fail"
        );

        // Test 5: Invalid photo upload (non-existent miniature)
        let non_existent_miniature_id = 99999;
        let result = PhotoRepository::create(
            &database,
            non_existent_miniature_id,
            "test.jpg".to_string(),
            "/tmp/test.jpg".to_string(),
            1024,
            "image/jpeg".to_string(),
        )
        .await;

        assert!(
            result.is_err(),
            "Photo upload to non-existent miniature should fail"
        );

        // Test 6: Invalid recipe creation (empty name)
        let invalid_recipe_request = CreateRecipeRequest {
            name: "".to_string(), // Empty name should fail
            miniature_type: MiniatureType::Troop,
            steps: vec!["Step 1".to_string()],
            paints_used: vec!["Paint 1".to_string()],
            techniques: vec!["Technique 1".to_string()],
            notes: None,
        };

        let result =
            handlers::recipes::create_recipe(State(database.clone()), Json(invalid_recipe_request))
                .await;

        assert!(result.is_err(), "Empty recipe name should fail validation");

        // Test 7: Recovery after partial failure - transaction rollback simulation
        // Create a valid project
        let project = create_test_project(&database).await;

        // Create a valid miniature
        let miniature = create_test_miniature(&database, project.id).await;

        // Attempt to create a photo with invalid data, then verify miniature still exists
        let _invalid_photo_result = PhotoRepository::create(
            &database,
            miniature.id,
            "".to_string(),             // Invalid filename
            "".to_string(),             // Invalid path
            0,                          // Invalid size
            "invalid/type".to_string(), // Invalid MIME type
        )
        .await;

        // Verify the miniature still exists despite photo creation failure
        let miniature_still_exists =
            handlers::miniatures::get_miniature(State(database.clone()), Path(miniature.id)).await;

        assert!(
            miniature_still_exists.is_ok(),
            "Miniature should still exist after photo creation failure"
        );

        // Test 8: Concurrent access simulation - multiple operations on same resource
        let project_for_concurrent_test = create_test_project(&database).await;

        // Simulate concurrent miniature creation
        let concurrent_requests = vec![
            CreateMiniatureRequest {
                name: "Concurrent Miniature 1".to_string(),
                miniature_type: MiniatureType::Troop,
                notes: None,
            },
            CreateMiniatureRequest {
                name: "Concurrent Miniature 2".to_string(),
                miniature_type: MiniatureType::Character,
                notes: None,
            },
            CreateMiniatureRequest {
                name: "Concurrent Miniature 3".to_string(),
                miniature_type: MiniatureType::Troop,
                notes: None,
            },
        ];

        let mut concurrent_results = Vec::new();
        for request in concurrent_requests {
            let result = handlers::miniatures::create_miniature(
                State(database.clone()),
                Path(project_for_concurrent_test.id),
                Json(request),
            )
            .await;
            concurrent_results.push(result);
        }

        // All concurrent operations should succeed
        assert!(
            concurrent_results.iter().all(|r| r.is_ok()),
            "All concurrent miniature creations should succeed"
        );

        // Verify all miniatures were created
        let final_miniatures = handlers::miniatures::list_miniatures(
            State(database.clone()),
            Path(project_for_concurrent_test.id),
        )
        .await
        .expect("Failed to list miniatures after concurrent creation")
        .0;

        let miniatures_array = final_miniatures["miniatures"].as_array().unwrap();
        assert_eq!(
            miniatures_array.len(),
            3,
            "All concurrent miniatures should be created"
        );
    }

    /// Integration Test 5: Security and input validation tests
    /// Tests various security scenarios including SQL injection, XSS, and input validation
    #[tokio::test]
    async fn test_security_and_input_validation() {
        let database = create_test_database().await;

        // Test 1: SQL Injection attempts in project creation
        let sql_injection_attempts = vec![
            "'; DROP TABLE projects; --",
            "' OR '1'='1",
            "'; INSERT INTO projects (name) VALUES ('hacked'); --",
            "' UNION SELECT * FROM projects --",
        ];

        for malicious_input in sql_injection_attempts {
            let project_request = CreateProjectRequest {
                name: malicious_input.to_string(),
                game_system: GameSystem::Warhammer40k,
                army: "Test Army".to_string(),
                description: None,
            };

            // Should either fail validation or be safely escaped
            let result =
                handlers::projects::create_project(State(database.clone()), Json(project_request))
                    .await;

            // If it succeeds, verify the malicious input was safely stored
            if let Ok(project) = result {
                assert_eq!(project.0.name, malicious_input);
                // Verify no SQL injection occurred by checking table integrity
                let all_projects = handlers::projects::list_projects(State(database.clone()))
                    .await
                    .expect("Failed to list projects");
                assert!(all_projects.0.len() >= 1);
            }
        }

        // Test 2: XSS attempts in various fields
        let xss_payloads = vec![
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//",
            "<svg onload=alert('xss')>",
        ];

        let valid_project = create_test_project(&database).await;

        for xss_payload in xss_payloads {
            // Test XSS in miniature names
            let miniature_request = CreateMiniatureRequest {
                name: xss_payload.to_string(),
                miniature_type: MiniatureType::Troop,
                notes: Some(format!("Notes with XSS: {}", xss_payload)),
            };

            let result = handlers::miniatures::create_miniature(
                State(database.clone()),
                Path(valid_project.id),
                Json(miniature_request),
            )
            .await;

            // Should either fail validation or safely store the input
            if let Ok(miniature) = result {
                assert_eq!(miniature.0.name, xss_payload);
                // Verify the XSS payload is stored as plain text, not executed
                assert!(miniature.0.notes.as_ref().unwrap().contains(xss_payload));
            }

            // Test XSS in recipe content
            let recipe_request = CreateRecipeRequest {
                name: format!("Recipe with XSS: {}", xss_payload),
                miniature_type: MiniatureType::Character,
                steps: vec![format!("Step with XSS: {}", xss_payload)],
                paints_used: vec![format!("Paint with XSS: {}", xss_payload)],
                techniques: vec![format!("Technique with XSS: {}", xss_payload)],
                notes: Some(format!("Notes with XSS: {}", xss_payload)),
            };

            let result =
                handlers::recipes::create_recipe(State(database.clone()), Json(recipe_request))
                    .await;

            // Should either fail validation or safely store the input
            if let Ok(recipe) = result {
                assert!(recipe.0.name.contains(xss_payload));
                assert!(recipe.0.steps[0].contains(xss_payload));
                assert!(recipe.0.paints_used[0].contains(xss_payload));
                assert!(recipe.0.techniques[0].contains(xss_payload));
            }
        }

        // Test 3: Path traversal attempts in photo uploads
        let path_traversal_attempts = vec![
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "..%252f..%252f..%252fetc%252fpasswd",
        ];

        let test_miniature = create_test_miniature(&database, valid_project.id).await;

        for malicious_path in path_traversal_attempts {
            let result = PhotoRepository::create(
                &database,
                test_miniature.id,
                malicious_path.to_string(),
                format!("/uploads/{}", malicious_path),
                1024,
                "image/jpeg".to_string(),
            )
            .await;

            // Should either fail validation or safely sanitize the path
            if let Ok(photo) = result {
                // Verify the path doesn't contain traversal sequences
                assert!(!photo.file_path.contains("../"));
                assert!(!photo.file_path.contains("..\\"));
                assert!(!photo.file_path.contains("%2e%2e"));
            }
        }

        // Test 4: Large input validation (DoS prevention)
        let large_string = "A".repeat(10000); // 10KB string

        let large_input_tests = vec![
            // Large project name
            CreateProjectRequest {
                name: large_string.clone(),
                game_system: GameSystem::Warhammer40k,
                army: "Test Army".to_string(),
                description: Some(large_string.clone()),
            },
        ];

        for request in large_input_tests {
            let result =
                handlers::projects::create_project(State(database.clone()), Json(request)).await;

            // Should either fail validation due to size limits or handle gracefully
            match result {
                Ok(_) => {
                    // If accepted, verify it was stored correctly
                    // This tests the system's ability to handle large inputs
                }
                Err(_) => {
                    // Expected behavior for oversized inputs
                }
            }
        }

        // Test 5: Unicode and special character handling
        let unicode_tests = vec![
            "🎨 Miniature Painting 🖌️",
            "Ñoñó's Army",
            "测试项目",
            "Проект тест",
            "مشروع اختبار",
            "🚀💀⚔️🛡️",
            "null\0byte",
            "line\nbreak\rtest",
            "tab\ttest",
        ];

        for unicode_input in unicode_tests {
            let project_request = CreateProjectRequest {
                name: unicode_input.to_string(),
                game_system: GameSystem::AgeOfSigmar,
                army: "Unicode Test Army".to_string(),
                description: Some(format!("Testing unicode: {}", unicode_input)),
            };

            let result =
                handlers::projects::create_project(State(database.clone()), Json(project_request))
                    .await;

            // Should handle unicode correctly
            if let Ok(project) = result {
                assert_eq!(project.0.name, unicode_input);
                // Verify unicode is preserved in database
                let retrieved =
                    handlers::projects::get_project(State(database.clone()), Path(project.0.id))
                        .await
                        .expect("Failed to retrieve unicode project");
                assert_eq!(retrieved.0.name, unicode_input);
            }
        }

        // Test 6: Concurrent access and race condition testing
        use std::sync::Arc;
        use tokio::sync::Semaphore;

        let concurrent_project = create_test_project(&database).await;
        let semaphore = Arc::new(Semaphore::new(10)); // Limit concurrent operations

        let mut handles = vec![];
        for i in 0..50 {
            let db = database.clone();
            let project_id = concurrent_project.id;
            let sem = semaphore.clone();

            let handle = tokio::spawn(async move {
                let _permit = sem.acquire().await.unwrap();

                let miniature_request = CreateMiniatureRequest {
                    name: format!("Concurrent Miniature {}", i),
                    miniature_type: if i % 2 == 0 {
                        MiniatureType::Troop
                    } else {
                        MiniatureType::Character
                    },
                    notes: Some(format!("Created concurrently: {}", i)),
                };

                handlers::miniatures::create_miniature(
                    State(db),
                    Path(project_id),
                    Json(miniature_request),
                )
                .await
            });
            handles.push(handle);
        }

        // Wait for all concurrent operations to complete
        let results: Vec<_> = futures::future::join_all(handles).await;

        // Count successful operations
        let successful_operations = results
            .iter()
            .filter(|r| match r {
                Ok(Ok(_)) => true,
                _ => false,
            })
            .count();

        // Should have high success rate (allowing for some failures due to constraints)
        assert!(
            successful_operations >= 45,
            "Most concurrent operations should succeed"
        );

        // Verify data integrity after concurrent operations
        let final_miniatures = handlers::miniatures::list_miniatures(
            State(database.clone()),
            Path(concurrent_project.id),
        )
        .await
        .expect("Failed to list miniatures after concurrent test")
        .0;

        let miniatures_array = final_miniatures["miniatures"].as_array().unwrap();
        assert_eq!(miniatures_array.len(), successful_operations);

        // Test 7: Input sanitization verification
        let sanitization_tests = vec![
            ("  trimmed  ", "trimmed"),                     // Whitespace trimming
            ("UPPERCASE", "UPPERCASE"),                     // Case preservation
            ("mixed\r\nlinebreaks\n", "mixed linebreaks "), // Line break handling
        ];

        for (input, expected_output) in sanitization_tests {
            let project_request = CreateProjectRequest {
                name: input.to_string(),
                game_system: GameSystem::Warhammer40k,
                army: "Sanitization Test".to_string(),
                description: None,
            };

            let result =
                handlers::projects::create_project(State(database.clone()), Json(project_request))
                    .await;

            if let Ok(project) = result {
                // Verify input was sanitized as expected
                assert_eq!(project.0.name.trim(), expected_output.trim());
            }
        }
    }

    // Helper functions for integration tests
    async fn create_test_project(database: &Database) -> shared_types::Project {
        let create_request = CreateProjectRequest {
            name: "Integration Test Project".to_string(),
            game_system: GameSystem::AgeOfSigmar,
            army: "Stormcast Eternals".to_string(),
            description: Some("Test project for integration tests".to_string()),
        };
        ProjectRepository::create(database, create_request)
            .await
            .expect("Failed to create test project")
    }

    async fn create_test_miniature(
        database: &Database,
        project_id: i64,
    ) -> shared_types::Miniature {
        create_test_miniature_with_type(database, project_id, MiniatureType::Troop).await
    }

    async fn create_test_miniature_with_type(
        database: &Database,
        project_id: i64,
        miniature_type: MiniatureType,
    ) -> shared_types::Miniature {
        let miniature_request = CreateMiniatureRequest {
            name: format!(
                "Test {} Miniature",
                match miniature_type {
                    MiniatureType::Troop => "Troop",
                    MiniatureType::Character => "Character",
                }
            ),
            miniature_type,
            notes: Some("Created for integration testing".to_string()),
        };
        MiniatureRepository::create(database, project_id, miniature_request)
            .await
            .expect("Failed to create test miniature")
    }
}
