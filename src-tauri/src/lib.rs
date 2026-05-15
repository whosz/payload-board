mod commands;
mod platform;
mod process_manager;
mod store;

use commands::apps::{list_installed_apps, pick_executable, pick_icon_file};
use commands::processes::{open_path, restart_app, scan_running_apps, start_app, stop_all, stop_app};
use commands::profiles::{delete_profile, list_profiles, save_profile};
use commands::settings::{
    get_data_dir, get_profiles_dir, get_sgdb_key, open_profiles_dir, pick_config_dir,
    reset_all_data, set_profiles_dir, set_sgdb_key,
};
use commands::steamgriddb::{sgdb_auto_bg, sgdb_grids, sgdb_search};
use process_manager::{check_crashed_processes, new_process_map, ProcessMap};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let process_map = new_process_map();

    tauri::Builder::default()
        .manage(process_map)
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let map = app.state::<ProcessMap>().inner().clone();
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    check_crashed_processes(&map, &handle);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_profiles,
            save_profile,
            delete_profile,
            pick_executable,
            pick_icon_file,
            list_installed_apps,
            start_app,
            stop_app,
            restart_app,
            open_path,
            stop_all,
            scan_running_apps,
            get_data_dir,
            get_profiles_dir,
            pick_config_dir,
            set_profiles_dir,
            reset_all_data,
            open_profiles_dir,
            get_sgdb_key,
            set_sgdb_key,
            sgdb_search,
            sgdb_grids,
            sgdb_auto_bg,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
