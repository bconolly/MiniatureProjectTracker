use sqlx::{Pool, Sqlite, Postgres, migrate::MigrateDatabase, Row};
use std::time::Duration;
use tracing::{info, warn, error};

#[derive(Clone)]
pub enum Database {
    Sqlite(Pool<Sqlite>),
    Postgres(Pool<Postgres>),
}

#[derive(Debug)]
pub struct DatabaseConfig {
    pub max_connections: u32,
    pub acquire_timeout: Duration,
    pub idle_timeout: Option<Duration>,
    pub max_lifetime: Option<Duration>,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            max_connections: 10,
            acquire_timeout: Duration::from_secs(3),
            idle_timeout: Some(Duration::from_secs(600)), // 10 minutes
            max_lifetime: Some(Duration::from_secs(1800)), // 30 minutes
        }
    }
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        Self::new_with_config(database_url, DatabaseConfig::default()).await
    }

    pub async fn new_with_config(database_url: &str, config: DatabaseConfig) -> Result<Self, sqlx::Error> {
        info!("Initializing database connection with URL: {}", 
              database_url.split('@').next().unwrap_or("***"));

        if database_url.starts_with("sqlite:") {
            Self::create_sqlite_pool(database_url, config).await
        } else if database_url.starts_with("postgres://") || database_url.starts_with("postgresql://") {
            Self::create_postgres_pool(database_url, config).await
        } else {
            error!("Unsupported database URL format: {}", database_url);
            Err(sqlx::Error::Configuration("Unsupported database URL format. Use 'sqlite:' or 'postgres://'".into()))
        }
    }

    async fn create_sqlite_pool(database_url: &str, config: DatabaseConfig) -> Result<Self, sqlx::Error> {
        // Create database file if it doesn't exist
        if !Sqlite::database_exists(database_url).await.unwrap_or(false) {
            info!("Creating SQLite database file");
            Sqlite::create_database(database_url).await?;
        }

        let mut pool_options = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(config.max_connections)
            .acquire_timeout(config.acquire_timeout);

        if let Some(idle_timeout) = config.idle_timeout {
            pool_options = pool_options.idle_timeout(idle_timeout);
        }

        if let Some(max_lifetime) = config.max_lifetime {
            pool_options = pool_options.max_lifetime(max_lifetime);
        }

        let pool = pool_options
            .connect(database_url)
            .await?;

        info!("SQLite connection pool created successfully");
        Ok(Database::Sqlite(pool))
    }

    async fn create_postgres_pool(database_url: &str, config: DatabaseConfig) -> Result<Self, sqlx::Error> {
        let mut pool_options = sqlx::postgres::PgPoolOptions::new()
            .max_connections(config.max_connections)
            .acquire_timeout(config.acquire_timeout);

        if let Some(idle_timeout) = config.idle_timeout {
            pool_options = pool_options.idle_timeout(idle_timeout);
        }

        if let Some(max_lifetime) = config.max_lifetime {
            pool_options = pool_options.max_lifetime(max_lifetime);
        }

        let pool = pool_options
            .connect(database_url)
            .await?;

        info!("PostgreSQL connection pool created successfully");
        Ok(Database::Postgres(pool))
    }

    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        info!("Running database migrations");
        match self {
            Database::Sqlite(pool) => {
                sqlx::migrate!("./migrations").run(pool).await?;
            }
            Database::Postgres(pool) => {
                sqlx::migrate!("./migrations").run(pool).await?;
            }
        }
        info!("Database migrations completed successfully");
        Ok(())
    }

    pub async fn health_check(&self) -> Result<(), sqlx::Error> {
        match self {
            Database::Sqlite(pool) => {
                let row = sqlx::query("SELECT 1 as health")
                    .fetch_one(pool)
                    .await?;
                let health: i32 = row.get("health");
                if health == 1 {
                    Ok(())
                } else {
                    Err(sqlx::Error::RowNotFound)
                }
            }
            Database::Postgres(pool) => {
                let row = sqlx::query("SELECT 1 as health")
                    .fetch_one(pool)
                    .await?;
                let health: i32 = row.get("health");
                if health == 1 {
                    Ok(())
                } else {
                    Err(sqlx::Error::RowNotFound)
                }
            }
        }
    }

    pub async fn close(&self) {
        info!("Closing database connection pool");
        match self {
            Database::Sqlite(pool) => pool.close().await,
            Database::Postgres(pool) => pool.close().await,
        }
    }

    pub fn get_sqlite_pool(&self) -> Option<&Pool<Sqlite>> {
        match self {
            Database::Sqlite(pool) => Some(pool),
            _ => None,
        }
    }

    pub fn get_postgres_pool(&self) -> Option<&Pool<Postgres>> {
        match self {
            Database::Postgres(pool) => Some(pool),
            _ => None,
        }
    }
}