//! PDF.cheap desktop shell.
//!
//! Keep native responsibilities here — window management, filesystem access,
//! auto-update — and let the web UI own the PDF experience. Heavy PDF work runs
//! in the webview's engine (WASM); this Rust layer stays thin and fast.

/// Read a user-picked file into bytes. Called after the native open dialog so
/// the webview never needs broad filesystem permissions of its own — Rust owns
/// disk access and hands over just the bytes for the chosen path.
#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Expose the app version to the UI (About panel, update checks).
#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Proxy an Anthropic Messages API request. The frontend builds the full request
/// body and the AI agent loop; this command only injects the API key header so
/// the key never lives in the webview. Set ANTHROPIC_API_KEY in the environment.
#[tauri::command]
async fn ai_message(body: serde_json::Value) -> Result<serde_json::Value, String> {
    let key = std::env::var("ANTHROPIC_API_KEY")
        .map_err(|_| "ANTHROPIC_API_KEY is not set in the app environment.".to_string())?;

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("Anthropic API {status}: {json}"));
    }
    Ok(json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![read_file_bytes, app_version, ai_message])
        .run(tauri::generate_context!())
        .expect("error while running PDF.cheap");
}
