use super::{StorageBackend, StorageError};
use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_s3::{Client, primitives::ByteStream};
use std::time::Duration;

pub struct S3Storage {
    client: Client,
    bucket: String,
    base_url: Option<String>,
}

impl S3Storage {
    pub async fn new(bucket: String, region: String, base_url: Option<String>) -> Result<Self, StorageError> {
        let config = aws_config::defaults(BehaviorVersion::latest())
            .region(aws_config::Region::new(region))
            .load()
            .await;
            
        let client = Client::new(&config);
        
        Ok(S3Storage {
            client,
            bucket,
            base_url,
        })
    }
    
    fn sanitize_key(&self, file_path: &str) -> Result<String, StorageError> {
        // Remove any path traversal attempts and ensure safe S3 key
        let sanitized = file_path
            .replace("..", "")
            .replace("\\", "/")
            .trim_start_matches('/')
            .to_string();
            
        if sanitized.is_empty() {
            return Err(StorageError::InvalidPath("Empty path after sanitization".to_string()));
        }
        
        Ok(sanitized)
    }
}

#[async_trait]
impl StorageBackend for S3Storage {
    async fn store(&self, file_data: &[u8], file_path: &str) -> Result<String, StorageError> {
        let key = self.sanitize_key(file_path)?;
        
        let body = ByteStream::from(file_data.to_vec());
        
        let result = self.client
            .put_object()
            .bucket(&self.bucket)
            .key(&key)
            .body(body)
            .send()
            .await;
            
        match result {
            Ok(_) => Ok(key),
            Err(e) => Err(StorageError::S3Error(format!("Failed to upload to S3: {}", e))),
        }
    }
    
    async fn retrieve(&self, file_path: &str) -> Result<Vec<u8>, StorageError> {
        let key = self.sanitize_key(file_path)?;
        
        let result = self.client
            .get_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await;
            
        match result {
            Ok(output) => {
                let data = output.body.collect().await
                    .map_err(|e| StorageError::S3Error(format!("Failed to read S3 object body: {}", e)))?;
                Ok(data.into_bytes().to_vec())
            }
            Err(e) => {
                if e.to_string().contains("NoSuchKey") {
                    Err(StorageError::FileNotFound(file_path.to_string()))
                } else {
                    Err(StorageError::S3Error(format!("Failed to retrieve from S3: {}", e)))
                }
            }
        }
    }
    
    async fn delete(&self, file_path: &str) -> Result<(), StorageError> {
        let key = self.sanitize_key(file_path)?;
        
        let result = self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await;
            
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(StorageError::S3Error(format!("Failed to delete from S3: {}", e))),
        }
    }
    
    async fn exists(&self, file_path: &str) -> Result<bool, StorageError> {
        let key = self.sanitize_key(file_path)?;
        
        let result = self.client
            .head_object()
            .bucket(&self.bucket)
            .key(&key)
            .send()
            .await;
            
        match result {
            Ok(_) => Ok(true),
            Err(e) => {
                if e.to_string().contains("NotFound") {
                    Ok(false)
                } else {
                    Err(StorageError::S3Error(format!("Failed to check S3 object existence: {}", e)))
                }
            }
        }
    }
    
    async fn get_url(&self, file_path: &str) -> Result<String, StorageError> {
        let key = self.sanitize_key(file_path)?;
        
        if let Some(base_url) = &self.base_url {
            // Use custom base URL (e.g., CloudFront distribution)
            let url = format!("{}/{}", base_url.trim_end_matches('/'), key);
            Ok(url)
        } else {
            // Generate presigned URL for direct S3 access
            let presigning_config = aws_sdk_s3::presigning::PresigningConfig::builder()
                .expires_in(Duration::from_secs(3600)) // 1 hour
                .build()
                .map_err(|e| StorageError::S3Error(format!("Failed to create presigning config: {}", e)))?;
                
            let presigned_request = self.client
                .get_object()
                .bucket(&self.bucket)
                .key(&key)
                .presigned(presigning_config)
                .await
                .map_err(|e| StorageError::S3Error(format!("Failed to create presigned URL: {}", e)))?;
                
            Ok(presigned_request.uri().to_string())
        }
    }
}