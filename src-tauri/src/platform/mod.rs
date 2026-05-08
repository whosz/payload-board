use std::path::PathBuf;

/// Returned by pick_executable IPC command.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PickedExecutable {
    pub path: String,
    pub suggested_name: String,
    pub icon_path: Option<String>,
}

/// Platform-agnostic abstraction. All platform-specific logic lives here.
/// The frontend and command layer never reference cfg-gated code directly.
pub trait PlatformAdapter: Send + Sync {
    fn extract_icon(&self, exe_path: &PathBuf) -> Option<PathBuf>;
    fn suggested_name(&self, exe_path: &PathBuf) -> String;
    fn graceful_close(&self, pid: u32) -> bool;
    fn kill_tree(&self, pid: u32) -> bool;
}

/// Returns the correct adapter for the current OS.
/// cfg dispatch is confined entirely to this function.
pub fn create_adapter() -> Box<dyn PlatformAdapter> {
    #[cfg(windows)]
    return Box::new(windows::WindowsAdapter);

    #[cfg(target_os = "macos")]
    return Box::new(macos::MacOsAdapter);

    #[cfg(target_os = "linux")]
    return Box::new(linux::LinuxAdapter);

    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    compile_error!("Unsupported platform");
}

#[cfg(windows)]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "linux")]
pub mod linux;
