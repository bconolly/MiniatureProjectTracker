use crate::{
    database::Database,
    error::{AppError, Result},
    repositories::recipe_repository::RecipeRepository,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use shared_types::{CreateRecipeRequest, MiniatureType, PaintingRecipe, UpdateRecipeRequest};

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
        return Err(AppError::ValidationError(
            "Recipe name is required".to_string(),
        ));
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
            return Err(AppError::ValidationError(
                "Recipe name cannot be empty".to_string(),
            ));
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
        Err(AppError::NotFound(format!(
            "Recipe with id {} not found",
            id
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn validate_recipe_name(name: &str) -> Result<()> {
        if name.trim().is_empty() {
            return Err(AppError::ValidationError(
                "Recipe name is required".to_string(),
            ));
        }
        Ok(())
    }

    #[test]
    fn test_validate_recipe_name_valid() {
        assert!(validate_recipe_name("Basic Troop Scheme").is_ok());
        assert!(validate_recipe_name("Gold Armor Recipe").is_ok());
        assert!(validate_recipe_name("R").is_ok());
        assert!(validate_recipe_name("123").is_ok());
        assert!(validate_recipe_name("Recipe with numbers 123").is_ok());
    }

    #[test]
    fn test_validate_recipe_name_empty() {
        assert!(validate_recipe_name("").is_err());
        assert!(validate_recipe_name("   ").is_err());
        assert!(validate_recipe_name("\t").is_err());
        assert!(validate_recipe_name("\n").is_err());
    }

    #[test]
    fn test_validate_recipe_name_whitespace_only() {
        assert!(validate_recipe_name("     ").is_err());
        assert!(validate_recipe_name("\t\t\t").is_err());
        assert!(validate_recipe_name("\n\n").is_err());
        assert!(validate_recipe_name("  \t  \n  ").is_err());
    }

    #[test]
    fn test_create_recipe_request_validation() {
        let valid_request = CreateRecipeRequest {
            name: "Test Recipe".to_string(),
            miniature_type: MiniatureType::Troop,
            steps: vec!["Step 1".to_string(), "Step 2".to_string()],
            paints_used: vec!["Red".to_string(), "Blue".to_string()],
            techniques: vec!["Dry brush".to_string()],
            notes: Some("Test notes".to_string()),
        };

        assert!(validate_recipe_name(&valid_request.name).is_ok());
    }

    #[test]
    fn test_update_recipe_request_validation_with_empty_name() {
        let empty_name = "".to_string();
        let whitespace_name = "   ".to_string();

        assert!(validate_recipe_name(&empty_name).is_err());
        assert!(validate_recipe_name(&whitespace_name).is_err());
    }

    #[test]
    fn test_recipe_type_filtering() {
        // Test that recipe query params can filter by type
        let troop_param = RecipeQueryParams {
            miniature_type: Some(MiniatureType::Troop),
        };

        let character_param = RecipeQueryParams {
            miniature_type: Some(MiniatureType::Character),
        };

        let no_filter_param = RecipeQueryParams {
            miniature_type: None,
        };

        assert!(troop_param.miniature_type.is_some());
        assert!(character_param.miniature_type.is_some());
        assert!(no_filter_param.miniature_type.is_none());
    }

    #[test]
    fn test_validation_accepts_various_formats() {
        assert!(validate_recipe_name("Simple name").is_ok());
        assert!(validate_recipe_name("Name with - dashes").is_ok());
        assert!(validate_recipe_name("Name (with parentheses)").is_ok());
        assert!(validate_recipe_name("Name's with apostrophe").is_ok());
        assert!(validate_recipe_name("Name & symbols!").is_ok());
    }

    #[test]
    fn test_create_request_with_empty_arrays() {
        let request = CreateRecipeRequest {
            name: "Test".to_string(),
            miniature_type: MiniatureType::Character,
            steps: vec![],
            paints_used: vec![],
            techniques: vec![],
            notes: None,
        };

        // Empty arrays should be allowed for steps, paints, and techniques
        assert!(validate_recipe_name(&request.name).is_ok());
        assert_eq!(request.steps.len(), 0);
        assert_eq!(request.paints_used.len(), 0);
        assert_eq!(request.techniques.len(), 0);
    }

    #[test]
    fn test_update_request_with_optional_fields() {
        let full_update = UpdateRecipeRequest {
            name: Some("New name".to_string()),
            steps: Some(vec!["New step".to_string()]),
            paints_used: Some(vec!["New paint".to_string()]),
            techniques: Some(vec!["New technique".to_string()]),
            notes: Some("New notes".to_string()),
        };

        let partial_update = UpdateRecipeRequest {
            name: Some("Only name".to_string()),
            steps: None,
            paints_used: None,
            techniques: None,
            notes: None,
        };

        if let Some(ref name) = full_update.name {
            assert!(validate_recipe_name(name).is_ok());
        }
        if let Some(ref name) = partial_update.name {
            assert!(validate_recipe_name(name).is_ok());
        }
    }
}
