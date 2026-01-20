use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::{
        miniature_repository::MiniatureRepository, project_repository::ProjectRepository,
    },
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::Value;
use shared_types::{CreateMiniatureRequest, Miniature, UpdateMiniatureRequest};

pub async fn list_miniatures(
    State(database): State<Database>,
    Path(project_id): Path<i64>,
) -> Result<Json<Value>> {
    // Verify project exists
    ProjectRepository::find_by_id(&database, project_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Project with id {} not found", project_id)))?;

    let miniatures = MiniatureRepository::find_by_project_id(&database, project_id).await?;

    Ok(Json(serde_json::json!({
        "miniatures": miniatures
    })))
}

pub async fn create_miniature(
    State(database): State<Database>,
    Path(project_id): Path<i64>,
    Json(request): Json<CreateMiniatureRequest>,
) -> Result<Json<Miniature>> {
    // Verify project exists
    ProjectRepository::find_by_id(&database, project_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Project with id {} not found", project_id)))?;

    // Validate required fields
    if request.name.trim().is_empty()
        || !request
            .name
            .chars()
            .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
    {
        return Err(AppError::ValidationError(
            "Miniature name is required".to_string(),
        ));
    }

    let miniature = MiniatureRepository::create(&database, project_id, request).await?;
    Ok(Json(miniature))
}

pub async fn get_miniature(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<Json<Miniature>> {
    let miniature = MiniatureRepository::find_by_id(&database, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Miniature with id {} not found", id)))?;

    Ok(Json(miniature))
}

pub async fn update_miniature(
    State(database): State<Database>,
    Path(id): Path<i64>,
    Json(request): Json<UpdateMiniatureRequest>,
) -> Result<Json<Miniature>> {
    // Validate fields if provided
    if let Some(ref name) = request.name {
        if name.trim().is_empty()
            || !name
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError(
                "Miniature name cannot be empty".to_string(),
            ));
        }
    }

    let miniature = MiniatureRepository::update(&database, id, request)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Miniature with id {} not found", id)))?;

    Ok(Json(miniature))
}

pub async fn delete_miniature(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<StatusCode> {
    let deleted = MiniatureRepository::delete(&database, id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound(format!(
            "Miniature with id {} not found",
            id
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use shared_types::{MiniatureType, ProgressStatus};

    fn validate_miniature_name(name: &str) -> Result<()> {
        if name.trim().is_empty()
            || !name
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError(
                "Miniature name is required".to_string(),
            ));
        }
        Ok(())
    }

    #[test]
    fn test_validate_miniature_name_valid() {
        assert!(validate_miniature_name("Space Marine Captain").is_ok());
        assert!(validate_miniature_name("Ork Boy #1").is_ok());
        assert!(validate_miniature_name("Commander-123").is_ok());
        assert!(validate_miniature_name("M").is_ok());
    }

    #[test]
    fn test_validate_miniature_name_empty() {
        assert!(validate_miniature_name("").is_err());
        assert!(validate_miniature_name("   ").is_err());
        assert!(validate_miniature_name("\t\n").is_err());
    }

    #[test]
    fn test_validate_miniature_name_control_characters_only() {
        assert!(validate_miniature_name("\n\n\n").is_err());
        assert!(validate_miniature_name("   \t   ").is_err());
    }

    #[test]
    fn test_create_miniature_request_validation() {
        let valid_request = CreateMiniatureRequest {
            name: "Test Miniature".to_string(),
            miniature_type: MiniatureType::Troop,
            notes: Some("Test notes".to_string()),
        };

        assert!(validate_miniature_name(&valid_request.name).is_ok());
    }

    #[test]
    fn test_update_miniature_request_validation_with_empty_name() {
        let empty_name = "".to_string();
        let whitespace_name = "   ".to_string();

        assert!(validate_miniature_name(&empty_name).is_err());
        assert!(validate_miniature_name(&whitespace_name).is_err());
    }

    #[test]
    fn test_validation_accepts_special_characters() {
        assert!(validate_miniature_name("Miniature-123!").is_ok());
        assert!(validate_miniature_name("Unit #5").is_ok());
        assert!(validate_miniature_name("Captain's Guard").is_ok());
    }

    #[test]
    fn test_progress_status_values() {
        // Test that all progress status values are valid enum variants
        let statuses = vec![
            ProgressStatus::Unpainted,
            ProgressStatus::Primed,
            ProgressStatus::Basecoated,
            ProgressStatus::Detailed,
            ProgressStatus::Completed,
        ];

        // Just ensure they can be created - validates enum definitions
        assert_eq!(statuses.len(), 5);
        assert_eq!(statuses[0], ProgressStatus::Unpainted);
        assert_eq!(statuses[4], ProgressStatus::Completed);
    }

    #[test]
    fn test_miniature_type_values() {
        // Test that miniature types are valid
        let types = vec![MiniatureType::Troop, MiniatureType::Character];

        assert_eq!(types.len(), 2);
    }

    #[test]
    fn test_create_request_with_optional_fields() {
        let request_with_notes = CreateMiniatureRequest {
            name: "Test".to_string(),
            miniature_type: MiniatureType::Character,
            notes: Some("Has notes".to_string()),
        };

        let request_without_notes = CreateMiniatureRequest {
            name: "Test".to_string(),
            miniature_type: MiniatureType::Troop,
            notes: None,
        };

        assert!(validate_miniature_name(&request_with_notes.name).is_ok());
        assert!(validate_miniature_name(&request_without_notes.name).is_ok());
    }
}
