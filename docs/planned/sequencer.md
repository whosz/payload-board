# Sequencer

## Goal
Launch all apps in a profile one by one, in configured order, with optional delays and wait strategies. Cancel at any point.

## Todos

- [ ] `start_sequence(profile_id)` Rust command
- [ ] Respect `order` field across all app entries
- [ ] Respect `launch_delay_ms` between each launch
- [ ] Implement `wait_strategy`:
  - `fire_and_forget` — launch and immediately move to next
  - `wait_for_window` — poll for a window belonging to the process before continuing
  - `wait_seconds` — fixed delay
- [ ] Progress bar / indicator at top of dashboard during sequence
- [ ] Cancel in-progress sequence
- [ ] Toast on sequence complete / error (shadcn Sonner)
- [ ] Hotkey: `Ctrl/Cmd+R` to trigger RUN SEQUENCE

## Notes

- Steam-problem: after `start_app`, scan process list for 10 s looking for a matching executable name; first match is assigned as tracked PID. Works cross-platform via `sysinfo`.
- If a process is already running when sequence starts, optionally skip it ("detect already running" — Phase 6).
