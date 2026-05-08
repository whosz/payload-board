use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_store::StoreExt;
use crate::store::{self, SETTINGS_FILE};

#[tauri::command]
pub fn get_data_dir<R: tauri::Runtime>(app: AppHandle<R>) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_profiles_dir<R: tauri::Runtime>(app: AppHandle<R>) -> String {
    store::current_profiles_dir(&app)
}

#[tauri::command]
pub async fn pick_config_dir<R: tauri::Runtime>(app: AppHandle<R>) -> Option<String> {
    app.dialog()
        .file()
        .blocking_pick_folder()
        .and_then(|p| p.as_path().map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn set_profiles_dir<R: tauri::Runtime>(
    app: AppHandle<R>,
    dir: Option<String>,
) -> Result<(), String> {
    let profiles = store::load_profiles(&app);
    store::update_custom_profiles_dir(&app, dir)?;
    store::save_profiles(&app, &profiles)
}

#[tauri::command]
pub async fn reset_all_data<R: tauri::Runtime>(app: AppHandle<R>) -> Result<(), String> {
    store::save_profiles(&app, &[])
}

#[tauri::command]
pub fn open_profiles_dir<R: tauri::Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let dir_str = store::current_profiles_dir(&app);
    let dir = std::path::Path::new(&dir_str);
    open_in_file_manager(dir)
}

#[tauri::command]
pub fn get_sgdb_key<R: tauri::Runtime>(app: AppHandle<R>) -> Option<String> {
    let store = app.store(SETTINGS_FILE).ok()?;
    store.get("sgdb_api_key").and_then(|v| v.as_str().map(|s| s.to_string()))
}

#[tauri::command]
pub fn set_sgdb_key<R: tauri::Runtime>(app: AppHandle<R>, key: Option<String>) -> Result<(), String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    match key {
        Some(k) => store.set("sgdb_api_key", k),
        None => { store.delete("sgdb_api_key"); }
    }
    store.save().map_err(|e| e.to_string())
}

fn open_in_file_manager(dir: &std::path::Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
