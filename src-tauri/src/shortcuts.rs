//! Configurable keyboard shortcuts. Global ones are registered with the OS (they work with the
//! window hidden or unfocused); window ones are only stored here and matched by the frontend.
//! Accelerators use Tauri's format, with `event.code` key names: `CommandOrControl+Alt+KeyR`.
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

use crate::commands::processes::stop_all_inner;
use crate::process_manager::ProcessMap;
use crate::sequencer::{start_sequence, SequenceMap};
use crate::store::SETTINGS_FILE;

const OVERRIDES_KEY: &str = "shortcuts";
const ENABLED_KEY: &str = "global_shortcuts_enabled";
const END_CONFIRM_WINDOW: Duration = Duration::from_secs(2);

#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Action {
    PaletteGlobal,
    RunSequence,
    EndSession,
    Palette,
    AddApp,
    NewProfile,
    Settings,
}

#[derive(Clone, Copy, PartialEq, Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Scope {
    Global,
    Window,
}

impl Action {
    pub const ALL: [Action; 7] = [
        Action::PaletteGlobal, Action::RunSequence, Action::EndSession,
        Action::Palette, Action::AddApp, Action::NewProfile, Action::Settings,
    ];

    fn key(self) -> &'static str {
        match self {
            Action::PaletteGlobal => "palette_global",
            Action::RunSequence => "run_sequence",
            Action::EndSession => "end_session",
            Action::Palette => "palette",
            Action::AddApp => "add_app",
            Action::NewProfile => "new_profile",
            Action::Settings => "settings",
        }
    }

    pub fn scope(self) -> Scope {
        match self {
            Action::PaletteGlobal | Action::RunSequence | Action::EndSession => Scope::Global,
            _ => Scope::Window,
        }
    }

    pub fn default_accelerator(self) -> &'static str {
        match self {
            Action::PaletteGlobal => "CommandOrControl+Shift+Space",
            Action::RunSequence => "CommandOrControl+Alt+KeyR",
            Action::EndSession => "CommandOrControl+Alt+KeyE",
            Action::Palette => "CommandOrControl+KeyK",
            Action::AddApp => "CommandOrControl+KeyN",
            Action::NewProfile => "CommandOrControl+Shift+KeyN",
            Action::Settings => "CommandOrControl+Comma",
        }
    }
}

/// Runtime state: registration errors, the profile the frontend has active, and the end-session confirmation timer.
#[derive(Default)]
pub struct ShortcutRuntime {
    errors: Mutex<HashMap<Action, String>>,
    active_profile: Mutex<Option<String>>,
    last_end_press: Mutex<Option<Instant>>,
}

#[derive(Serialize, Debug)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ShortcutError {
    /// not a valid accelerator (or a global one without a modifier)
    Invalid,
    /// already used by another action
    Conflict { with: Action },
    /// the OS refused the registration (another app owns it)
    Taken,
}

#[derive(Serialize)]
pub struct ShortcutEntry {
    pub action: Action,
    pub accelerator: Option<String>,
    pub default: String,
    pub scope: Scope,
    /// registration problem for global shortcuts (e.g. taken by another app)
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ShortcutsState {
    pub entries: Vec<ShortcutEntry>,
    pub global_enabled: bool,
}

#[derive(Serialize, Clone)]
struct Feedback {
    message: String,
    kind: &'static str,
}

// ── storage ─────────────────────────────────────────────────────────────────

fn overrides<R: tauri::Runtime>(app: &AppHandle<R>) -> serde_json::Map<String, serde_json::Value> {
    app.store(SETTINGS_FILE)
        .ok()
        .and_then(|s| s.get(OVERRIDES_KEY))
        .and_then(|v| v.as_object().cloned())
        .unwrap_or_default()
}

fn write_overrides<R: tauri::Runtime>(app: &AppHandle<R>, map: serde_json::Map<String, serde_json::Value>) -> Result<(), String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    store.set(OVERRIDES_KEY, serde_json::Value::Object(map));
    store.save().map_err(|e| e.to_string())
}

/// Stored value wins (`null` = cleared); otherwise the default.
fn accelerator_of<R: tauri::Runtime>(app: &AppHandle<R>, action: Action) -> Option<String> {
    match overrides(app).get(action.key()) {
        Some(serde_json::Value::String(s)) => Some(s.clone()),
        Some(_) => None,
        None => Some(action.default_accelerator().to_string()),
    }
}

fn global_enabled<R: tauri::Runtime>(app: &AppHandle<R>) -> bool {
    app.store(SETTINGS_FILE)
        .ok()
        .and_then(|s| s.get(ENABLED_KEY))
        .and_then(|v| v.as_bool())
        .unwrap_or(true)
}

fn parse(accelerator: &str, scope: Scope) -> Result<Shortcut, ShortcutError> {
    let sc = Shortcut::from_str(accelerator).map_err(|_| ShortcutError::Invalid)?;
    if scope == Scope::Global && sc.mods.is_empty() {
        return Err(ShortcutError::Invalid);
    }
    Ok(sc)
}

fn state<R: tauri::Runtime>(app: &AppHandle<R>) -> ShortcutsState {
    let rt = app.state::<ShortcutRuntime>();
    let errors = rt.errors.lock().unwrap();
    ShortcutsState {
        entries: Action::ALL
            .iter()
            .map(|&a| ShortcutEntry {
                action: a,
                accelerator: accelerator_of(app, a),
                default: a.default_accelerator().to_string(),
                scope: a.scope(),
                error: errors.get(&a).cloned(),
            })
            .collect(),
        global_enabled: global_enabled(app),
    }
}

// ── global registration ─────────────────────────────────────────────────────

fn feedback<R: tauri::Runtime>(app: &AppHandle<R>, message: &str, kind: &'static str) {
    let _ = app.emit("shortcut_feedback", Feedback { message: message.to_string(), kind });
}

fn show_main_window<R: tauri::Runtime>(app: &AppHandle<R>) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

fn handle<R: tauri::Runtime>(app: &AppHandle<R>, action: Action) {
    let rt = app.state::<ShortcutRuntime>();
    let profile = rt.active_profile.lock().unwrap().clone();
    match action {
        Action::PaletteGlobal => {
            show_main_window(app);
            let _ = app.emit("shortcut_triggered", serde_json::json!({ "action": "palette" }));
        }
        Action::RunSequence => match profile {
            None => feedback(app, "No active profile", "warn"),
            Some(id) => {
                let (map, seqs) = (app.state::<ProcessMap>(), app.state::<SequenceMap>());
                match start_sequence(app, &map, &seqs, &id) {
                    Ok(()) => feedback(app, "Sequence started", "info"),
                    Err(e) => feedback(app, &e, "warn"),
                }
            }
        },
        Action::EndSession => {
            let Some(id) = profile else { return feedback(app, "No active profile", "warn") };
            let confirmed = {
                let mut last = rt.last_end_press.lock().unwrap();
                let ok = last.is_some_and(|t| t.elapsed() <= END_CONFIRM_WINDOW);
                *last = if ok { None } else { Some(Instant::now()) };
                ok
            };
            if !confirmed {
                return feedback(app, "Press again within 2 s to end the session", "warn");
            }
            feedback(app, "Ending session…", "info");
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                let map = app.state::<ProcessMap>();
                if let Err(e) = stop_all_inner(&app, &map, &id).await {
                    feedback(&app, &e, "error");
                }
            });
        }
        _ => {}
    }
}

/// (Re)registers every enabled global shortcut; failures are kept per action in `ShortcutRuntime`.
pub fn register_all<R: tauri::Runtime>(app: &AppHandle<R>) {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    let rt = app.state::<ShortcutRuntime>();
    let mut errors = rt.errors.lock().unwrap();
    errors.clear();
    if !global_enabled(app) {
        return;
    }
    for action in Action::ALL.into_iter().filter(|a| a.scope() == Scope::Global) {
        let Some(acc) = accelerator_of(app, action) else { continue };
        match parse(&acc, Scope::Global) {
            Err(_) => { errors.insert(action, "Invalid shortcut".into()); }
            Ok(sc) => {
                let result = gs.on_shortcut(sc, move |app, _, event| {
                    if event.state == ShortcutState::Pressed {
                        handle(app, action);
                    }
                });
                if result.is_err() {
                    errors.insert(action, "Taken by another application".into());
                }
            }
        }
    }
}

// ── commands ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_shortcuts<R: tauri::Runtime>(app: AppHandle<R>) -> ShortcutsState {
    state(&app)
}

#[tauri::command]
pub fn set_shortcut<R: tauri::Runtime>(
    app: AppHandle<R>,
    action: Action,
    accelerator: Option<String>,
) -> Result<ShortcutsState, ShortcutError> {
    let mut map = overrides(&app);
    let previous = map.get(action.key()).cloned();

    if let Some(acc) = &accelerator {
        let sc = parse(acc, action.scope())?;
        for other in Action::ALL.into_iter().filter(|&o| o != action) {
            let taken = accelerator_of(&app, other)
                .and_then(|o| parse(&o, other.scope()).ok())
                .is_some_and(|o| o.id() == sc.id());
            if taken {
                return Err(ShortcutError::Conflict { with: other });
            }
        }
    }

    map.insert(action.key().into(), accelerator.map_or(serde_json::Value::Null, serde_json::Value::String));
    write_overrides(&app, map.clone()).map_err(|_| ShortcutError::Invalid)?;

    if action.scope() == Scope::Global {
        register_all(&app);
        if app.state::<ShortcutRuntime>().errors.lock().unwrap().contains_key(&action) {
            // The OS refused it: put the previous binding back.
            match previous {
                Some(v) => map.insert(action.key().into(), v),
                None => map.remove(action.key()),
            };
            let _ = write_overrides(&app, map);
            register_all(&app);
            return Err(ShortcutError::Taken);
        }
    }
    Ok(state(&app))
}

#[tauri::command]
pub fn reset_shortcut<R: tauri::Runtime>(app: AppHandle<R>, action: Action) -> Result<ShortcutsState, String> {
    let mut map = overrides(&app);
    map.remove(action.key());
    write_overrides(&app, map)?;
    if action.scope() == Scope::Global {
        register_all(&app);
    }
    Ok(state(&app))
}

#[tauri::command]
pub fn set_global_shortcuts_enabled<R: tauri::Runtime>(app: AppHandle<R>, enabled: bool) -> Result<ShortcutsState, String> {
    let store = app.store(SETTINGS_FILE).map_err(|e| e.to_string())?;
    store.set(ENABLED_KEY, enabled);
    store.save().map_err(|e| e.to_string())?;
    register_all(&app);
    Ok(state(&app))
}

/// Temporarily unregisters (or restores) the OS-level shortcuts while the Settings screen records a new key combination.
#[tauri::command]
pub fn suspend_global_shortcuts<R: tauri::Runtime>(app: AppHandle<R>, suspended: bool) {
    if suspended {
        let _ = app.global_shortcut().unregister_all();
    } else {
        register_all(&app);
    }
}

/// The frontend tells us which profile is active, so global run/end work with the window hidden.
#[tauri::command]
pub fn set_active_profile(runtime: State<'_, ShortcutRuntime>, profile_id: Option<String>) {
    *runtime.active_profile.lock().unwrap() = profile_id;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_accelerators_parse_are_unique_and_globals_have_modifiers() {
        let mut ids = std::collections::HashSet::new();
        for a in Action::ALL {
            let sc = parse(a.default_accelerator(), a.scope()).unwrap_or_else(|_| panic!("{:?} default invalid", a));
            assert!(ids.insert(sc.id()), "{:?} default collides with another action", a);
        }
    }

    #[test]
    fn global_shortcut_without_modifier_is_invalid() {
        assert!(parse("KeyR", Scope::Global).is_err());
        assert!(parse("KeyR", Scope::Window).is_ok());
        assert!(parse("nonsense+++", Scope::Window).is_err());
    }
}
