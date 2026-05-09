# Sequencer — Done (partial)

Core sequencer shipped in v0.3.1.

## What was built

- RUN SEQUENCE button in dashboard top bar
- Launches apps in `order` field sequence
- Respects `launch_delay_ms` between each launch (waits the delay before starting the next app)
- Skips apps that are already running
- Toast on failure
- Only `fire_and_forget` wait strategy is implemented (launch and immediately move on)

## What's still missing

- [ ] **`wait_for_window` strategy** — poll for a visible window belonging to the process before continuing to next app; needed for apps that take time to initialise (e.g. iRacing)
- [ ] **`wait_seconds` strategy** — fixed additional wait after launch before continuing
- [ ] **Progress indicator** — show which app is currently launching during a sequence (progress bar or step indicator in the dashboard)
- [ ] **Cancel sequence** — button or hotkey to abort a sequence mid-run
- [ ] **Hotkey** — `Ctrl+R` to trigger RUN SEQUENCE from anywhere in the app
- [ ] **Steam-problem workaround** — Steam games launch via a Steam intermediate process; need to scan process list for the real executable after launch
