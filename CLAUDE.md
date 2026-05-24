# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- session-recall:v1 — DO NOT EDIT MANUALLY -->
## Progressive Session Recall — RUN FIRST ON EVERY PROMPT

**Run `session-recall` FIRST on every prompt before doing anything else.** It costs ~50 tokens and prevents expensive blind searches.

```bash
session-recall files --json --limit 10  # recently touched files
session-recall files --days 7 --json    # files touched in last 7 days
session-recall list --json --limit 5    # recent sessions
session-recall list --days 2 --json     # sessions from last 2 days
session-recall search '<term>' --json   # full-text search
session-recall search '<term>' --days 5 # search last 5 days only
session-recall checkpoints --days 3     # checkpoints from last 3 days
session-recall repos --json             # discovered repositories across providers
session-recall show <id> --json         # drill into one session
session-recall health --json            # 8-dimension health check
session-recall schema-check             # validate DB schema (run after Copilot CLI upgrade)


## Running the game

Open `index.html` directly in a browser — no server, no build step. All data is inlined as `window.*` globals in the `data/` scripts.

For headless research batch runs:
```
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 50 --seed 42 --out results.json
node scripts/run-bop.js --runs 100 --cn-risk 0.9 --us-patience 0.2
```

## Stack constraints

Vanilla HTML/CSS/JS. No frameworks, no bundler, no npm. Do not suggest or introduce any of these. Script load order in `index.html` is the dependency graph — it matters.

## Architecture

### Data layer (`data/`)

Files set `window.POWERS_DATA`, `window.SCENARIOS_DATA`, `window.DOCTRINES_DATA`, `window.EVENT_TABLE`. All are plain objects — no fetch, no async. When adding a new scenario or power, add it to the relevant `data/*-data.js` file. The `.json` files in `data/` are source drafts; the `-data.js` files are what the game loads.

### Engine modules (`js/`)

All engine modules are IIFEs that expose a singleton:

| Module | Role |
|---|---|
| `state.js` | Single source of truth. All world state mutations go through `State.*`. The world object is a reference — mutate it, don't copy it (except for snapshots via `State.restore`). |
| `domains.js` | Action catalog. Pure data + lookup helpers. No side effects. |
| `ai.js` | Rule-based NPC decision logic. `AI.decideTurn(powerId, world)` returns `ActionObject[]`. Reads `power.riskTolerance`, `power.patience`, `power.priorityDomains`. |
| `cascades.js` | `Cascades.resolve(actions, world)` applies 1st–4th order effects and returns a cascade log. This is where stat deltas, relationship changes, and crisis escalations happen. |
| `epistemic.js` | Manages perceived vs. true state. `Epistemic.update(world)` drifts perceptions toward truth each turn. |
| `events.js` | `Events.drawEvents(world)` draws stochastic world events from `EVENT_TABLE`. Call `Events.init(EVENT_TABLE)` once before the game loop. |
| `turn.js` | Orchestrates the turn loop: player action phase → NPC resolution → cascade → epistemic → events → advance. Has both interactive (`endPlayerTurn`) and headless (`runSimulation`, `simulateTurn`) paths. All delays are in `sleep()` which respects `world.sim.speed`. |
| `oracle.js` | Research API (`window.BoP`). Headless turn executor with no UI calls or sleeps. `BoP.init()`, `BoP.step()`, `BoP.run()`, `BoP.runBatch()`. Works in both browser and Node. |
| `ui.js` | Rendering only — no game logic. Reads `State.get()` and writes to DOM. `UI.render()` redraws everything; individual `UI.render*()` functions update one panel. |
| `main.js` | Bootstrap only. Scenario/doctrine selection screen, then calls `Turn.startTurn(world)`. |
| `research-ui.js` | Browser panel for batch runs. Uses `BoP.*` API. |

### Turn lifecycle

```
startTurn()               ← player_action phase, renders UI
  ↓ player clicks End Turn
endPlayerTurn()           ← npc_resolution → cascade → epistemic → events → end_turn
  ↓ calls State.advanceTurn(), State.checkGameOver()
startTurn()               ← loops until game over
```

Simulation mode bypasses the player action phase: `simulateTurn()` calls `AI.decideTurn` for the player too, then calls `endPlayerTurn(true)`.

### State shape (key fields)

```js
world.powers[powerId].trueState      // { military, nuclear, economic, cyber, info, domestic, space }
world.powers[powerId].perceivedBy    // { [viewerId]: { ...stats with noise } }
world.powers[powerId].relationships  // { [otherId]: -100..100 }
world.crises[n].escalationLevel      // 0–5; 5 = nuclear exchange / game over
world.sim                            // { active, paused, speed: 1|2|5|0 }
world.gameOver                       // null or { result: 'win'|'lose', reason }
```

### Adding content

- **New action**: add to the actions array in `domains.js`. Must have `id`, `domain`, `cost`, `requiresTarget`, `effects`. Effects are applied by `cascades.js`.
- **New scenario**: add to `SCENARIOS_DATA` in `data/scenarios-data.js`. Crises need `location: {x, y}` for SVG map markers.
- **New power**: add to `POWERS_DATA` in `data/powers-data.js`. Add personality to `PERSONALITIES` in `ai.js`.
- **New event**: add to `EVENT_TABLE` in `data/events-data.js`.

### Oracle / research API

`window.BoP` (browser) / `module.exports` (Node) exposes the engine for agent-based modeling. Key pattern:

```js
BoP.init('taiwan_strait_2026', { seed: 42, paramOverrides: { CN: { riskTolerance: 0.9 } } });
const result = BoP.run();   // → { outcome, turns, finalState }
```

For branching what-ifs: `const snap = BoP.getState(); /* run */; BoP.setState(snap); /* run differently */`

Node runner uses `vm.runInContext` to load browser-style IIFE modules — the regex `^(const|let) ([A-Z][A-Za-z_]*)\s*=` → `var $2 =` converts top-level module declarations to context-global scope.
