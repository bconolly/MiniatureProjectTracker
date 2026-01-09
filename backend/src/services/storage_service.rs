use crate::config::{Config, StorageType};
use crate::storage::{Storage, StorageConfig, StorageError};

pub struct StorageService {
    storage: Storage,
}

impl StorageService {
    pub async fn new(config: &Config) -> Result<Self, StorageError> {
        let storage_config = match &config.storage_type {
            StorageType::Local => {
                let base_path = config.local_storage_path
                    .as_ref()
                    .unwrap_or(&"./uploads".to_string())
                    .clone();
                let base_url = format!("http://localhost:{}/uploads", config.port);
                
                StorageConfig::Local { base_path, base_url }
            }
            StorageType::S3 => {
                let bucket = config.s3_bucket
                    .as_ref()
                    .ok_or_else(|| StorageError::InvalidPath("S3_BUCKET not configured".to_string()))?
                    .clone();
                let region = config.aws_region
                    .as_ref()
                    .ok_or_else(|| StorageError::InvalidPath("AWS_REGION not configured".to_string()))?
                    .clone();
                
                StorageConfig::S3 { 
                    bucket, 
                    region, 
                    base_url: None // Could be configured for CloudFront later
                }
            }
        };
        
        let storage = Storage::new(storage_config).await?;
        
        Ok(StorageService { storage })
    }
    
    pub async fn store_photo(&self, file_data: &[u8], filename: &str, miniature_id: i64) -> Result<String, StorageError> {
        // Generate a unique path for the photo
        let file_extension = std::path::Path::new(filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("jpg");
            
        let unique_filename = format!("miniatures/{}/{}_{}.{}", 
            miniature_id, 
            uuid::Uuid::new_v4(), 
            filename.replace(&format!(".{}", file_extension), ""),
            file_extension
        );
        
        self.storage.store(file_data, &unique_filename).await
    }
    
    pub async fn retrieve_photo(&self, file_path: &str) -> Result<Vec<u8>, StorageError> {
        self.storage.retrieve(file_path).await
    }
    
    pub async fn delete_photo(&self, file_path: &str) -> Result<(), StorageError> {
        self.storage.delete(file_path).await
    }
    
    pub async fn get_photo_url(&self, file_path: &str) -> Result<String, StorageError> {
        self.storage.get_url(file_path).await
    }
    
    pub async fn photo_exists(&self, file_path: &str) -> Result<bool, StorageError> {
        self.storage.exists(file_path).await
    }
}