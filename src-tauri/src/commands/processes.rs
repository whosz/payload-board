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
    start_app_inner(&app, &process_map, &profile_id, &entry_id).await
}

/// Shared by the `start_app` command and the sequencer (which has no `State`).
pub async fn start_app_inner<R: tauri::Runtime>(
    app: &AppHandle<R>,
    process_map: &ProcessMap,
    profile_id: &str,
    entry_id: &str,
) -> Result<(), String> {
    let profiles = store::load_profiles(app);
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
    let priority = entry.priority.clone();
    let launch_minimised = entry.launch_minimised.unwrap_or(false);

    let exe_name = Path::new(&exe)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    // If the process is already running on the system, adopt it instead of double-launching
    {
        use sysinfo::System;
        let sys = System::new_all();
        for (pid, proc) in sys.processes() {
            let name = proc.name().to_string_lossy().to_lowercase();
            let name = name.trim_end_matches(".exe");
            if name == exe_name {
                let existing_pid = pid.as_u32();
                let mut map = process_map.lock().unwrap();
                map.insert(
                    entry_id.to_string(),
                    ProcessEntry {
                        pid: existing_pid,
                        status: ProcessStatus::Running,
                        exe_name: exe_name.clone(),
                        started_at: Instant::now(),
                    },
                );
                drop(map);
                emit_status(app, entry_id, Some(existing_pid), ProcessStatus::Running);
                return Ok(());
            }
        }
    }

    let initial_pid = if launch_minimised {
        spawn_minimised(&exe, &args, working_dir.as_deref())?
    } else {
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
        let pid = child.id();
        std::mem::forget(child);
        pid
    };

    if let Some(ref p) = priority {
        apply_priority(initial_pid, p);
    }

    {
        let mut map = process_map.lock().unwrap();
        map.insert(
            entry_id.to_string(),
            ProcessEntry {
                pid: initial_pid,
                status: ProcessStatus::Running,
                exe_name: exe_name.clone(),
                started_at: Instant::now(),
            },
        );
    }

    emit_status(app, entry_id, Some(initial_pid), ProcessStatus::Running);

    // PID re-adoption task (handles launchers like Steam that re-exec themselves)
    let map_clone = process_map.clone();
    let app_clone = app.clone();
    let entry_id_clone = entry_id.to_string();
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

// ── scan_running_apps ─────────────────────────────────────────────────────────

/// Check all apps in a profile against currently running OS processes.
/// For each match found, adopt the PID into the process map so the tile shows Running.
/// Called when a profile is selected, so externally-launched apps are reflected immediately.
#[tauri::command]
pub async fn scan_running_apps<R: tauri::Runtime>(
    app: AppHandle<R>,
    process_map: State<'_, ProcessMap>,
    profile_id: String,
) -> Result<(), String> {
    use sysinfo::System;

    let profiles = store::load_profiles(&app);
    let profile = profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("Profile not found")?;

    let sys = System::new_all();

    for entry in &profile.apps {
        // Skip entries already tracked as running
        {
            let map = process_map.lock().unwrap();
            if let Some(e) = map.get(&entry.id) {
                if e.status == ProcessStatus::Running {
                    continue;
                }
            }
        }

        let exe_name = Path::new(&entry.executable_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();

        if exe_name.is_empty() {
            continue;
        }

        for (pid, proc) in sys.processes() {
            let name = proc.name().to_string_lossy().to_lowercase();
            let name = name.trim_end_matches(".exe");
            if name == exe_name {
                let existing_pid = pid.as_u32();
                {
                    let mut map = process_map.lock().unwrap();
                    map.insert(
                        entry.id.clone(),
                        ProcessEntry {
                            pid: existing_pid,
                            status: ProcessStatus::Running,
                            exe_name: exe_name.clone(),
                            started_at: Instant::now(),
                        },
                    );
                }
                emit_status(&app, &entry.id, Some(existing_pid), ProcessStatus::Running);
                break;
            }
        }
    }

    Ok(())
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

// ── spawn_minimised ───────────────────────────────────────────────────────────

fn spawn_minimised(exe: &str, args: &[String], working_dir: Option<&str>) -> Result<u32, String> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            CreateProcessW, PROCESS_INFORMATION, STARTUPINFOW, STARTF_USESHOWWINDOW,
        };
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOWMINIMIZED;
        use windows::core::{PCWSTR, PWSTR};

        let cmd_line = if args.is_empty() {
            format!("\"{}\"", exe)
        } else {
            format!("\"{}\" {}", exe, args.join(" "))
        };
        let mut cmd_wide: Vec<u16> = cmd_line.encode_utf16().chain(std::iter::once(0)).collect();

        let wd_wide: Option<Vec<u16>> = working_dir
            .map(|d| d.encode_utf16().chain(std::iter::once(0)).collect());

        let mut si = STARTUPINFOW::default();
        si.cb = std::mem::size_of::<STARTUPINFOW>() as u32;
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_SHOWMINIMIZED.0 as u16;

        let mut pi = PROCESS_INFORMATION::default();

        unsafe {
            let wd_ptr = match wd_wide.as_ref() {
                Some(v) => PCWSTR(v.as_ptr()),
                None => PCWSTR::null(),
            };
            CreateProcessW(
                PCWSTR::null(),
                PWSTR(cmd_wide.as_mut_ptr()),
                None, None, false,
                Default::default(),
                None,
                wd_ptr,
                &si,
                &mut pi,
            ).map_err(|e| e.to_string())?;
            let pid = pi.dwProcessId;
            let _ = CloseHandle(pi.hProcess);
            let _ = CloseHandle(pi.hThread);

            // SW_SHOWMINIMIZED is a hint many apps ignore — sweep windows post-launch
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(800));
                minimise_process_windows(pid);
                std::thread::sleep(std::time::Duration::from_millis(1500));
                minimise_process_windows(pid);
            });

            Ok(pid)
        }
    }
    #[cfg(not(windows))]
    {
        // No universal minimise mechanism on Linux/macOS — spawn normally
        let mut cmd = std::process::Command::new(exe);
        cmd.args(args);
        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            cmd.process_group(0);
        }
        let child = cmd.spawn().map_err(|e| format!("Failed to spawn '{}': {}", exe, e))?;
        let pid = child.id();
        std::mem::forget(child);
        Ok(pid)
    }
}

#[cfg(windows)]
unsafe fn minimise_process_windows(pid: u32) {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, IsWindowVisible, ShowWindow, SW_MINIMIZE,
    };

    unsafe extern "system" fn callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let target_pid = lparam.0 as u32;
        let mut window_pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut window_pid));
        if window_pid == target_pid && IsWindowVisible(hwnd).as_bool() {
            let _ = ShowWindow(hwnd, SW_MINIMIZE);
        }
        BOOL(1)
    }

    let _ = EnumWindows(Some(callback), LPARAM(pid as isize));
}

// ── apply_priority ────────────────────────────────────────────────────────────

fn apply_priority(pid: u32, priority: &str) {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::CloseHandle;
        use windows::Win32::System::Threading::{
            OpenProcess, SetPriorityClass,
            IDLE_PRIORITY_CLASS, NORMAL_PRIORITY_CLASS, HIGH_PRIORITY_CLASS,
            PROCESS_SET_INFORMATION,
        };
        unsafe {
            let Ok(handle) = OpenProcess(PROCESS_SET_INFORMATION, false, pid) else { return };
            let class = match priority {
                "low"  => IDLE_PRIORITY_CLASS,
                "high" => HIGH_PRIORITY_CLASS,
                _      => NORMAL_PRIORITY_CLASS,
            };
            let _ = SetPriorityClass(handle, class);
            let _ = CloseHandle(handle);
        }
    }
    #[cfg(unix)]
    {
        let niceness: i32 = match priority {
            "low"  => 10,
            "high" => -5,
            _      => 0,
        };
        let _ = std::process::Command::new("renice")
            .args(["-n", &niceness.to_string(), &pid.to_string()])
            .output();
    }
}
