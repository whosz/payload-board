# Payload Board

A cross-platform desktop app for managing sets of applications (profiles) — launch them in sequence, monitor CPU/RAM in real time, and close everything with one click. Built for the "dark cockpit" aesthetic: zero rounded corners, functional data, no fluff.

## What it does

1. You create a named **profile** (e.g. `iRacing`, `Work`, `Stream`).
2. You add **apps** to the profile — each with a launch order, optional delay, and CLI args.
3. You click **RUN SEQUENCE** → apps start one by one in your configured order.
4. The dashboard shows a live tile per app with CPU%, RAM, uptime, and a sparkline (Phase 4).
5. You can stop / restart / force-kill individual apps from their tile.
6. **END SESSION** gracefully closes everything in the profile (→ force-kill after 5 s timeout).
7. Profiles persist across restarts. Multiple profiles, switch from the left sidebar.

## Features

- Named profiles with multiple app entries
- Configurable launch order, delay (ms), and CLI arguments
- `fire_and_forget` / `wait_for_window` / `wait_seconds` launch strategies
- Per-process controls: stop, restart, open folder, force-kill
- CPU% and RAM MB monitoring per process at 1 Hz (Phase 4)
- 60-second sparkline history per process (Phase 4)
- Session footer: total CPU, total RAM, system free RAM (Phase 4)
- Persistent profiles (JSON, stored in platform app data dir)
- Cross-platform: Windows, macOS, Linux

## Installation

### Prerequisites

**All platforms:**
- [Node.js](https://nodejs.org) v18+
- [Rust](https://rustup.rs) stable toolchain

**Linux (WSL2 / Ubuntu):**
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev pkg-config build-essential
```

**macOS:** Xcode Command Line Tools (`xcode-select --install`)

**Windows:** [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or Visual Studio with C++ workload

### Run in development
```bash
npm install
npm run tauri dev
```

First Rust compile takes 5–10 minutes. Subsequent runs are fast.

### Build for production
```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`

## Usage

1. **Create a profile** — click `+ NEW PROFILE` in the sidebar, enter a name.
2. **Add apps** — select the profile, click `Add App`, browse to the executable (or type the path). Set the launch delay if needed.
3. **Configure order** — apps launch in the order they were added (drag-to-reorder coming in Phase 5).
4. **Run** — click `RUN SEQUENCE`. Watch the tiles turn live.
5. **Monitor** — CPU%, RAM, uptime, and sparklines update every second (Phase 4).
6. **End session** — click `END SESSION`. All profile apps receive a graceful close signal; any that don't exit within 5 s are force-killed.

## Platform notes

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Sequential launch | ✅ | ✅ | ✅ |
| CPU/RAM monitoring | ✅ | ✅ | ✅ |
| Icon extraction | Phase 2 | Phase 2 | Phase 2 |
| Graceful close (GUI apps) | Phase 2 | Phase 2 | Phase 2 |
| iRacing / SimHub / Fanatec | ✅ | ❌ | ❌ (ecosystem) |
| Dev/Work/Stream profiles | ✅ | ✅ | ✅ |

## FAQ

**Why not Electron?**
Payload Board monitors CPU and RAM of other processes. Using Electron would add ~150 MB RAM and meaningful CPU overhead to the very app that reports resource usage. Tauri's Rust backend uses ~5 MB RAM.

**Does it work on Linux / macOS?**
Yes. Gaming-specific profiles (iRacing, Fanatec, SimHub) are Windows-only because those simulators don't run elsewhere. For dev, design, or streaming setups, macOS and Linux work fine.

**Can I import / export profiles?**
Planned in Phase 6. Profiles are stored as plain JSON in your app data directory:
- Windows: `%APPDATA%\com.payload-board\`
- macOS: `~/Library/Application Support/com.payload-board/`
- Linux: `~/.config/com.payload-board/`

**Steam launches a helper that exits immediately — how does Payload Board track the real process?**
After `start_app`, Payload Board scans the process list for 10 seconds looking for a process matching the executable's filename. The first match is assigned as the tracked PID. This works on all platforms via the `sysinfo` crate (Phase 4).

**Can I require admin/sudo for a specific app?**
The `requires_elevation` flag is in the data model. Platform-specific elevation (UAC on Windows, `osascript` on macOS, `pkexec` on Linux) is planned for Phase 6.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app) |
| Backend | Rust stable |
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (heavily customised — zero radius, no shadows) |
| Icons | FontAwesome 6 Free (Solid + Regular) |
| Process monitoring | `sysinfo` crate (Phase 4) |
| Persistence | `tauri-plugin-store` (JSON) |
