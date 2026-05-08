#![cfg(target_os = "linux")]

use std::path::PathBuf;
use super::PlatformAdapter;

pub struct LinuxAdapter;

impl PlatformAdapter for LinuxAdapter {
    fn extract_icon(&self, _exe_path: &PathBuf) -> Option<PathBuf> {
        // Phase 2: parse .desktop Icon= field, resolve from XDG theme paths
        None
    }

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
}

fn titlecase(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}
