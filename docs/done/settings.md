# Settings — Done (partial)

Settings panel shipped in v0.3.0, extended in v0.4.0.

## What was built

Settings Dialog (gear icon, top-right of header). Four sections:

### Appearance
- Light / dark mode toggle; preference persisted in `localStorage`; all components respond via `var(--color-*)` CSS properties

### SteamGridDB
- Password input for API key
- Save button — persists key to `tauri-plugin-store` (`payload-board-settings.json`)
- Confirmation message ("API key saved." / "Failed to save API key.") shown after Save

### Storage
- Shows current profiles directory (click to open in file manager)
- "Change directory..." — folder picker that migrates all data to new location
- "Reset to default" — reverts to platform app data dir

### Danger Zone
- "Reset all data" with inline double-confirm — clears all profiles and apps

### About
- App version (read from Tauri at runtime), GitHub link

## Storage implementation

Two separate store files:
- `profiles.json` — profile data (path may be custom)
- `payload-board-settings.json` — settings key/value store (always in default app data dir)

## What's still missing

- [ ] **Persist last active profile** — save and restore `activeProfileId` across restarts (store in `payload-board-settings.json`)
- [ ] **Re-trigger onboarding** — button in Settings to show onboarding again (once onboarding is built)
- [ ] **Check for updates** — optional update check button (low priority; GitHub Releases API)
