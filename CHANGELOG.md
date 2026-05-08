# Changelog

All notable changes to Payload Board are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
