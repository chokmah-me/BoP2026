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
| `--ai-backend <id>` | `heuristic` | NPC AI backend: `heuristic` or `deepseek` |
| `--ai-powers <ids>` | `all` | Powers using LLM backend: `all` or comma-list e.g. `CN,RU` |
| `--log-prompts` | off | Save LLM prompt+response to a `.jsonl` sidecar file |
| `--thinking` | off | Use `deepseek-reasoner` (chain-of-thought) instead of `deepseek-chat` |
| `--dry-run` | off | Estimate token cost without making API calls (DeepSeek only) |

### LLM NPC backend (DeepSeek)

NPCs can use a DeepSeek LLM instead of the rule-based heuristic. Headless only — no browser support. Requires a `DEEPSEEK_API_KEY` environment variable.

```bash
# Smoke test — 1 turn, ~$0.0002
DEEPSEEK_API_KEY=sk-... node scripts/test-deepseek.js

# CN + RU as LLM NPCs, 20 seeds, with prompt log
DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js \
  --ai-backend deepseek --ai-powers CN,RU \
  --runs 20 --seed 0 --log-prompts --out logs/llm-cnru.json

# All 5 NPCs, 50 runs (~$0.10)
DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js \
  --ai-backend deepseek --runs 50 --seed 200

# Dry-run cost estimate — no API calls made
DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js \
  --ai-backend deepseek --runs 50 --dry-run
```

LLM NPCs use prompt version `v1.2` (tracked in `js/ai-deepseek.js`). Each NPC receives its own system prompt with personality, active crisis context, and available actions, and returns a JSON array of up to 3 actions within its AP budget. Invalid power targets are dropped silently. Rate-limit errors retry with exponential backoff (1s → 2s → 4s → 8s) before falling back to the heuristic.

**Empirical results (Phase 2, 20 seeds, `taiwan_strait_2026` and `iran_nuclear_2026`):**

| Scenario | Backend | Avg stability | Avg turns | Nuclear % |
|----------|---------|---------------|-----------|-----------|
| Taiwan Strait | Heuristic | 21.6 | 4.5 | 0% |
| Taiwan Strait | LLM CN+RU | **26.4** | 5.2 | 0% |
| Iran Nuclear | Heuristic | 21.3 | 5.3 | 0% |
| Iran Nuclear | LLM CN+RU | **28.6** | 5.1 | 0% |

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

100-run baseline (seed 0–99, default parameters, v2.0.6):

| Scenario | Win % | Nuclear escalation % | Avg stability | Avg turns |
|----------|-------|----------------------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 0% | 22.5 (σ 2.8) | 4.7 (σ 0.8) |
| Iran Nuclear 2026 | 0% | 0% | 21.2 (σ 3.2) | 4.7 (σ 0.9) |
| South China Sea 2026 | 0% | 4% | 21.2 (σ 6.4) | 4.7 (σ 1.2) |

Seed 0–99, default parameters, max 20 turns. "Win" = US player achieves game-over win condition; all 300 runs ended in loss, reflecting how difficult crisis management is under default conditions. All scenarios are designed to be hard.

Key findings from the baseline:

- **Taiwan** is now the tightest scenario (σ 2.8 stability, σ 0.8 turns). Nuclear escalation dropped to 0% — the v2.0.4 posture system de-escalates at crisis level 4+, which consistently prevents Taiwan from reaching nuclear threshold.
- **Iran** nuclear rate dropped from 79% (v2.0.2) to 0%. The strategic posture system (v2.0.4) triggers de-escalation before the four interlocking crises reach nuclear threshold. Average run length extended from 3.0 to 4.7 turns as a result. Stability distribution tightened considerably (σ 3.2 vs. σ 13.4 prior).
- **SCS** retains the highest nuclear rate at 4%, reflecting the direct US-China military confrontation dynamic. Stability spread (σ 6.4) is still the widest of the three, driven by the autonomous engagement and semiconductor chokepoint crises creating divergent trajectories.
- EU and India default to diplomatic actions (secret channels, bilateral negotiation); Russia and the US default to military cycling (force withdrawal → deploy forces). This matches the AI personality calibration.

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
