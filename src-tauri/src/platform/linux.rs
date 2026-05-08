#![cfg(target_os = "linux")]

use std::path::PathBuf;
use super::PlatformAdapter;

pub struct LinuxAdapter;

impl PlatformAdapter for LinuxAdapter {
    fn extract_icon(&self, exe_path: &PathBuf) -> Option<PathBuf> {
        // 1. Image file adjacent to the executable (same stem, image extension)
        for ext in &["png", "svg", "jpg"] {
            let c = exe_path.with_extension(ext);
            if c.exists() { return Some(c); }
        }

        let name = exe_path.file_stem()?.to_str()?.to_lowercase();
        let home = std::env::var("HOME").unwrap_or_default();

        // 2. XDG pixmaps directories
        let pixmap_dirs = [
            format!("{}/.local/share/pixmaps", home),
            "/usr/local/share/pixmaps".to_string(),
            "/usr/share/pixmaps".to_string(),
        ];
        for dir in &pixmap_dirs {
            for ext in &["png", "svg", "xpm"] {
                let p = PathBuf::from(dir).join(format!("{}.{}", name, ext));
                if p.exists() { return Some(p); }
            }
        }

        // 3. Hicolor icon theme — largest size first
        let icon_bases = [
            format!("{}/.local/share/icons/hicolor", home),
            "/usr/local/share/icons/hicolor".to_string(),
            "/usr/share/icons/hicolor".to_string(),
        ];
        for base in &icon_bases {
            for size in &["256x256", "128x128", "64x64", "48x48", "32x32"] {
                for ext in &["png", "svg"] {
                    let p = PathBuf::from(base)
                        .join(size).join("apps")
                        .join(format!("{}.{}", name, ext));
                    if p.exists() { return Some(p); }
                }
            }
        }

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

    fn open_path(&self, exe_path: &std::path::Path) -> Result<(), String> {
        let dir = exe_path.parent().unwrap_or(exe_path);
        std::process::Command::new("xdg-open")
            .arg(dir)
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
