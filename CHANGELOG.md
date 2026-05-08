# Changelog

All notable changes to Payload Board are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.5] — 2026-05-08

### Added
- Delete profile button: red X appears on hover next to each profile in the sidebar; errors surfaced as toast

## [0.2.4] — 2026-05-08

### Fixed
- Sidebar still rendering at 20px: in react-resizable-panels v4, a bare number in `defaultSize`/`minSize`/`maxSize` is treated as **pixels** (not %). Changed to string format: `"20%"`, `"12%"`, `"40%"`, `"80%"`

## [0.2.3] — 2026-05-08

### Fixed
- Sidebar resize fully broken: replaced shadcn `ResizablePanelGroup/Panel/Handle` wrappers with direct `Group/Panel/Separator` imports from `react-resizable-panels` — Tailwind classes on the shadcn wrapper conflicted with the library's internal inline styles, causing wrong initial size (~37px instead of 20%)
- Removed unused `faCircleSolid` import in AppTile (TS error)
- Fixed TS error: `style` prop not supported on `<Icon>` — crashed icon animation wrapped in `<span>` instead

## [0.2.2] — 2026-05-08

### Fixed
- Sidebar resize in both directions: reverted wrong `direction` prop → correct `orientation="horizontal"` (react-resizable-panels v4 TypeScript API)
- Sidebar content wrapped in `overflow: hidden` container so it can shrink below content intrinsic width
- ResizableHandle JS event handlers removed (were potentially blocking library's internal drag events); hover now handled via pure CSS `.resizable-handle:hover`
- Sidebar `minSize` relaxed: 14% → 12%; `maxSize` raised: 35% → 40%

## [0.2.1] — 2026-05-08

### Fixed
- Sidebar resize broken — `orientation` prop changed to `direction` (react-resizable-panels v4 API)
- All IPC calls (start/stop/restart/open/remove) now wrapped in try/catch; errors surfaced as dismissible toast notifications in bottom-right corner
- `End Session` button now catches and displays errors
- `.claude/` directory added to `.gitignore` to prevent local settings (and tokens) from being committed

### Changed
- Base font size: 14 px → 16 px
- App tile: 260×120 px → 340×170 px; padding 12 px → 14/16 px; icon size 11 px → 14 px
- Sidebar: profile items padding increased; `+ New Profile` button has hover background state
- Top bar: min-height 44 px → 56 px; buttons bumped to `size="default"` (from `sm`)
- Status bar: min-height 32 px → 44 px; letter-spacing added
- ResizableHandle: 1 px → 4 px, yellow glow on hover so it's discoverable
- Profile list items: hover background state added; active border 2 px → 3 px
- Tile buttons: `.tile-btn` CSS class — 60% opacity at rest, 100% on hover, scale(0.88) on press

## [0.2.0] — 2026-05-08

### Added

**Phase 2 — Process Control**
- `start_app` / `stop_app` / `restart_app` / `open_path` / `stop_all` IPC commands
- `ProcessManager`: in-memory PID tracking with `Running / Stopping / Stopped / Crashed` states
- 1 Hz background watcher — detects crashed processes and emits `process_status_changed` events
- PID re-adoption: after `start_app`, scan process list for 10 s to handle launchers that re-exec (Steam-problem)
- Graceful shutdown → force-kill after 5 s timeout on all platforms
- `PlatformAdapter::open_path` — Explorer `/select` (Win), `open -R` (macOS), `xdg-open` (Linux)
- Windows `graceful_close` via `taskkill` without `/F` (sends WM_CLOSE to windowed apps)
- `AppTile`: ▶ ■ ↻ 📁 controls + status LED (cyan glow / outline / red pulse for Crashed)
- `StatusBar`: live TOTAL / ALIVE / CRASHED counters
- `End Session` button wired to `stop_all`
- `sysinfo = "0.32"` + `tokio` added to Rust dependencies

### Changed
- Bundle ID: `com.matt.payload-board` → `com.payload-board`

## [0.1.0] — 2026-05-08

### Added

**Phase 0 — Setup**
- Tauri 2 + React + TypeScript + Vite project scaffold
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- shadcn/ui components: Button, Dialog, Input, Select, Switch, Tabs, Tooltip, ScrollArea, Resizable
- Full design system in `src/globals.css` — dark cockpit palette, `--radius: 0px`, FA icon CSS classes
- All shadcn components purged of `rounded-*` and `shadow-*` defaults
- `cockpit` button variant: yellow accent, monospace, uppercase
- FontAwesome 6 Free (Solid + Regular) with centralised icon registry in `src/components/icons/`
- `PlatformAdapter` trait with stub implementations for Windows, macOS, Linux
- Platform-conditional Cargo deps (`windows`, `freedesktop_entry_parser`)
- `.gitignore` covering `node_modules/`, `dist/`, `src-tauri/target/`, `src-tauri/gen/`

**Phase 1 — MVP Scaffold**
- Profile CRUD (create, rename, delete) with JSON persistence via `tauri-plugin-store`
- App entry management: add/remove apps per profile with name, path, and launch delay
- File picker integration via `tauri-plugin-dialog` (`pick_executable` IPC command)
- Suggested app name derived from executable filename (per-platform via `PlatformAdapter`)
- Two-column layout: 220 px sidebar + resizable main area (`ResizablePanelGroup`)
- Profile list sidebar with active accent border (`#FFE600`)
- App tile grid: 260×120 px tiles with status dot, name, path, edit/remove actions
- Session status bar: total enabled processes count
- Profile editor dialog and app entry editor dialog
- `useProfiles` hook for local state management
- Typed IPC wrappers in `src/ipc/profiles.ts`
- README.md with full usage docs and FAQ
- CHANGELOG.md
