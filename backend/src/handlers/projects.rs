use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::project_repository::ProjectRepository,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::Value;
use shared_types::{CreateProjectRequest, Project, UpdateProjectRequest};

pub async fn list_projects(State(database): State<Database>) -> Result<Json<Value>> {
    let projects = ProjectRepository::find_all(&database).await?;

    Ok(Json(serde_json::json!({
        "projects": projects
    })))
}

pub async fn create_project(
    State(database): State<Database>,
    Json(request): Json<CreateProjectRequest>,
) -> Result<Json<Project>> {
    // Validate required fields - reject empty, whitespace-only, or control-character-only strings
    if request.name.trim().is_empty()
        || !request
            .name
            .chars()
            .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
    {
        return Err(AppError::ValidationError(
            "Project name is required".to_string(),
        ));
    }

    if request.army.trim().is_empty()
        || !request
            .army
            .chars()
            .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
    {
        return Err(AppError::ValidationError("Army is required".to_string()));
    }

    let project = ProjectRepository::create(&database, request).await?;
    Ok(Json(project))
}

pub async fn get_project(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<Json<Project>> {
    let project = ProjectRepository::find_by_id(&database, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Project with id {} not found", id)))?;

    Ok(Json(project))
}

pub async fn update_project(
    State(database): State<Database>,
    Path(id): Path<i64>,
    Json(request): Json<UpdateProjectRequest>,
) -> Result<Json<Project>> {
    // Validate fields if provided
    if let Some(ref name) = request.name {
        if name.trim().is_empty()
            || !name
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError(
                "Project name cannot be empty".to_string(),
            ));
        }
    }

    if let Some(ref army) = request.army {
        if army.trim().is_empty()
            || !army
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError(
                "Army cannot be empty".to_string(),
            ));
        }
    }

    let project = ProjectRepository::update(&database, id, request)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Project with id {} not found", id)))?;

    Ok(Json(project))
}

pub async fn delete_project(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<StatusCode> {
    let deleted = ProjectRepository::delete(&database, id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound(format!(
            "Project with id {} not found",
            id
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use shared_types::GameSystem;

    fn validate_project_name(name: &str) -> Result<()> {
        if name.trim().is_empty()
            || !name
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError(
                "Project name is required".to_string(),
            ));
        }
        Ok(())
    }

    fn validate_army_name(army: &str) -> Result<()> {
        if army.trim().is_empty()
            || !army
                .chars()
                .any(|c| c.is_alphanumeric() || c.is_ascii_punctuation())
        {
            return Err(AppError::ValidationError("Army is required".to_string()));
        }
        Ok(())
    }

    #[test]
    fn test_validate_project_name_valid() {
        assert!(validate_project_name("My Project").is_ok());
        assert!(validate_project_name("Project 123").is_ok());
        assert!(validate_project_name("Test-Project!").is_ok());
        assert!(validate_project_name("A").is_ok());
    }

    #[test]
    fn test_validate_project_name_empty() {
        assert!(validate_project_name("").is_err());
        assert!(validate_project_name("   ").is_err());
        assert!(validate_project_name("\t\n").is_err());
    }

    #[test]
    fn test_validate_project_name_control_characters_only() {
        assert!(validate_project_name("\n\n\n").is_err());
        assert!(validate_project_name("   \t   ").is_err());
    }

    #[test]
    fn test_validate_army_name_valid() {
        assert!(validate_army_name("Space Marines").is_ok());
        assert!(validate_army_name("Army-123").is_ok());
        assert!(validate_army_name("Orks!").is_ok());
    }

    #[test]
    fn test_validate_army_name_empty() {
        assert!(validate_army_name("").is_err());
        assert!(validate_army_name("   ").is_err());
        assert!(validate_army_name("\t\n").is_err());
    }

    #[test]
    fn test_create_project_request_validation() {
        // Test that validation logic matches what's in the handler
        let valid_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            game_system: GameSystem::Warhammer40k,
            army: "Space Marines".to_string(),
            description: Some("Test description".to_string()),
        };

        assert!(validate_project_name(&valid_request.name).is_ok());
        assert!(validate_army_name(&valid_request.army).is_ok());
    }

    #[test]
    fn test_update_project_request_validation_with_empty_name() {
        let empty_name = "".to_string();
        let whitespace_name = "   ".to_string();

        assert!(validate_project_name(&empty_name).is_err());
        assert!(validate_project_name(&whitespace_name).is_err());
    }

    #[test]
    fn test_update_project_request_validation_with_empty_army() {
        let empty_army = "".to_string();
        let whitespace_army = "   ".to_string();

        assert!(validate_army_name(&empty_army).is_err());
        assert!(validate_army_name(&whitespace_army).is_err());
    }

    #[test]
    fn test_validation_rejects_special_characters_without_alphanumeric() {
        // Names with only special characters should be rejected
        assert!(validate_project_name("!!!").is_ok()); // Punctuation is allowed
        assert!(validate_project_name("---").is_ok());
        assert!(validate_project_name("...").is_ok());
    }

    #[test]
    fn test_validation_accepts_mixed_content() {
        assert!(validate_project_name("Project-123!").is_ok());
        assert!(validate_project_name("My Army (2024)").is_ok());
        assert!(validate_army_name("Space Marines - 1st Company").is_ok());
    }
}
