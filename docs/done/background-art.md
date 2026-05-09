# Background Art — Done

Shipped in v0.4.0.

## What was built

Each app tile can display a background image with a dark gradient overlay for readability.

### Sources
- **SteamGridDB** — two-step picker: search by game name → choose from 460×215 grid images; API calls proxied through Rust (`reqwest`) to avoid CORS
- **Local image** — file picker (`pickIconFile`) for any local image file

### Implementation notes
- Background URL stored as `background_url?: string` on `AppEntry`
- URL detection: `url.startsWith('http') ? url : convertFileSrc(url)` — remote URLs pass through, local paths need `convertFileSrc`
- Dark overlay: `linear-gradient(rgba(10,10,11,0.82) 0%, rgba(10,10,11,0.72) 50%, rgba(10,10,11,0.88) 100%)` over the image
- Tile text colors are pinned to dark hex values (not CSS vars) when a background is set, so they stay readable in light mode
- Control button row has an additional `rgba(10,10,11,0.55)` semi-transparent strip behind it
- API key stored in `payload-board-settings.json` via `tauri-plugin-store` as `serde_json::Value::String`

### SteamGridDB API
- Search: `GET /api/v2/search/autocomplete/{term}`
- Grids: `GET /api/v2/grids/game/{id}?dimensions=460x215`
- API key configured in Settings → SteamGridDB section

## What's still missing

- [ ] **More grid dimensions** — currently only 460×215; could offer hero art (600×900) or other sizes as alternatives
- [ ] **Clear button in tile** — currently only clearable via the app editor; could add a quick-clear from the tile context menu (if a context menu is ever added)
