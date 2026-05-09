# Platform Adapters — Done (partial)

Trait and initial implementations shipped in v0.4.0.

## What was built

`PlatformAdapter` trait in `src-tauri/src/platform/mod.rs` with implementations for Windows, macOS, and Linux.

### Trait (as shipped)

```rust
trait PlatformAdapter {
    fn list_installed_apps(&self) -> Vec<InstalledApp>;  // default: empty vec
    // extract_icon removed — was unreliable, custom image picker used instead
}
```

### Windows (`platform/windows.rs`)
- `list_installed_apps` — reads `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*` and `HKCU\...`, extracts `DisplayName` + `DisplayIcon` (strips index suffix, verifies `.exe`/`.bat` exists, deduplicates)

### macOS / Linux (`platform/macos.rs`, `platform/linux.rs`)
- `list_installed_apps` — uses default (returns empty vec)

## What's still missing

- [ ] **macOS `list_installed_apps`** — scan `/Applications/*.app`, extract name + executable path from `Info.plist`
- [ ] **Linux `list_installed_apps`** — parse `.desktop` files in `/usr/share/applications/` and `~/.local/share/applications/` (strip `Exec=` field codes like `%U`, `%f`)
- [ ] **Graceful shutdown** — `graceful_close(pid)` per platform (WM_CLOSE on Windows, SIGTERM on Unix); currently all platforms use force-kill
- [ ] **Tree-kill** — `kill_tree(pid)` per platform (`taskkill /F /T` on Windows, kill process group on Unix)

## Rules

- `cfg` flags only inside `src-tauri/src/platform/` — nowhere else in the codebase
- Frontend is never aware of the platform
