//! PDF.cheap conversion + OCR microservice.
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
        .route("/ai", post(ai))
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

/// POST /ai — proxy an Anthropic Messages API request for the *web* build (the
/// desktop app proxies through the Tauri `ai_message` command instead). Injects
/// ANTHROPIC_API_KEY server-side so the key never reaches the browser.
async fn ai(Json(body): Json<serde_json::Value>) -> impl IntoResponse {
    let key = match std::env::var("ANTHROPIC_API_KEY") {
        Ok(k) => k,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "ANTHROPIC_API_KEY not set on the server" })),
            )
                .into_response();
        }
    };

    let client = reqwest::Client::new();
    let sent = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await;

    match sent {
        Ok(resp) => {
            let status = StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::OK);
            match resp.json::<serde_json::Value>().await {
                Ok(j) => (status, Json(j)).into_response(),
                Err(e) => {
                    (StatusCode::BAD_GATEWAY, Json(json!({ "error": e.to_string() }))).into_response()
                }
            }
        }
        Err(e) => {
            (StatusCode::BAD_GATEWAY, Json(json!({ "error": e.to_string() }))).into_response()
        }
    }
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
