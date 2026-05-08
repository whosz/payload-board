#![cfg(target_os = "macos")]

use std::path::PathBuf;
use super::PlatformAdapter;

pub struct MacOsAdapter;

impl PlatformAdapter for MacOsAdapter {
    fn extract_icon(&self, _exe_path: &PathBuf) -> Option<PathBuf> {
        // Phase 2: NSWorkspace iconForFile → PNG via cocoa/objc
        None
    }

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
}
