# BoP2026 Oracle — Headless Simulation Reference

The Oracle is the engine's programmatic interface for running simulations without a browser. It exposes the full game loop as a JavaScript API (`window.BoP` in browser, `module.exports` in Node) and outputs structured analytics JSON suited for game-theoretic and mechanism design analysis.

Two ways to use it:

- **CLI runner** (`scripts/run-bop.js`): simplest path, covers most batch simulation needs.
- **Direct API** (`js/oracle.js`): full control — custom NPC behavior, branching, counterfactuals, inline result processing.

---

## CLI Runner

```bash
node scripts/run-bop.js [options]
```

**All flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario <id>` | `taiwan_strait_2026` | Scenario. Also: `iran_nuclear_2026`, `south_china_sea_2026`, `korean_peninsula_2026`, `sovereignty_void_2026`, `orbital_warfare_2026`, `megacity_siege_2026`, `financial_contagion_2026` |
| `--runs <n>` | `10` | Number of simulation runs |
| `--seed <n>` | random | Base seed; run i uses seed+i |
| `--out <path>` | `bop-results.json` | Output file (analytics format) |
| `--max-turns <n>` | `20` | Turn limit per run |
| `--player <id>` | `US` | Power the AI controls as "player" |
| `--cascade-scale <f>` | `1.0` | Multiplier on systemic event deltas (0 = off) |
| `--<power>-risk <f>` | persona default | Override riskTolerance (0–1). E.g. `--cn-risk 0.9` |
| `--<power>-patience <f>` | persona default | Override patience (0–1). E.g. `--ru-patience 0.2` |

Power IDs: `US`, `CN`, `EU`, `RU`, `IN`, `GULF`, `IR`.

**Common workflows:**

```bash
# Reproducible single run
node scripts/run-bop.js --runs 1 --seed 42 --out run.json

# 100-run baseline, fixed seed
node scripts/run-bop.js --runs 100 --seed 0 --out baseline.json

# Parameter variation: China hawkish, US dovish
node scripts/run-bop.js --runs 100 --seed 0 --cn-risk 0.9 --us-patience 0.2 --out hawk-cn.json

# Iran scenario with cascade amplification
node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 100 --seed 0 --cascade-scale 1.5 --out iran-cascade.json
```

Output is always an array in `bop2026-analytics-v1` format. See [Output Schema](#output-schema) below.

---

## Loading the API in Node

For custom scripts that use the Oracle API directly, use the shared loader. It sets up the VM
context, rewrites the browser-style IIFE modules so their singletons land on the shared global,
loads them in `index.html` order, and returns the context:

```js
'use strict';
const { loadEngine } = require('./load-engine'); // from scripts/

const ctx = loadEngine();   // ctx.BoP, ctx.AI, ctx.Domains, ctx.Events, ctx.State, ...
const BoP = ctx.BoP;
```

After this, `BoP.*` works exactly as described below. (Internally the loader rewrites top-level
`const/let X =` to `var` with a `/gm` regex so names persist across `runInContext` calls;
indented IIFE-internal declarations are left alone.)

---

## API Reference

### `BoP.init(scenarioId, options?)`

Initialize a new game. Must be called before `step()` or `run()`.

**Parameters:**

| Option | Type | Description |
|--------|------|-------------|
| `doctrine` | `string` | Doctrine id (e.g. `'realist'`) |
| `player` | `string` | Power the AI controls as player (default `'US'`) |
| `seed` | `number` | RNG seed for reproducibility. Honored since v2.13.2: patches mulberry32 *before* `State.init` so setup noise is on the same stream. Stays installed until `BoP.unseed()`. |
| `cascadeScale` | `number` | Multiplier on systemic event stat deltas (default `1.0`) |
| `paramOverrides` | `object` | Per-power overrides — see below |
| `crisisOverrides` | `object` | `{ [crisisId]: { escalationLevel: n } }` |

`paramOverrides` shape per power:
```js
{
  CN: {
    riskTolerance: 0.9,    // 0–1
    patience: 0.4,         // 0–1
    trueState: { military: 80 },      // override initial stats
    relationships: { US: -80 }        // override initial relationships
  }
}
```

Returns a `WorldSnapshot` (deep clone of initial world state).

Some scenarios require a doctrine (currently `sovereignty_void_2026`, whose latency mechanic is
built around the doctrinal `t_rat`). Calling `init()` on one without `options.doctrine` throws,
listing the valid doctrine ids.

---

### `BoP.seed(n)` / `BoP.unseed()`

Make a run reproducible by replacing `Math.random` with the engine's mulberry32 PRNG, seeded with
`n`. Call `unseed()` to restore the original `Math.random`. Prefer `init(scenarioId, { seed: n })`
(v2.13.2+), which applies the same patch before world setup. Either form stays installed until
`unseed()`. (`runBatch()` seeds internally per run; use these only when driving `init`/`run`
yourself. Repeated `seed()` calls without `unseed()` between them are safe — the native RNG is
captured once.)

```js
BoP.seed(42);
try {
  BoP.init('taiwan_strait_2026');
  const result = BoP.run();
} finally {
  BoP.unseed();
}
```

---

### `BoP.step(playerActions?)`

Execute one turn. All NPC powers act via AI. Optionally supply player actions.

```js
// AI decides player actions too
const t = BoP.step();

// Manually supply player actions
const t = BoP.step([
  { actor: 'US', actionId: 'cyber_offense', target: 'CN' },
  { actor: 'US', actionId: 'economic_sanctions', target: 'IR' }
]);
```

Returns a **raw `TurnResult`** — see [Raw TurnResult](#raw-turnresult-from-bopstep) below. Note this differs from the per-turn format inside `exportAnalytics()` output.

---

### `BoP.run(options?)`

Run a full game to completion or `maxTurns`.

```js
const result = BoP.run({ maxTurns: 20 });
console.log(result.outcome.result);         // 'win' | 'lose' | 'incomplete'
console.log(result.outcome.stabilityIndex); // 0–100
console.log(result.outcome.turnsPlayed);
```

Returns a `SimResult`.

---

### `BoP.runBatch(config)`

Run many games. Handles RNG seeding per run.

```js
const results = BoP.runBatch({
  scenarioId: 'taiwan_strait_2026',
  runs: 100,
  seeds: Array.from({ length: 100 }, (_, i) => i),  // omit for random
  initOptions: {
    paramOverrides: { CN: { riskTolerance: 0.9 } }
  },
  runOptions: { maxTurns: 20 },
  paramSweep: {                      // round-robin across runs
    RU: { riskTolerance: [0.3, 0.7] }
  },
  onProgress: (done, total) => process.stdout.write(`\r${done}/${total}`)
});
```

Returns `BatchResult[]`: `[{ runId, seed, params, result: SimResult }]`. Note: `exportBatchAnalytics()` transforms this — it renames `result` to `analytics` and reshapes it to the analytics export format.

---

### `BoP.getState()` / `BoP.setState(snapshot)`

Save and restore world state for branching.

```js
BoP.init('taiwan_strait_2026', { seed: 42 });
BoP.step(); BoP.step(); BoP.step();   // advance 3 turns

const snap = BoP.getState();          // save branch point

const resultA = BoP.run();            // run to end from here

BoP.setState(snap);                   // restore
const resultB = BoP.run();            // run again — same branch point, same RNG state
```

`getState()` returns a deep-cloned JSON-serializable snapshot. Safe to serialize to disk and restore later.

---

### `BoP.setNPCOverride(powerId, fn)` / `BoP.clearOverrides()`

Replace the AI decision function for one power. Useful for testing specific strategies or modeling doctrine changes.

```js
// Force CN to always build military
BoP.setNPCOverride('CN', (powerId, world) => [
  { actor: 'CN', actionId: 'military_buildup' }
]);

BoP.run();
BoP.clearOverrides();  // restore default AI for all powers
```

The override function receives `(powerId, world)` and must return an array of action objects (`[{ actor, actionId, target? }]`). The world is read-only inside the override — mutations have no effect.

---

### `BoP.setPlayerOverride(fn)` (async path only)

Override the AI decision function for the player power. Works like `setNPCOverride` but applies to whichever power is `world.player`. Only active in `runAsync()` / `stepAsync()` — the sync `run()` and `runBatch()` paths ignore it.

```js
// Route the player through an LLM backend
BoP.setPlayerOverride(async (powerId, world) => {
  const actions = await myLLM.decide(powerId, world);
  return actions;
});

await BoP.runAsync({ maxTurns: 10 });
BoP.clearOverrides();  // clears both NPC and player overrides
```

Useful for testing whether an LLM correctly navigates player-specific mechanics (e.g. AOM pre-delegation in `sovereignty_void_2026`) that are filtered from NPC action pools.

---

### `BoP.exportAnalytics(simResult, meta?)`

Convert a `SimResult` to `bop2026-analytics-v1` format. Strips raw `stateSnapshot` blobs from each turn to keep file size reasonable.

```js
const result = BoP.run();
const analytics = BoP.exportAnalytics(result, {
  seed: 42,
  paramOverrides: { CN: { riskTolerance: 0.9 } }
});
```

`meta` is optional metadata attached to the analytics object (`seed`, `paramOverrides`).

---

### `BoP.exportBatchAnalytics(batchResults)`

Convert `runBatch()` output to analytics format. Each element becomes `{ runId, seed, analytics }`.

```js
const batch = BoP.runBatch({ ... });
const analytics = BoP.exportBatchAnalytics(batch);
require('fs').writeFileSync('out.json', JSON.stringify(analytics, null, 2));
```

---

## Output Schema

> **Two formats exist.** The raw API (`step()`, `run()`, `runBatch()`) returns one shape. `exportAnalytics()` / `exportBatchAnalytics()` reshapes it for storage. Field names differ — see below.

### Top-level (analytics object)

```js
{
  schema:      "bop2026-analytics-v1",
  exportedAt:  "2026-05-25T...",           // ISO timestamp
  scenarioId:  "taiwan_strait_2026",
  player:      "US",                       // power controlled as player
  doctrine:    null | "realist",           // doctrine id if selected
  seed:        42 | null,
  paramOverrides: {},                      // from meta arg
  outcome: {
    result:         "win" | "lose" | "draw",
    reason:         "string",              // human-readable game-over cause
    stabilityIndex: 24,                   // avg domestic stat across powers (0–100)
    systemicRisk: {                        // second composite metric (see Limitations)
      index:          12,                  // GSI minus crisis/nuclear penalties, 0–100
      crisisPressure: 4,                   // sum of escalation levels across crises
      maxNuclear:     2                    // peak nuclear posture (0–5)
    },
    turnsPlayed:    6
  },
  initialState: { powers, crises },        // pre-game state (before turn 1)
  turns:        TurnResult[],
  finalState:   { powers, crises }         // state after last turn
}
```

### `initialState` / `finalState`

```js
{
  powers: {
    US: {
      name:          "United States",
      trueState: {
        military:  92,   // 0–100
        nuclear:    4,   // 0–5
        economic:  78,
        cyber:     70,
        info:      65,
        domestic:  62,
        space:     55
      },
      relationships: { CN: -55, EU: 65, RU: -40, IN: 40, GULF: 30, IR: -70 },
      riskTolerance: 0.3,
      patience:      0.6
    },
    // ... other powers
  },
  crises: [
    {
      id:             "taiwan_strait",
      name:           "Taiwan Military Escalation",
      domain:         "military",
      involved:       ["US", "CN"],
      escalationLevel: 2              // 0–5; 5 = nuclear exchange / game over
    }
  ]
}
```

### Raw `TurnResult` (from `BoP.step()`)

What you get when calling `BoP.step()` directly. Field names differ from the analytics export.

```js
{
  turn:          1,
  year:          2026,
  playerActions: [{ actor: "US", actionId: "cyber_offense", target: "CN", flavor: "..." }],
  npcActions:    [{ actor: "CN", actionId: "military_buildup", flavor: "..." }, ...],
  cascadeLog: [
    {
      order:      1,                   // 1 = direct, 2 = probable, 3 = conditional, 4 = systemic
      type:       "stat_change",       // see cascade types below
      actor:      "CN",
      confidence: "CONFIRMED",         // CONFIRMED | LIKELY (65%) | POSSIBLE (40%) | SPECULATIVE (20%)
      text:       "PLA forces surge..."
    }
  ],
  events: [
    { id: "financial_shock", name: "Global Financial Shock", description: "..." }
  ],
  stateDeltas: {
    stats: {
      US: { military: { before: 92, after: 81, delta: -11 },
            economic: { before: 78, after: 59, delta: -19 } },
      CN: { military: { before: 72, after: 75, delta:   3 } }
    },
    relationships: {
      "US->CN": { before: -55, after: -72, delta: -17 },
      "CN->US": { before: -60, after: -74, delta: -14 }
    },
    crises: {
      "taiwan_strait": { escalationLevel: { before: 2, after: 3, delta: 1 } }
    }
  },
  stateSnapshot: { ... },  // full world state clone — large; use BoP.getState() for branching
  gameOver: null | { result: "lose", reason: "Taiwan Strait reached nuclear threshold" }
}
```

`stateDeltas` records only changed values. Unchanged stats, relationships, and crises do not appear.

### Per-turn format inside analytics export (`exportAnalytics` output)

`exportAnalytics()` remaps the raw `TurnResult` for storage. Key differences: `playerActions`/`npcActions` → `actions.player`/`actions.npc`; `cascadeLog` → `cascades`; `stateSnapshot` stripped.

```js
{
  turn: 1,
  year: 2026,
  actions: {
    player: [{ actor: "US", actionId: "cyber_offense", target: "CN", flavor: "..." }],
    npc:    [{ actor: "CN", actionId: "military_buildup", flavor: "..." }, ...]
  },
  cascades: [
    {
      order:      1,
      type:       "stat_change",
      actor:      "CN",
      confidence: "CONFIRMED",
      text:       "PLA forces surge..."
    }
  ],
  events:      [{ id: "financial_shock", name: "Global Financial Shock", description: "..." }],
  stateDeltas: { stats: { ... }, relationships: { ... }, crises: { ... } },
  // stateSnapshot is not present — stripped to keep file size reasonable
  gameOver:    null | { result: "lose", reason: "Taiwan Strait reached nuclear threshold" }
}
```

**Cascade types:** `stat_change`, `escalation`, `relationship`, `epistemic`, `cascade`, `systemic_warning`, `systemic_event`, `compound_pressure`, `entanglement`, `crisis_decay`, `warning`.

**Action IDs** are defined in `js/domains.js`. Common ones: `military_buildup`, `force_withdrawal`, `cyber_offense`, `economic_sanctions`, `diplomatic_channel`, `info_operation`, `space_recon`.

---

## Working with Output

### Load and inspect

```python
import json

with open('baseline.json') as f:
    batch = json.load(f)

# Each element: { runId, seed, analytics }
run0 = batch[0]['analytics']
print(run0['outcome'])
print(f"{len(run0['turns'])} turns")
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
                rows.append({
                    'runId': entry['runId'],
                    'seed':  entry['seed'],
                    'turn':  t['turn'],
                    'year':  t['year'],
                    'power': pid,
                    'stat':  stat,
                    **d          # before, after, delta
                })

df = pd.DataFrame(rows)
# Mean military delta for US across all runs and turns
print(df[(df.power=='US') & (df.stat=='military')]['delta'].mean())
```

### Relationship time series

```python
rel_rows = []
for entry in batch:
    a = entry['analytics']
    # seed initial values from initialState
    cur = {}
    for pid, pw in a['initialState']['powers'].items():
        for oid, val in pw['relationships'].items():
            cur[f"{pid}->{oid}"] = val
    for t in a['turns']:
        for key, d in t['stateDeltas']['relationships'].items():
            cur[key] = d['after']
        for key, val in cur.items():
            rel_rows.append({'runId': entry['runId'], 'turn': t['turn'], 'pair': key, 'value': val})

rel_df = pd.DataFrame(rel_rows)
us_cn = rel_df[rel_df.pair == 'US->CN'].groupby('turn')['value'].mean()
print(us_cn)
```

### Outcome distribution and nuclear rate

```python
outcomes = [e['analytics']['outcome'] for e in batch]
total = len(outcomes)
wins  = sum(1 for o in outcomes if o['result'] == 'win')
nuke  = sum(1 for o in outcomes if 'nuclear' in o.get('reason','').lower())

print(f"Win rate: {wins/total:.0%}")
print(f"Nuclear: {nuke/total:.0%}")
print(f"Avg stability: {sum(o['stabilityIndex'] for o in outcomes)/total:.1f}")
```

### Compare two parameter sets

```python
with open('baseline.json') as f:
    base = json.load(f)
with open('hawk-cn.json') as f:
    hawk = json.load(f)

def nuke_rate(batch):
    outcomes = [e['analytics']['outcome'] for e in batch]
    return sum(1 for o in outcomes if 'nuclear' in o.get('reason','').lower()) / len(outcomes)

print(f"Baseline nuclear: {nuke_rate(base):.0%}")
print(f"Hawk-CN nuclear:  {nuke_rate(hawk):.0%}")
```

---

## Advanced Patterns

### Counterfactual branching

Run two trajectories from the same world state at the same turn:

```js
BoP.init('taiwan_strait_2026', { seed: 42 });
BoP.step(); BoP.step();           // advance to turn 3

const snap = BoP.getState();      // branch point

// Path A: CN continues default
const resultA = BoP.run({ maxTurns: 15 });
const analyticsA = BoP.exportAnalytics(resultA, { seed: 42 });

// Path B: CN stands down
BoP.setState(snap);
BoP.setNPCOverride('CN', (id, world) => [
  { actor: 'CN', actionId: 'force_withdrawal', target: 'US' }
]);
const resultB = BoP.run({ maxTurns: 15 });
const analyticsB = BoP.exportAnalytics(resultB, { seed: 42 });
BoP.clearOverrides();

console.log(analyticsA.outcome.result, analyticsB.outcome.result);
```

### Parameter sweep with `paramSweep`

`paramSweep` assigns values round-robin across runs, so runs 0, 4, 8, ... get `riskTolerance: 0.3`, runs 1, 5, 9, ... get `0.5`, etc.:

```js
const results = BoP.runBatch({
  scenarioId: 'taiwan_strait_2026',
  runs: 100,
  seeds: Array.from({ length: 100 }, (_, i) => i),
  paramSweep: {
    CN: { riskTolerance: [0.3, 0.5, 0.7, 0.9] }
  },
  runOptions: { maxTurns: 20 }
});
```

Then group by `params.CN.riskTolerance` in your analysis.

### Disable cascade amplification

Set `cascadeScale: 0` to run without systemic threshold events:

```js
BoP.init('taiwan_strait_2026', { seed: 42, cascadeScale: 0 });
const noSystemic = BoP.run();

BoP.init('taiwan_strait_2026', { seed: 42, cascadeScale: 2.0 });
const amplified = BoP.run();
```

### Inspect turn-by-turn interactively

```js
BoP.init('taiwan_strait_2026', { seed: 42 });

while (!BoP.getState().gameOver) {
  const t = BoP.step();
  const deltas = t.stateDeltas.stats;
  if (deltas.US?.military?.delta < -10) {
    console.log(`Turn ${t.turn}: US military collapsed (${deltas.US.military.delta})`);
  }
}
```

---

## Companion Scripts

| Script | Usage | Description |
|--------|-------|-------------|
| `scripts/run-bop.js` | `node scripts/run-bop.js [flags]` | CLI batch runner, outputs analytics JSON |
| `scripts/analyze-results.js` | `node scripts/analyze-results.js out.json [--verbose]` | Outcome distribution, stability histogram, top actions by power |
| `scripts/sensitivity-sweep.js` | `node scripts/sensitivity-sweep.js` | Sweeps RU/CN riskTolerance and cascade severity, outputs markdown tables |
| `scripts/test-analytics.js` | `node scripts/test-analytics.js` | regression tests for export correctness |
| `scripts/test-cascades.js` | `node scripts/test-cascades.js` | cascade/threshold/idempotency regression tests |
| `scripts/load-engine.js` | `require('./load-engine').loadEngine()` | shared VM loader; returns the engine context; throws if any expected global (`State`/`Domains`/`Cascades`/`Epistemic`/`Events`/`AI`/`BoP`) failed to attach |

`npm test` runs the dependency-free Node tests (`test-cascades.js` + `test-analytics.js`).
`analyze-results.js` accepts both the legacy `{ result: SimResult }` format and the current `{ analytics }` format.

---

## Limitations for Research Use

- Cascade weights and AI personality values are calibrated for plausibility, not fit to data. Treat outputs as model-internal quantities, not empirical predictions.
- No leader-level or domestic-coalition modeling. Powers are unitary actors.
- `stabilityIndex` is the mean domestic stat across all powers — a rough aggregate, not a validated stability metric. `outcome.systemicRisk` folds in crisis escalation and nuclear posture for a less blind signal, but is likewise calibrated for plausibility, not fit to data.
- Epistemic noise (perception drift) is stochastic per run; two runs with the same seed but different turn counts will diverge if epistemic updates accumulate differently.

See [docs/model-notes.md](model-notes.md) for theoretical grounding and full limitations.
