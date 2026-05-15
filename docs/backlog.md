# Backlog

Lower-priority ideas and Phase 6 nice-to-haves. Promote to a feature file when ready to plan properly.

## Near term

- [x] **CLI arguments field** — free-text input below the executable path in the app entry editor; easy to paste into; see `planned/app-launch-config.md`
- [x] **Default view: tiles** — change the initial view mode from list to grid (tiles) on first launch and after reset
- [x] **Remove background animation** — remove the animated gradient on `body::before`; keep the static gradient colours
- [x] **Update tile placeholder + hover effect** — redesign the SVG grid placeholder graphic; add a visible hover effect on tiles (e.g. border glow or overlay)
- [x] **App logo** — design and add a logo/icon for the app (window title bar, taskbar, About section)
- [x] **More readable header font** — evaluate replacing or tuning Orbitron for app/profile names; switched to Exo (display) + Inter (body)
- [x] **Status bar font style** — update typography for "Total", "Alive", "Crashed" labels in the status bar (currently Orbitron 10px)
- [x] **Disable "Run Sequence" during active session** — button should be disabled while any app in the profile is running, not just when the app list is empty

## Phase 6 — nice-to-have

- [ ] **System tray** — Tauri tray API (cross-platform); quick start/stop profile from tray menu without opening main window
- [x] **Autostart** — `tauri-plugin-autostart` (cross-platform); option per profile or global
- [ ] **Export / import profiles** — serialize profile JSON to file; import via file picker
- [ ] **Session logs** — timestamped log per session: which apps launched, exit codes, crash events
- [x] **Detect already running** — on sequence start, check if process is already up; skip it rather than double-launching
- [x] **Browse installed apps list** — Windows (registry), macOS (`/Applications`), Linux (`.desktop` files); currently Windows-only in v0.4.0
- [x] **macOS & Linux installers** — add macOS (.dmg / .app bundle) and Linux (.deb / .AppImage) build targets to CI; currently Windows-only (NSIS + MSI)

## Future ideas

- [ ] **Profile templates** — ship a few starter profiles (Gaming, Dev, Stream) on first launch
- [ ] **Scheduled sessions** — trigger a profile at a set time (cron-style)
- [ ] **Dependency graph** — define "app B requires app A to be running first" without relying solely on order + delay
- [ ] **Health checks** — custom ping (port check, HTTP endpoint, file exists) to determine if an app is truly ready before next step launches
- [ ] **Notifications** — native OS notification on sequence complete or crash
- [ ] **Multi-monitor awareness** — remember which screen/position an app was on and restore it
- [ ] **CLI interface** — `payload-board run <profile>` from terminal; useful for scripting and CI
- [ ] **Profile sharing** — sharable profile URLs or a community registry (very long term)

## Future release ideas

### UI
- [x] **UI redesign** — Figma-driven redesign of all components, new colour tokens and fonts, in-app onboarding, logo; see `planned/ui-redesign.md`
- [ ] **App-specific preset dropdowns** — curated launch options for select apps (e.g. CrewChief); dropdown only visible when app name matches a known preset; selecting a preset appends to the args field; see `planned/app-launch-config.md`
- [x] **Automatic tile images on app detection** — when an app is added via "Browse installed apps" or by name match, automatically search SteamGridDB (if API key is configured) and download the best-matching grid image as the tile background; user can still override or clear it manually

### Process reliability
- [ ] **Auto-restart on crash** — automatically relaunch an app if it exits unexpectedly; configurable retry limit before giving up
- [x] **Process priority / CPU affinity** — set process priority (High / Normal / Low) per app entry; useful when one app (e.g. iRacing) should always win over others (e.g. SimHub)

### Launch conditions
- [ ] **Conditional launch** — only start an app if a condition is met: USB device connected, network available, or another process already running
- [ ] **Environment variables per app** — inject custom env vars at launch without touching the system environment

### Profile management
- [ ] **Duplicate profile** — clone an existing profile as a starting point instead of building from scratch
- [ ] **Working directory override** — some apps behave differently depending on where they're launched from; allow overriding per app entry
- [ ] **App notes field** — small text note per app entry for quirks or reminders (e.g. "must launch before SimHub or it crashes")
- [ ] **Run multiple instances** — same executable, different args, treated as separate independent entries

### Session awareness
- [ ] **Session history** — log of past sessions: profile used, duration, which apps crashed or were force-killed
- [ ] **Usage stats** — how often each profile is run, average session length

### Global hotkeys
- [ ] **System-wide hotkeys** — trigger RUN SEQUENCE or END SESSION from anywhere, even when the Payload Board window is in the background
