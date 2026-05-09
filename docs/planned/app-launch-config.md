# App Launch Configuration

## Goal
Give users control over how each app is launched — via free-form CLI arguments and, for select apps, a curated set of options exposed as a dropdown.

---

## Feature 1: CLI arguments field

A free-text input for launch arguments, shown directly below the executable path field in the app entry editor. Easy to paste into, easy to clear.

### Todos

- [ ] Add `args: string` field to `AppEntry` (raw string, split on spawn)
- [ ] Render args input below the path field in `AppEntryEditor`
- [ ] Placeholder text: e.g. `--no-update --windowed`
- [ ] On launch, split string into `Vec<String>` and pass to `tauri-plugin-shell`
- [ ] Show current args in a collapsed summary on the tile (muted, monospace) when set

### UX notes

- Single text input, not a tag system — paste-friendly is the priority
- Monospace font (`JetBrains Mono`), `--text-secondary` color, small (11–12 px)
- Optional field — empty by default, no visual noise when unused

---

## Feature 2: App-specific option presets (dropdown)

Some apps (e.g. CrewChief) expose meaningful launch modes or config flags that are better represented as a labeled dropdown than a raw args string. The dropdown is only visible for apps that have a known preset set defined.

### Todos

- [ ] Define a `presets` registry: `Record<string, Preset[]>` keyed by app name (as entered by the user)
- [ ] `Preset` shape: `{ label: string; args: string; description?: string }`
- [ ] In `AppEntryEditor`, detect if the app name matches a known preset key (case-insensitive)
- [ ] If match found: show a dropdown (shadcn `Select`) below the args field labeled `Preset options`
- [ ] Selecting a preset appends its args to the existing args field (does not replace)
- [ ] If no match: dropdown is hidden entirely — no empty UI clutter

### Known apps to add presets for

- **CrewChief** — language/spotter options, UDP mode flags

### Preset registry location

`src/lib/presets.ts` — plain TS object, easy to extend without touching core logic.

### UX notes

- Dropdown label: `PRESET OPTIONS` (uppercase, `--text-muted`, 11 px)
- Selecting a preset should feel like a shortcut, not a replacement — user can still edit the args field freely after
- If a preset is active, show its label in muted text next to the args input as a hint
- Dropdown only appears after the executable path is set and matched
