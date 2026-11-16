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
- [x] Progress indicator during sequence (hero button shows step/total) — v0.6.0
- [x] Cancel in-progress sequence — v0.6.0 (sequencer runs in Rust)
- [ ] Toast on sequence complete / error (shadcn Sonner)
- [x] Hotkey to trigger RUN SEQUENCE (configurable, global) — v0.6.0

## Notes

- Steam-problem: after `start_app`, scan process list for 10 s looking for a matching executable name; first match is assigned as tracked PID. Works cross-platform via `sysinfo`.
- If a process is already running when sequence starts, optionally skip it ("detect already running" — Phase 6).
