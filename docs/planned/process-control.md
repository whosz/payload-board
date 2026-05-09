# Process Control

## Goal
Per-app tile actions: start, stop, restart, open folder, force kill. END SESSION closes everything in the profile gracefully, with a force-kill fallback after timeout.

## Todos

- [ ] `start_app(entry_id)` — spawn process, track PID
- [ ] `stop_app(entry_id, force: bool)` — graceful close → force kill after 5 s
- [ ] `restart_app(entry_id)` — stop then start
- [ ] `open_path(entry_id)` — reveal in Explorer / Finder / file manager
- [ ] `stop_all(profile_id)` — END SESSION: graceful → kill after 5 s timeout
- [ ] Custom icon per app (image file picker, cached)
- [ ] Per-tile status LED (RUNNING / STOPPED / CRASHED)
- [ ] Confirm dialog before removing an app entry from profile

## Platform specifics

### Graceful shutdown
- **Windows:** `EnumWindows` + `GetWindowThreadProcessId` → `WM_CLOSE` → `TerminateProcess` after 5 s
- **macOS:** `NSRunningApplication.terminate()` → `forceTerminate()` after 5 s
- **Linux:** `SIGTERM` on process group → `SIGKILL` after 5 s

### Tree-kill
- **Windows:** `taskkill /F /T /PID` or `JobObject` set at spawn
- **Unix:** spawn with `setsid`, then `kill -TERM -<pgid>`

### Icon extraction
- **Windows:** `SHGetFileInfoW` → PNG
- **macOS:** `NSWorkspace.iconForFile()` → PNG
- **Linux:** `.desktop Icon=` field → theme lookup in `/usr/share/icons/`

## Notes

- CRASHED state: process exited with non-zero code or unexpectedly — tile shows red pulse
- Force-kill shown as destructive action (red icon, confirm if needed)
