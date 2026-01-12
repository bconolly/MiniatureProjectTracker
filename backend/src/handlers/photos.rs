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
