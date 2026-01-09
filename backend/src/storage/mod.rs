use async_trait::async_trait;
use std::path::Path;

pub mod local;
pub mod s3;

#[derive(Debug)]
pub enum StorageError {
    IoError(std::io::Error),
    S3Error(String),
    InvalidPath(String),
    FileNotFound(String),
}

impl std::fmt::Display for StorageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StorageError::IoError(e) => write!(f, "IO error: {}", e),
            StorageError::S3Error(e) => write!(f, "S3 error: {}", e),
            StorageError::InvalidPath(path) => write!(f, "Invalid path: {}", path),
            StorageError::FileNotFound(path) => write!(f, "File not found: {}", path),
        }
    }
}

impl std::error::Error for StorageError {}

impl From<std::io::Error> for StorageError {
    fn from(error: std::io::Error) -> Self {
        StorageError::IoError(error)
    }
}

#[async_trait]
pub trait StorageBackend: Send + Sync {
    /// Store a file and return the storage path
    async fn store(&self, file_data: &[u8], file_path: &str) -> Result<String, StorageError>;
    
    /// Retrieve a file by its storage path
    async fn retrieve(&self, file_path: &str) -> Result<Vec<u8>, StorageError>;
    
    /// Delete a file by its storage path
    async fn delete(&self, file_path: &str) -> Result<(), StorageError>;
    
    /// Check if a file exists at the given path
    async fn exists(&self, file_path: &str) -> Result<bool, StorageError>;
    
    /// Get the public URL for a file (if applicable)
    async fn get_url(&self, file_path: &str) -> Result<String, StorageError>;
}

pub enum StorageConfig {
    Local {
        base_path: String,
        base_url: String,
    },
    S3 {
        bucket: String,
        region: String,
        base_url: Option<String>,
    },
}

pub struct Storage {
    backend: Box<dyn StorageBackend>,
}

impl Storage {
    pub async fn new(config: StorageConfig) -> Result<Self, StorageError> {
        let backend: Box<dyn StorageBackend> = match config {
            StorageConfig::Local { base_path, base_url } => {
                Box::new(local::LocalStorage::new(base_path, base_url).await?)
            }
            StorageConfig::S3 { bucket, region, base_url } => {
                Box::new(s3::S3Storage::new(bucket, region, base_url).await?)
            }
        };
        
        Ok(Storage { backend })
    }
    
    pub async fn store(&self, file_data: &[u8], file_path: &str) -> Result<String, StorageError> {
        self.backend.store(file_data, file_path).await
    }
    
    pub async fn retrieve(&self, file_path: &str) -> Result<Vec<u8>, StorageError> {
        self.backend.retrieve(file_path).await
    }
    
    pub async fn delete(&self, file_path: &str) -> Result<(), StorageError> {
        self.backend.delete(file_path).await
    }
    
    pub async fn exists(&self, file_path: &str) -> Result<bool, StorageError> {
        self.backend.exists(file_path).await
    }
    
    pub async fn get_url(&self, file_path: &str) -> Result<String, StorageError> {
        self.backend.get_url(file_path).await
    }
}