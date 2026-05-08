use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

pub const STORE_FILE: &str = "payload-board.json";
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
    pub enabled: bool,
    pub order: i32,
    pub requires_elevation: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub color_accent: Option<String>,
    pub apps: Vec<AppEntry>,
    pub created_at: String,
    pub updated_at: String,
}

pub fn load_profiles<R: tauri::Runtime>(app: &AppHandle<R>) -> Vec<Profile> {
    let Ok(store) = app.store(STORE_FILE) else {
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
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let value = serde_json::to_value(profiles).map_err(|e| e.to_string())?;
    store.set(PROFILES_KEY, value);
    store.save().map_err(|e| e.to_string())
}
