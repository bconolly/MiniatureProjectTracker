use axum::{
    extract::{State, Path, Query},
    response::Json,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use shared_types::{PaintingRecipe, MiniatureType, CreateRecipeRequest, UpdateRecipeRequest};
use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::recipe_repository::RecipeRepository,
};

#[derive(Debug, Deserialize)]
pub struct RecipeQueryParams {
    #[serde(rename = "type")]
    pub miniature_type: Option<MiniatureType>,
}

pub async fn list_recipes(
    State(database): State<Database>,
    Query(params): Query<RecipeQueryParams>,
) -> Result<Json<Value>> {
    let recipes = match params.miniature_type {
        Some(miniature_type) => RecipeRepository::find_by_type(&database, miniature_type).await?,
        None => RecipeRepository::find_all(&database).await?,
    };
    
    Ok(Json(serde_json::json!({
        "recipes": recipes
    })))
}

pub async fn create_recipe(
    State(database): State<Database>,
    Json(request): Json<CreateRecipeRequest>,
) -> Result<Json<PaintingRecipe>> {
    // Validate required fields
    if request.name.trim().is_empty() {
        return Err(AppError::ValidationError("Recipe name is required".to_string()));
    }

    let recipe = RecipeRepository::create(&database, request).await?;
    Ok(Json(recipe))
}

pub async fn get_recipe(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<Json<PaintingRecipe>> {
    let recipe = RecipeRepository::find_by_id(&database, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Recipe with id {} not found", id)))?;
    
    Ok(Json(recipe))
}

pub async fn update_recipe(
    State(database): State<Database>,
    Path(id): Path<i64>,
    Json(request): Json<UpdateRecipeRequest>,
) -> Result<Json<PaintingRecipe>> {
    // Validate fields if provided
    if let Some(ref name) = request.name {
        if name.trim().is_empty() {
            return Err(AppError::ValidationError("Recipe name cannot be empty".to_string()));
        }
    }

    let recipe = RecipeRepository::update(&database, id, request)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Recipe with id {} not found", id)))?;
    
    Ok(Json(recipe))
}

pub async fn delete_recipe(
    State(database): State<Database>,
    Path(id): Path<i64>,
) -> Result<StatusCode> {
    let deleted = RecipeRepository::delete(&database, id).await?;
    
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound(format!("Recipe with id {} not found", id)))
    }
}