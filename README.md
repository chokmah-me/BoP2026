# Balance of Power 2026

A turn-based multipolar crisis simulation for IR research and war studies pedagogy. Runs in the browser as a playable game and headless via Node.js for batch simulation and parameter sensitivity analysis.

---

## What it is

BoP2026 models great-power competition across six domains (military, economic, cyber, information, diplomatic, domestic) with seven major actors: US, China, EU, Russia, India, the Gulf Bloc, and Iran. Each turn, AI-driven powers select actions based on risk tolerance, patience, and domain priorities. Actions cascade through first- through fourth-order effects, with probabilistic second-order outcomes and systemic threshold events (financial fragmentation, domestic fragility spirals, compound crises).

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

Select a scenario and doctrine on the opening screen. Click **End Turn** to advance. The **Research** button in the top-right opens the in-browser batch runner.

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
| `--scenario <id>` | `taiwan_strait_2026` | Scenario to run. Also: `iran_nuclear_2026` |
| `--runs <n>` | `10` | Number of simulation runs |
| `--seed <n>` | random | Base seed; run i uses seed+i |
| `--out <path>` | `bop-results.json` | Output JSON file |
| `--max-turns <n>` | `20` | Turn limit per run |
| `--player <id>` | `US` | Which power the AI controls as "player" |
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
```

**SimResult shape:**

```js
{
  scenarioId: string,
  outcome: {
    result: 'win' | 'lose' | 'incomplete',
    reason: string,
    stabilityIndex: number,   // 0–100
    turnsPlayed: number
  },
  turns: TurnResult[],        // per-turn cascade logs, actions, events
  finalState: WorldSnapshot
}
```

---

## Model behavior (face validity)

100-run baseline (seed 0–99, default parameters):

| Scenario | Win % | Nuclear escalation % | Avg stability | Avg turns |
|----------|-------|----------------------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 1% | 25.8 (σ 3.6) | 5.9 (σ 0.5) |
| Iran Nuclear 2026 | 0% | 73% | 41.3 (σ 11.6) | 4.0 (σ 2.2) |

Seed 0–99, default parameters, max 20 turns. "Win" = US player achieves game-over win condition; all 200 runs ended in loss, reflecting how difficult crisis management is under default conditions. Both scenarios are designed to be hard.

Key findings from the baseline:

- **Taiwan** ends fast (avg 6 turns) and converges tightly (σ 0.5). Nearly every run triggers the sanctions financial clearing systemic event and the domestic fragility cascade. Nuclear escalation is rare (1%); the Taiwan scenario ends in a managed-loss before reaching nuclear threshold.
- **Iran** is much more volatile (σ 2.2 turns, σ 11.6 stability). 73% of runs reach nuclear escalation, reflecting Iran's high riskTolerance (0.70) and the scenario's four interlocking crises. 64% of runs see the compound "Gulf of Fire" crisis emerge from the Hormuz + nuclear crisis merge. Stability distribution is bimodal: runs either collapse quickly (~20s) or stay elevated (~50s) before nuclear termination.
- In both scenarios, EU and India default to diplomatic actions (secret channels, bilateral negotiation); Russia and the US default to military cycling (force withdrawal → deploy forces). This matches the AI personality calibration.

Reproduce:

```bash
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --seed 0 --out docs/taiwan-baseline.json
node scripts/analyze-results.js docs/taiwan-baseline.json

node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 100 --seed 0 --out docs/iran-baseline.json
node scripts/analyze-results.js docs/iran-baseline.json
```

---

## Scenarios

### Taiwan Strait, 2026
PLA forces mobilize around Taiwan as the US-China trade war peaks. Three active crises at start: Taiwan military escalation (level 2), US-China trade war (level 3), Baltic cyber probe (level 1). Seven powers active.

### Iran Nuclear Threshold, 2026
Iran's enrichment crosses 84%. Four active crises: Iran nuclear program (level 2), Hormuz closure threat (level 1), Iran proxy network (level 2), Gulf Bloc fracture (level 1).

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

> Bilar, D. Y. (2026). *Balance of Power 2026* (v1.0). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Chokmah LLC. Zenodo. https://doi.org/10.5281/zenodo.20370930
> GitHub: https://github.com/chokmah-me/BoP2026

---

## License

MIT. See [LICENSE](LICENSE).
