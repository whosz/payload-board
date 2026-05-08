#![cfg(windows)]

use std::path::PathBuf;
use super::PlatformAdapter;

pub struct WindowsAdapter;

impl PlatformAdapter for WindowsAdapter {
    fn extract_icon(&self, _exe_path: &PathBuf) -> Option<PathBuf> {
        // Phase 2: SHGetFileInfoW + HICON → PNG via `image` crate
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
}

fn titlecase(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}
