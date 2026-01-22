use crate::database::Database;
use chrono::{DateTime, Utc};
use shared_types::PaintingRecipe;
use sqlx::Row;

pub struct MiniatureRecipeRepository;

impl MiniatureRecipeRepository {
    /// Link a recipe to a miniature
    pub async fn link(
        database: &Database,
        miniature_id: i64,
        recipe_id: i64,
    ) -> Result<(), sqlx::Error> {
        match database {
            crate::database::Database::Sqlite(pool) => {
                sqlx::query(
                    "INSERT OR IGNORE INTO miniature_recipes (miniature_id, recipe_id) VALUES (?1, ?2)"
                )
                .bind(miniature_id)
                .bind(recipe_id)
                .execute(pool)
                .await?;
            }
            crate::database::Database::Postgres(pool) => {
                sqlx::query(
                    "INSERT INTO miniature_recipes (miniature_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
                )
                .bind(miniature_id)
                .bind(recipe_id)
                .execute(pool)
                .await?;
            }
        }
        Ok(())
    }

    /// Unlink a recipe from a miniature
    pub async fn unlink(
        database: &Database,
        miniature_id: i64,
        recipe_id: i64,
    ) -> Result<bool, sqlx::Error> {
        let rows_affected = match database {
            crate::database::Database::Sqlite(pool) => {
                sqlx::query(
                    "DELETE FROM miniature_recipes WHERE miniature_id = ?1 AND recipe_id = ?2"
                )
                .bind(miniature_id)
                .bind(recipe_id)
                .execute(pool)
                .await?
                .rows_affected()
            }
            crate::database::Database::Postgres(pool) => {
                sqlx::query(
                    "DELETE FROM miniature_recipes WHERE miniature_id = $1 AND recipe_id = $2"
                )
                .bind(miniature_id)
                .bind(recipe_id)
                .execute(pool)
                .await?
                .rows_affected()
            }
        };
        Ok(rows_affected > 0)
    }

    /// Get all recipes linked to a miniature
    pub async fn find_recipes_for_miniature(
        database: &Database,
        miniature_id: i64,
    ) -> Result<Vec<PaintingRecipe>, sqlx::Error> {
        match database {
            crate::database::Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    r#"
                    SELECT pr.id, pr.name, pr.miniature_type, pr.steps, pr.paints_used, pr.techniques, pr.notes, pr.created_at, pr.updated_at
                    FROM painting_recipes pr
                    INNER JOIN miniature_recipes mr ON pr.id = mr.recipe_id
                    WHERE mr.miniature_id = ?1
                    ORDER BY pr.name
                    "#
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| {
                    let steps: Vec<String> = serde_json::from_str(r.get("steps")).unwrap_or_default();
                    let paints_used: Vec<String> = serde_json::from_str(r.get("paints_used")).unwrap_or_default();
                    let techniques: Vec<String> = serde_json::from_str(r.get("techniques")).unwrap_or_default();

                    PaintingRecipe {
                        id: r.get("id"),
                        name: r.get("name"),
                        miniature_type: r.get("miniature_type"),
                        steps,
                        paints_used,
                        techniques,
                        notes: r.get("notes"),
                        created_at: r.get("created_at"),
                        updated_at: r.get("updated_at"),
                    }
                }).collect())
            }
            crate::database::Database::Postgres(pool) => {
                let rows = sqlx::query(
                    r#"
                    SELECT pr.id, pr.name, pr.miniature_type, pr.steps, pr.paints_used, pr.techniques, pr.notes, pr.created_at, pr.updated_at
                    FROM painting_recipes pr
                    INNER JOIN miniature_recipes mr ON pr.id = mr.recipe_id
                    WHERE mr.miniature_id = $1
                    ORDER BY pr.name
                    "#
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| {
                    let steps: Vec<String> = serde_json::from_str(r.get("steps")).unwrap_or_default();
                    let paints_used: Vec<String> = serde_json::from_str(r.get("paints_used")).unwrap_or_default();
                    let techniques: Vec<String> = serde_json::from_str(r.get("techniques")).unwrap_or_default();

                    PaintingRecipe {
                        id: r.get("id"),
                        name: r.get("name"),
                        miniature_type: r.get("miniature_type"),
                        steps,
                        paints_used,
                        techniques,
                        notes: r.get("notes"),
                        created_at: r.get("created_at"),
                        updated_at: r.get("updated_at"),
                    }
                }).collect())
            }
        }
    }

    /// Get the count of miniatures using a specific recipe
    pub async fn count_miniatures_for_recipe(
        database: &Database,
        recipe_id: i64,
    ) -> Result<i64, sqlx::Error> {
        match database {
            crate::database::Database::Sqlite(pool) => {
                let row = sqlx::query(
                    "SELECT COUNT(*) as count FROM miniature_recipes WHERE recipe_id = ?1"
                )
                .bind(recipe_id)
                .fetch_one(pool)
                .await?;
                Ok(row.get("count"))
            }
            crate::database::Database::Postgres(pool) => {
                let row = sqlx::query(
                    "SELECT COUNT(*) as count FROM miniature_recipes WHERE recipe_id = $1"
                )
                .bind(recipe_id)
                .fetch_one(pool)
                .await?;
                Ok(row.get("count"))
            }
        }
    }

    /// Get all recipe IDs linked to a miniature
    pub async fn get_recipe_ids_for_miniature(
        database: &Database,
        miniature_id: i64,
    ) -> Result<Vec<i64>, sqlx::Error> {
        match database {
            crate::database::Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT recipe_id FROM miniature_recipes WHERE miniature_id = ?1"
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| r.get("recipe_id")).collect())
            }
            crate::database::Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT recipe_id FROM miniature_recipes WHERE miniature_id = $1"
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| r.get("recipe_id")).collect())
            }
        }
    }
}
