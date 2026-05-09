# Platform Adapters

## Goal
All platform-specific logic lives behind a `PlatformAdapter` trait in `src-tauri/src/platform/`. Frontend is completely unaware of the platform.

## Trait interface

```rust
trait PlatformAdapter {
    fn extract_icon(path: &str) -> Result<Vec<u8>>;   // returns PNG bytes
    fn list_installed_apps() -> Result<Vec<AppInfo>>;
    fn graceful_close(pid: u32) -> Result<()>;
    fn kill_tree(pid: u32) -> Result<()>;
}
```

## Todos

- [ ] Define `PlatformAdapter` trait in `platform/mod.rs`
- [ ] Factory function that returns the right impl at runtime
- [ ] Windows: `extract_icon` via `SHGetFileInfoW`
- [ ] Windows: `list_installed_apps` from registry (`HKLM/HKCU Uninstall`)
- [ ] Windows: `graceful_close` via `WM_CLOSE`, `kill_tree` via `taskkill /F /T`
- [ ] macOS: `extract_icon` via `NSWorkspace.iconForFile`
- [ ] macOS: `list_installed_apps` scan `/Applications/*.app`
- [ ] macOS: `graceful_close` via `NSRunningApplication.terminate()`
- [ ] Linux: `extract_icon` via `.desktop Icon=` + theme lookup
- [ ] Linux: `list_installed_apps` via `.desktop` parsing (`freedesktop_entry_parser`)
- [ ] Linux: `graceful_close` via `SIGTERM` on process group, `SIGKILL` after 5 s
- [ ] All three impls covered before merging any phase

## Cargo conditional deps

```toml
[target.'cfg(windows)'.dependencies]
windows = { version = "...", features = ["Win32_UI_Shell", "Win32_System_Registry"] }

[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "..."
objc = "..."

[target.'cfg(target_os = "linux")'.dependencies]
freedesktop_entry_parser = "..."
```

## Notes

- `cfg` flags only allowed inside `src-tauri/src/platform/` — nowhere else
- Icon output always PNG bytes; cached in `icon_cache.rs`
- `.desktop Exec=` field codes (`%U`, `%f`, etc.) must be stripped before spawning
- macOS `.app` bundles: use `open -a "MyApp.app"` rather than calling the binary directly
