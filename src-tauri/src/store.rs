use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

pub const STORE_FILE: &str = "payload-board.json";
pub const SETTINGS_FILE: &str = "payload-board-settings.json";
pub const PROFILES_KEY: &str = "profiles";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppEntry {
    pub id: String,
    pub name: String,
    pub executable_path: String,
    pub args: Vec<String>,
    pub working_dir: Option<String>,
    pub launch_delay_ms: u64,
    pub wait_strategy: String,
    pub wait_seconds: Option<u64>,
    pub icon_cache_path: Option<String>,
    pub background_url: Option<String>,
    pub enabled: bool,
    pub order: i32,
    pub requires_elevation: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub color_accent: Option<String>,
    pub emoji: Option<String>,
    pub description: Option<String>,
    pub apps: Vec<AppEntry>,
    pub created_at: String,
    pub updated_at: String,
}

fn custom_profiles_dir<R: tauri::Runtime>(app: &AppHandle<R>) -> Option<String> {
    let store = app.store(SETTINGS_FILE).ok()?;
    store
        .get("custom_profiles_dir")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

fn effective_store_path<R: tauri::Runtime>(app: &AppHandle<R>) -> String {
    if let Some(dir) = custom_profiles_dir(app) {
        let dir = dir.trim_end_matches('/').trim_end_matches('\\');
        format!("{}/payload-board.json", dir)
    } else {
        STORE_FILE.to_string()
    }
}

/// Returns the directory where profiles are currently stored (for display in UI).
pub fn current_profiles_dir<R: tauri::Runtime>(app: &AppHandle<R>) -> String {
    custom_profiles_dir(app).unwrap_or_else(|| {
        app.path()
            .app_data_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| "unknown".to_string())
    })
}

pub fn load_profiles<R: tauri::Runtime>(app: &AppHandle<R>) -> Vec<Profile> {
    let path = effective_store_path(app);
    let Ok(store) = app.store(&path) else {
        return Vec::new();
    };
    store
        .get(PROFILES_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

pub fn save_profiles<R: tauri::Runtime>(
    app: &AppHandle<R>,
    profiles: &[Profile],
) -> Result<(), String> {
    let path = effective_store_path(app);
    let store = app.store(&path).map_err(|e| e.to_string())?;
    let value = serde_json::to_value(profiles).map_err(|e| e.to_string())?;
    store.set(PROFILES_KEY, value);
    store.save().map_err(|e| e.to_string())
}

pub fn update_custom_profiles_dir<R: tauri::Runtime>(
    app: &AppHandle<R>,
    dir: Option<String>,
) -> Result<(), String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    match dir {
        Some(d) => store.set("custom_profiles_dir", serde_json::Value::String(d)),
        None => {
            store.delete("custom_profiles_dir");
        }
    }
    store.save().map_err(|e| e.to_string())
}
