#![cfg(target_os = "linux")]

use std::path::PathBuf;
use super::{InstalledApp, PlatformAdapter};

pub struct LinuxAdapter;

impl PlatformAdapter for LinuxAdapter {
    fn suggested_name(&self, exe_path: &PathBuf) -> String {
        exe_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| titlecase(s))
            .unwrap_or_else(|| "Unknown".to_string())
    }

    fn graceful_close(&self, pid: u32) -> bool {
        let _ = std::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .output();
        true
    }

    fn kill_tree(&self, pid: u32) -> bool {
        // Try to kill the entire process group first (negative PID = PGID)
        let _ = std::process::Command::new("kill")
            .args(["-KILL", &format!("-{}", pid)])
            .output();
        // Fallback: direct kill
        let _ = std::process::Command::new("kill")
            .args(["-KILL", &pid.to_string()])
            .output();
        true
    }

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        let dir = exe_path.parent().unwrap_or(exe_path);

        // Try xdg-open first; exit code 0 means it worked
        let xdg_ok = std::process::Command::new("xdg-open")
            .arg(dir)
            .status()
            .map(|s| s.success())
            .unwrap_or(false);

        if xdg_ok {
            return Ok(());
        }

        // WSL2 fallback: open with Windows Explorer
        if let Ok(win_path) = std::process::Command::new("wslpath")
            .args(["-w", &dir.to_string_lossy()])
            .output()
        {
            let win_path = String::from_utf8_lossy(&win_path.stdout).trim().to_string();
            if !win_path.is_empty() {
                let _ = std::process::Command::new("explorer.exe")
                    .arg(&win_path)
                    .spawn();
                return Ok(());
            }
        }

        // Try common file managers as last resort
        for fm in &["nautilus", "thunar", "dolphin", "nemo", "pcmanfm"] {
            if std::process::Command::new(fm).arg(dir).spawn().is_ok() {
                return Ok(());
            }
        }

        Err(format!("No file manager found to open {:?}", dir))
    }

    fn list_installed_apps(&self) -> Vec<InstalledApp> {
        let mut apps = Vec::new();
        let mut search_dirs = vec![
            PathBuf::from("/usr/share/applications"),
            PathBuf::from("/var/lib/flatpak/exports/share/applications"),
        ];
        if let Ok(home) = std::env::var("HOME") {
            search_dirs.push(PathBuf::from(&home).join(".local/share/applications"));
        }

        for dir in search_dirs {
            let Ok(entries) = std::fs::read_dir(&dir) else { continue };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some("desktop") {
                    continue;
                }
                let Ok(content) = std::fs::read_to_string(&path) else { continue };

                let mut name: Option<String> = None;
                let mut exec: Option<String> = None;
                let mut hidden = false;

                for line in content.lines() {
                    if line.starts_with("Name=") && name.is_none() {
                        name = Some(line[5..].to_string());
                    } else if line.starts_with("Exec=") && exec.is_none() {
                        exec = Some(line[5..].to_string());
                    } else if line == "NoDisplay=true" || line == "Hidden=true" {
                        hidden = true;
                    }
                }

                if hidden { continue; }
                let Some(name) = name else { continue };
                if name.is_empty() { continue; }

                // Extract executable: first token, strip field codes and quotes
                let exe_path = exec.map(|e| {
                    let first = e.split_whitespace().next().unwrap_or("").to_string();
                    first.trim_matches('"').to_string()
                }).filter(|s| !s.is_empty());

                apps.push(InstalledApp { name, exe_path });
            }
        }

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
