# Payload Board

![Payload Board](docs/assets/screenshot.png)

<sub>Also in [grey](docs/assets/screenshots/grey-1280x800-grid.png) and [light](docs/assets/screenshots/light-1280x800-grid.png) themes, with a [list view](docs/assets/screenshots/dark-1280x800-list.png) and [tabbed settings](docs/assets/screenshots/dark-1280x800-settings.png). Screenshots use sample data.</sub>

A desktop app for managing sets of applications (profiles) — launch them in sequence, monitor their status in real time, and close everything with one click. Built for the "dark cockpit" aesthetic: functional data, no fluff.

Inspired by the pain of managing a dozen simracing apps that all had to be started in the right order before a session and closed one by one afterwards. Payload Board automates that.

## What it does

1. You create a named **profile** (e.g. `Racing`, `Work`, `Stream`) and pick an accent colour and optional cover image.
2. You add **apps** to the profile — each with a launch order, delay and optional CLI arguments.
3. You press **Run sequence** → apps start one by one in your configured order; the button shows progress and can cancel.
4. The dashboard shows a live tile per app with its current status.
5. You can stop / restart / open the folder of individual apps from their tile.
6. **End session** gracefully closes everything in the profile (→ force-kill after 5 s timeout).
7. Profiles persist across restarts; switch between them in the tabs at the top.

Everything is reachable from the keyboard: `Ctrl+K` opens a command palette, and global shortcuts work even while a game has focus.

## Features

**Profiles & apps**
- Named profiles with emoji, accent colour and cover image
- Multiple app entries per profile with launch order, delay and CLI arguments
- Per-app process priority: Low / Normal / High
- Per-app "Launch minimised" toggle (Windows only)
- Poster view (carousel) and compact list view; A→Z / Z→A display sort
- Confirm dialogs before removing apps or deleting profiles

**Session management**
- Sequencer runs in the backend — keeps going with the window hidden; progress and cancel in the hero button
- Detect already-running processes — adopts the existing process instead of double-launching
- Crash notifications (when the window is not in front) and optional auto-restart per app with a retry limit
- Hero shows live / crashed counts, launch-order strip and session timer

**Keyboard**
- **Command palette** (`Ctrl+K`) — actions, apps and profiles in one searchable list
- **Configurable shortcuts** in Settings → Shortcuts — in-window and global (OS-level); conflicts and refused keys are reported
- Roving focus on tiles: arrows, `Enter` start/stop, `R` restart, `E` edit, `Del` remove; tooltips show the key

**Appearance**
- Graphite + orange accent, per-app colour glow and first-letter backdrop; Dark / Grey / Light themes
- SteamGridDB artwork for tiles (API key in Settings, with a link to where to get one) or any local image
- Mini mode below 560 px width; WCAG 2.2 AA contrast, focus and target sizes
- Languages: English, Polski, Deutsch, Español, Français

**System**
- Tray icon with Show / Quit; **Start minimised to tray**, **Minimise on close**, **Launch on startup** (Settings)
- **Update check** — asks GitHub for a newer release at startup (can be turned off) and links to the download page
- Browse installed apps: Windows (registry; Steam games resolved through Steam's app manifests), Linux (`.desktop` files)
- Custom config directory and reset-all-data option in Settings → Data

## Installation

### Windows

Download the latest release from [GitHub Releases](https://github.com/whosz/payload-board/releases):

| File | Description |
|------|-------------|
| `Payload-Board_x.x.x_x64-setup.exe` | Installer (recommended) |
| `Payload-Board_x.x.x_x64_en-US.msi` | MSI installer |
| `Payload-Board_x.x.x-portable-x64.zip` | Portable — extract and run, no install needed |

**Requirements:** Windows 10 or 11 (64-bit).  
Windows may show a SmartScreen warning on first run — click "More info → Run anyway".

### Linux

Pre-built `.deb` / `.AppImage` (Linux) are available on the [Releases](https://github.com/whosz/payload-board/releases) page.

Or build from source:

**Prerequisites:**
- [Node.js](https://nodejs.org) v18+
- [Rust](https://rustup.rs) stable toolchain

**Linux (Ubuntu / WSL2):**
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev pkg-config build-essential
```

**Build:**
```bash
npm install
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`

First Rust compile takes 5–10 minutes. Subsequent builds are fast.

## Usage

1. **Create a profile** — click `+` in the top bar (or `Ctrl+N`), enter a name; optionally an emoji, accent colour and cover image.
2. **Add apps** — select the profile, click `Add app`, browse to the executable or pick from the installed apps list. Set any CLI arguments and process priority if needed.
3. **Configure order** — apps launch in the order they were added (the A→Z sort only changes how they are displayed).
4. **Run** — click `Run sequence`. Watch the tiles turn live; click the button again (it shows the step) to cancel.
5. **End session** — click `End session`. All profile apps receive a graceful close signal; any that don't exit within 5 s are force-killed.
6. **Tray** — the app lives in the system tray. Close the window to minimise it (if "Minimise on close" is enabled), or use Quit from the tray menu to exit fully.

## FAQ

**Why not Electron?**
Payload Board monitors and controls other processes. Using Electron would add ~150 MB RAM and meaningful CPU overhead to the very app that manages resource usage. Tauri's Rust backend uses ~5 MB RAM.

**Does it work on Linux?**
Yes — pre-built binaries are available on the Releases page. The "Browse installed apps" feature works on Windows (registry) and Linux (`.desktop` files). There is no macOS build.

**Can I import / export profiles?**
Not yet. Profiles are stored as plain JSON in your app data directory:
- Windows: `%APPDATA%\com.payload-board\`
- Linux: `~/.config/com.payload-board/`

You can also change the storage location in Settings → Storage.

**Steam launches a helper that exits immediately — how does Payload Board track the real process?**
After launch, Payload Board scans the process list for 10 seconds looking for a process matching the executable's filename. The first match is assigned as the tracked PID.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app) |
| Backend | Rust stable |
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Styling tokens | CSS custom properties (`--color-*`) in `src/globals.css`; Dark / Grey / Light themes via `[data-theme]` |
| Components | shadcn/ui (heavily customised) |
| Fonts | Big Shoulders (headings), Barlow Semi Condensed (UI), IBM Plex Mono (labels), Racing Sans One (tile letter) |
| Icons | FontAwesome 6 Free |
| Persistence | `tauri-plugin-store` (JSON) |
| Shortcuts / notifications | `tauri-plugin-global-shortcut`, `tauri-plugin-notification` |
