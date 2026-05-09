# Process Control — Done

Shipped across v0.3.1 and v0.4.0.

## What was built

- `start_app(profileId, entryId)` — spawns process, tracks PID in `ProcessMap`
- `stop_app(entryId)` — kills process (force kill via `taskkill /F /T` on Windows)
- `restart_app(profileId, entryId)` — stop then start
- `open_path(profileId, entryId)` — opens the app's folder in Explorer / file manager
- `stop_all(profileId)` — END SESSION: kills all running apps in the profile
- Per-tile status LED: RUNNING (cyan glow) / STOPPED (outline) / CRASHED (red pulse)
- CRASHED state: tile gets red border + error message shown below path
- Confirm modal before removing an app entry from a profile
- Trash icon (gray default, red on hover) for remove button

## Platform notes

Current kill implementation is force-kill only (`kill()` via `Child.kill()` in Rust). Graceful shutdown (WM_CLOSE → TerminateProcess timeout) is not yet implemented — see below.

## What's still missing

- [ ] **Graceful shutdown** — send WM_CLOSE (Windows) / SIGTERM (Unix) first, force-kill after 5 s timeout; currently goes straight to force-kill
- [ ] **Tree-kill** — kill child processes spawned by the tracked process; currently only kills the root PID
- [ ] **Force-kill confirm** — optional confirm dialog for force-kill action (low priority)
