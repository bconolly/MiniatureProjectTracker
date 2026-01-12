use crate::database::Database;
use chrono::Utc;
use shared_types::{
    CreateMiniatureRequest, Miniature, MiniatureType, ProgressStatus, UpdateMiniatureRequest,
};
use sqlx::{Pool, Postgres, Row, Sqlite};

pub struct MiniatureRepository;

impl MiniatureRepository {
    pub async fn create(
        database: &Database,
        project_id: i64,
        request: CreateMiniatureRequest,
    ) -> Result<Miniature, sqlx::Error> {
        let now = Utc::now();

        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO miniatures (project_id, name, miniature_type, progress_status, notes, created_at, updated_at)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                    RETURNING id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at
                    "#
                )
                .bind(project_id)
                .bind(&request.name)
                .bind(&request.miniature_type)
                .bind(ProgressStatus::Unpainted) // Default status
                .bind(&request.notes)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Miniature {
                    id: row.get("id"),
                    project_id: row.get("project_id"),
                    name: row.get("name"),
                    miniature_type: row.get("miniature_type"),
                    progress_status: row.get("progress_status"),
                    notes: row.get("notes"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO miniatures (project_id, name, miniature_type, progress_status, notes, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at
                    "#
                )
                .bind(project_id)
                .bind(&request.name)
                .bind(&request.miniature_type)
                .bind(ProgressStatus::Unpainted) // Default status
                .bind(&request.notes)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Miniature {
                    id: row.get("id"),
                    project_id: row.get("project_id"),
                    name: row.get("name"),
                    miniature_type: row.get("miniature_type"),
                    progress_status: row.get("progress_status"),
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
    ) -> Result<Option<Miniature>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    "SELECT id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at FROM miniatures WHERE id = ?1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Miniature {
                    id: r.get("id"),
                    project_id: r.get("project_id"),
                    name: r.get("name"),
                    miniature_type: r.get("miniature_type"),
                    progress_status: r.get("progress_status"),
                    notes: r.get("notes"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    "SELECT id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at FROM miniatures WHERE id = $1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Miniature {
                    id: r.get("id"),
                    project_id: r.get("project_id"),
                    name: r.get("name"),
                    miniature_type: r.get("miniature_type"),
                    progress_status: r.get("progress_status"),
                    notes: r.get("notes"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
        }
    }

    pub async fn find_by_project_id(
        database: &Database,
        project_id: i64,
    ) -> Result<Vec<Miniature>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at FROM miniatures WHERE project_id = ?1 ORDER BY created_at"
                )
                .bind(project_id)
                .fetch_all(pool)
                .await?;

                Ok(rows
                    .into_iter()
                    .map(|r| Miniature {
                        id: r.get("id"),
                        project_id: r.get("project_id"),
                        name: r.get("name"),
                        miniature_type: r.get("miniature_type"),
                        progress_status: r.get("progress_status"),
                        notes: r.get("notes"),
                        created_at: r.get("created_at"),
                        updated_at: r.get("updated_at"),
                    })
                    .collect())
            }
            Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at FROM miniatures WHERE project_id = $1 ORDER BY created_at"
                )
                .bind(project_id)
                .fetch_all(pool)
                .await?;

                Ok(rows
                    .into_iter()
                    .map(|r| Miniature {
                        id: r.get("id"),
                        project_id: r.get("project_id"),
                        name: r.get("name"),
                        miniature_type: r.get("miniature_type"),
                        progress_status: r.get("progress_status"),
                        notes: r.get("notes"),
                        created_at: r.get("created_at"),
                        updated_at: r.get("updated_at"),
                    })
                    .collect())
            }
        }
    }

    pub async fn update(
        database: &Database,
        id: i64,
        request: UpdateMiniatureRequest,
    ) -> Result<Option<Miniature>, sqlx::Error> {
        let now = Utc::now();

        // First, get the current miniature to merge with updates
        let current = Self::find_by_id(database, id).await?;
        let Some(current) = current else {
            return Ok(None);
        };

        let name = request.name.unwrap_or(current.name);
        let progress_status = request.progress_status.unwrap_or(current.progress_status);
        let notes = request.notes.or(current.notes);

        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE miniatures 
                    SET name = ?1, progress_status = ?2, notes = ?3, updated_at = ?4
                    WHERE id = ?5
                    RETURNING id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&progress_status)
                .bind(&notes)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Miniature {
                    id: r.get("id"),
                    project_id: r.get("project_id"),
                    name: r.get("name"),
                    miniature_type: r.get("miniature_type"),
                    progress_status: r.get("progress_status"),
                    notes: r.get("notes"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE miniatures 
                    SET name = $1, progress_status = $2, notes = $3, updated_at = $4
                    WHERE id = $5
                    RETURNING id, project_id, name, miniature_type, progress_status, notes, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&progress_status)
                .bind(&notes)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Miniature {
                    id: r.get("id"),
                    project_id: r.get("project_id"),
                    name: r.get("name"),
                    miniature_type: r.get("miniature_type"),
                    progress_status: r.get("progress_status"),
                    notes: r.get("notes"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
        }
    }

    pub async fn delete(database: &Database, id: i64) -> Result<bool, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let result = sqlx::query("DELETE FROM miniatures WHERE id = ?1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
            Database::Postgres(pool) => {
                let result = sqlx::query("DELETE FROM miniatures WHERE id = $1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
        }
    }
}
