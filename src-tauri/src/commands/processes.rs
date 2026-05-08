use std::path::Path;
use std::time::{Duration, Instant};
use tauri::{AppHandle, State};

use crate::platform;
use crate::process_manager::{emit_status, ProcessEntry, ProcessMap, ProcessStatus};
use crate::store;

// ── start_app ────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn start_app<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    profile_id: String,
    entry_id: String,
) -> Result<(), String> {
    let profiles = store::load_profiles(&app);
    let profile = profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;
    let entry = profile
        .apps
        .iter()
        .find(|a| a.id == entry_id)
        .ok_or("App entry not found")?;

    let exe = entry.executable_path.clone();
    let args = entry.args.clone();
    let working_dir = entry.working_dir.clone();

    let mut cmd = std::process::Command::new(&exe);
    cmd.args(&args);
    if let Some(dir) = &working_dir {
        cmd.current_dir(dir);
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn '{}': {}", exe, e))?;
    let initial_pid = child.id();
    std::mem::forget(child);

    let exe_name = Path::new(&exe)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    {
        let mut map = process_map.lock().unwrap();
        map.insert(
            entry_id.clone(),
            ProcessEntry {
                pid: initial_pid,
                status: ProcessStatus::Running,
                exe_name: exe_name.clone(),
                started_at: Instant::now(),
            },
        );
    }

    emit_status(&app, &entry_id, Some(initial_pid), ProcessStatus::Running);

    // PID re-adoption task (handles launchers like Steam that re-exec themselves)
    let map_clone = (*process_map).clone();
    let app_clone = app.clone();
    let entry_id_clone = entry_id.clone();
    tauri::async_runtime::spawn(async move {
        readopt_pid(map_clone, app_clone, entry_id_clone, initial_pid, exe_name).await;
    });

    Ok(())
}

async fn readopt_pid<R: tauri::Runtime>(
    process_map: ProcessMap,
    app: AppHandle<R>,
    entry_id: String,
    initial_pid: u32,
    exe_name: String,
) {
    use sysinfo::System;

    for _ in 0..20u8 {
        tokio::time::sleep(Duration::from_millis(500)).await;

        let sys = System::new_all();
        let initial_alive = sys.process(sysinfo::Pid::from(initial_pid as usize)).is_some();

        if !initial_alive {
            // Initial launcher died — look for a re-spawned process with same exe name
            for (pid, proc) in sys.processes() {
                let name = proc.name().to_string_lossy().to_lowercase();
                let name = name.trim_end_matches(".exe");
                if name == exe_name || name.contains(&exe_name) {
                    let new_pid = pid.as_u32();
                    if new_pid != initial_pid {
                        let mut map = process_map.lock().unwrap();
                        if let Some(e) = map.get_mut(&entry_id) {
                            if e.status == ProcessStatus::Running {
                                e.pid = new_pid;
                                emit_status(&app, &entry_id, Some(new_pid), ProcessStatus::Running);
                            }
                        }
                        return;
                    }
                }
            }
            break;
        }
    }
}

// ── stop_app ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn stop_app<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    entry_id: String,
    force: bool,
) -> Result<(), String> {
    let pid = {
        let mut map = process_map.lock().unwrap();
        let entry = map
            .get_mut(&entry_id)
            .ok_or("Process not found in state")?;
        if entry.status == ProcessStatus::Stopped {
            return Ok(());
        }
        entry.status = ProcessStatus::Stopping;
        entry.pid
    };

    let adapter = platform::create_adapter();

    if force {
        adapter.kill_tree(pid);
    } else {
        adapter.graceful_close(pid);
        if !wait_for_death(pid, Duration::from_secs(5)).await {
            adapter.kill_tree(pid);
        }
    }

    {
        let mut map = process_map.lock().unwrap();
        if let Some(e) = map.get_mut(&entry_id) {
            e.status = ProcessStatus::Stopped;
        }
    }

    emit_status(&app, &entry_id, None, ProcessStatus::Stopped);
    Ok(())
}

async fn wait_for_death(pid: u32, timeout: Duration) -> bool {
    use sysinfo::System;
    let start = std::time::Instant::now();
    while start.elapsed() < timeout {
        tokio::time::sleep(Duration::from_millis(250)).await;
        let sys = System::new_all();
        if sys.process(sysinfo::Pid::from(pid as usize)).is_none() {
            return true;
        }
    }
    false
}

// ── restart_app ───────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn restart_app<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    profile_id: String,
    entry_id: String,
) -> Result<(), String> {
    // Stop first
    let pid = {
        let mut map = process_map.lock().unwrap();
        match map.get_mut(&entry_id) {
            Some(e) if e.status == ProcessStatus::Running || e.status == ProcessStatus::Crashed => {
                e.status = ProcessStatus::Stopping;
                Some(e.pid)
            }
            _ => None,
        }
    };

    if let Some(pid) = pid {
        let adapter = platform::create_adapter();
        adapter.graceful_close(pid);
        if !wait_for_death(pid, Duration::from_secs(5)).await {
            adapter.kill_tree(pid);
        }
        {
            let mut map = process_map.lock().unwrap();
            if let Some(e) = map.get_mut(&entry_id) {
                e.status = ProcessStatus::Stopped;
            }
        }
        emit_status(&app, &entry_id, None, ProcessStatus::Stopped);
    }

    // Start fresh
    let profiles = store::load_profiles(&app);
    let profile = profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;
    let entry = profile
        .apps
        .iter()
        .find(|a| a.id == entry_id)
        .ok_or("App entry not found")?;

    let exe = entry.executable_path.clone();
    let args = entry.args.clone();
    let working_dir = entry.working_dir.clone();

    let mut cmd = std::process::Command::new(&exe);
    cmd.args(&args);
    if let Some(dir) = &working_dir {
        cmd.current_dir(dir);
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to respawn '{}': {}", exe, e))?;
    let new_pid = child.id();
    std::mem::forget(child);

    let exe_name = Path::new(&exe)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    {
        let mut map = process_map.lock().unwrap();
        map.insert(
            entry_id.clone(),
            ProcessEntry {
                pid: new_pid,
                status: ProcessStatus::Running,
                exe_name,
                started_at: Instant::now(),
            },
        );
    }

    emit_status(&app, &entry_id, Some(new_pid), ProcessStatus::Running);
    Ok(())
}

// ── open_path ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn open_path<R: tauri::Runtime>(
    app: AppHandle<R>,
    profile_id: String,
    entry_id: String,
) -> Result<(), String> {
    let profiles = store::load_profiles(&app);
    let profile = profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;
    let entry = profile
        .apps
        .iter()
        .find(|a| a.id == entry_id)
        .ok_or("App entry not found")?;

    let exe_path = Path::new(&entry.executable_path);
    platform::create_adapter().open_path(exe_path)
}

// ── stop_all ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn stop_all<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    profile_id: String,
) -> Result<(), String> {
    let profiles = store::load_profiles(&app);
    let profile = profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;

    let entry_ids: Vec<String> = profile.apps.iter().map(|a| a.id.clone()).collect();
    let adapter = platform::create_adapter();

    // Collect PIDs and mark Stopping
    let to_kill: Vec<(String, u32)> = {
        let mut map = process_map.lock().unwrap();
        entry_ids
            .iter()
            .filter_map(|id| {
                let e = map.get_mut(id)?;
                if e.status == ProcessStatus::Running || e.status == ProcessStatus::Crashed {
                    e.status = ProcessStatus::Stopping;
                    Some((id.clone(), e.pid))
                } else {
                    None
                }
            })
            .collect()
    };

    // Graceful shutdown all at once, then wait, then kill survivors
    for (_, pid) in &to_kill {
        adapter.graceful_close(*pid);
    }

    tokio::time::sleep(Duration::from_secs(5)).await;

    use sysinfo::System;
    let sys = System::new_all();
    for (_, pid) in &to_kill {
        if sys.process(sysinfo::Pid::from(*pid as usize)).is_some() {
            adapter.kill_tree(*pid);
        }
    }

    {
        let mut map = process_map.lock().unwrap();
        for (id, _) in &to_kill {
            if let Some(e) = map.get_mut(id) {
                e.status = ProcessStatus::Stopped;
            }
        }
    }

    for (id, _) in &to_kill {
        emit_status(&app, id, None, ProcessStatus::Stopped);
    }

    Ok(())
}
