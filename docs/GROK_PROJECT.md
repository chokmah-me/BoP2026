# BoP2026 — Grok Project Instructions

Turn-based geopolitical simulation. Rule-based AI NPCs, eight powers, eight crisis scenarios, vanilla JS (no framework, no bundler). Two entry points: browser (`index.html`) and Node headless oracle (`scripts/run-bop.js` / `js/oracle.js`).

**GitHub repo root:** `BoP2026/`

---

## Repository Map

```
data/                   Game data (loaded as window.* globals)
  powers-data.js        POWERS_DATA — power stats, relationships, personalities
  scenarios-data.js     SCENARIOS_DATA — scenario definitions + crisis configs
  doctrines-data.js     DOCTRINES_DATA — player doctrines
  events-data.js        EVENT_TABLE — stochastic world event pool

js/                     Engine IIFEs, each exposes one singleton
  state.js              State — single mutable world object
  domains.js            Domains — action catalog, pure data + lookups
  cascades.js           Cascades — 1st–4th order effect resolution
  epistemic.js          Epistemic — perceived vs. true state drift
  events.js             Events — stochastic event drawing
  ai.js                 AI — rule-based NPC decision logic
  turn.js               Turn — interactive browser game loop
  oracle.js             BoP — headless research API
  ui.js                 UI — rendering only, no game logic
  main.js               Bootstrap (browser only)
  research-ui.js        Browser batch-run panel

scripts/
  run-bop.js            CLI batch runner
  analyze-results.js    Post-run statistics
  sensitivity-sweep.js  Parameter sweep over RU/CN risk × cascade severity
  test-analytics.js     8 regression tests for export correctness
  test-cascades.js      Cascade logic unit tests

docs/
  ORACLE.md             API reference
  model-notes.md        Theoretical grounding and limitations
  QUICKSTART.md         Browser setup
  findings.md           Research findings log
```

---

## Enumerated Values

### Power IDs
`US`, `CN`, `EU`, `IN`, `RU`, `GB`, `IR`, `DPRK`

`GB` is the Gulf Bloc. `GULF` is not an engine id.

### Scenario IDs
`taiwan_strait_2026`, `iran_nuclear_2026`, `south_china_sea_2026`, `korean_peninsula_2026`, `sovereignty_void_2026`, `orbital_warfare_2026`, `megacity_siege_2026`, `financial_contagion_2026`

`sovereignty_void_2026` requires `options.doctrine`.

### Doctrine IDs (pass the id string to `BoP.init()` `doctrine`)
`MAGA`, `TWELVER`, `EU_FATALISM`, `MING`, `JUCHE`

Do not pass `"0"`–`"3"`. Those numeric keys are not engine ids.

### Action IDs
Use `Domains.getAll()` — do not maintain a hand list here. Families: military, economic, diplomatic, cyber, info, domestic, supply_chain, biological, emp, autonomous (incl. AOM: `boost_phase_intercept`, `pre_delegate_authority`, `revert_midcourse_defense`), space, urban, technology (`rd_military` / `rd_cyber` / `rd_space` / `rd_info`).

### Stat Keys
`military`, `nuclear`, `economic`, `cyber`, `info`, `domestic`, `space`

All stats are `0–100` except `nuclear` (`0–5`).

### Escalation Levels
`0–5`. Level 5 triggers game over (nuclear exchange).

---

## Headless Simulation — Quick Start

### CLI
```bash
# Default: 10 runs, random seed, taiwan_strait_2026
node scripts/run-bop.js

# Reproducible 100-run baseline
node scripts/run-bop.js --runs 100 --seed 0 --out baseline.json

# Parameter variation
node scripts/run-bop.js --runs 100 --seed 0 --cn-risk 0.9 --us-patience 0.2 --out hawk-cn.json

# Iran scenario with amplified cascades
node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 100 --seed 0 --cascade-scale 1.5 --out iran.json
```

All CLI flags:
```
--scenario <id>         Default: taiwan_strait_2026
--runs <n>              Default: 10
--seed <n>              Base seed (run i uses seed+i). Omit for random.
--out <path>            Default: bop-results.json (also auto-saves to logs/)
--max-turns <n>         Default: 20
--player <id>           Power the AI controls as player. Default: US
--cascade-scale <f>     Systemic event delta multiplier (0 = off). Default: 1.0
--<power>-risk <f>      Override riskTolerance 0–1. E.g. --cn-risk 0.9
--<power>-patience <f>  Override patience 0–1. E.g. --ru-patience 0.2
```

### Loading the Oracle in a Custom Node Script
```js
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = '/absolute/path/to/BoP2026';
global.window = global;
const ctx = vm.createContext(global);

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // top-level const/let → var so names survive across script calls
  const patched = code.replace(/^(const|let) ([A-Z][A-Za-z_]*)\s*=/m, 'var $2 =');
  vm.runInContext(patched, ctx, { filename: rel });
}

// Load order must match index.html — it is the dependency graph
load('data/powers-data.js');
load('data/scenarios-data.js');
load('data/doctrines-data.js');
load('data/events-data.js');
load('js/state.js');
load('js/domains.js');
load('js/cascades.js');
load('js/epistemic.js');
load('js/events.js');
load('js/ai.js');
load('js/oracle.js');

const BoP = ctx.BoP;
```

---

## Oracle API

### `BoP.init(scenarioId, options?)`

Initialize or reset a game. Call before `step()` / `run()`.

```js
BoP.init('taiwan_strait_2026', {
  doctrine:        'MAGA',           // doctrine id, optional (required for sovereignty_void_2026)
  player:          'US',             // power AI controls as player
  seed:            42,               // RNG seed for reproducibility
  cascadeScale:    1.0,              // systemic event delta multiplier
  paramOverrides:  {
    CN: { riskTolerance: 0.9, patience: 0.4 },
    US: { trueState: { military: 80 }, relationships: { CN: -80 } }
  },
  crisisOverrides: { taiwan_strait: { escalationLevel: 3 } }
});
```

Returns a `WorldSnapshot` (deep clone of initial world state).

---

### `BoP.step(playerActions?)`

Execute one turn. Returns a `TurnResult`.

```js
// AI decides all actions including player
const t = BoP.step();

// Supply player actions manually
const t = BoP.step([
  { actor: 'US', actionId: 'deploy_forces', target: 'CN' },
  { actor: 'US', actionId: 'sanctions', target: 'IR' }
]);
```

---

### `BoP.run(options?)`

Run full game to completion or `maxTurns`. Returns `SimResult`.

```js
const result = BoP.run({ maxTurns: 20 });
console.log(result.outcome.result);          // 'win' | 'lose' | 'incomplete'
console.log(result.outcome.stabilityIndex);  // 0–100
console.log(result.outcome.turnsPlayed);
```

---

### `BoP.runBatch(config)`

Run many games. Returns `BatchResult[]`.

```js
const batch = BoP.runBatch({
  scenarioId:  'taiwan_strait_2026',
  runs:        100,
  seeds:       Array.from({ length: 100 }, (_, i) => i),  // omit for random
  initOptions: { paramOverrides: { CN: { riskTolerance: 0.9 } } },
  runOptions:  { maxTurns: 20 },
  paramSweep:  {                        // round-robin across runs
    CN: { riskTolerance: [0.3, 0.5, 0.7, 0.9] }
  },
  onProgress:  (done, total) => process.stdout.write(`\r${done}/${total}`)
});
// returns [{ runId, seed, params, result: SimResult }, ...]
```

---

### `BoP.getState()` / `BoP.setState(snapshot)`

Branch and restore. `getState()` returns a deep-clone JSON-serializable snapshot.

```js
BoP.init('taiwan_strait_2026', { seed: 42 });
BoP.step(); BoP.step();         // advance 2 turns

const snap = BoP.getState();

const resultA = BoP.run();      // run to end

BoP.setState(snap);             // restore branch point
const resultB = BoP.run();      // same starting state, fresh run
```

---

### `BoP.setNPCOverride(powerId, fn)` / `BoP.clearOverrides()`

Replace AI for one power. Override fn receives `(powerId, world)`, must return `[{ actor, actionId, target? }]`.

```js
// Force CN to always build military
BoP.setNPCOverride('CN', (id, world) => [
  { actor: 'CN', actionId: 'deploy_forces' }
]);
BoP.run();
BoP.clearOverrides();
```

---

### `BoP.exportAnalytics(simResult, meta?)` / `BoP.exportBatchAnalytics(batchResults)`

Convert raw results to `bop2026-analytics-v1` format for storage and analysis.

```js
const result  = BoP.run();
const analytics = BoP.exportAnalytics(result, { seed: 42, paramOverrides: { CN: { riskTolerance: 0.9 } } });

const batch = BoP.runBatch({ ... });
fs.writeFileSync('out.json', JSON.stringify(BoP.exportBatchAnalytics(batch), null, 2));
```

---

## Output Schemas

### Raw `TurnResult` (from `BoP.step()`)

```js
{
  turn:          1,
  year:          2026,
  playerActions: [{ actor: 'US', actionId: 'force_withdrawal', target: null, flavor: '...' }],
  npcActions:    [{ actor: 'CN', actionId: 'trade_deal', target: 'RU', flavor: '...' }],
  cascadeLog:    [{ order: 1, type: 'stat_change', actor: 'CN', confidence: 'CONFIRMED', text: '...' }],
  events:        [{ id: 'financial_shock', name: '...', description: '...' }],
  stateDeltas:   { stats: {}, relationships: {}, crises: {} },  // see below
  stateSnapshot: { ... },   // full world state (large — omitted in analytics export)
  gameOver:      null | { result: 'lose', reason: '...' }
}
```

> **Doc discrepancy:** `ORACLE.md` shows `t.actions.player` / `t.actions.npc`. That's wrong. The real fields are `t.playerActions` and `t.npcActions`. The `actions.player/npc` shape only appears in the *analytics export* format.

### `stateDeltas` (only changed values appear)

```js
{
  stats: {
    US: { military: { before: 92, after: 81, delta: -11 } },
    CN: { military: { before: 72, after: 75, delta: 3 } }
  },
  relationships: {
    'US->CN': { before: -55, after: -72, delta: -17 }
  },
  crises: {
    taiwan_strait: { escalationLevel: { before: 2, after: 3, delta: 1 } }
  }
}
```

### Analytics export (from `exportAnalytics`)

```js
{
  schema:         'bop2026-analytics-v1',
  exportedAt:     '2026-05-26T...',
  scenarioId:     'taiwan_strait_2026',
  player:         'US',
  doctrine:       null | 'MAGA',
  seed:           42 | null,
  paramOverrides: {},
  outcome: {
    result:         'win' | 'lose' | 'incomplete',
    reason:         '...',
    stabilityIndex: 24,      // mean domestic stat across all powers
    turnsPlayed:    6
  },
  initialState: { powers: { US: { name, trueState, relationships, riskTolerance, patience }, ... }, crises: [...] },
  turns: [
    {
      turn, year,
      actions: {
        player: [{ actor, actionId, target, flavor }],
        npc:    [{ actor, actionId, target, flavor }]
      },
      cascades: [{ order, type, actor, confidence, text }],
      events:   [{ id, name, description }],
      stateDeltas,   // same shape as above
      gameOver
      // stateSnapshot is stripped to keep file size down
    }
  ],
  finalState: { powers, crises }
}
```

Cascade `confidence` values: `CONFIRMED`, `LIKELY` (65%), `POSSIBLE` (40%), `SPECULATIVE` (20%).

Cascade `type` values: `stat_change`, `escalation`, `relationship`, `epistemic`, `cascade`, `systemic_warning`, `systemic_event`, `compound_pressure`, `entanglement`, `crisis_decay`, `warning`.

---

## Python Analysis Patterns

### Load batch output
```python
import json

with open('baseline.json') as f:
    batch = json.load(f)
# Each entry: { runId, seed, analytics }
```

### Outcome distribution
```python
outcomes = [e['analytics']['outcome'] for e in batch]
total = len(outcomes)
wins  = sum(1 for o in outcomes if o['result'] == 'win')
nuke  = sum(1 for o in outcomes if 'nuclear' in o.get('reason', '').lower())

print(f"Win rate:  {wins/total:.0%}")
print(f"Nuclear:   {nuke/total:.0%}")
print(f"Avg stab:  {sum(o['stabilityIndex'] for o in outcomes)/total:.1f}")
```

### Flatten stat deltas to DataFrame
```python
import pandas as pd

rows = []
for entry in batch:
    a = entry['analytics']
    for t in a['turns']:
        for pid, stats in t['stateDeltas']['stats'].items():
            for stat, d in stats.items():
                rows.append({ 'runId': entry['runId'], 'seed': entry['seed'],
                               'turn': t['turn'], 'power': pid, 'stat': stat, **d })

df = pd.DataFrame(rows)
print(df[(df.power=='US') & (df.stat=='military')]['delta'].mean())
```

### Relationship time series
```python
rel_rows = []
for entry in batch:
    a = entry['analytics']
    cur = { f"{pid}->{oid}": v
            for pid, pw in a['initialState']['powers'].items()
            for oid, v in pw['relationships'].items() }
    for t in a['turns']:
        for key, d in t['stateDeltas']['relationships'].items():
            cur[key] = d['after']
        for key, val in cur.items():
            rel_rows.append({ 'runId': entry['runId'], 'turn': t['turn'], 'pair': key, 'value': val })

rel_df = pd.DataFrame(rel_rows)
us_cn = rel_df[rel_df.pair == 'US->CN'].groupby('turn')['value'].mean()
```

### Compare two parameter sets
```python
def nuke_rate(batch):
    return sum(1 for e in batch if 'nuclear' in e['analytics']['outcome'].get('reason','').lower()) / len(batch)

with open('baseline.json') as f: base = json.load(f)
with open('hawk-cn.json')  as f: hawk = json.load(f)

print(f"Baseline: {nuke_rate(base):.0%}  Hawk-CN: {nuke_rate(hawk):.0%}")
```

---

## Advanced Patterns

### Counterfactual branching
```js
BoP.init('taiwan_strait_2026', { seed: 42 });
BoP.step(); BoP.step();            // advance to turn 3

const snap = BoP.getState();

const resultA = BoP.run({ maxTurns: 15 });
const analyticsA = BoP.exportAnalytics(resultA, { seed: 42 });

BoP.setState(snap);
BoP.setNPCOverride('CN', (id, w) => [{ actor: 'CN', actionId: 'force_withdrawal' }]);
const resultB = BoP.run({ maxTurns: 15 });
const analyticsB = BoP.exportAnalytics(resultB, { seed: 42 });
BoP.clearOverrides();
```

### Step-by-step inspection
```js
BoP.init('taiwan_strait_2026', { seed: 42 });

while (!BoP.getState().gameOver) {
  const t = BoP.step();
  const usMil = t.stateDeltas.stats?.US?.military;
  if (usMil?.delta < -10) console.log(`Turn ${t.turn}: US military collapsed (${usMil.delta})`);
}
```

### Parameter sweep (runBatch)
```js
// Runs 0,4,8… get riskTolerance 0.3; runs 1,5,9… get 0.5; etc.
const batch = BoP.runBatch({
  scenarioId: 'taiwan_strait_2026',
  runs: 100,
  seeds: Array.from({ length: 100 }, (_, i) => i),
  paramSweep: { CN: { riskTolerance: [0.3, 0.5, 0.7, 0.9] } },
  runOptions: { maxTurns: 20 }
});
// group results by e.params.CN.riskTolerance
```

### Disable systemic cascades
```js
BoP.init('taiwan_strait_2026', { seed: 42, cascadeScale: 0 });
const noSystemic = BoP.run();

BoP.init('taiwan_strait_2026', { seed: 42, cascadeScale: 2.0 });
const amplified = BoP.run();
```

---

## Engine Internals (for code modification)

### State shape (key fields)
```js
world.powers[powerId].trueState        // { military, nuclear, economic, cyber, info, domestic, space }
world.powers[powerId].perceivedBy      // { [viewerId]: { ...stats with noise } }
world.powers[powerId].relationships    // { [otherId]: -100..100 }
world.powers[powerId].riskTolerance    // 0–1
world.powers[powerId].patience         // 0–1
world.crises[n].escalationLevel        // 0–5; 5 = game over
world.sim                              // { active, paused, speed: 1|2|5|0 }
world.gameOver                         // null | { result: 'win'|'lose', reason }
```

All world state mutations go through `State.*`. Never copy the world object — snapshot via `State.restore()` only.

### Turn lifecycle (browser)
```
startTurn()           ← player action phase, renders UI
  ↓ player clicks End Turn
endPlayerTurn()       ← npc_resolution → cascade → epistemic → events → end_turn
  ↓ State.advanceTurn(), State.checkGameOver()
startTurn()           ← loops until game over
```

In headless mode `simulateTurn()` skips the player phase and calls `AI.decideTurn` for the player power too.

### Adding content
- **New action:** add to the actions array in `js/domains.js`. Required fields: `id`, `domain`, `cost`, `requiresTarget`, `effects`. Cascades are applied by `cascades.js`.
- **New scenario:** add to `SCENARIOS_DATA` in `data/scenarios-data.js`. Crises need `location: { x, y }` for the SVG map.
- **New power:** add to `POWERS_DATA` in `data/powers-data.js`. Add a personality block to `PERSONALITIES` in `js/ai.js`.
- **New event:** add to `EVENT_TABLE` in `data/events-data.js`.

### Script load order (matters — do not reorder)
```
data/powers-data.js → data/scenarios-data.js → data/doctrines-data.js → data/events-data.js
→ js/state.js → js/domains.js → js/cascades.js → js/epistemic.js → js/events.js
→ js/ai.js → js/oracle.js   ← headless endpoint
→ js/turn.js → js/ui.js → js/research-ui.js → js/main.js   ← browser only
```

---

## Companion Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `run-bop.js` | `node scripts/run-bop.js [flags]` | Batch CLI runner, outputs analytics JSON |
| `analyze-results.js` | `node scripts/analyze-results.js out.json [--verbose]` | Outcome distribution, stability histogram, top actions |
| `sensitivity-sweep.js` | `node scripts/sensitivity-sweep.js` | Sweeps RU/CN risk × cascade severity, outputs markdown tables |
| `test-analytics.js` | `node scripts/test-analytics.js` | 8 regression tests for export correctness |

`analyze-results.js` accepts both legacy `{ result: SimResult }` and current `{ analytics }` formats.

---

## Known Limitations

- Cascade weights and AI personality values are calibrated for plausibility, not fit to historical data. Treat outputs as model-internal, not empirical predictions.
- Powers are unitary actors — no leader-level or domestic-coalition modeling.
- `stabilityIndex` is the mean domestic stat across all powers — a rough aggregate, not a validated metric.
- Epistemic noise is stochastic per run; two runs with the same seed but different turn counts will diverge as perception drift accumulates differently.

