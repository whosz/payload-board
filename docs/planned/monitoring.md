# Monitoring

## Goal
Real-time per-process metrics (CPU%, RAM) shown in each app tile. System totals in a footer bar. 60-second sparkline per tile.

## Todos

- [ ] `sysinfo` loop at 1 Hz in Rust backend
- [ ] Emit `metrics_tick` event to frontend: `{ entry_id, pid, status, cpu_pct, ram_mb, uptime_s, history: [...] }`
- [ ] Sparkline per tile (uPlot — smaller and sharper than Recharts)
- [ ] CPU color thresholds: > 80% → `--status-warn`, > 95% → `--status-crit`
- [ ] Sparkline color follows same thresholds
- [ ] Footer bar: total CPU%, total RAM used, system free RAM, count of alive processes
- [ ] Uptime counter per tile (formatted as `0h 04m`)

## Sparkline notes

- 60-second rolling window, 1 data point per second
- Width matches tile; height ~24 px
- No axes, no labels — pure signal
- Color: `--status-live` baseline, shifts to warn/crit at thresholds
- Use `uPlot` (lighter than Recharts, sharper rendering)

## Status LED

| State | Color | Style |
|-------|-------|-------|
| RUNNING | `--status-live` (#00E5FF) | Filled dot, `box-shadow: 0 0 8px var(--status-live)` |
| STOPPED | `--text-muted` | Outline dot (FA Regular circle) |
| CRASHED | `--status-crit` (#FF2D55) | Filled, `animation: pulse 1s infinite` |
