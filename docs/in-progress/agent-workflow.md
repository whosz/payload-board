# Agent & sub-agent workflow for v6 (Big Picture + Palette + Shortcuts)

Executes [ui-big-picture-palette.md](ui-big-picture-palette.md). Goal: **least tokens for the best result** — use agents only where parallel work or an independent check pays for the cold start. Complements [../planned/model-routing.md](../planned/model-routing.md) (model table) and the ponytail rules in `CLAUDE.md`.

## 1. Principles

1. **The main session is the orchestrator** (Sonnet, effort `medium`). It owns planning, contracts, merging, commits and the user conversation. Sub-agents never talk to the user.
2. **Spawn an agent only if** (a) the work can run in parallel on *disjoint files*, (b) an independent reviewer adds value, or (c) the output is a bulky search/QA result we only need summarised. Otherwise do it inline — an agent starts cold and re-reads context.
3. **Contracts before code.** Cross-boundary interfaces (Rust ↔ TS) are written down first (section 4) so both sides can be built at the same time.
4. **Max 2 sub-agents in parallel.** More means merge conflicts and token burn, not speed.
5. **Disjoint file ownership** (section 5). Anything shared is edited only by the orchestrator.
6. **Pass references, not content**: file paths + line ranges + the contract. Never paste whole files into prompts.
7. **Short reports**: every sub-agent ends with ≤ 15 lines (done / not done / files changed / commands run / open risks).
8. **Agents can't test on Windows.** They run in WSL/Linux: `tsc`, `vite build`, `cargo check/clippy`, headless-browser mocks. Global shortcuts, notifications, tray and WebView2 behaviour need the **Windows checklist** (section 8) run by the user after each phase.

## 2. Roster

| Role | Agent / model | Effort | Tools | Writes | Use for |
|------|---------------|--------|-------|--------|---------|
| Orchestrator | main session, Sonnet | medium | all | contracts, `App.tsx`, shared files, commits | planning, merging, gates |
| `scout` | built-in `Explore`, **Haiku** (`model: haiku`) | low | read-only | nothing | "where is X used", file maps, dependency checks. Report ≤ 20 lines |
| `architect` | built-in `Plan`, **Opus** (one-off) | high | read-only | nothing (returns a design) | D1 sequencer design, shortcut registry, failure modes. Only for phases S and 4 |
| `rust-dev` | custom, **Sonnet** | high | read/edit/bash | `src-tauri/**` only | sequencer, shortcuts, notification, serde migration. Must run `cargo check` + `cargo clippy` |
| `ui-dev` | custom, **Sonnet** | medium | read/edit/bash | `src/**` except `App.tsx`/shared files | hero, carousel, palette, settings UI. Must run `npx tsc --noEmit` + `npm run build` |
| `qa-visual` | custom, **Haiku** (Sonnet if it must fix a script) | low | bash, read | `docs/assets/qa/**` only | headless screenshots (3 themes × 900×600 / 1200×800 × grid/list/dialogs), keyboard-only script, contrast calculator. **Reports, never fixes** |
| `reviewer` | `/code-review medium` + `/ponytail-review`; **Opus** only for phases S, 4, 5 (risk: lifetimes, races, data format), otherwise Sonnet | medium–high | read-only | nothing (findings) | independent review before each phase commit |

Custom agents are defined as files (spec in section 9). `Explore` and `Plan` are built in, so `scout` and `architect` need no files.

## 3. Orchestration per phase

```
 P0  orchestrator ─ qa-visual (v5 mock shots) ─► user: Windows QA of v5
 ───────────────────────────────────────────────────────────────
 C   architect(Opus) ─► contracts (section 4) ─► orchestrator signs off
 ───────────────────────────────────────────────────────────────
 S   rust-dev ∥ ui-dev(useSequence against mocked events) ─► merge ─► gate
 1   ui-dev (sequential: ProfileTabs → Hero → Carousel → focus) ─► gate
 2   orchestrator inline (small)                               ─► gate
 3+4 ui-dev (registry, palette, Settings UI)  ∥  rust-dev (shortcuts.rs, commands, store)
                                    ─► integration (orchestrator) ─► gate
 5   rust-dev ∥ ui-dev (toast, settings)   [data-format ask first]  ─► gate
 6   ui-dev                                                         ─► gate
```

| Phase | Parallel? | Why |
|-------|-----------|-----|
| S | yes | Rust sequencer vs TS hook share only the event contract |
| 1 | **no** | every task touches `App.tsx`; splitting creates conflicts |
| 2 | no agent | ~1 h, cheaper inline |
| 3 + 4 | yes | `src/` vs `src-tauri/`; Settings UI waits for the shortcut commands but can use the contract + a stub |
| 5 | yes | same split |

### Gate after every phase (orchestrator runs it, in this order)

1. `npx tsc --noEmit` · `npm run build` · `cargo check` · `cargo clippy -- -D warnings` (in `src-tauri`)
2. `qa-visual` report: screenshots at 900×600 and 1200×800, dark/grey/light, keyboard-only pass, contrast of new colours ≥ 4.5:1
3. `reviewer` findings: fix or log each (nothing silently dropped)
4. Update the phase checkboxes in the plan, **commit** (one commit per phase, trailer as in `CLAUDE.md`), then hand the user the Windows checklist

Stop rule: a sub-agent that fails the same build/test **twice** stops and reports to the orchestrator instead of looping.

## 4. Contracts (draft — `architect` refines, orchestrator signs off before coding)

**Sequencer (phase S)**

```
commands:  run_sequence(profile_id: String) -> Result<(), String>
           cancel_sequence(profile_id: String) -> Result<(), String>
event:     sequence_progress {
             profile_id: string,
             state: 'launching' | 'running' | 'cancelled' | 'done' | 'error',
             step: number, total: number,       // 1-based
             app_id?: string, error?: string }
existing:  process_status_changed (unchanged payload)
```

`useSequence(profileId)` → `{ state, step, total, run(), cancel() }`.

**Shortcuts (phase 4)**

```
type ShortcutAction = 'palette' | 'run_sequence' | 'end_session'
                    | 'add_app' | 'new_profile' | 'settings'
interface ShortcutEntry { action; accelerator: string | null; default: string;
                          scope: 'global' | 'window'; }
commands:  get_shortcuts() -> ShortcutEntry[] + { global_enabled: boolean }
           set_shortcut(action, accelerator | null) -> Result<(), ShortcutError>
           reset_shortcut(action) -> ShortcutEntry
           set_global_shortcuts_enabled(enabled: bool)
ShortcutError = 'Invalid' | 'Conflict(action)' | 'Taken'   // Taken = OS refused
event:     shortcut_triggered { action }   // window-visible actions; run/end also work in Rust
```

Accelerator format: Tauri (`CommandOrControl+Shift+Space`). Frontend and palette read the same entries.

**Auto-restart (phase 5, only after the data-format OK)**: optional `AppEntry.restart_on_crash?: boolean`, `max_retries?: number` with `#[serde(default)]` on the Rust side.

## 5. File ownership (conflict avoidance)

| Area | Owner | Others |
|------|-------|--------|
| `src-tauri/**` incl. `Cargo.toml`, `Cargo.lock`, `capabilities/` | `rust-dev` | read-only |
| `package.json`, `package-lock.json` | `ui-dev` (only for deps it needs; ask orchestrator first) | — |
| `src/App.tsx`, `src/types.ts`, `src/globals.css` | **orchestrator** (small edits) / `ui-dev` in phase 1 only | `ui-dev` must request token changes |
| `src/components/**`, `src/hooks/**`, `src/lib/**` | `ui-dev` | `rust-dev` read-only |
| `docs/**`, `CLAUDE.md` | orchestrator | — |
| `docs/assets/qa/**` | `qa-visual` | — |

Parallel agents run in **separate git worktrees** (`isolation: "worktree"`) from the same base commit. The orchestrator merges (rust first, then ui) and resolves lockfile conflicts by re-running `cargo check` / `npm install`, never by hand-editing.

## 6. Prompt template for a sub-agent

```
Goal: <one sentence>          Phase: <S|1|3|4|5|6>   Branch/worktree: <name>
Read first (line ranges): <file:lines>, contract: agent-workflow.md §4 <section>
You own: <paths>        You must NOT touch: <paths>
Do: <numbered tasks, each verifiable>
Rules: follow CLAUDE.md (ponytail, tokens only in globals.css :root/[data-theme], WCAG baseline).
       New CSS variables go in :root / [data-theme], never @theme inline.
Done when: <commands that must pass>
Stop and report if: the same check fails twice, or a task needs a file you don't own.
Report (≤ 15 lines): done / not done · files changed · commands + results · risks · Windows-only checks needed
```

## 7. Token budget

- Haiku for search and QA runs; Sonnet `medium` for UI; Sonnet `high` only for Rust and the palette's ARIA/keyboard logic; Opus only for `architect` (S, 4) and `reviewer` (S, 4, 5).
- One `qa-visual` run per phase, not per edit. Screenshots are read once and summarised; the image paths go in the report.
- `/compact` between phases; start a fresh session per phase when context passes ~50 %.
- Reuse what exists before writing: `AppControls`, `TileBackdrop`, base-ui `Dialog`, `STATUS_LABEL`, the settings store, the `process_status_changed` event.
- Don't ask a sub-agent to "explore the repo". Give it the files.

## 8. Windows checklist (user, after each phase that touches Rust or the window)

- Global shortcuts work with the window **hidden to tray** and while a game has focus; failing/conflicting keys show an error and are reversible in Settings
- Run / end via shortcut; End session needs the second press
- Sequence with delays still starts apps in order; cancel works; a crashed app shows up in the hero
- Fonts and tile art render correctly; 900×600 and 1200×800 both fine
- Tray minimise/restore, autostart, start-minimised unaffected

## 9. Setup steps before the first phase — **A1–A4 done** (2026-11-14)

| Step | What | Status |
|------|------|--------|
| A1 | `.gitignore`: `.claude/` → `.claude/*` + `!.claude/agents/` (settings files stay ignored; verified with `git check-ignore`) | done |
| A2 | `.claude/agents/{rust-dev,ui-dev,qa-visual,reviewer}.md` | done |
| A3 | Visual QA harness in `scripts/visual-qa/` (`tauri-mock.js`, `shoot.mjs`, `contrast.mjs`), `playwright-core` devDependency, npm scripts `qa:shots` and `qa:contrast` | done |
| A4 | Figma token entries removed from the `permissions.allow` lists (global, project, project-local). **You still need to revoke the token in Figma** — it remains in old session logs under `~/.claude/projects/` (other projects) | done, revoke pending |

How the QA tooling is used: `npm run qa:contrast` (exit code 1 on failures) and `npm run qa:shots -- --out docs/assets/qa --themes dark,grey,light --sizes 1280x800,900x600 --views grid,list,settings,add [--tab 12]`. It starts Vite itself, mocks the Tauri backend in the browser and stops the server afterwards. It cannot see Windows-only behaviour.

Agent definition sketch (A2):

```
---
name: rust-dev
description: Implements Rust/Tauri changes under src-tauri only. Use for sequencer, shortcuts, notifications, serde migrations.
model: sonnet
tools: Read, Grep, Glob, Edit, Write, Bash
---
Own only src-tauri/**. Follow CLAUDE.md. Run cargo check and cargo clippy -- -D warnings before reporting.
New persisted fields: Option<T> + #[serde(default)]. Report in ≤ 15 lines.
```

## 10. Risks specific to the agent approach

| Risk | Mitigation |
|------|-----------|
| Rust and TS drift from the contract | Contract in §4 is the single source; orchestrator diffs payload names at merge; `qa-visual` exercises events with the mock |
| Merge conflicts in lockfiles / `App.tsx` | Ownership table; rust first, then ui; lockfiles regenerated |
| Agents "verify" only the happy path | Gate includes keyboard-only pass and the Windows checklist; reviewer is a different model/agent than the author |
| Token blow-up from exploratory agents | Haiku `scout` only, ≤ 20-line reports; no whole-file prompts |
| Hidden-window timers (JS sequencer) | Removed by D1; if D1 is rejected, phase 4 gets an explicit Windows test for delays with the window hidden |
