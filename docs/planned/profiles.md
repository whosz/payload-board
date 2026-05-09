# Profiles

## Goal
Named sets of apps a user can create, configure, and switch between. Profiles persist across restarts.

## Data shape

```ts
type Profile = {
  id: string;
  name: string;
  icon?: string;          // emoji or custom image
  description?: string;
  color_accent?: string;
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
};
```

Stored as JSON via `tauri-plugin-store` in the platform app data dir.

## Todos

- [ ] Profile CRUD (create, rename, delete) via Dialog
- [ ] Confirm dialog before delete
- [ ] Sidebar list with profile switching
- [ ] Emoji/icon picker on create
- [ ] Persist selected profile across restarts
- [ ] Export profile as JSON
- [ ] Import profile from JSON file

## Notes

- Multiple profiles supported; switching via left sidebar
- `+ NEW PROFILE` button at bottom of sidebar
- Deletion should warn if any apps in the profile are currently running
