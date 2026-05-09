#![cfg(target_os = "macos")]

use std::path::PathBuf;
use super::{InstalledApp, PlatformAdapter};

pub struct MacOsAdapter;

impl PlatformAdapter for MacOsAdapter {
    fn suggested_name(&self, exe_path: &PathBuf) -> String {
        exe_path
            .file_name()
            .and_then(|s| s.to_str())
            .map(|s| s.trim_end_matches(".app").to_string())
            .unwrap_or_else(|| "Unknown".to_string())
    }

    fn graceful_close(&self, pid: u32) -> bool {
        // Phase 2: NSRunningApplication terminate
        let _ = std::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .output();
        true
    }

    fn kill_tree(&self, pid: u32) -> bool {
        let _ = std::process::Command::new("kill")
            .args(["-KILL", &pid.to_string()])
            .output();
        true
    }

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        std::process::Command::new("open")
            .args(["-R", &exe_path.to_string_lossy()])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn list_installed_apps(&self) -> Vec<InstalledApp> {
        let mut apps = Vec::new();
        let mut search_dirs = vec![PathBuf::from("/Applications")];
        if let Ok(home) = std::env::var("HOME") {
            search_dirs.push(PathBuf::from(home).join("Applications"));
        }

        for dir in search_dirs {
            let Ok(entries) = std::fs::read_dir(&dir) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some("app") {
                    continue;
                }
                let name = match path.file_stem().and_then(|s| s.to_str()) {
                    Some(n) if !n.is_empty() => n.to_string(),
                    _ => continue,
                };
                // Try Contents/MacOS/<name> first, then first binary in Contents/MacOS/
                let macos_dir = path.join("Contents").join("MacOS");
                let exe_path = if macos_dir.join(&name).exists() {
                    Some(macos_dir.join(&name).to_string_lossy().to_string())
                } else {
                    std::fs::read_dir(&macos_dir).ok()
                        .and_then(|mut d| d.next())
                        .and_then(|e| e.ok())
                        .map(|e| e.path().to_string_lossy().to_string())
                };
                apps.push(InstalledApp { name, exe_path });
            }
        }

        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
        apps
    }
}
