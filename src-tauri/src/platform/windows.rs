#![cfg(windows)]

use std::path::PathBuf;
use super::{PlatformAdapter, InstalledApp};

pub struct WindowsAdapter;

impl PlatformAdapter for WindowsAdapter {
    fn suggested_name(&self, exe_path: &PathBuf) -> String {
        exe_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| titlecase(s))
            .unwrap_or_else(|| "Unknown".to_string())
    }

    fn graceful_close(&self, pid: u32) -> bool {
        // taskkill without /F sends WM_CLOSE to windowed processes
        std::process::Command::new("taskkill")
            .args(["/PID", &pid.to_string()])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    fn kill_tree(&self, pid: u32) -> bool {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        true
    }

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        let path_str = exe_path.to_string_lossy();
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path_str))
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn list_installed_apps(&self) -> Vec<InstalledApp> {
        let mut apps = list_registry_apps();

        // Merge in Start menu apps (covers MS Store / MSIX apps missing from registry)
        let existing: std::collections::HashSet<String> =
            apps.iter().map(|a| a.name.to_lowercase()).collect();
        for app in list_start_menu_apps() {
            if !existing.contains(&app.name.to_lowercase()) {
                apps.push(app);
            }
        }

        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
        apps
    }
}

fn list_registry_apps() -> Vec<InstalledApp> {
    use winreg::enums::*;
    use winreg::RegKey;

    const UNINSTALL_PATH: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";

    let mut apps: Vec<InstalledApp> = Vec::new();

    let roots = [
        (HKEY_LOCAL_MACHINE, false),
        (HKEY_CURRENT_USER, false),
        (HKEY_LOCAL_MACHINE, true), // 32-bit apps on 64-bit Windows
    ];

    for (hive, wow64) in roots {
        let hive_key = RegKey::predef(hive);
        let flags = if wow64 { KEY_READ | 0x0200 } else { KEY_READ };
        let Ok(uninstall) = hive_key.open_subkey_with_flags(UNINSTALL_PATH, flags) else {
            continue;
        };

        for subkey_name in uninstall.enum_keys().flatten() {
            let Ok(subkey) = uninstall.open_subkey(&subkey_name) else { continue };

            let name: String = match subkey.get_value("DisplayName") {
                Ok(v) => v,
                Err(_) => continue,
            };
            if name.trim().is_empty() { continue; }

            let exe_path = subkey
                .get_value::<String, _>("DisplayIcon")
                .ok()
                .map(|icon| {
                    let s = icon.trim().to_string();
                    if let Some(pos) = s.rfind(',') {
                        let suffix = &s[pos + 1..];
                        if suffix.chars().all(|c| c.is_ascii_digit() || c == '-') {
                            return s[..pos].trim_matches('"').to_string();
                        }
                    }
                    s.trim_matches('"').to_string()
                })
                .filter(|p| {
                    let lower = p.to_lowercase();
                    (lower.ends_with(".exe") || lower.ends_with(".bat"))
                        && std::path::Path::new(p).exists()
                });

            apps.push(InstalledApp { name, exe_path });
        }
    }

    apps
}

/// Uses PowerShell `Get-StartApps` to enumerate Start menu entries, which includes
/// MS Store / MSIX apps that don't appear in the registry uninstall keys.
fn list_start_menu_apps() -> Vec<InstalledApp> {
    let Ok(output) = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-StartApps | ConvertTo-Json -Compress",
        ])
        .output()
    else {
        return vec![];
    };

    if !output.status.success() { return vec![]; }
    let Ok(json) = String::from_utf8(output.stdout) else { return vec![] };

    // ConvertTo-Json returns an array or a single object when there's only one entry
    let items: Vec<serde_json::Value> =
        if let Ok(arr) = serde_json::from_str::<Vec<serde_json::Value>>(&json) {
            arr
        } else if let Ok(obj) = serde_json::from_str::<serde_json::Value>(&json) {
            vec![obj]
        } else {
            return vec![];
        };

    items.iter().filter_map(|item| {
        let name = item["Name"].as_str()?.trim().to_string();
        let app_id = item["AppID"].as_str()?;
        if name.is_empty() { return None; }

        // Store/MSIX apps have AppIDs like "PackageFamilyName!AppId".
        // Traditional apps have AppIDs that are direct .exe paths.
        let exe_path = if app_id.contains('!') {
            // No direct exe — user gets the name auto-filled; exe field left blank
            None
        } else {
            let lower = app_id.to_lowercase();
            if (lower.ends_with(".exe") || lower.ends_with(".bat"))
                && std::path::Path::new(app_id).exists()
            {
                Some(app_id.to_string())
            } else {
                None
            }
        };

        Some(InstalledApp { name, exe_path })
    }).collect()
}

fn titlecase(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}
