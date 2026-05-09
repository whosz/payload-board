# Payload Board — docs

Feature planning and todos for the Payload Board project.

## Structure

```
docs/
├── index.md                    ← you are here
├── scope.md                    ← original project scope, stack rationale, design system brief
├── backlog.md                  ← lower-priority ideas and future features
├── planned/                    ← ready to build, not yet started
│   ├── app-launch-config.md    ← CLI args field + app-specific presets
│   ├── monitoring.md           ← CPU/RAM metrics, sparklines, footer totals
│   ├── sequencer.md            (remaining: wait strategies, progress bar, cancel)
│   ├── platform-adapters.md    (remaining: graceful shutdown, macOS/Linux installed apps)
│   ├── hotkeys.md              ← in-app + system-wide keyboard shortcuts
│   ├── tray-autostart.md       ← system tray icon + launch at startup
│   ├── export-import.md        ← export/import profiles as JSON
│   ├── session-logs.md         ← per-session launch/crash log
│   └── ui-redesign.md          ← Figma-driven full redesign
├── in-progress/                ← currently being worked on
└── done/                       ← shipped
    ├── profiles.md             ← profile CRUD, emoji, edit (v0.4.0)
    ├── process-control.md      ← start/stop/restart/kill, status LED (v0.3.1–v0.4.0)
    ├── sequencer.md            ← basic run sequence, delays (v0.3.1)
    ├── platform-adapters.md    ← PlatformAdapter trait, Windows installed apps (v0.4.0)
    ├── settings.md             ← Settings panel, storage, SteamGridDB key (v0.3.0–v0.4.0)
    └── background-art.md       ← SteamGridDB + local image backgrounds (v0.4.0)
```

Move a file from `planned/` → `in-progress/` when you start it, and to `done/` when it's shipped. Done files stay as a record of what was built and what remains.

## Phases reference

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Setup (Tauri, Tailwind, shadcn, FA, Cargo) | done |
| 1 | MVP scaffold (sidebar, dashboard, profile CRUD, IPC) | done |
| 2 | Process control (start/stop/restart/kill, status LED) | done |
| 3 | Sequencer (ordered launch, delays, fire-and-forget) | done (partial — wait strategies, progress bar remain) |
| 4 | Monitoring (sysinfo loop, sparklines, footer totals) | not started |
| 5 | UX polish (full redesign via Figma, hotkeys, animations, onboarding) | not started |
| 6 | Nice-to-have (tray, autostart, export/import, logs) | not started |

## Current version

**v0.4.0** — released 2026-05-09. See `CHANGELOG.md` for full notes.

Next up: see `backlog.md` for near-term items and `planned/` for feature specs.
