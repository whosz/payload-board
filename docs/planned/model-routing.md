# Model routing & token budget

Goal: least tokens for the same result. Ponytail (`ponytail@ponytail`, already installed and enabled, level `full`) handles *what gets written*; this file covers *which model does what*.

## Audit of what exists

| Item | State | Action |
|------|-------|--------|
| Plugin `ponytail@ponytail` | installed, enabled | none |
| Custom agents (`~/.claude/agents`, `.claude/agents`) | none exist | none — built-in agents + the `model` parameter are enough |
| User skill `no-ai-slop` | 97 lines, loads only on trigger, description is precise | leave as is; use for README / CHANGELOG prose only |
| Project `CLAUDE.md` | missing | added (short, loaded every session) |
| Default model | `sonnet`, effort `high` | keep; lower effort for mechanical work |

> Agent roster and per-phase orchestration for the v6 work: [../done/agent-workflow.md](../done/agent-workflow.md).

## Routing table

| Task | Model | Why |
|------|-------|-----|
| Find files, grep, "where is X used", read-only exploration | **Haiku** (`Explore` agent, `model: haiku`) | cheapest, output is a summary |
| Mechanical edits: token/colour swaps, renames, CSS restyle, docs, changelog | **Sonnet**, effort `medium` | the bulk of the restyle |
| Component logic, Rust IPC, bug fixes | **Sonnet**, effort `high` | default |
| Architecture decisions, data-format changes (profile JSON), risky refactors, final review | **Opus** (`/model opus`, one-off) | only where a wrong call is expensive |
| Visual mockups | **Sonnet** | iterate on the artifact, don't re-derive context |

## Rules that save tokens

1. Don't spawn an agent for something 1–3 tool calls can do (each agent starts cold).
2. Search with `Grep`/`Glob` first; read only the line range needed.
3. Never re-read a file just edited; never paste whole files into replies.
4. One phase = one commit = one short summary. No running commentary.
5. Run `/compact` between restyle phases; start a fresh session per phase if context passes ~50 %.
6. Opus only for a decision, then switch back with `/model sonnet`.

## Security finding (do now)

A Figma personal access token is stored in plain text in `~/.claude/settings.json` and in the project's `.claude/settings.json` / `settings.local.json` (inside `Bash(curl ...)` allow rules). `.claude/` is gitignored, so it hasn't leaked via git, but it's in cleartext and in session logs.

- [ ] Revoke the token in Figma (Settings → Security → Personal access tokens) and issue a new one
- [ ] Delete the `curl ... X-Figma-Token` entries from the allow lists
- [ ] Use the Figma MCP connector instead (already connected), no token in commands
