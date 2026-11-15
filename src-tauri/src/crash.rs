//! Crash handling: system notification when the window isn't in front, optional auto-restart with a retry limit.
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

use crate::commands::processes::start_app_inner;
use crate::i18n::{fmt, tr};
use crate::process_manager::{emit_error, ProcessMap, ProcessStatus};
use crate::store::{self, AppEntry, SETTINGS_FILE};

const RESTART_DELAY: Duration = Duration::from_secs(2);
/// An app that stays up this long gets its retry budget back.
const STABLE_AFTER: Duration = Duration::from_secs(60);
const DEFAULT_RETRIES: u32 = 3;
/// Boolean settings the frontend may read/write (both default to on).
const BOOL_SETTINGS: [&str; 2] = ["notify_on_crash", "auto_restart_enabled"];

/// entry_id -> restart attempts used since the app last ran stably
#[derive(Default)]
pub struct RestartState(Mutex<HashMap<String, u32>>);

impl RestartState {
    /// A manual start gives the app a fresh retry budget.
    pub fn reset(&self, entry_id: &str) {
        self.0.lock().unwrap().remove(entry_id);
    }
}

#[derive(Debug, PartialEq)]
enum Decision {
    Restart(u32),
    GiveUp(u32),
    Nothing,
}

fn decide(global: bool, per_app: Option<bool>, attempts: u32, max: Option<u32>) -> Decision {
    if !global || per_app != Some(true) {
        return Decision::Nothing;
    }
    let max = max.unwrap_or(DEFAULT_RETRIES).clamp(1, 10);
    if attempts < max { Decision::Restart(attempts + 1) } else { Decision::GiveUp(max) }
}

fn bool_setting<R: tauri::Runtime>(app: &AppHandle<R>, key: &str) -> bool {
    app.store(SETTINGS_FILE).ok().and_then(|s| s.get(key)).and_then(|v| v.as_bool()).unwrap_or(true)
}

/// True when the main window is visible and focused (then the UI already shows what happened).
pub fn window_in_front<R: tauri::Runtime>(app: &AppHandle<R>) -> bool {
    app.get_webview_window("main")
        .map(|w| w.is_visible().unwrap_or(false) && w.is_focused().unwrap_or(false))
        .unwrap_or(false)
}

pub fn notify<R: tauri::Runtime>(app: &AppHandle<R>, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

fn find_entry<R: tauri::Runtime>(app: &AppHandle<R>, entry_id: &str) -> Option<(String, AppEntry)> {
    store::load_profiles(app).into_iter().find_map(|p| {
        let id = p.id.clone();
        p.apps.into_iter().find(|a| a.id == entry_id).map(|a| (id, a))
    })
}

/// Called by the watcher for every app that just crashed.
pub fn on_crash<R: tauri::Runtime>(app: &AppHandle<R>, entry_id: &str) {
    let Some((profile_id, entry)) = find_entry(app, entry_id) else { return };
    let state = app.state::<RestartState>();
    let attempts = state.0.lock().unwrap().get(entry_id).copied().unwrap_or(0);
    let tell = bool_setting(app, "notify_on_crash") && !window_in_front(app);
    let name = &entry.name;

    match decide(bool_setting(app, "auto_restart_enabled"), entry.restart_on_crash, attempts, entry.max_retries) {
        Decision::Restart(n) => {
            state.0.lock().unwrap().insert(entry_id.to_string(), n);
            if tell { notify(app, &fmt("{name} crashed", &[("name", name)]), &fmt("Restarting it (attempt {n})", &[("n", &n.to_string())])); }
            let (app, map) = (app.clone(), app.state::<ProcessMap>().inner().clone());
            let entry_id = entry_id.to_string();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(RESTART_DELAY).await;
                let still_crashed = map.lock().unwrap().get(&entry_id).is_some_and(|e| e.status == ProcessStatus::Crashed);
                if !still_crashed { return; } // the user already dealt with it
                if let Err(e) = start_app_inner(&app, &map, &profile_id, &entry_id).await {
                    emit_error(&app, &entry_id, e);
                }
            });
        }
        Decision::GiveUp(max) => {
            if tell { notify(app, &fmt("{name} keeps crashing", &[("name", name)]), &fmt("Gave up after {max} restarts", &[("max", &max.to_string())])); }
        }
        Decision::Nothing => {
            if tell { notify(app, &fmt("{name} crashed", &[("name", name)]), &tr("Open Payload Board to restart it")); }
        }
    }
}

/// Called every second: apps that have been running stably get their retry budget back.
pub fn tick<R: tauri::Runtime>(app: &AppHandle<R>, map: &ProcessMap) {
    let stable: Vec<String> = map
        .lock()
        .unwrap()
        .iter()
        .filter(|(_, e)| e.status == ProcessStatus::Running && e.started_at.elapsed() >= STABLE_AFTER)
        .map(|(id, _)| id.clone())
        .collect();
    if stable.is_empty() { return; }
    let state = app.state::<RestartState>();
    let mut counts = state.0.lock().unwrap();
    for id in stable { counts.remove(&id); }
}

#[tauri::command]
pub fn get_bool_setting<R: tauri::Runtime>(app: AppHandle<R>, key: String) -> Result<bool, String> {
    if !BOOL_SETTINGS.contains(&key.as_str()) { return Err("Unknown setting".into()); }
    Ok(bool_setting(&app, &key))
}

#[tauri::command]
pub fn set_bool_setting<R: tauri::Runtime>(app: AppHandle<R>, key: String, value: bool) -> Result<(), String> {
    if !BOOL_SETTINGS.contains(&key.as_str()) { return Err("Unknown setting".into()); }
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    store.set(key, value);
    store.save().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn restart_policy() {
        assert_eq!(decide(true, Some(true), 0, None), Decision::Restart(1));
        assert_eq!(decide(true, Some(true), 2, None), Decision::Restart(3));
        assert_eq!(decide(true, Some(true), 3, None), Decision::GiveUp(3));
        assert_eq!(decide(true, Some(true), 1, Some(1)), Decision::GiveUp(1));
        assert_eq!(decide(true, Some(true), 9, Some(99)), Decision::Restart(10)); // clamped to 10
        assert_eq!(decide(false, Some(true), 0, None), Decision::Nothing); // global switch off
        assert_eq!(decide(true, None, 0, None), Decision::Nothing); // per-app off
        assert_eq!(decide(true, Some(false), 0, Some(5)), Decision::Nothing);
    }
}
