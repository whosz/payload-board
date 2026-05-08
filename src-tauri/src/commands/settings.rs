use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use crate::store;

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
