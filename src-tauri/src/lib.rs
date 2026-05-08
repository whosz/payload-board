mod commands;
mod platform;
mod store;

use commands::apps::pick_executable;
use commands::profiles::{delete_profile, list_profiles, save_profile};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_profiles,
            save_profile,
            delete_profile,
            pick_executable,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
