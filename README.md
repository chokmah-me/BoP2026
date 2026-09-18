# Balance of Power 2026

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.20370929-blue)](https://doi.org/10.5281/zenodo.20370929)  
**Roadmap:** [Development Plan](docs/ROADMAP.md)  
**Background:** [The Story Behind BoP2026](docs/BACKGROUND.md)  
**Quickstart:** [Get analysis-ready data in 10 minutes](docs/QUICKSTART.md)  
**Oracle reference:** [Headless simulation, full API, output schema](docs/ORACLE.md)  
**Baselines:** [Citable HEAD dataset](docs/baselines/DATASET.md) · [HEAD table (I1)](docs/HEAD-baseline.md) · **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)  
**Resume:** [Workplan](docs/notes/workplan.md) · [Findings 1–4 robustness](docs/notes/findings-1-4-robustness.md) · [SV void CI pilot](docs/notes/sv-void-ci-pilot.md)

A turn-based multipolar crisis simulation for IR research and war studies pedagogy. Eight scenarios, thirteen domains, eight actors. Runs in the browser as a playable game and headless via Node.js for batch simulation and parameter sensitivity analysis.

---

## What it is

BoP2026 models great-power competition across thirteen domains (military, economic, cyber, information, diplomatic, domestic, supply chain, autonomous, biological, EMP, space, urban, technology) with eight major actors: US, China, EU, Russia, India, the Gulf Bloc, Iran, and North Korea. Iran is active in the Iran Nuclear scenario; DPRK is active in the Korean Peninsula scenario. Each turn, AI-driven powers select actions based on risk tolerance, patience, and domain priorities. Actions cascade through first- through fourth-order effects, with probabilistic second-order outcomes and systemic threshold events (financial fragmentation, debt spiral, domestic fragility spirals, pandemic outbreak, C4ISR collapse, Kessler debris cascade, urban quagmire, compound crises).

The engine is designed for two uses:

1. **Classroom / wargame**: play through eight scenarios — Taiwan Strait, Iran Nuclear, South China Sea, Korean Peninsula, Sovereignty Void, Orbital Warfare, Megacity Siege, or Financial Contagion — in a browser, no install required.
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

Select a scenario and doctrine on the opening screen. Click **End Turn** to advance. The **Research** button in the top-right opens the in-browser batch runner. A **Save Log** button in the event log panel exports the current game state and event history as JSON. The log also downloads automatically when the game ends (nuclear exchange, collapse, doctrine failure) as a post-mortem file named `bop-{scenario}-{date}-t{turn}-{result}.json`. The event log is scrollable — pause a running simulation and scroll back to read the full turn-by-turn cascade (up to 200 entries retained).

### Node.js (headless research runs)

Requires Node.js 18+. No runtime dependencies — `package.json` only wires the test/research scripts.

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

# Headless regression suite (CI job `test` — no npm install required)
npm test

# Browser smoke (CI job `browser` installs Chromium; locally: npm install once)
npm run test:browser
```

**CLI flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario <id>` | `taiwan_strait_2026` | Scenario to run: `taiwan_strait_2026`, `iran_nuclear_2026`, `south_china_sea_2026`, `korean_peninsula_2026`, `sovereignty_void_2026`, `orbital_warfare_2026`, `megacity_siege_2026`, `financial_contagion_2026` |
| `--doctrine <id>` | scenario default | Doctrine to play: `MAGA`, `TWELVER`, `EU_FATALISM`, `MING`, `JUCHE` |
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
| `--asymmetric-aom` | off | Reproduce the original asymmetric AOM prompt ("exploit paths" for adversaries). Default since v2.6.0 is symmetric, personality-gated framing for every agent — see [the prompt-asymmetry note](docs/notes/llm-wargame-prompt-asymmetry.md). |
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

# All NPCs, 50 runs (~$0.10)
DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js \
  --ai-backend deepseek --runs 50 --seed 200

# Dry-run cost estimate — no API calls made
DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js \
  --ai-backend deepseek --runs 50 --dry-run
```

LLM NPCs use prompt version **`v1.4`** (tracked in `js/ai-deepseek.js`). The **system** message carries role, personality, and the JSON output contract. **Turn-state** facts (crises, stats, AP, available actions) and the situational `LATENCY GOVERNANCE (AOM)` block live in the **per-turn user** message so latency options refresh as crises activate or delegation flips. Invalid power targets are dropped silently. Rate-limit errors retry with exponential backoff (1s → 2s → 4s → 8s) before falling back to the heuristic. Offline pins: `node scripts/test-deepseek-parse.js`.

**AOM prompt framing (`sovereignty_void_2026`).** By default (v2.6.0+), AOM framing is *symmetric*: every agent — player and adversary alike — gets neutral "Strategic options" language, a shared systemic-survival objective, and escalation gated on its own `riskTolerance`/`patience` (now delivered in the user-message AOM section under `PROMPT_VERSION` v1.4). Earlier versions handed LLM adversaries an "Exploit paths" manual the player never saw, which drove an artificially high sovereignty-void rate. Pass `--asymmetric-aom` to reproduce that original prompt; each logged call records `aomMode` and `promptVersion`. Study + multi-seed CI pilot: [docs/notes/llm-wargame-prompt-asymmetry.md](docs/notes/llm-wargame-prompt-asymmetry.md), [docs/notes/sv-void-ci-pilot.md](docs/notes/sv-void-ci-pilot.md) (`scripts/sv-void-ci-pilot.ps1`).

**Chat vs. thinking mode:** the default `deepseek-chat` is fast and cheap (about $0.10/50-run, all NPCs). Use it for parameter sweeps and baseline comparison. `--thinking` switches to `deepseek-reasoner`, which generates a chain-of-thought reasoning trace per NPC per turn. Both models bill at `deepseek-v4-flash` rates ($0.14/$0.28 per 1M input/output, with 50x cache-hit discount). Actual cost: ~$1.40/50-run for Korean Peninsula (6–9 turn games), ~$0.70/50-run for Taiwan/Iran (4–5 turns). Use thinking mode when you want to study *how* an LLM agent reasons about crisis escalation — the traces are logged to the `.jsonl` sidecar via `--log-prompts`. Not worth ~14x over chat for bulk sweeps.

**Empirical results:**

| Scenario | Backend | Avg stability | Avg turns | Nuclear % | Version |
|----------|---------|---------------|-----------|-----------|---------|
| Taiwan Strait | Heuristic | 21.6 | 4.5 | 0% | v2.1.1 |
| Taiwan Strait | LLM CN+RU | **26.4** | 5.2 | 0% | v2.1.1 |
| Iran Nuclear | Heuristic | 28.0 | 8.0 | 0% | v2.3.0 |
| Iran Nuclear | LLM all NPCs | **34.5** | 4.1 | 40% | v2.3.0 |
| Korean Peninsula | Heuristic | 33.0 | 8.0 | 0% | v2.3.0 |
| Korean Peninsula | LLM all NPCs | **31.0** | 5.1 | 0% | v2.3.0 |

LLM NPCs adopt new domain actions naturally: 11 biological-domain calls observed in 10 Iran runs (IR using `bio_surveillance_network`, `bio_program_attribution`); 69 EMP-domain calls in 10 KP runs (DPRK using `emp_hardening` and `emp_capability_signal` most; `emp_strike` used sparingly as a last resort).

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
console.log(result.outcome.result);        // 'win' | 'lose' | 'draw'
console.log(result.outcome.stabilityIndex);
console.log(result.outcome.turnsPlayed);

// Step through manually
const step = BoP.step();   // one turn, AI decides all actions
console.log(step.cascadeLog);

// Reproducible (v2.13.2+): init({ seed }) is enough. BoP.seed()/unseed() still work.
// runBatch seeds each run internally.
BoP.seed(42);
BoP.init('taiwan_strait_2026');
const seeded = BoP.run();
BoP.unseed();

// Branching / counterfactuals
const snap = BoP.getState();
BoP.run();                   // outcome A
BoP.setState(snap);          // reset to branch point
BoP.setNPCOverride('CN', (id, world) => [...]);
BoP.setPlayerOverride((id, world) => [...]);  // override player power too (async path)
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
    stabilityIndex: number,   // 0–100, mean domestic stat
    systemicRisk: {           // second composite metric
      index: number,          // 0–100, GSI minus crisis/nuclear penalties
      crisisPressure: number, // sum of escalation across crises
      maxNuclear: number      // peak nuclear posture (0–5)
    },
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

Heuristic baseline (default parameters, re-baselined at v2.13.4 HEAD on 2026-09-17; 100 runs, seed 0, all on one engine build so rows are directly comparable). Published table: [`docs/baselines/v2.13.4/summary.json`](docs/baselines/v2.13.4/summary.json) (human reprint / I1: [`docs/HEAD-baseline.md`](docs/HEAD-baseline.md); dataset note: [`docs/baselines/DATASET.md`](docs/baselines/DATASET.md)). The May 2026 73% Iran snapshot in [`docs/findings.md`](docs/findings.md) is not this engine — shape claims for Findings 1–4 are stress-tested in [`docs/notes/findings-1-4-robustness.md`](docs/notes/findings-1-4-robustness.md).

| Scenario | Win % | Nuclear escalation % | Avg stability | Avg turns |
|----------|-------|----------------------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 0% | 33.0 | 8.3 |
| Iran Nuclear 2026 | 0% | 12% | 30.1 | 8.1 |
| South China Sea 2026 | 0% | 0% | 26.9 | 8.7 |
| Korean Peninsula 2026 | 0% | 0% | 27.1 | 10.0 |
| Orbital Warfare 2026 | 0% | 1% | 30.6 | 9.0 |
| Megacity Siege 2026 | 0% | 0% | 25.1 | 7.8 |
| Financial Contagion 2026 | 0% | 0% | 32.0 | 8.7 |

Default parameters, max 20 turns. "Win" = US player achieves game-over win condition; all runs end in loss under heuristic AI, reflecting how difficult crisis management is by design. Versus the v2.12.0 table, rows moved by at most a few tenths of GSI/turns; Iran nuclear rate is 12% here (14% at v2.12.0; n=20 instrument runs read 20% — small-n noise). Shape is unchanged: 0% heuristic wins, Iran is the nuclear scenario, Taiwan is cascade-dominant.

Key findings from the baseline:

- **Iran** carries the only material nuclear rate (12%). IR has been an active NPC since v2.1.1, and its brinkmanship doctrine drives divergent — sometimes nuclear — trajectories. Orbital is a 1% tail. Every other scenario sits at 0% under heuristic play: the v2.0.4 posture system de-escalates at crisis level 4+, keeping conventional confrontations below the nuclear threshold.
- **Megacity Siege** is the lowest-stability scenario (25.1) — the urban quagmire's persistent attrition grinds military/domestic every turn the front stays hot. **Taiwan** (33.0) and **Financial Contagion** (32.0) sit highest, reflecting recoverable economic/diplomatic crises rather than purely kinetic ones.
- Broadening the NPC pool at v2.12.0 *raised* stability a few tenths in most scenarios rather than lowering it: NPCs now spend some calm-turn action points on non-escalatory R&D and defensive capability-building (`rd_*`, `satellite_hardening`, `debris_remediation_pact`) instead of escalatory cycling, and the posture system keeps the newly-available escalatory options (`asat_strike`, `drone_swarm_deploy`) tail events rather than baseline behavior.
- Latent tail risks rarely fire under heuristic de-escalation: `asat_strike` (Kessler cascade) and `emp_strike` are seldom selected, so the Orbital debris cascade and C4ISR collapse are tail outcomes, not baseline ones.
- EU and India default to diplomatic actions (secret channels, bilateral negotiation); Russia and the US default to military cycling (force withdrawal → deploy forces). This matches the AI personality calibration.

Reproduce:

```bash
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --seed 0 --out docs/baselines/v2.13.4/taiwan_strait_2026.json
node scripts/analyze-results.js docs/baselines/v2.13.4/taiwan_strait_2026.json

node scripts/run-bop.js --scenario iran_nuclear_2026 --runs 100 --seed 0 --out docs/baselines/v2.13.4/iran_nuclear_2026.json
node scripts/analyze-results.js docs/baselines/v2.13.4/iran_nuclear_2026.json

node scripts/run-bop.js --scenario south_china_sea_2026 --runs 100 --seed 0 --out docs/baselines/v2.13.4/south_china_sea_2026.json
node scripts/analyze-results.js docs/baselines/v2.13.4/south_china_sea_2026.json

node scripts/run-bop.js --scenario korean_peninsula_2026 --runs 100 --seed 0 --out docs/baselines/v2.13.4/korean_peninsula_2026.json
node scripts/analyze-results.js docs/baselines/v2.13.4/korean_peninsula_2026.json
```

Same pattern for `orbital_warfare_2026`, `megacity_siege_2026`, and `financial_contagion_2026`. Per-run JSON is gitignored (~12–18 MB each); the committed table is `docs/baselines/v2.13.4/summary.json`.

**Sovereignty Void** is omitted from that seven-row table: it requires `--doctrine`, and doctrine sets both the player power and `t_rat`, so rows are not strategy A/B cells. Heuristic n=100 seed 0 doctrine matrix (same engine build): [`docs/baselines/v2.13.4/sv-summary.json`](docs/baselines/v2.13.4/sv-summary.json). Report `void%` (terminal sovereignty-void losses) separately from `nuclear%`; heuristic `void%` is an AOM/physics metric, not LLM skill.

| Doctrine | Player | t_rat | Win % | Nuclear % | Void % | Avg stability | Avg turns |
|----------|--------|------:|------:|----------:|-------:|--------------:|----------:|
| MING | CN | 120 | 0% | 0% | 49% | 32.0 | 7.4 |
| MAGA | US | 180 | 0% | 0% | 20% | 36.1 | 6.0 |
| JUCHE | DPRK | 45 | 0% | 0% | 23% | 28.2 | 8.0 |
| TWELVER | IR | 240 | 0% | 0% | 61% | 32.8 | 7.3 |
| EU_FATALISM | EU | 300 | 0% | 0% | 44% | 31.7 | 7.3 |

```bash
node scripts/run-bop.js --scenario sovereignty_void_2026 --doctrine MING --runs 100 --seed 0 --out docs/baselines/v2.13.4/sovereignty_void_ming_2026.json
```

---

## Scenarios

### Taiwan Strait, 2026
PLA forces mobilize around Taiwan as the US-China trade war peaks. Three active crises at start: Taiwan military escalation (level 2), US-China trade war (level 3), Baltic cyber probe (level 1). Five NPCs active (CN, EU, IN, RU, GB).

### Iran Nuclear Threshold, 2026
Iran's enrichment crosses 84%. Four active crises: Iran nuclear program (level 1), Hormuz closure threat (level 1), Iran proxy network (level 1), Gulf Bloc fracture (level 1). Iran (IR) is an active NPC — takes actions each turn alongside US, CN, EU, IN, RU, GB. Six scenario-specific stochastic events model the proxy branches: Hezbollah surge/degradation, Houthi Red Sea escalation/degradation, and Gulf Bloc alignment choices (US alignment vs. China hedging).

### South China Sea, 2026
China seizes a contested reef and drone swarms have replaced coast guard skippers. Four active crises: SCS Island Seizure (military, level 1), Sea Lane Blockade Threat (economic, level 1), Semiconductor Chokepoint (supply_chain, level 1), Autonomous Engagement (autonomous, level 1). Highest direct US–China military confrontation among the conventional scenarios; under the v2.13.4 HEAD heuristic table both SCS and Taiwan sit at **0%** nuclear (early v2.0.x SCS runs once showed a small nuclear tail — do not cite that as HEAD).

### Korean Peninsula, 2026
DPRK moves tactical warheads to forward positions after the latest ICBM series. Four active crises: ICBM Test Series (military, L1), Sanctions Regime Collapse (economic, L1), Lazarus Financial Operations (cyber, L1), Forward Nuclear Posture (military, L2). DPRK is the primary NPC antagonist — highest riskTolerance (0.85) and lowest patience (0.35) in the game. High starting escalation (sum 5) leaves little diplomatic margin.

### Sovereignty Void, 2026
Golden Dome is online and boost-phase physics set the clock. The AOM latency mechanic compares your doctrine's ratification time (`t_rat`) against each crisis's intercept window (`t_event`): if `t_rat > t_event`, the sovereignty void fires and your input doesn't register. **Requires a `--doctrine`** (UI hides it until one is chosen; `BoP.init` throws without one) — the headline mechanic is built around `t_rat`, which defaults to 999s with no doctrine. Crises: DPRK boost-phase launch (autonomous, `t_event` 90s — only JUCHE closes it), PLA hypersonic strike (autonomous, 120s — MING can close it), C2 comms blackout (cyber, adds 30s to `t_rat`), and a dormant DoDD 3000.09 review triggered by pre-delegation. Resolution paths: intercept if fast enough, pre-delegate authority (Rice-Theorem stat mask, DoDD review), or revert to midcourse (clears delegation, restores human control).

### Orbital Warfare, 2026
A destructive ASAT test seeds a debris field as GPS goes dark over a theater and cislunar resource claims harden. Player is US. Four `orbit`-region crises: ASAT Demonstration (space, L1), GNSS Denial (space, L1), Comms Satellite Blackout (cyber, L1), Cislunar Resource Claim (diplomatic, L1). The signature failure mode is the **Kessler-syndrome cascade** — an `asat_strike` seeds orbital debris that bleeds onto bystanders' `space` assets, and once two-plus powers fall below the space threshold, a global `kessler_cascade` renders low Earth orbit unusable (space/military/info degrade for all). Two `orbit`-region crises at level 3 merge into the `orbital_denial` compound. The Space (counterspace) action domain — `satellite_hardening`, `orbital_isr_surge`, `asat_strike`, `debris_remediation_pact` — drives the scenario. Closes Krepinevich's "War for Space" (#5), bringing playable domain coverage to 6 of 7.

### Megacity Siege, 2026
A coastal megacity of 20 million fractures as its host state collapses; a US-led stabilization force, a rival-backed faction, and entrenched insurgents grind block by block. Player is US. Four `megacity`-region crises: Coastal Megacity Siege (urban, L2), Insurgent Network (urban, L1), Humanitarian Corridor Crisis (diplomatic, L1), Urban Infrastructure Collapse (economic, L1). The signature mechanic is the **urban quagmire** — a `siege_encirclement` seeds a *persistent* attrition cascade that grinds the engaged powers' military/domestic/info every turn the urban front stays hot, and lifts only when the crises de-escalate (or a `civil_evacuation_corridor` relieves them); sustained quagmire with multiple fragile states triggers a one-shot `urban_humanitarian_catastrophe`, and two `megacity` crises at level 3 merge into the `urban_cauldron` compound. The Urban Operations domain — `urban_stabilization`, `precision_clearance_ops`, `siege_encirclement`, `civil_evacuation_corridor` — drives the scenario. Closes Krepinevich's "Urban Insurgency" (#6), completing playable domain coverage at 7 of 7.

### Financial Contagion, 2026
A clearing-network failure freezes SWIFT/CHIPS/Fedwire as sovereign defaults and a BRICS+ reserve-currency shift compound into systemic collapse. Player is US. Four `global_finance`-region crises: Clearing Network Failure (economic, L2 — the hot crisis), Sovereign Debt Crisis (economic, L1), Dollar Weaponization Backlash (supply_chain, L1), G20 Coordination Collapse (diplomatic, L1). All seven NPC-capable powers active, with higher intel quality across the board (the financial system is relatively transparent). The signature mechanic is the **debt spiral** — a *persistent* cascade (modeled on the urban quagmire) that seeds once `financial_fragmentation` has fired, ≥2 powers fall below economic 35, and a `global_finance` crisis sits at ≥ L2; while active it grinds every economy below 55 each turn (economic −5 / domestic −3) and lifts only when the financial crises de-escalate. Two `global_finance` crises at level 3 merge into the `great_deleveraging` compound. The scenario reuses the Economic and Supply Chain domains plus two new financial actions — `emergency_swap_lines` (bilateral central-bank liquidity) and `sovereign_debt_restructuring` (IMF/G20 relief). Closes Krepinevich's "Collapse of the Global Financial System" (#7) with a dedicated scenario, completing the full 7-of-7 Krepinevich suite.

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
- Arms-race catch-up exists on the `techLevel` ledger (v2.13.0): a rival's lead pulls matching R&D on a calm board, gated off mid-crisis. There is still no capability *erosion* and no multi-year procurement timeline.
- Nuclear threshold (crisis level 5) ends the game; actual nuclear use mechanics are not modeled.

See [docs/model-notes.md](docs/model-notes.md) for full theoretical grounding and appropriate uses.

---

## Citation

If you use BoP2026 in research or teaching, please cite it as:

> Bilar, D. Y. (2026). *Balance of Power 2026* (v2.13.4). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Chokmah LLC. Zenodo. https://doi.org/10.5281/zenodo.20370929
> GitHub: https://github.com/chokmah-me/BoP2026

---

## License

MIT. See [LICENSE](LICENSE). Contributions: [CONTRIBUTING.md](CONTRIBUTING.md).
