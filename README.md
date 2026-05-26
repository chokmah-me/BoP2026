# Balance of Power 2026

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.20370930-blue)](https://doi.org/10.5281/zenodo.20370930)  
**Roadmap:** [Development Plan](docs/ROADMAP.md)  
**Background:** [The Story Behind BoP2026](docs/BACKGROUND.md)  
**Quickstart:** [Get analysis-ready data in 10 minutes](docs/QUICKSTART.md)  
**Oracle reference:** [Headless simulation, full API, output schema](docs/ORACLE.md)

A turn-based multipolar crisis simulation for IR research and war studies pedagogy. Runs in the browser as a playable game and headless via Node.js for batch simulation and parameter sensitivity analysis.

---

## What it is

BoP2026 models great-power competition across eight domains (military, economic, cyber, information, diplomatic, domestic, supply chain, autonomous) with seven major actors: US, China, EU, Russia, India, the Gulf Bloc, and Iran. Each turn, AI-driven powers select actions based on risk tolerance, patience, and domain priorities. Actions cascade through first- through fourth-order effects, with probabilistic second-order outcomes and systemic threshold events (financial fragmentation, domestic fragility spirals, compound crises).

The engine is designed for two uses:

1. **Classroom / wargame**: play as the United States through the Taiwan Strait or Iran Nuclear scenarios in a browser, no install required.
2. **Research companion**: run hundreds of parameterized simulations headless, explore counterfactuals via branching, and analyze outcomes with the Oracle API.

This is a **stylized model**, not an empirically fitted one. Parameters are calibrated for face validity against open-source IR literature, not regression-estimated from historical data. See [docs/model-notes.md](docs/model-notes.md) for assumptions and limitations.

---

## Quick start

### Browser (interactive game)

Open `index.html` directly in any modern browser. No server, no build step, no npm.

```
# Windows
start index.html

# macOS
open index.html
```

Select a scenario and doctrine on the opening screen. Click **End Turn** to advance. The **Research** button in the top-right opens the in-browser batch runner. A **Save Log** button in the event log panel exports the current game state and event history as JSON. The log also downloads automatically when the game ends (nuclear exchange, collapse, doctrine failure) as a post-mortem file named `bop-{scenario}-{date}-t{turn}-{result}.json`.

### Node.js (headless research runs)

Requires Node.js 16+.

```bash
# Default: 10 runs of Taiwan Strait, random seeds
node scripts/run-bop.js

# 100 runs, fixed seed base, output to file
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --seed 42 --out results.json

# Parameter sweep: China high-risk, US low patience
node scripts/run-bop.js --runs 50 --cn-risk 0.9 --us-patience 0.2

# Iran scenario
node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 50

# Analyze batch output
node scripts/analyze-results.js results.json
```

**CLI flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario <id>` | `taiwan_strait_2026` | Scenario to run: `taiwan_strait_2026`, `iran_nuclear_2026`, `south_china_sea_2026` |
| `--runs <n>` | `10` | Number of simulation runs |
| `--seed <n>` | random | Base seed; run i uses seed+i |
| `--out <path>` | `logs/bop-{scenario}-{date}-s{seed}-x{runs}.json` | Output file (`bop2026-analytics-v1`). `logs/` dir created automatically. |
| `--max-turns <n>` | `20` | Turn limit per run |
| `--player <id>` | `US` | Which power the AI controls as "player" |
| `--cascade-scale <f>` | `1.0` | Multiplier on systemic event deltas (0 = off) |
| `--<power>-risk <f>` | persona default | Override riskTolerance (0–1). E.g. `--cn-risk 0.9` |
| `--<power>-patience <f>` | persona default | Override patience (0–1). E.g. `--ru-patience 0.2` |

---

## Oracle API

The `window.BoP` object (browser) / `require('./js/oracle')` (Node) exposes the simulation engine for scripted use.

```js
// Initialize a scenario
BoP.init('taiwan_strait_2026', {
  seed: 42,
  paramOverrides: {
    CN: { riskTolerance: 0.9, patience: 0.4 },
    US: { patience: 0.2 }
  }
});

// Run to completion (returns SimResult)
const result = BoP.run({ maxTurns: 20 });
console.log(result.outcome.result);        // 'win' | 'lose' | 'incomplete'
console.log(result.outcome.stabilityIndex);
console.log(result.outcome.turnsPlayed);

// Step through manually
const step = BoP.step();   // one turn, AI decides all actions
console.log(step.cascadeLog);

// Branching / counterfactuals
const snap = BoP.getState();
BoP.run();                   // outcome A
BoP.setState(snap);          // reset to branch point
BoP.setNPCOverride('CN', (id, world) => [...]);
BoP.run();                   // outcome B under different CN behavior

// Batch sweep
const results = BoP.runBatch({
  scenarioId: 'taiwan_strait_2026',
  runs: 100,
  seeds: Array.from({ length: 100 }, (_, i) => i),
  paramSweep: {
    CN: { riskTolerance: [0.3, 0.5, 0.7, 0.9] }
  }
});

// Export analytics-ready JSON (schema: bop2026-analytics-v1)
const analytics = BoP.exportAnalytics(result);
// or for batch:
const batch = BoP.exportBatchAnalytics(results);
```

**SimResult shape:**

```js
{
  scenarioId: string,
  initialState: WorldSnapshot,  // pre-game state, before turn 1
  outcome: {
    result: 'win' | 'lose' | 'incomplete',
    reason: string,
    stabilityIndex: number,   // 0–100
    turnsPlayed: number
  },
  turns: TurnResult[],        // per-turn cascade logs, actions, events, deltas
  finalState: WorldSnapshot
}
```

**TurnResult shape:**

```js
{
  turn: number,
  year: number,
  actions: {
    player: ActionObject[],
    npc: ActionObject[]
  },
  cascadeLog: CascadeEntry[],
  events: EventObject[],
  stateDeltas: {
    stats:         { [powerId]: { [stat]: { before, after, delta } } },
    relationships: { ["A->B"]:  { before, after, delta } },
    crises:        { [crisisId]: { escalationLevel: { before, after, delta } } }
  },
  stateSnapshot: WorldSnapshot,  // full world state after this turn
  gameOver: null | { result: string, reason: string }
}
```

---

## Model behavior (face validity)

100-run baseline (seed 0–99, default parameters, v2.0.2 — see v2.0.4 and v2.0.5 calibration notes in CHANGELOG for AI behavior changes):

| Scenario | Win % | Nuclear escalation % | Avg stability | Avg turns |
|----------|-------|----------------------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 1% | 20.4 (σ 4.5) | 4.9 (σ 0.9) |
| Iran Nuclear 2026 | 0% | 79% | 36.2 (σ 13.4) | 3.0 (σ 1.6) |
| South China Sea 2026 | 0% | 9% | 22.2 (σ 9.7) | 4.5 (σ 1.3) |

Seed 0–99, default parameters, max 20 turns. "Win" = US player achieves game-over win condition; all 300 runs ended in loss, reflecting how difficult crisis management is under default conditions. All scenarios are designed to be hard.

Note: prior to v2.0.2, `Events.init()` was not called in headless runs, so stochastic world events never fired during batch simulation. Numbers above reflect events firing correctly.

Key findings from the baseline:

- **Taiwan** ends fast (avg 5 turns) and converges tightly (σ 0.9). Nearly every run triggers the sanctions financial clearing systemic event and the domestic fragility cascade. Nuclear escalation is rare (1%); the Taiwan scenario ends in a managed-loss before reaching nuclear threshold.
- **Iran** is the most volatile scenario (σ 1.6 turns, σ 13.4 stability). 79% of runs reach nuclear escalation, driven by Iran's high riskTolerance (0.70) and four interlocking crises. With proxy events now firing, Hezbollah and Houthi pressure accelerates the collapse — avg turns dropped from 4.0 (pre-v2.0.2) to 3.0. Stability is bimodal: runs either collapse quickly (~20s) or hold elevated (~50s) before nuclear termination.
- **SCS** sits between them: 9% nuclear rate, wider stability spread (σ 9.7). The autonomous engagement and semiconductor chokepoint crises create divergent trajectories depending on whether early actions escalate or contain.
- EU and India default to diplomatic actions (secret channels, bilateral negotiation); Russia and the US default to military cycling (force withdrawal → deploy forces). This matches the AI personality calibration.

As of v2.0.5: patient powers (China, India) conserve AP in low-stakes turns and prioritize repairing critical stats. Pressure markers (financial fragmentation warning, etc.) now expire each turn and re-trigger only when conditions hold.

Reproduce:

```bash
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --seed 0 --out docs/taiwan-baseline.json
node scripts/analyze-results.js docs/taiwan-baseline.json

node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 100 --seed 0 --out docs/iran-baseline.json
node scripts/analyze-results.js docs/iran-baseline.json

node scripts/run-bop.js --scenario south_china_sea_2026 --runs 100 --seed 0 --out docs/scs-baseline.json
node scripts/analyze-results.js docs/scs-baseline.json
```

---

## Scenarios

### Taiwan Strait, 2026
PLA forces mobilize around Taiwan as the US-China trade war peaks. Three active crises at start: Taiwan military escalation (level 2), US-China trade war (level 3), Baltic cyber probe (level 1). Seven powers active.

### Iran Nuclear Threshold, 2026
Iran's enrichment crosses 84%. Four active crises: Iran nuclear program (level 2), Hormuz closure threat (level 1), Iran proxy network (level 2), Gulf Bloc fracture (level 1). Six scenario-specific stochastic events model the proxy branches: Hezbollah surge/degradation, Houthi Red Sea escalation/degradation, and Gulf Bloc alignment choices (US alignment vs. China hedging).

### South China Sea, 2026
China seizes a contested reef and drone swarms have replaced coast guard skippers. Four active crises: SCS Island Seizure (military, level 1), Sea Lane Blockade Threat (economic, level 1), Semiconductor Chokepoint (supply_chain, level 1), Autonomous Engagement (autonomous, level 1). The highest direct US-China military confrontation of the three scenarios — 9% baseline nuclear rate vs. 1% for Taiwan.

---

## Adding content

See [CLAUDE.md](CLAUDE.md) for full architecture notes.

- **New scenario**: add to `data/scenarios-data.js`
- **New power**: add to `data/powers-data.js` and `PERSONALITIES` in `js/ai.js`
- **New action**: add to `js/domains.js`; effects are applied by `js/cascades.js`

---

## Limitations

- Parameters (cascade weights, AI personality values) are calibrated for plausibility, not fit to historical data.
- No leader-level agents. Powers act as unitary actors.
- Domestic politics is a single scalar, not a structured political system.
- No arms race dynamics or technology development curves.
- Nuclear threshold (crisis level 5) ends the game; actual nuclear use mechanics are not modeled.

See [docs/model-notes.md](docs/model-notes.md) for full theoretical grounding and appropriate uses.

---

## Citation

If you use BoP2026 in research or teaching, please cite it as:

> Bilar, D. Y. (2026). *Balance of Power 2026* (v2.0.6). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Chokmah LLC. Zenodo. https://doi.org/10.5281/zenodo.20370930
> GitHub: https://github.com/chokmah-me/BoP2026

---

## License

MIT. See [LICENSE](LICENSE).
