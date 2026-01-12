use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub storage_type: StorageType,
    pub aws_region: Option<String>,
    pub s3_bucket: Option<String>,
    pub local_storage_path: Option<String>,
}

#[derive(Debug, Clone)]
pub enum StorageType {
    Local,
    S3,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        dotenvy::dotenv().ok(); // Load .env file if it exists

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./miniature_tracker.db".to_string());

        let port = env::var("PORT")
            .unwrap_or_else(|_| "3000".to_string())
            .parse::<u16>()?;

        let storage_type = match env::var("STORAGE_TYPE").as_deref() {
            Ok("s3") => StorageType::S3,
            _ => StorageType::Local,
        };

        let aws_region = env::var("AWS_REGION").ok();
        let s3_bucket = env::var("S3_BUCKET").ok();
        let local_storage_path = env::var("LOCAL_STORAGE_PATH")
            .ok()
            .or_else(|| Some("./uploads".to_string()));

        Ok(Config {
            database_url,
            port,
            storage_type,
            aws_region,
            s3_bucket,
            local_storage_path,
        })
    }
}
