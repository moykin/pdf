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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![read_file_bytes, app_version])
        .run(tauri::generate_context!())
        .expect("error while running PDF.cheap");
}
