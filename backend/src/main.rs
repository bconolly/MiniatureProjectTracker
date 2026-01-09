use axum::{
    routing::{get, post, put, delete},
    Router,
    response::Json,
    http::StatusCode,
    middleware,
};
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::net::SocketAddr;

mod config;
mod database;
mod error;
mod handlers;
mod repositories;
mod services;
mod storage;

#[cfg(test)]
mod tests;

#[cfg(test)]
mod integration_tests;

use config::Config;
use database::Database;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing with structured logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "miniature_painting_tracker_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize database
    let database = Database::new(&config.database_url).await?;
    
    // Run migrations
    database.migrate().await?;

    // Perform initial health check
    database.health_check().await.map_err(|e| {
        tracing::error!("Database health check failed: {}", e);
        e
    })?;
    tracing::info!("Database health check passed");

    // Build our application with routes and middleware
    let app = Router::new()
        .route("/", get(health_check))
        .route("/api/projects", get(handlers::projects::list_projects))
        .route("/api/projects", post(handlers::projects::create_project))
        .route("/api/projects/:id", get(handlers::projects::get_project))
        .route("/api/projects/:id", put(handlers::projects::update_project))
        .route("/api/projects/:id", delete(handlers::projects::delete_project))
        .route("/api/projects/:id/miniatures", get(handlers::miniatures::list_miniatures))
        .route("/api/projects/:id/miniatures", post(handlers::miniatures::create_miniature))
        .route("/api/miniatures/:id", get(handlers::miniatures::get_miniature))
        .route("/api/miniatures/:id", put(handlers::miniatures::update_miniature))
        .route("/api/miniatures/:id", delete(handlers::miniatures::delete_miniature))
        .route("/api/recipes", get(handlers::recipes::list_recipes))
        .route("/api/recipes", post(handlers::recipes::create_recipe))
        .route("/api/recipes/:id", get(handlers::recipes::get_recipe))
        .route("/api/recipes/:id", put(handlers::recipes::update_recipe))
        .route("/api/recipes/:id", delete(handlers::recipes::delete_recipe))
        .route("/api/miniatures/:id/photos", post(handlers::photos::upload_photo))
        .route("/api/miniatures/:id/photos", get(handlers::photos::list_photos))
        .route("/api/photos/:id", delete(handlers::photos::delete_photo))
        .layer(
            ServiceBuilder::new()
                // Add request ID for tracing
                .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
                .layer(PropagateRequestIdLayer::x_request_id())
                // Add tracing
                .layer(TraceLayer::new_for_http())
                // Add CORS
                .layer(CorsLayer::permissive())
        )
        .with_state(database);

    // Run the server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check(
    axum::extract::State(database): axum::extract::State<Database>
) -> Result<Json<serde_json::Value>, StatusCode> {
    match database.health_check().await {
        Ok(_) => Ok(Json(serde_json::json!({
            "status": "healthy",
            "service": "miniature-painting-tracker",
            "database": "connected"
        }))),
        Err(_) => {
            tracing::error!("Health check failed: database connection error");
            Err(StatusCode::SERVICE_UNAVAILABLE)
        }
    }
}