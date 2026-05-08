use tauri::AppHandle;
use crate::store::{self, Profile};

#[tauri::command]
pub async fn list_profiles<R: tauri::Runtime>(app: AppHandle<R>) -> Vec<Profile> {
    store::load_profiles(&app)
}

#[tauri::command]
pub async fn save_profile<R: tauri::Runtime>(
    app: AppHandle<R>,
    profile: Profile,
) -> Result<(), String> {
    let mut profiles = store::load_profiles(&app);
    if let Some(pos) = profiles.iter().position(|p| p.id == profile.id) {
        profiles[pos] = profile;
    } else {
        profiles.push(profile);
    }
    store::save_profiles(&app, &profiles)
}

#[tauri::command]
pub async fn delete_profile<R: tauri::Runtime>(
    app: AppHandle<R>,
    id: String,
) -> Result<(), String> {
    let mut profiles = store::load_profiles(&app);
    profiles.retain(|p| p.id != id);
    store::save_profiles(&app, &profiles)
}
