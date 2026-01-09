use sqlx::{Pool, Sqlite, Postgres, Row};
use chrono::Utc;
use shared_types::{PaintingRecipe, MiniatureType, CreateRecipeRequest, UpdateRecipeRequest};
use crate::database::Database;

pub struct RecipeRepository;

impl RecipeRepository {
    pub async fn create(
        database: &Database,
        request: CreateRecipeRequest,
    ) -> Result<PaintingRecipe, sqlx::Error> {
        let now = Utc::now();
        let steps_json = serde_json::to_string(&request.steps).unwrap_or_default();
        let paints_json = serde_json::to_string(&request.paints_used).unwrap_or_default();
        let techniques_json = serde_json::to_string(&request.techniques).unwrap_or_default();
        
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO painting_recipes (name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                    RETURNING id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at
                    "#
                )
                .bind(&request.name)
                .bind(&request.miniature_type)
                .bind(&steps_json)
                .bind(&paints_json)
                .bind(&techniques_json)
                .bind(&request.notes)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                let steps: Vec<String> = serde_json::from_str(row.get("steps")).unwrap_or_default();
                let paints_used: Vec<String> = serde_json::from_str(row.get("paints_used")).unwrap_or_default();
                let techniques: Vec<String> = serde_json::from_str(row.get("techniques")).unwrap_or_default();

                Ok(PaintingRecipe {
                    id: row.get("id"),
                    name: row.get("name"),
                    miniature_type: row.get("miniature_type"),
                    steps,
                    paints_used,
                    techniques,
                    notes: row.get("notes"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO painting_recipes (name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at
                    "#
                )
                .bind(&request.name)
                .bind(&request.miniature_type)
                .bind(&steps_json)
                .bind(&paints_json)
                .bind(&techniques_json)
                .bind(&request.notes)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                let steps: Vec<String> = serde_json::from_str(row.get("steps")).unwrap_or_default();
                let paints_used: Vec<String> = serde_json::from_str(row.get("paints_used")).unwrap_or_default();
                let techniques: Vec<String> = serde_json::from_str(row.get("techniques")).unwrap_or_default();

                Ok(PaintingRecipe {
                    id: row.get("id"),
                    name: row.get("name"),
                    miniature_type: row.get("miniature_type"),
                    steps,
                    paints_used,
                    techniques,
                    notes: row.get("notes"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
            }
        }
    }

    pub async fn find_by_id(
        database: &Database,
        id: i64,
    ) -> Result<Option<PaintingRecipe>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes WHERE id = ?1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| {
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
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes WHERE id = $1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| {
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
                }))
            }
        }
    }

    pub async fn find_all(database: &Database) -> Result<Vec<PaintingRecipe>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes ORDER BY name"
                )
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
            Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes ORDER BY name"
                )
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

    pub async fn find_by_type(
        database: &Database,
        miniature_type: MiniatureType,
    ) -> Result<Vec<PaintingRecipe>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes WHERE miniature_type = ?1 ORDER BY name"
                )
                .bind(&miniature_type)
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
            Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at FROM painting_recipes WHERE miniature_type = $1 ORDER BY name"
                )
                .bind(&miniature_type)
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

    pub async fn update(
        database: &Database,
        id: i64,
        request: UpdateRecipeRequest,
    ) -> Result<Option<PaintingRecipe>, sqlx::Error> {
        let now = Utc::now();

        // First, get the current recipe to merge with updates
        let current = Self::find_by_id(database, id).await?;
        let Some(current) = current else {
            return Ok(None);
        };

        let name = request.name.unwrap_or(current.name);
        let steps = request.steps.unwrap_or(current.steps);
        let paints_used = request.paints_used.unwrap_or(current.paints_used);
        let techniques = request.techniques.unwrap_or(current.techniques);
        let notes = request.notes.or(current.notes);

        let steps_json = serde_json::to_string(&steps).unwrap_or_default();
        let paints_json = serde_json::to_string(&paints_used).unwrap_or_default();
        let techniques_json = serde_json::to_string(&techniques).unwrap_or_default();

        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE painting_recipes 
                    SET name = ?1, steps = ?2, paints_used = ?3, techniques = ?4, notes = ?5, updated_at = ?6
                    WHERE id = ?7
                    RETURNING id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&steps_json)
                .bind(&paints_json)
                .bind(&techniques_json)
                .bind(&notes)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| {
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
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE painting_recipes 
                    SET name = $1, steps = $2, paints_used = $3, techniques = $4, notes = $5, updated_at = $6
                    WHERE id = $7
                    RETURNING id, name, miniature_type, steps, paints_used, techniques, notes, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&steps_json)
                .bind(&paints_json)
                .bind(&techniques_json)
                .bind(&notes)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| {
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
                }))
            }
        }
    }

    pub async fn delete(database: &Database, id: i64) -> Result<bool, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let result = sqlx::query("DELETE FROM painting_recipes WHERE id = ?1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
            Database::Postgres(pool) => {
                let result = sqlx::query("DELETE FROM painting_recipes WHERE id = $1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
        }
    }
}