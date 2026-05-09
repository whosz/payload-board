# Hotkeys

## Goal

Keyboard shortcuts for common actions, both in-app and system-wide (available even when the window is not focused).

---

## Feature 1: In-app hotkeys

Shortcuts that work when the Payload Board window is focused.

### Planned shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+R` | RUN SEQUENCE for active profile |
| `Ctrl+.` | END SESSION (stop all) |
| `Ctrl+N` | New profile |
| `Ctrl+Shift+,` | Open Settings |
| `Escape` | Close open dialog |
| `Ctrl+Shift+D` | Toggle Design Reference (dev only — already shipped) |

### Todos

- [ ] Add `keydown` listeners in `App.tsx` for each shortcut
- [ ] Guard each shortcut: only fire if no modal/dialog is open (check state)
- [ ] Show shortcut hints in button tooltips (e.g. `title="Run Sequence (Ctrl+R)"`)

---

## Feature 2: System-wide hotkeys

Shortcuts that work from anywhere on the OS, even when Payload Board is in the background or minimised.

### Planned shortcuts

| Shortcut | Action |
|----------|--------|
| User-configurable | RUN SEQUENCE for active profile |
| User-configurable | END SESSION |

### Implementation

Use `tauri-plugin-global-shortcut` (Tauri 2 official plugin).

### Todos

- [ ] Add `tauri-plugin-global-shortcut` to `Cargo.toml` and `tauri.conf.json`
- [ ] Register default shortcuts at app startup (with fallback if already taken)
- [ ] Allow user to customise shortcuts in Settings → Hotkeys section
- [ ] Persist configured shortcuts in `payload-board-settings.json`
- [ ] Unregister shortcuts on app exit

### Notes

- Global shortcuts conflict with other apps — must be user-configurable, not hardcoded
- Show the active shortcut in the Settings panel so users can confirm what's registered
- On Windows, some key combos are reserved by the OS — handle registration failure gracefully
