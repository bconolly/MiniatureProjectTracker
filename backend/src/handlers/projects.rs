use axum::{
    extract::{State, Path},
    response::Json,
    http::StatusCode,
};
use serde_json::Value;
use shared_types::{Project, CreateProjectRequest, UpdateProjectRequest};
use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::project_repository::ProjectRepository,
};

pub async fn list_projects(
    State(database): State<Database>,
) -> Result<Json<Value>> {
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
    if request.name.trim().is_empty() || !request.name.chars().any(|c| c.is_alphanumeric() || c.is_ascii_punctuation()) {
        return Err(AppError::ValidationError("Project name is required".to_string()));
    }
    
    if request.army.trim().is_empty() || !request.army.chars().any(|c| c.is_alphanumeric() || c.is_ascii_punctuation()) {
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
        if name.trim().is_empty() || !name.chars().any(|c| c.is_alphanumeric() || c.is_ascii_punctuation()) {
            return Err(AppError::ValidationError("Project name cannot be empty".to_string()));
        }
    }
    
    if let Some(ref army) = request.army {
        if army.trim().is_empty() || !army.chars().any(|c| c.is_alphanumeric() || c.is_ascii_punctuation()) {
            return Err(AppError::ValidationError("Army cannot be empty".to_string()));
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
        Err(AppError::NotFound(format!("Project with id {} not found", id)))
    }
}