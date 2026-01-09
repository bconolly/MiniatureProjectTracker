use sqlx::{Pool, Sqlite, Postgres, Row};
use chrono::Utc;
use shared_types::{Project, GameSystem, CreateProjectRequest, UpdateProjectRequest};
use crate::database::Database;

pub struct ProjectRepository;

impl ProjectRepository {
    pub async fn create(
        database: &Database,
        request: CreateProjectRequest,
    ) -> Result<Project, sqlx::Error> {
        let now = Utc::now();
        
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO projects (name, game_system, army, description, created_at, updated_at)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                    RETURNING id, name, game_system, army, description, created_at, updated_at
                    "#
                )
                .bind(&request.name)
                .bind(&request.game_system)
                .bind(&request.army)
                .bind(&request.description)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Project {
                    id: row.get("id"),
                    name: row.get("name"),
                    game_system: row.get("game_system"),
                    army: row.get("army"),
                    description: row.get("description"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO projects (name, game_system, army, description, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, name, game_system, army, description, created_at, updated_at
                    "#
                )
                .bind(&request.name)
                .bind(&request.game_system)
                .bind(&request.army)
                .bind(&request.description)
                .bind(now)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Project {
                    id: row.get("id"),
                    name: row.get("name"),
                    game_system: row.get("game_system"),
                    army: row.get("army"),
                    description: row.get("description"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                })
            }
        }
    }

    pub async fn find_by_id(
        database: &Database,
        id: i64,
    ) -> Result<Option<Project>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    "SELECT id, name, game_system, army, description, created_at, updated_at FROM projects WHERE id = ?1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    "SELECT id, name, game_system, army, description, created_at, updated_at FROM projects WHERE id = $1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
        }
    }

    pub async fn find_all(database: &Database) -> Result<Vec<Project>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, game_system, army, description, created_at, updated_at FROM projects ORDER BY game_system, army, name"
                )
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }).collect())
            }
            Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT id, name, game_system, army, description, created_at, updated_at FROM projects ORDER BY game_system, army, name"
                )
                .fetch_all(pool)
                .await?;

                Ok(rows.into_iter().map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }).collect())
            }
        }
    }

    pub async fn update(
        database: &Database,
        id: i64,
        request: UpdateProjectRequest,
    ) -> Result<Option<Project>, sqlx::Error> {
        let now = Utc::now();

        // First, get the current project to merge with updates
        let current = Self::find_by_id(database, id).await?;
        let Some(current) = current else {
            return Ok(None);
        };

        let name = request.name.unwrap_or(current.name);
        let game_system = request.game_system.unwrap_or(current.game_system);
        let army = request.army.unwrap_or(current.army);
        let description = request.description.or(current.description);

        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE projects 
                    SET name = ?1, game_system = ?2, army = ?3, description = ?4, updated_at = ?5
                    WHERE id = ?6
                    RETURNING id, name, game_system, army, description, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&game_system)
                .bind(&army)
                .bind(&description)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    UPDATE projects 
                    SET name = $1, game_system = $2, army = $3, description = $4, updated_at = $5
                    WHERE id = $6
                    RETURNING id, name, game_system, army, description, created_at, updated_at
                    "#
                )
                .bind(&name)
                .bind(&game_system)
                .bind(&army)
                .bind(&description)
                .bind(now)
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Project {
                    id: r.get("id"),
                    name: r.get("name"),
                    game_system: r.get("game_system"),
                    army: r.get("army"),
                    description: r.get("description"),
                    created_at: r.get("created_at"),
                    updated_at: r.get("updated_at"),
                }))
            }
        }
    }

    pub async fn delete(database: &Database, id: i64) -> Result<bool, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let result = sqlx::query("DELETE FROM projects WHERE id = ?1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
            Database::Postgres(pool) => {
                let result = sqlx::query("DELETE FROM projects WHERE id = $1")
                    .bind(id)
                    .execute(pool)
                    .await?;

                Ok(result.rows_affected() > 0)
            }
        }
    }
}