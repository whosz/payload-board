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
        use winreg::enums::*;
        use winreg::RegKey;

        const UNINSTALL_PATH: &str =
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";

        let mut apps: Vec<InstalledApp> = Vec::new();

        let roots = [
            (HKEY_LOCAL_MACHINE, false),
            (HKEY_CURRENT_USER, false),
            // 32-bit apps on 64-bit Windows
            (HKEY_LOCAL_MACHINE, true),
        ];

        for (hive, wow64) in roots {
            let hive_key = RegKey::predef(hive);
            let flags = if wow64 {
                KEY_READ | 0x0200 // KEY_WOW64_32KEY
            } else {
                KEY_READ
            };
            let Ok(uninstall) = hive_key.open_subkey_with_flags(UNINSTALL_PATH, flags) else {
                continue;
            };

            for subkey_name in uninstall.enum_keys().flatten() {
                let Ok(subkey) = uninstall.open_subkey(&subkey_name) else {
                    continue;
                };

                let name: String = match subkey.get_value("DisplayName") {
                    Ok(v) => v,
                    Err(_) => continue,
                };

                if name.trim().is_empty() { continue; }

                // DisplayIcon often contains "path\to\app.exe,0"
                let exe_path = subkey
                    .get_value::<String, _>("DisplayIcon")
                    .ok()
                    .map(|icon| {
                        let s = icon.trim().to_string();
                        // Strip ",<index>" suffix
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

        // Deduplicate by name (keep first occurrence)
        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
        apps
    }
}

fn titlecase(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}
