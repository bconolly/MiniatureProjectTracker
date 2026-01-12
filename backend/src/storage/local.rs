use super::{StorageBackend, StorageError};
use async_trait::async_trait;
use std::path::{Path, PathBuf};
use tokio::fs;
use uuid::Uuid;

pub struct LocalStorage {
    base_path: PathBuf,
    base_url: String,
}

impl LocalStorage {
    pub async fn new(base_path: String, base_url: String) -> Result<Self, StorageError> {
        let path = PathBuf::from(&base_path);

        // Create the base directory if it doesn't exist
        if !path.exists() {
            fs::create_dir_all(&path).await?;
        }

        Ok(LocalStorage {
            base_path: path,
            base_url,
        })
    }

    fn get_full_path(&self, file_path: &str) -> PathBuf {
        self.base_path.join(file_path)
    }

    fn sanitize_path(&self, file_path: &str) -> Result<String, StorageError> {
        // Remove any path traversal attempts and ensure safe filename
        let sanitized = file_path
            .replace("..", "")
            .replace("\\", "/")
            .trim_start_matches('/')
            .to_string();

        if sanitized.is_empty() {
            return Err(StorageError::InvalidPath(
                "Empty path after sanitization".to_string(),
            ));
        }

        Ok(sanitized)
    }
}

#[async_trait]
impl StorageBackend for LocalStorage {
    async fn store(&self, file_data: &[u8], file_path: &str) -> Result<String, StorageError> {
        let sanitized_path = self.sanitize_path(file_path)?;
        let full_path = self.get_full_path(&sanitized_path);

        // Create parent directories if they don't exist
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        // Write the file
        fs::write(&full_path, file_data).await?;

        Ok(sanitized_path)
    }

    async fn retrieve(&self, file_path: &str) -> Result<Vec<u8>, StorageError> {
        let sanitized_path = self.sanitize_path(file_path)?;
        let full_path = self.get_full_path(&sanitized_path);

        if !full_path.exists() {
            return Err(StorageError::FileNotFound(file_path.to_string()));
        }

        let data = fs::read(&full_path).await?;
        Ok(data)
    }

    async fn delete(&self, file_path: &str) -> Result<(), StorageError> {
        let sanitized_path = self.sanitize_path(file_path)?;
        let full_path = self.get_full_path(&sanitized_path);

        if !full_path.exists() {
            return Err(StorageError::FileNotFound(file_path.to_string()));
        }

        fs::remove_file(&full_path).await?;
        Ok(())
    }

    async fn exists(&self, file_path: &str) -> Result<bool, StorageError> {
        let sanitized_path = self.sanitize_path(file_path)?;
        let full_path = self.get_full_path(&sanitized_path);
        Ok(full_path.exists())
    }

    async fn get_url(&self, file_path: &str) -> Result<String, StorageError> {
        let sanitized_path = self.sanitize_path(file_path)?;
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), sanitized_path);
        Ok(url)
    }
}
