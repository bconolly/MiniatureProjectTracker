use crate::database::Database;
use chrono::Utc;
use shared_types::Photo;
use sqlx::{Pool, Postgres, Row, Sqlite};

pub struct PhotoRepository;

impl PhotoRepository {
    pub async fn create(
        database: &Database,
        miniature_id: i64,
        filename: String,
        file_path: String,
        file_size: i64,
        mime_type: String,
    ) -> Result<Photo, sqlx::Error> {
        let now = Utc::now();

        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO photos (miniature_id, filename, file_path, file_size, mime_type, uploaded_at)
                    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                    RETURNING id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at
                    "#
                )
                .bind(miniature_id)
                .bind(&filename)
                .bind(&file_path)
                .bind(file_size)
                .bind(&mime_type)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Photo {
                    id: row.get("id"),
                    miniature_id: row.get("miniature_id"),
                    filename: row.get("filename"),
                    file_path: row.get("file_path"),
                    file_size: row.get("file_size"),
                    mime_type: row.get("mime_type"),
                    uploaded_at: row.get("uploaded_at"),
                })
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    r#"
                    INSERT INTO photos (miniature_id, filename, file_path, file_size, mime_type, uploaded_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at
                    "#
                )
                .bind(miniature_id)
                .bind(&filename)
                .bind(&file_path)
                .bind(file_size)
                .bind(&mime_type)
                .bind(now)
                .fetch_one(pool)
                .await?;

                Ok(Photo {
                    id: row.get("id"),
                    miniature_id: row.get("miniature_id"),
                    filename: row.get("filename"),
                    file_path: row.get("file_path"),
                    file_size: row.get("file_size"),
                    mime_type: row.get("mime_type"),
                    uploaded_at: row.get("uploaded_at"),
                })
            }
        }
    }

    pub async fn find_by_id(database: &Database, id: i64) -> Result<Option<Photo>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let row = sqlx::query(
                    "SELECT id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at FROM photos WHERE id = ?1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Photo {
                    id: r.get("id"),
                    miniature_id: r.get("miniature_id"),
                    filename: r.get("filename"),
                    file_path: r.get("file_path"),
                    file_size: r.get("file_size"),
                    mime_type: r.get("mime_type"),
                    uploaded_at: r.get("uploaded_at"),
                }))
            }
            Database::Postgres(pool) => {
                let row = sqlx::query(
                    "SELECT id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at FROM photos WHERE id = $1"
                )
                .bind(id)
                .fetch_optional(pool)
                .await?;

                Ok(row.map(|r| Photo {
                    id: r.get("id"),
                    miniature_id: r.get("miniature_id"),
                    filename: r.get("filename"),
                    file_path: r.get("file_path"),
                    file_size: r.get("file_size"),
                    mime_type: r.get("mime_type"),
                    uploaded_at: r.get("uploaded_at"),
                }))
            }
        }
    }

    pub async fn find_by_miniature_id(
        database: &Database,
        miniature_id: i64,
    ) -> Result<Vec<Photo>, sqlx::Error> {
        match database {
            Database::Sqlite(pool) => {
                let rows = sqlx::query(
                    "SELECT id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at FROM photos WHERE miniature_id = ?1 ORDER BY uploaded_at"
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows
                    .into_iter()
                    .map(|r| Photo {
                        id: r.get("id"),
                        miniature_id: r.get("miniature_id"),
                        filename: r.get("filename"),
                        file_path: r.get("file_path"),
                        file_size: r.get("file_size"),
                        mime_type: r.get("mime_type"),
                        uploaded_at: r.get("uploaded_at"),
                    })
                    .collect())
            }
            Database::Postgres(pool) => {
                let rows = sqlx::query(
                    "SELECT id, miniature_id, filename, file_path, file_size, mime_type, uploaded_at FROM photos WHERE miniature_id = $1 ORDER BY uploaded_at"
                )
                .bind(miniature_id)
                .fetch_all(pool)
                .await?;

                Ok(rows
                    .into_iter()
                    .map(|r| Photo {
                        id: r.get("id"),
                        miniature_id: r.get("miniature_id"),
                        filename: r.get("filename"),
                        file_path: r.get("file_path"),
                        file_size: r.get("file_size"),
                        mime_type: r.get("mime_type"),
                        uploaded_at: r.get("uploaded_at"),
                    })
                    .collect())
            }
        }
    }

    pub async fn delete(database: &Database, id: i64) -> Result<Option<Photo>, sqlx::Error> {
        // First get the photo to return its details for cleanup
        let photo = Self::find_by_id(database, id).await?;

        if photo.is_some() {
            match database {
                Database::Sqlite(pool) => {
                    let result = sqlx::query("DELETE FROM photos WHERE id = ?1")
                        .bind(id)
                        .execute(pool)
                        .await?;

                    if result.rows_affected() > 0 {
                        Ok(photo)
                    } else {
                        Ok(None)
                    }
                }
                Database::Postgres(pool) => {
                    let result = sqlx::query("DELETE FROM photos WHERE id = $1")
                        .bind(id)
                        .execute(pool)
                        .await?;

                    if result.rows_affected() > 0 {
                        Ok(photo)
                    } else {
                        Ok(None)
                    }
                }
            }
        } else {
            Ok(None)
        }
    }

    pub async fn delete_by_miniature_id(
        database: &Database,
        miniature_id: i64,
    ) -> Result<Vec<Photo>, sqlx::Error> {
        // First get all photos to return their details for cleanup
        let photos = Self::find_by_miniature_id(database, miniature_id).await?;

        if !photos.is_empty() {
            match database {
                Database::Sqlite(pool) => {
                    sqlx::query("DELETE FROM photos WHERE miniature_id = ?1")
                        .bind(miniature_id)
                        .execute(pool)
                        .await?;
                }
                Database::Postgres(pool) => {
                    sqlx::query("DELETE FROM photos WHERE miniature_id = $1")
                        .bind(miniature_id)
                        .execute(pool)
                        .await?;
                }
            }
        }

        Ok(photos)
    }
}
