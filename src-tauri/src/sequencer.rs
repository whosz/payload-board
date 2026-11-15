//! Launch sequencer. Runs in Rust (not in the webview) so it keeps going with the
//! window hidden, can be cancelled, and reports progress via `sequence_progress`.
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::commands::processes::start_app_inner;
use crate::process_manager::{emit_error, ProcessMap, ProcessStatus};
use crate::store::{self, AppEntry, Profile};

/// profile_id -> cancel flag of the sequence currently running for that profile.
pub type SequenceMap = Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>;

pub fn new_sequence_map() -> SequenceMap {
    Arc::new(Mutex::new(HashMap::new()))
}

#[derive(Serialize, Clone, Copy, PartialEq, Debug)]
#[serde(rename_all = "snake_case")]
pub enum SequenceState {
    Launching,
    Done,
    Cancelled,
}

#[derive(Serialize, Clone)]
pub struct SequenceProgress {
    pub profile_id: String,
    pub state: SequenceState,
    /// 1-based index of the step being launched (or the last one when done/cancelled)
    pub step: usize,
    pub total: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

fn emit_progress<R: tauri::Runtime>(
    app: &AppHandle<R>,
    profile_id: &str,
    state: SequenceState,
    step: usize,
    total: usize,
    app_id: Option<&str>,
    error: Option<String>,
) {
    let _ = app.emit(
        "sequence_progress",
        SequenceProgress {
            profile_id: profile_id.to_string(),
            state,
            step,
            total,
            app_id: app_id.map(str::to_string),
            error,
        },
    );
}

/// Enabled apps in launch order (`order`; equal orders keep their list order).
pub fn plan(profile: &Profile) -> Vec<&AppEntry> {
    let mut apps: Vec<&AppEntry> = profile.apps.iter().filter(|a| a.enabled).collect();
    apps.sort_by_key(|a| a.order);
    apps
}

/// Sleeps `ms` in short slices so a cancel is noticed quickly. Returns false if cancelled.
async fn cancellable_sleep(ms: u64, cancel: &AtomicBool) -> bool {
    let mut left = ms;
    while left > 0 {
        if cancel.load(Ordering::SeqCst) {
            return false;
        }
        let slice = left.min(100);
        tokio::time::sleep(Duration::from_millis(slice)).await;
        left -= slice;
    }
    !cancel.load(Ordering::SeqCst)
}

async fn execute<R: tauri::Runtime>(
    app: &AppHandle<R>,
    map: &ProcessMap,
    profile: &Profile,
    cancel: &AtomicBool,
) -> (SequenceState, usize) {
    let apps = plan(profile);
    let total = apps.len();

    for (i, entry) in apps.iter().enumerate() {
        let step = i + 1;
        if cancel.load(Ordering::SeqCst) {
            return (SequenceState::Cancelled, i);
        }
        emit_progress(app, &profile.id, SequenceState::Launching, step, total, Some(&entry.id), None);

        let already_running = map
            .lock()
            .unwrap()
            .get(&entry.id)
            .is_some_and(|e| e.status == ProcessStatus::Running);
        if already_running {
            continue;
        }

        if let Err(e) = start_app_inner(app, map, &profile.id, &entry.id).await {
            emit_error(app, &entry.id, e.clone());
            emit_progress(app, &profile.id, SequenceState::Launching, step, total, Some(&entry.id), Some(e));
        }
        if !cancellable_sleep(entry.launch_delay_ms, cancel).await {
            return (SequenceState::Cancelled, step);
        }
    }
    (SequenceState::Done, total)
}

#[tauri::command]
pub async fn run_sequence<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    sequences: State<'_, SequenceMap>,
    profile_id: String,
) -> Result<(), String> {
    let profile = store::load_profiles(&app)
        .into_iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;

    let cancel = Arc::new(AtomicBool::new(false));
    {
        let mut running = sequences.lock().unwrap();
        if running.contains_key(&profile_id) {
            return Err("A sequence is already running for this profile".into());
        }
        running.insert(profile_id.clone(), cancel.clone());
    }

    let map = process_map.inner().clone();
    let seqs = sequences.inner().clone();
    tauri::async_runtime::spawn(async move {
        let total = plan(&profile).len();
        let (state, step) = execute(&app, &map, &profile, &cancel).await;
        seqs.lock().unwrap().remove(&profile.id);
        emit_progress(&app, &profile.id, state, step, total, None, None);
    });
    Ok(())
}

#[tauri::command]
pub fn cancel_sequence(sequences: State<'_, SequenceMap>, profile_id: String) -> Result<(), String> {
    if let Some(flag) = sequences.lock().unwrap().get(&profile_id) {
        flag.store(true, Ordering::SeqCst);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn app(id: &str, order: i32, enabled: bool) -> AppEntry {
        AppEntry {
            id: id.into(), name: id.into(), executable_path: String::new(), args: vec![],
            working_dir: None, launch_delay_ms: 0, wait_strategy: "fire_and_forget".into(),
            wait_seconds: None, icon_cache_path: None, background_url: None, enabled, order,
            requires_elevation: None, priority: None, launch_minimised: None,
        }
    }

    #[test]
    fn plan_skips_disabled_and_sorts_by_order_keeping_ties_stable() {
        let profile = Profile {
            id: "p".into(), name: "p".into(), color_accent: None, emoji: None, description: None,
            apps: vec![app("c", 2, true), app("off", 0, false), app("a", 0, true), app("b", 0, true)],
            created_at: String::new(), updated_at: String::new(),
        };
        let ids: Vec<&str> = plan(&profile).iter().map(|a| a.id.as_str()).collect();
        assert_eq!(ids, ["a", "b", "c"]);
    }

    #[test]
    fn cancellable_sleep_stops_early_when_cancelled() {
        tauri::async_runtime::block_on(async {
            let t = std::time::Instant::now();
            assert!(!cancellable_sleep(5_000, &AtomicBool::new(true)).await);
            assert!(t.elapsed() < Duration::from_millis(500));
            assert!(cancellable_sleep(0, &AtomicBool::new(false)).await);
        });
    }
}
