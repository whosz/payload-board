mod commands;
mod crash;
mod i18n;
mod platform;
mod process_manager;
mod sequencer;
mod shortcuts;
mod store;

use commands::apps::{list_installed_apps, pick_executable, pick_icon_file};
use commands::processes::{open_path, restart_app, scan_running_apps, start_app, stop_all, stop_app};
use commands::profiles::{delete_profile, list_profiles, save_profile};
use commands::settings::{
    get_data_dir, get_minimise_on_close, get_profiles_dir, get_sgdb_key,
    get_start_minimised_to_tray, open_profiles_dir, pick_config_dir, reset_all_data,
    set_minimise_on_close, set_profiles_dir, set_sgdb_key, set_start_minimised_to_tray,
};
use commands::steamgriddb::{sgdb_auto_bg, sgdb_grids, sgdb_search};
use crash::{get_bool_setting, set_bool_setting, RestartState};
use i18n::set_language;
use process_manager::{check_crashed_processes, new_process_map, ProcessMap};
use sequencer::{cancel_sequence, new_sequence_map, run_sequence};
use shortcuts::{get_shortcuts, register_all, reset_shortcut, set_active_profile, set_global_shortcuts_enabled, set_shortcut, suspend_global_shortcuts, ShortcutRuntime};
use store::SETTINGS_FILE;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let process_map = new_process_map();

    tauri::Builder::default()
        .manage(process_map)
        .manage(new_sequence_map())
        .manage(ShortcutRuntime::default())
        .manage(RestartState::default())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // ── Crash watcher ────────────────────────────────────────────────
            let map = app.state::<ProcessMap>().inner().clone();
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                    for id in check_crashed_processes(&map, &handle) {
                        crash::on_crash(&handle, &id);
                    }
                    crash::tick(&handle, &map);
                }
            });

            // ── System tray ──────────────────────────────────────────────────
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};

            let show = MenuItem::with_id(app, "show", "Show Payload Board", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Payload Board")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // ── Start minimised to tray ──────────────────────────────────────
            let start_minimised = app.handle().store(SETTINGS_FILE)
                .ok()
                .and_then(|s| s.get("start_minimised_to_tray"))
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            if start_minimised {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            // ── Minimise on close ────────────────────────────────────────────
            let app_handle_close = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        let minimise_on_close = app_handle_close.store(SETTINGS_FILE)
                            .ok()
                            .and_then(|s| s.get("minimise_on_close"))
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);
                        if minimise_on_close {
                            api.prevent_close();
                            if let Some(w) = app_handle_close.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                    }
                });
            }

            // ── Global shortcuts (from stored settings) ─────────────────────
            register_all(app.handle());

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
            run_sequence,
            cancel_sequence,
            get_shortcuts,
            set_shortcut,
            reset_shortcut,
            set_global_shortcuts_enabled,
            set_active_profile,
            suspend_global_shortcuts,
            get_bool_setting,
            set_bool_setting,
            set_language,
            scan_running_apps,
            get_data_dir,
            get_profiles_dir,
            pick_config_dir,
            set_profiles_dir,
            reset_all_data,
            open_profiles_dir,
            get_sgdb_key,
            set_sgdb_key,
            get_start_minimised_to_tray,
            set_start_minimised_to_tray,
            get_minimise_on_close,
            set_minimise_on_close,
            sgdb_search,
            sgdb_grids,
            sgdb_auto_bg,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn show_main_window<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
