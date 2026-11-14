# Payload Board

Tauri 2 (Rust) + React 19 + Tailwind 4 + shadcn/base-ui. Windows-first desktop app; macOS/Linux supported.

## Commands

- `npm run dev` — Vite only (port 1420); `npm run tauri dev` — full app
- `npm run build` — `tsc && vite build` (run before finishing any change)

## Working rules

- Follow ponytail (already enabled): smallest change that works, reuse existing components/tokens.
- Colours, fonts, radii live in `src/globals.css` tokens only — no hardcoded values in components.
- Changing the profile JSON shape needs a migration in Rust (`src-tauri`) — ask first.
- Docs: plans in `docs/planned/`, move to `docs/in-progress/` then `docs/done/`. Current top priority: `docs/in-progress/ui-restyle-v5.md`.

## Models (see `docs/planned/model-routing.md`)

- Search / exploration: Haiku (`Explore` agent). Implementation: Sonnet. Opus only for architecture or data-format decisions.
- Don't spawn agents for work 1–3 tool calls can do. Read line ranges, not whole files.

## Accessibility baseline

WCAG 2.2 AA: contrast ≥ 4.5:1, targets ≥ 24 px, visible `:focus-visible`, status never by colour alone, respect `prefers-reduced-motion`.
