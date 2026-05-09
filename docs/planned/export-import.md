# Export / Import Profiles

## Goal

Let users back up their profiles, move them between machines, or share them with others.

---

## Feature 1: Export profile to JSON

Download a single profile (or all profiles) as a `.json` file.

### Todos

- [ ] Add `export_profile(profile_id)` Rust command — serializes the profile to JSON, opens a save-file dialog, writes to chosen path
- [ ] Add `export_all_profiles()` variant — exports all profiles as a JSON array
- [ ] Add "Export..." button in the profile context menu or profile editor footer
- [ ] Exported filename default: `{profile-name}-payload-board.json`

---

## Feature 2: Import profile from JSON

Load a previously exported profile file into the app.

### Todos

- [ ] Add `import_profile()` Rust command — opens a file picker (`.json` filter), parses, validates, and merges into current profiles
- [ ] Validate imported JSON against the `Profile` schema before saving; show error if malformed
- [ ] Generate a new `id` and `created_at` / `updated_at` for the imported profile (avoid ID collisions)
- [ ] If a profile with the same name already exists, prompt: "Replace" / "Import as copy" / "Cancel"
- [ ] Add "Import profile..." button in the sidebar footer or Settings panel

---

## Notes

- `executable_path` values in an exported profile are machine-specific — they won't work on import if paths differ; consider showing a warning
- Background `background_url` pointing to a local file will break on import to a different machine; remote (SteamGridDB) URLs are safe
- Keep the schema simple — no versioning needed until the `AppEntry` shape changes significantly
