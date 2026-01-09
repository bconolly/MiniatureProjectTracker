use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use shared_types::{ErrorResponse, ErrorDetails};
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    DatabaseError(sqlx::Error),
    ValidationError(String),
    NotFound(String),
    Conflict(String),
    InternalServerError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::DatabaseError(err) => write!(f, "Database error: {}", err),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::Conflict(msg) => write!(f, "Conflict: {}", msg),
            AppError::InternalServerError(msg) => write!(f, "Internal server error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound("Resource not found".to_string()),
            _ => AppError::DatabaseError(err),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message, details) = match self {
            AppError::ValidationError(msg) => (
                StatusCode::BAD_REQUEST,
                "validation_error".to_string(),
                msg,
                None,
            ),
            AppError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                "not_found".to_string(),
                msg,
                None,
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                "conflict".to_string(),
                msg,
                None,
            ),
            AppError::DatabaseError(err) => {
                tracing::error!("Database error: {}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database_error".to_string(),
                    "An internal database error occurred".to_string(),
                    None,
                )
            }
            AppError::InternalServerError(msg) => {
                tracing::error!("Internal server error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_server_error".to_string(),
                    "An internal server error occurred".to_string(),
                    None,
                )
            }
        };

        let error_response = ErrorResponse {
            error: ErrorDetails {
                error_type,
                message,
                details,
                timestamp: Utc::now(),
            },
        };

        (status, Json(error_response)).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;