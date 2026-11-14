# UI Restyle v5 — "Rig" look on the current layout

**Status: in progress on branch `feat/ui-restyle-v5` (phases 1–4 implemented, phase 5 = manual QA in the real Tauri app).** Priority: highest. Supersedes the Figma-driven approach in `ui-redesign.md` for visuals; keep that file for onboarding and logo work.

## Goal

New look and feel only. **Layout, components and behaviour stay as they are**: sidebar with profiles, header with RUN SEQUENCE / END SESSION, toolbar, tile grid, status bar. No new features.

Mockup (private artifact, v1–v5 side by side): https://claude.ai/artifact/RbuTCyfJ4tbEv2CKCpy2Fh — **v5 is the target.**

## Decisions

| Topic | Decision |
|-------|----------|
| Direction | Graphite + one orange accent (Teenage Engineering-style restraint), hardware-instrument details. Deliberately *not* close to the Fanatec app (v3 rejected) and *not* full neon PCB (v1 rejected as over-engineered) |
| Layout | Unchanged from the current app |
| Cables, knobs, sequencer, draggable windows | **Out of scope** (v1 only) |
| Fonts | Big Shoulders 800 (headings), Barlow Semi Condensed 500–700 (UI text), IBM Plex Mono 600 (micro labels), Racing Sans One (tile letter only; chosen over Kanit / Saira italic and Exo 2 / Teko, whose variable outlines show overlapping contours) |
| Per-app colour | Only in the tile background glow and outlined letter. Never on controls |
| Status colour | Live `#3ee08f`, crashed `#ff2e4d`, stopped grey. Always paired with a text label |
| Tile background | first letter of the app name, outlined in the app colour (glow + dashed echo + grain), no image files. Real artwork (SteamGridDB / local) still overrides it |
| Replicate | Not needed now. Revisit only for a background texture or sample cover art |

## Tokens (all in `src/globals.css`, no hardcoded values in components)

```
--color-bg-base      #121211     --color-bg-desk     #0e0e0d
--color-bg-surface   #161615     --color-bg-elevated #20201e
--color-border       #2e2d29     --color-border-strong #3b3a36
--color-text-primary #ecebe6     --color-text-muted  #9a9892
--color-accent       #ff6a13     --color-status-live #3ee08f
--color-status-crit  #ff2e4d     --color-error-text  #ff9aa9
--font-display 'Big Shoulders'   --font-body 'Barlow Semi Condensed'
--font-mono 'IBM Plex Mono'
```

Themes: dark (default), grey, light desk. Accent stays the same across themes. Replaces the current purple / grey themes.

## Accessibility (WCAG 2.2 AA) — acceptance criteria

- [x] Text contrast ≥ 4.5:1 (checked for all three themes; grey `crit` and light `accent`/`live`/`crit` were adjusted to pass)
- [x] Micro labels ≥ 11 px
- [x] Click targets ≥ 24 px (SC 2.5.8); icon buttons 32 px, text buttons 36 px
- [x] One button scale: text buttons 36 px tall, square toggles 36×36, tile icon buttons 32 px
- [x] Visible focus ring (`:focus-visible`, 2 px accent, 2 px offset) on every control
- [x] Status never conveyed by colour alone (LIVE / CRASHED / STOPPED text next to the LED)
- [x] Decorative SVG `aria-hidden`; icon-only buttons have `aria-label`
- [x] `aria-pressed` on view toggle, `aria-current` on the active profile, real `disabled` on RUN SEQUENCE
- [x] `prefers-reduced-motion`: no moving dot, no pulsing LED
- [x] The segment strip on tiles is decorative (2 px, 45 % opacity, `aria-hidden`)

## Implementation phases

| # | Scope | Files | Est. |
|---|-------|-------|------|
| 1 | Tokens, fonts, themes (dark / grey / light), focus ring, reduced motion. **Bundle fonts locally** with `@fontsource` (Big Shoulders, Barlow Semi Condensed, IBM Plex Mono, Racing Sans One) instead of the Google Fonts `@import` in `globals.css` — a desktop app must not depend on the network for its typeface | `globals.css`, `index.html`, `App.tsx` (theme state) | 15 min |
| 2 | Tile: first-letter background, status chip, segment strip, 32 px actions | `AppTile.tsx`, new `TileBackdrop.tsx` | 45 min |
| 3 | Sidebar, header, toolbar, status bar with segment counters | `ProfileList.tsx`, `App.tsx`, `StatusBar.tsx` | 30 min |
| 4 | List view, dialogs, inputs, selects, settings | `AppListRow.tsx`, `ui/*`, `editor/*`, `SettingsPanel.tsx` | 45 min |
| 5 | Visual QA against the mockup + a11y pass (keyboard, contrast) | — | 20 min |
| | **Total** | | **~2.5 h** + 1–2 feedback rounds |

Work on a branch (`feat/ui-restyle-v5`), one commit per phase, ship as v0.6.0.

## Out of scope / later

- Own title bar, left icon rail (only worth it once there are more screens)
- Onboarding and logo integration — stay in `ui-redesign.md`
- Replicate-generated textures

## Inspiration (sources)

- Teenage Engineering — constraints as aesthetic: https://blakecrosley.com/de/guides/design/teenage-engineering
- Teenage Engineering — design perspective: https://designwanted.com/teenage-engineering-creating-design-perspective
- LED flag panels and segmented displays in GT cars: https://www.patreon.com/posts/146689166
- Broadcast-style pit wall cards and panels: https://github.com/AbhinavPabbaraju/f1-pit-wall
- Telemetry dashboard research for sim racers: https://essay.utwente.nl/essays/95989

## Follow-up work (done in the same session as this plan)

1. Check ponytail is installed → **yes** (`ponytail@ponytail`, enabled).
2. Optimise skills / agents and split work between models → `docs/planned/model-routing.md`.
3. Optimise the app code → after the tooling work, before phase 1 above.

## Implementation notes (phases 1–4 done)

- Token names from v0.5 were kept (values changed), plus `--color-accent`, `--color-accent-fg`, `--color-bg-desk`, `--color-desk-vignette`. Three undefined tokens that components already used (`border-default`, `bg-hover`, `accent-laser`) are now defined.
- Themes are `dark` / `grey` / `light`; any stored `purple` value falls back to `dark`.
- New: `lib/appColor.ts` (stable per-app colour from `order`), `TileBackdrop.tsx` (outlined first letter), `AppControls.tsx` (shared by tile and list row, replaces two duplicated button groups).
- Light theme is a separate design, not an inverted dark: warm paper panels, white tiles, darker per-app colours (`--app-color-N`), no glow/grain (`--tile-*` tokens). New tokens must live in `:root` / `[data-theme]`, **not** in `@theme inline` — Tailwind 4 drops unused theme variables from there.
- Fonts are bundled via `@fontsource` (works offline).
- Verified with a mocked Tauri backend in headless Chromium (dark / grey / light, grid / list, settings and add-app dialogs). **Not yet verified in the real Tauri window** — do that before merging (phase 5): keyboard-only pass, Windows font rendering, SteamGridDB artwork over the new gradient.
- Not restyled yet: `DesignReference.tsx` (dev-only); `SteamGridPicker` / `InstalledAppsPicker` only got the shared radius/colour replacements.
