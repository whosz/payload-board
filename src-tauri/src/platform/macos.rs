#![cfg(target_os = "macos")]

use std::path::PathBuf;
use super::PlatformAdapter;

pub struct MacOsAdapter;

impl PlatformAdapter for MacOsAdapter {
    fn extract_icon(&self, exe_path: &PathBuf) -> Option<PathBuf> {
        let parent = exe_path.parent()?;
        let name = exe_path.file_stem()?.to_str()?.to_lowercase();
        for filename in &[
            format!("{}.png", name),
            format!("{}.icns", name),
            "icon.png".to_string(),
            "AppIcon.png".to_string(),
        ] {
            let p = parent.join(filename);
            if p.exists() { return Some(p); }
        }
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

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        std::process::Command::new("open")
            .args(["-R", &exe_path.to_string_lossy()])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}
