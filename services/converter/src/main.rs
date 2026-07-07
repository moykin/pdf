//! MyFreePDF conversion + OCR microservice.
//!
//! Heavy, non-interactive PDF work that does NOT belong in the WASM client:
//!   * Office <-> PDF conversion (Word/Excel/PPT ↔ PDF)
//!   * PDF -> Word/Excel/PPT/Text/Image
//!   * OCR of scanned pages
//!
//! In production these are backed by the commercial SDK's conversion module or
//! by LibreOffice-headless + Tesseract (see Dockerfile). This scaffold exposes
//! the HTTP contract and returns 501 for the not-yet-wired operations so the
//! frontend can integrate against a stable API today.

use axum::{
    extract::DefaultBodyLimit,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/health", get(health))
        .route("/convert", post(convert))
        .route("/ocr", post(ocr))
        .layer(CorsLayer::permissive())
        // Allow large PDFs (100 MB) through multipart uploads.
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024));

    let port = std::env::var("PORT").unwrap_or_else(|_| "8787".to_string());
    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("failed to bind converter port");

    tracing::info!("converter listening on http://{addr}");
    axum::serve(listener, app)
        .await
        .expect("converter server error");
}

async fn health() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "converter",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

/// POST /convert — body: multipart(file, target). Target ∈ docx|xlsx|pptx|txt|png|jpeg
/// or "pdf" for the reverse direction. Returns the converted file bytes.
async fn convert() -> impl IntoResponse {
    not_implemented("convert", "Wire up the SDK conversion module or LibreOffice-headless here.")
}

/// POST /ocr — body: multipart(file, lang). Returns a searchable PDF or extracted text.
async fn ocr() -> impl IntoResponse {
    not_implemented("ocr", "Wire up the SDK OCR module or Tesseract here.")
}

fn not_implemented(op: &str, hint: &str) -> impl IntoResponse {
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(json!({
            "error": "not_implemented",
            "operation": op,
            "message": hint,
        })),
    )
}
