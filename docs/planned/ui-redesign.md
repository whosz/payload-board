# UI Redesign

## Goal
Replace the current UI with a new design created in Figma. Covers component redesigns, design token updates (fonts + colours), onboarding, and logo integration. Figma MCP is used to pull assets and specs directly into code.

---

## Phase A — Figma preparation (design side)

Before any code changes, the Figma file needs to be structured for clean handoff via MCP.

- [ ] Finalise new designs for all existing components (see component list below)
- [ ] Define new colour styles as Figma variables — will map directly to CSS custom properties
- [ ] Define new typography styles (font families, sizes, weights, line heights)
- [ ] Design onboarding screens (see Feature 4)
- [ ] Prepare logo assets (SVG, multiple sizes, dark/light variants if needed)
- [ ] Organise Figma file into clearly named pages/sections — MCP reads file structure, clean naming = cleaner output

---

## Feature 1: Redesigned components

Replace current shadcn-based components with designs from Figma. Work through these one by one — update, test, move on.

### Component list

| Component | Location | Notes |
|-----------|----------|-------|
| App tile | `dashboard/AppTile.tsx` | Core element — prioritise first |
| Sidebar / profile list | `sidebar/ProfileList.tsx` | |
| Top bar | `App.tsx` | RUN SEQUENCE + END SESSION CTAs |
| Status LED | `AppTile.tsx` | RUNNING / STOPPED / CRASHED states |
| Sparkline | `dashboard/Sparkline.tsx` | |
| Footer / status bar | `dashboard/StatusBar.tsx` | System totals |
| Profile editor dialog | `editor/ProfileEditor.tsx` | |
| App entry editor | `editor/AppEntryEditor.tsx` | Includes args field + preset dropdown |
| Buttons | `ui/button.tsx` | All variants |
| Inputs | `ui/input.tsx` | Path field, args field |
| Select / dropdown | `ui/select.tsx` | Preset options dropdown |
| Dialog / modal | `ui/dialog.tsx` | Confirms, editors |
| Toast | Sonner config | Sequence complete / error |

### Todos

- [ ] Connect Figma MCP to the repo workspace
- [ ] For each component: pull design specs from Figma via MCP, update JSX + CSS accordingly
- [ ] Visual QA each component against the Figma frame after update
- [ ] Remove any leftover shadcn default styles that the redesign replaces

---

## Feature 2: Figma MCP integration

Using the Figma MCP server to pull design tokens and component specs directly — avoiding manual copy-paste of values.

### Todos

- [ ] Set up Figma MCP server (requires Figma API token + MCP config)
- [ ] Connect to the Figma file for Payload Board
- [ ] Use MCP to extract colour variables → update `src/styles/tokens.css`
- [ ] Use MCP to extract typography styles → update font stack and scale in `tokens.css`
- [ ] Use MCP to inspect component specs (spacing, sizing, border styles) during component updates
- [ ] Confirm MCP is reading from the correct Figma file/page before starting component work

### Notes

- MCP reads live Figma data — make sure the Figma file is in a stable state before pulling (avoid mid-edit pulls)
- Keep `tokens.css` as the single source of truth on the code side; all MCP-derived values land here first

---

## Feature 3: New colour and typography

Replace current dark cockpit tokens with the new system coming from Figma.

### Todos

- [ ] Export new colour variables from Figma via MCP → update all custom properties in `tokens.css`
- [ ] Update shadcn HSL mappings (`--background`, `--foreground`, `--primary`, etc.) to match new palette
- [ ] Replace font families in `tokens.css` and `index.html` (Google Fonts / local font import)
- [ ] Update font size scale, weights, and letter-spacing to match Figma type styles
- [ ] Audit every component for hardcoded colour or font values — replace with tokens
- [ ] Test light mode toggle if it remains part of the new design

### Notes

- All colour and font changes go through `tokens.css` only — no hardcoded values in component files
- If the new design drops or changes light mode, remove the toggle and clean up the persisted preference in localStorage

---

## Feature 4: In-app onboarding

First-run experience for new users. Shown once, then never again (state persisted).

### Todos

- [ ] Design onboarding screens in Figma before building (part of Phase A)
- [ ] Decide on format: modal overlay, full-screen takeover, or step-by-step coach marks — align with Figma design
- [ ] Build onboarding flow component(s) based on Figma designs via MCP
- [ ] Steps to cover (draft — update once Figma designs are final):
  - [ ] Welcome screen + what Payload Board does (1 screen)
  - [ ] Create your first profile (guided)
  - [ ] Add your first app (guided)
  - [ ] Run your first sequence (prompt)
- [ ] Persist `onboarding_complete` flag in `tauri-plugin-store`
- [ ] Skip button on every step
- [ ] Ability to re-trigger onboarding from Settings

---

## Feature 5: Logo

Add the Payload Board logo to the app UI and window assets.

### Todos

- [ ] Finalise logo in Figma (SVG, at minimum 16 / 32 / 128 / 256 px variants)
- [ ] Export from Figma via MCP or manual export
- [ ] Add logo to sidebar header or top bar (confirm placement in Figma)
- [ ] Replace placeholder Tauri app icon with logo:
  - [ ] `src-tauri/icons/` — replace all sizes (32x32, 128x128, 256x256, icon.ico, icon.icns)
  - [ ] Update `tauri.conf.json` icon paths if needed
- [ ] Confirm logo renders correctly in both colour modes if applicable

---

## Suggested order of work

1. Finish Figma designs (Phase A) — don't start code until designs are stable
2. Set up Figma MCP connection (Feature 2)
3. Pull tokens → update `tokens.css` (Feature 3)
4. Redesign components one by one (Feature 1), starting with App Tile
5. Build onboarding (Feature 4)
6. Integrate logo (Feature 5)
7. Full visual QA pass across all screens
