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
