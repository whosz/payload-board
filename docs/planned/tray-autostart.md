# Tray & Autostart

## Goal

Run Payload Board in the background with a system tray icon for quick access. Optionally launch at OS startup.

---

## Feature 1: System tray

Minimise to tray instead of closing. Quick actions from the tray menu without opening the main window.

### Tray menu items

```
Payload Board
──────────────────
▶ Run Sequence      (active profile name shown)
■ End Session
──────────────────
● Race Day          ← active profile, checkmark
  Practice
  Replay Session
──────────────────
  Open window
  Quit
```

### Todos

- [ ] Add `tauri-plugin-tray` to `Cargo.toml` and register in `lib.rs`
- [ ] Set tray icon (`src-tauri/icons/tray.png` — 22×22 or 32×32)
- [ ] On window close: hide to tray instead of quitting (intercept `CloseRequested` event)
- [ ] Build tray menu dynamically from current profiles list
- [ ] Wire "Run Sequence" and "End Session" menu items to existing IPC commands
- [ ] Wire profile menu items to switch active profile
- [ ] "Open window" → `window.show()` + `window.set_focus()`
- [ ] Update tray menu when profiles change (re-register menu on profile mutations)
- [ ] Show tray tooltip with active profile name + running app count

### Notes

- Tray icon should change state: default / running (cyan tint) / crashed (red tint)
- On Windows, tray icon double-click should open the window
- Provide a way to truly quit the app (not just hide) — "Quit" menu item

---

## Feature 2: Autostart

Launch Payload Board automatically when the OS starts.

### Todos

- [ ] Add `tauri-plugin-autostart` to `Cargo.toml` and register in `lib.rs`
- [ ] Add toggle in Settings → Startup section: "Launch at login"
- [ ] Persist preference in `payload-board-settings.json`
- [ ] On toggle on: register autostart entry; on toggle off: remove it
- [ ] On autostart: start minimised to tray (not as a visible window)

### Notes

- Autostart only makes sense if tray is also implemented — don't ship one without the other
- Windows: writes to `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- macOS: creates a Launch Agent plist in `~/Library/LaunchAgents/`
- Linux: creates a `.desktop` file in `~/.config/autostart/`
- `tauri-plugin-autostart` handles all three platforms
