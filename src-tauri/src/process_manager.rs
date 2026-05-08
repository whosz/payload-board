use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessStatus {
    Running,
    Stopping,
    Stopped,
    Crashed,
}

#[derive(Debug, Clone)]
pub struct ProcessEntry {
    pub pid: u32,
    pub status: ProcessStatus,
    pub exe_name: String,
    pub started_at: Instant,
}

pub type ProcessMap = Arc<Mutex<HashMap<String, ProcessEntry>>>;

#[derive(Serialize, Clone)]
pub struct StatusEvent {
    pub entry_id: String,
    pub pid: Option<u32>,
    pub status: ProcessStatus,
}

pub fn new_process_map() -> ProcessMap {
    Arc::new(Mutex::new(HashMap::new()))
}

pub fn emit_status<R: tauri::Runtime>(
    app: &AppHandle<R>,
    entry_id: &str,
    pid: Option<u32>,
    status: ProcessStatus,
) {
    let _ = app.emit(
        "process_status_changed",
        StatusEvent {
            entry_id: entry_id.to_string(),
            pid,
            status,
        },
    );
}

/// Called every ~1s from the background watcher. Detects crashed processes.
pub fn check_crashed_processes<R: tauri::Runtime>(map: &ProcessMap, app: &AppHandle<R>) {
    use sysinfo::System;

    let candidates: Vec<(String, u32)> = {
        let guard = map.lock().unwrap();
        guard
            .iter()
            .filter(|(_, e)| {
                e.status == ProcessStatus::Running
                    && e.started_at.elapsed().as_secs() >= 3
            })
            .map(|(id, e)| (id.clone(), e.pid))
            .collect()
    };

    if candidates.is_empty() {
        return;
    }

    let sys = System::new_all();

    for (entry_id, pid) in candidates {
        let alive = sys.process(sysinfo::Pid::from(pid as usize)).is_some();
        if !alive {
            {
                let mut guard = map.lock().unwrap();
                if let Some(e) = guard.get_mut(&entry_id) {
                    if e.status == ProcessStatus::Running {
                        e.status = ProcessStatus::Crashed;
                    }
                }
            }
            emit_status(app, &entry_id, None, ProcessStatus::Crashed);
        }
    }
}
