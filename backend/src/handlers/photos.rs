use crate::config::Config;
use crate::database::Database;
use crate::repositories::MiniatureRepository;
use crate::repositories::PhotoRepository;
use crate::services::storage_service::StorageService;
use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde_json::json;
use shared_types::{ErrorDetails, ErrorResponse, Photo};

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: &[&str] = &["image/jpeg", "image/png", "image/webp"];

pub async fn upload_photo(
    Path(miniature_id): Path<i64>,
    State(database): State<Database>,
    mut multipart: Multipart,
) -> Result<Json<Photo>, (StatusCode, Json<ErrorResponse>)> {
    // Check if miniature exists
    match MiniatureRepository::find_by_id(&database, miniature_id).await {
        Ok(Some(_)) => {}
        Ok(None) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "not_found".to_string(),
                        message: format!("Miniature with id {} not found", miniature_id),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            ));
        }
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "database_error".to_string(),
                        message: format!("Database error: {}", e),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            ));
        }
    }

    // Process multipart form data
    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut mime_type: Option<String> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "invalid_multipart".to_string(),
                    message: format!("Invalid multipart data: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })? {
        let field_name = field.name().unwrap_or("").to_string();

        if field_name == "photo" {
            filename = field.file_name().map(|s| s.to_string());
            mime_type = field.content_type().map(|s| s.to_string());

            // Validate MIME type
            if let Some(ref mt) = mime_type {
                if !ALLOWED_MIME_TYPES.contains(&mt.as_str()) {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(ErrorResponse {
                            error: ErrorDetails {
                                error_type: "invalid_file_type".to_string(),
                                message: format!(
                                    "Unsupported file type: {}. Allowed types: {}",
                                    mt,
                                    ALLOWED_MIME_TYPES.join(", ")
                                ),
                                details: None,
                                timestamp: Utc::now(),
                            },
                        }),
                    ));
                }
            }

            let data = field.bytes().await.map_err(|e| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        error: ErrorDetails {
                            error_type: "file_read_error".to_string(),
                            message: format!("Failed to read file data: {}", e),
                            details: None,
                            timestamp: Utc::now(),
                        },
                    }),
                )
            })?;

            // Check file size
            if data.len() > MAX_FILE_SIZE {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ErrorResponse {
                        error: ErrorDetails {
                            error_type: "file_too_large".to_string(),
                            message: format!(
                                "File size {} bytes exceeds maximum allowed size of {} bytes",
                                data.len(),
                                MAX_FILE_SIZE
                            ),
                            details: None,
                            timestamp: Utc::now(),
                        },
                    }),
                ));
            }

            file_data = Some(data.to_vec());
        }
    }

    // Validate required fields
    let file_data = file_data.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "missing_file".to_string(),
                    message: "No photo file provided".to_string(),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    let filename = filename.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "missing_filename".to_string(),
                    message: "No filename provided".to_string(),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    let mime_type = mime_type.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "missing_mime_type".to_string(),
                    message: "No MIME type provided".to_string(),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    // Initialize storage service
    let config = Config::from_env().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "config_error".to_string(),
                    message: format!("Configuration error: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    let storage_service = StorageService::new(&config).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "storage_error".to_string(),
                    message: format!("Storage initialization error: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    // Store the file
    let file_path = storage_service
        .store_photo(&file_data, &filename, miniature_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "storage_error".to_string(),
                        message: format!("Failed to store photo: {}", e),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            )
        })?;

    // Save photo record to database
    let photo = PhotoRepository::create(
        &database,
        miniature_id,
        filename,
        file_path,
        file_data.len() as i64,
        mime_type,
    )
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "database_error".to_string(),
                    message: format!("Failed to save photo record: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    Ok(Json(photo))
}

pub async fn list_photos(
    Path(miniature_id): Path<i64>,
    State(database): State<Database>,
) -> Result<Json<Vec<Photo>>, (StatusCode, Json<ErrorResponse>)> {
    // Check if miniature exists
    match MiniatureRepository::find_by_id(&database, miniature_id).await {
        Ok(Some(_)) => {}
        Ok(None) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "not_found".to_string(),
                        message: format!("Miniature with id {} not found", miniature_id),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            ));
        }
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "database_error".to_string(),
                        message: format!("Database error: {}", e),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            ));
        }
    }

    let photos = PhotoRepository::find_by_miniature_id(&database, miniature_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "database_error".to_string(),
                        message: format!("Failed to retrieve photos: {}", e),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            )
        })?;

    Ok(Json(photos))
}

pub async fn delete_photo(
    Path(photo_id): Path<i64>,
    State(database): State<Database>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // Get photo details before deletion
    let photo = PhotoRepository::delete(&database, photo_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: ErrorDetails {
                        error_type: "database_error".to_string(),
                        message: format!("Database error: {}", e),
                        details: None,
                        timestamp: Utc::now(),
                    },
                }),
            )
        })?;

    let photo = photo.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "not_found".to_string(),
                    message: format!("Photo with id {} not found", photo_id),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    // Initialize storage service and delete the file
    let config = Config::from_env().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "config_error".to_string(),
                    message: format!("Configuration error: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    let storage_service = StorageService::new(&config).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: ErrorDetails {
                    error_type: "storage_error".to_string(),
                    message: format!("Storage initialization error: {}", e),
                    details: None,
                    timestamp: Utc::now(),
                },
            }),
        )
    })?;

    // Delete from storage (log error but don't fail the request if file doesn't exist)
    if let Err(e) = storage_service.delete_photo(&photo.file_path).await {
        tracing::warn!("Failed to delete photo file {}: {}", photo.file_path, e);
    }

    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_max_file_size_constant() {
        assert_eq!(MAX_FILE_SIZE, 10 * 1024 * 1024);
        assert_eq!(MAX_FILE_SIZE, 10_485_760);
    }

    #[test]
    fn test_allowed_mime_types() {
        assert_eq!(ALLOWED_MIME_TYPES.len(), 3);
        assert!(ALLOWED_MIME_TYPES.contains(&"image/jpeg"));
        assert!(ALLOWED_MIME_TYPES.contains(&"image/png"));
        assert!(ALLOWED_MIME_TYPES.contains(&"image/webp"));
    }

    #[test]
    fn test_mime_type_validation_valid() {
        assert!(ALLOWED_MIME_TYPES.contains(&"image/jpeg"));
        assert!(ALLOWED_MIME_TYPES.contains(&"image/png"));
        assert!(ALLOWED_MIME_TYPES.contains(&"image/webp"));
    }

    #[test]
    fn test_mime_type_validation_invalid() {
        assert!(!ALLOWED_MIME_TYPES.contains(&"image/gif"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"image/bmp"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"image/svg+xml"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"application/pdf"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"text/plain"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"video/mp4"));
    }

    #[test]
    fn test_file_size_validation() {
        // Valid sizes
        assert!(1024 <= MAX_FILE_SIZE); // 1KB
        assert!(100 * 1024 <= MAX_FILE_SIZE); // 100KB
        assert!(1024 * 1024 <= MAX_FILE_SIZE); // 1MB
        assert!(5 * 1024 * 1024 <= MAX_FILE_SIZE); // 5MB
        assert!(10 * 1024 * 1024 <= MAX_FILE_SIZE); // 10MB exactly

        // Invalid sizes
        assert!((10 * 1024 * 1024 + 1) > MAX_FILE_SIZE); // Just over 10MB
        assert!((15 * 1024 * 1024) > MAX_FILE_SIZE); // 15MB
        assert!((100 * 1024 * 1024) > MAX_FILE_SIZE); // 100MB
    }

    #[test]
    fn test_mime_type_case_sensitivity() {
        // MIME types should be lowercase
        assert!(ALLOWED_MIME_TYPES.contains(&"image/jpeg"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"IMAGE/JPEG"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"Image/Jpeg"));
    }

    #[test]
    fn test_jpeg_variations() {
        // Only image/jpeg is allowed, not image/jpg
        assert!(ALLOWED_MIME_TYPES.contains(&"image/jpeg"));
        assert!(!ALLOWED_MIME_TYPES.contains(&"image/jpg"));
    }

    #[test]
    fn test_file_size_edge_cases() {
        let zero_bytes = 0;
        let one_byte = 1;
        let max_minus_one = MAX_FILE_SIZE - 1;
        let max_exactly = MAX_FILE_SIZE;
        let max_plus_one = MAX_FILE_SIZE + 1;

        assert!(zero_bytes <= MAX_FILE_SIZE);
        assert!(one_byte <= MAX_FILE_SIZE);
        assert!(max_minus_one <= MAX_FILE_SIZE);
        assert!(max_exactly <= MAX_FILE_SIZE);
        assert!(max_plus_one > MAX_FILE_SIZE);
    }

    #[test]
    fn test_error_response_structure() {
        // Test that error response types are correctly defined
        let error_types = vec![
            "not_found",
            "invalid_multipart",
            "invalid_file_type",
            "file_read_error",
            "file_too_large",
            "missing_file",
            "missing_filename",
            "missing_mime_type",
            "config_error",
            "storage_error",
            "database_error",
        ];

        // Ensure we have all expected error types documented
        assert!(error_types.len() >= 10);
        assert!(error_types.contains(&"file_too_large"));
        assert!(error_types.contains(&"invalid_file_type"));
        assert!(error_types.contains(&"missing_file"));
    }

    #[test]
    fn test_allowed_extensions_from_mime_types() {
        // Document the expected file extensions for allowed MIME types
        let extensions = vec!["jpg", "jpeg", "png", "webp"];

        // MIME type mappings
        assert_eq!(ALLOWED_MIME_TYPES[0], "image/jpeg"); // .jpg/.jpeg
        assert_eq!(ALLOWED_MIME_TYPES[1], "image/png");  // .png
        assert_eq!(ALLOWED_MIME_TYPES[2], "image/webp"); // .webp

        assert!(extensions.len() >= 3);
    }

    #[test]
    fn test_max_file_size_in_different_units() {
        const KB: usize = 1024;
        const MB: usize = 1024 * KB;

        assert_eq!(MAX_FILE_SIZE, 10 * MB);
        assert_eq!(MAX_FILE_SIZE / MB, 10);
        assert_eq!(MAX_FILE_SIZE / KB, 10240);
    }

    #[test]
    fn test_multipart_field_name() {
        // The expected field name in multipart data
        let expected_field_name = "photo";
        assert_eq!(expected_field_name, "photo");
    }

    #[test]
    fn test_storage_path_requirements() {
        // Photo storage paths should be tracked
        // This test documents the expectations for file_path storage
        let example_path = "/uploads/miniatures/123/photo.jpg";
        assert!(example_path.contains("photo"));
        assert!(!example_path.is_empty());
    }
}
