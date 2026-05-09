# Profiles — Done

Shipped in v0.4.0.

## What was built

- Profile CRUD: create, rename, delete via Dialog
- Confirm modal before delete
- Sidebar list with profile switching; active profile highlighted with yellow left border
- Emoji picker (75 emoji) on create/edit
- Optional description field
- Pen icon on hover → opens profile editor pre-filled
- Trash icon on hover → confirm modal before delete

## Data shape (as shipped)

```ts
type Profile = {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color_accent?: string;   // defined but not used in UI yet
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
};
```

Stored as JSON array via `tauri-plugin-store` in `profiles.json` (default path) or a custom path set in settings.

## What's still missing

- [ ] **Persist selected profile across restarts** — on launch, restore the last active profile ID from `tauri-plugin-store`
- [ ] **Warn if apps are running** — when deleting a profile, check if any of its apps are currently running and warn before proceeding
- [ ] **Duplicate profile** — clone an existing profile as a starting point; see backlog
- [ ] **Export / import as JSON** — see backlog
