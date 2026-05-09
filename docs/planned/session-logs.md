# Session Logs

## Goal

Timestamped log of each session: which apps launched, how long they ran, exit codes, and crash events. Useful for diagnosing recurring crashes and tracking usage.

---

## Data shape

```ts
type SessionLog = {
  id: string;
  profile_id: string;
  profile_name: string;     // snapshot at time of session
  started_at: string;       // ISO 8601
  ended_at: string | null;  // null if session is still active
  entries: SessionEntry[];
};

type SessionEntry = {
  app_id: string;
  app_name: string;         // snapshot
  started_at: string;
  ended_at: string | null;
  exit_code: number | null;
  crashed: boolean;
  error_message: string | null;
};
```

---

## Todos

### Backend

- [ ] Create a `SessionLog` struct in Rust matching the shape above
- [ ] On RUN SEQUENCE start: create a new `SessionLog`, store in memory
- [ ] On each `start_app`: append a `SessionEntry` with `started_at`
- [ ] On each process exit: fill `ended_at`, `exit_code`, `crashed` in the matching `SessionEntry`
- [ ] On END SESSION (or all apps stopped): set `SessionLog.ended_at`
- [ ] Persist logs to `session-logs.json` in the app data dir (append-only, keep last N sessions)
- [ ] Add `get_session_logs()` and `clear_session_logs()` IPC commands

### Frontend

- [ ] Session log viewer — accessible from Settings or a dedicated button in the footer
- [ ] List of past sessions with: profile name, date, duration, crash count
- [ ] Expandable row per session showing per-app detail
- [ ] Color-code: green row = clean exit, red = crashed, grey = force-killed
- [ ] "Clear logs" button in the viewer

---

## Notes

- Keep only the last 30 sessions by default (configurable or just hardcoded for now)
- Logs are local only — no telemetry or upload
- Duration = `ended_at - started_at`; show as `0h 04m 32s`
