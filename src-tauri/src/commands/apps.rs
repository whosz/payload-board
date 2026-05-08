use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::platform::{self, PickedExecutable};

#[tauri::command]
pub async fn pick_executable<R: tauri::Runtime>(
    app: AppHandle<R>,
) -> Result<PickedExecutable, String> {
    let path = app
        .dialog()
        .file()
        .blocking_pick_file()
        .ok_or_else(|| "No file selected".to_string())?;

    let path_buf = path
        .as_path()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_path_buf();

    let adapter = platform::create_adapter();
    let suggested_name = adapter.suggested_name(&path_buf);
    let icon_path = adapter
        .extract_icon(&path_buf)
        .map(|p| p.to_string_lossy().to_string());

    Ok(PickedExecutable {
        path: path_buf.to_string_lossy().to_string(),
        suggested_name,
        icon_path,
    })
}

#[tauri::command]
pub async fn pick_icon_file<R: tauri::Runtime>(app: AppHandle<R>) -> Result<String, String> {
    let path = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "svg", "ico", "bmp", "webp"])
        .blocking_pick_file()
        .ok_or_else(|| "No file selected".to_string())?;

    path.as_path()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn extract_app_icon(exe_path: String) -> Option<String> {
    let path = PathBuf::from(&exe_path);
    let adapter = platform::create_adapter();
    adapter
        .extract_icon(&path)
        .map(|p| p.to_string_lossy().to_string())
}
