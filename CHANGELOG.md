# Changelog

All notable changes to Payload Board are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.5.0] — 2026-05-14

### Changed
- **Full UI rebuild** — every React component rewritten from Figma specs; no layout logic or Tauri backend changed
- **Layout** — outer padding (`8px`), two rounded panels (`r=16`): SidePanel `266px` fixed + MainPanel `flex-1`; both use semi-transparent `bg-surface` with gradient background visible behind them
- **Color system** — all colors migrated to CSS custom properties (`--color-*`); Purple (default) and Grey themes selectable in Settings; `[data-theme]` attribute on `<html>`; gradient background via `body::before` with three radial ellipses per theme
- **Typography** — Orbitron for all headers/labels (profile name 20px/600/2px, tile name 16px/700/2px, list row name 12px/700/2px, section labels 10px/600/1.5px uppercase); Onest for body text, paths, buttons, inputs
- **AppTile** — 260×180px, `bg-elevated` base, SVG grid placeholder pattern when no background image; background photo at 50% opacity (100% on hover); teal glow dot for running state; red border + error note pill for crashed state; hover scale `1.01`
- **AppListRow** — 52px rows, `padding: 8px 16px`, `gap: 16px`; same status LED logic as tile; Orbitron 12/700/2px name, Onest 11/500 path
- **Button variants** — CTA/Fill/Destructive are uppercase Onest 10/600; Default (modal actions) uppercase text-primary; Outline (Sort/view toggles) text-secondary no-uppercase; Ghost no-border muted; Nav sidebar buttons; compound variants for Destructive Small (filled error-bg)
- **ProfileList** — active item has 4px status-live left bar; hover reveals edit/delete icon buttons; "Profiles" header and nav button labels Orbitron 10/600/1.5px uppercase
- **StatusBar** — "Total" Orbitron 10/600, "Alive"/"Crashed" Orbitron 10/400, all text-secondary
- **Modals** — ProfileEditor and AppEntryEditor: `bg-base`, `border-divider`, `r=8`, inline Orbitron header + X close; emoji picker; footer with `border-top`; label flash on close fixed
- **Settings** — inline header style matching editors; White theme option removed (kept in CSS, removed from UI); SteamGridDB input/button sizes unified
- **Icon component** — color via CSS vars (`--color-text-muted` default, `--color-status-live` for active/live, `--color-status-crit` for crit, `--color-text-secondary` for secondary)
- **Theme-aware SVG tile placeholder** — three separate SVG files (`tile-placeholder.svg`, `tile-placeholder-grey.svg`) referenced via `--tile-placeholder-url` CSS variable
- Removed `react-resizable-panels` dependency; removed `src/components/ui/resizable.tsx`

## [0.4.1] — 2026-05-09

### Added
- **CLI arguments field** — free-text input in the app editor (below executable path); args are displayed in small mono text on the tile and list row
- **Browse installed apps — macOS & Linux** — macOS scans `/Applications` and `~/Applications` for `.app` bundles; Linux parses `.desktop` files from standard XDG application directories; Windows registry support was already in v0.4.0
- **Detect already running** — launching an app that is already running on the OS adopts the existing process instead of double-launching; scanning also runs automatically when switching profiles
- **Profile description in top bar** — when a profile with a description is active, the description appears below the profile name in the top panel

### Changed
- "UI redesign" and "App-specific preset dropdowns" moved to Future release ideas in backlog

## [0.4.0] — 2026-05-09

### Added
- **SteamGridDB background art** — each app tile can display game artwork as a background (dark overlay preserves readability); pick art via the new SteamGridDB picker in the app editor (search game → pick grid image); API key configured in Settings
- **Local background image** — "Local image..." button in app editor lets you pick any image file as tile background
- **List view** — toggle between grid (cards) and list (compact rows) via grid/list icon buttons on the right of the sort bar; list rows show status LED, name, path, delay badge and all process controls in a single 44px row
- **Profile emoji & description** — emoji picker (75 icons) and optional description field in profile editor; emoji displayed in sidebar before profile name
- **Browse installed apps** — "Installed..." button in app editor opens a searchable list of apps read from Windows registry (`HKLM/HKCU Uninstall`); Windows only, returns empty list on other platforms
- **Edit profile** — pen icon appears on hover next to each profile in sidebar; opens profile editor pre-filled with name, emoji and description
- **API key save feedback** — Settings SteamGridDB section shows "API key saved." or "Failed to save API key." after pressing Save

### Fixed
- **App editing** — editing an existing app no longer creates a duplicate; dialog shows "Edit Application" / "Save" when editing, "Add Application" / "Add App" when creating
- **Error message in crashed tile** — when `start_app` or `restart_app` fails, the error is shown in red inside the tile below the path (in addition to the toast)
- **SteamGridDB API key** — key now persists correctly across restarts (was silently discarded due to incorrect store serialization)
- **App tile light mode** — tile text is always readable when background art is set; colors are pinned to dark values regardless of active theme

### Changed
- App tile control buttons have a semi-transparent dark overlay behind them when a background image is loaded
- Remove button on app tiles is now gray by default, turns red on hover
- Trash icon replaces X in both app tile remove button and profile delete button
- Confirm modal added before removing an app from a profile
- Executable path now sits immediately below app name in the tile (no large gap)
- Settings config path shown as a full readable block (click to open in file manager)
- Removed "Icon" section from Add/Edit Application dialog (auto-detection was unreliable)
- Removed auto icon detection entirely (`extract_icon` / `extract_app_icon`); custom icon files still supported
- README: removed Platform notes table, restructured Installation into Windows (ready to download) vs macOS/Linux (build from source), added simracing inspiration note

## [0.3.1] — 2026-05-08

### Fixed
- IPC args were snake_case (`profile_id`, `entry_id`) — Tauri 2 requires camelCase (`profileId`, `entryId`); all process commands now work correctly
- "Run Sequence" button had no `onClick` handler — now iterates sorted apps, respects `launch_delay_ms`, skips already-running apps

### Added
- App icons: auto-detected from XDG icon theme (Linux), adjacent image files (Windows/macOS); custom image picker; 20×20 icon shown on tile
- Sort bar above tile grid: A→Z / Z→A toggle (click active to reset to manual order)
- Hover states on all header buttons (Add App, Run Sequence, End Session, Settings)

### Changed
- About section: removed email, kept GitHub link only
- CI: portable `.zip` added to GitHub Release alongside installers; bundle targets narrowed to `["nsis", "msi"]`

## [0.3.0] — 2026-05-08

### Added
- **Settings panel** (gear icon, top-right): four sections — Appearance, Storage, Danger Zone, About
- **Light mode** — toggles `body.light` CSS class; preference persisted in `localStorage`; all hardcoded hex values replaced with `var(--color-*)` throughout every component so the theme cascades automatically
- **Confirm delete dialog** — modal confirmation before a profile is removed
- **Storage section**: shows current config directory, button to open it in the file manager, "Change directory" folder picker that migrates all data to the new location, "Reset to default" button
- **Danger Zone** — "Reset all data" with inline double-confirmation
- **About section** — app version (read from Tauri), creator contact, repo link
- Rust commands: `get_data_dir`, `get_profiles_dir`, `pick_config_dir`, `set_profiles_dir`, `reset_all_data`, `open_profiles_dir`
- `store.rs` now supports a custom profiles directory stored in a separate `payload-board-settings.json`; effective path resolved dynamically on every load/save

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
