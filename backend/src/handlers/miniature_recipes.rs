use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::{
        miniature_recipe_repository::MiniatureRecipeRepository,
        miniature_repository::MiniatureRepository,
        recipe_repository::RecipeRepository,
    },
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::Value;
use shared_types::PaintingRecipe;

/// Get all recipes linked to a miniature
pub async fn get_miniature_recipes(
    State(database): State<Database>,
    Path(miniature_id): Path<i64>,
) -> Result<Json<Value>> {
    // Verify miniature exists
    MiniatureRepository::find_by_id(&database, miniature_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Miniature with id {} not found", miniature_id)))?;

    let recipes = MiniatureRecipeRepository::find_recipes_for_miniature(&database, miniature_id).await?;

    Ok(Json(serde_json::json!({
        "recipes": recipes
    })))
}

/// Link a recipe to a miniature
pub async fn link_recipe_to_miniature(
    State(database): State<Database>,
    Path((miniature_id, recipe_id)): Path<(i64, i64)>,
) -> Result<StatusCode> {
    // Verify miniature exists
    MiniatureRepository::find_by_id(&database, miniature_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Miniature with id {} not found", miniature_id)))?;

    // Verify recipe exists
    RecipeRepository::find_by_id(&database, recipe_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Recipe with id {} not found", recipe_id)))?;

    MiniatureRecipeRepository::link(&database, miniature_id, recipe_id).await?;

    Ok(StatusCode::CREATED)
}

/// Unlink a recipe from a miniature
pub async fn unlink_recipe_from_miniature(
    State(database): State<Database>,
    Path((miniature_id, recipe_id)): Path<(i64, i64)>,
) -> Result<StatusCode> {
    let deleted = MiniatureRecipeRepository::unlink(&database, miniature_id, recipe_id).await?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NotFound(format!(
            "Recipe {} is not linked to miniature {}",
            recipe_id, miniature_id
        )))
    }
}

/// Get count of miniatures using a recipe
pub async fn get_recipe_usage_count(
    State(database): State<Database>,
    Path(recipe_id): Path<i64>,
) -> Result<Json<Value>> {
    // Verify recipe exists
    RecipeRepository::find_by_id(&database, recipe_id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Recipe with id {} not found", recipe_id)))?;

    let count = MiniatureRecipeRepository::count_miniatures_for_recipe(&database, recipe_id).await?;

    Ok(Json(serde_json::json!({
        "recipe_id": recipe_id,
        "miniature_count": count
    })))
}
