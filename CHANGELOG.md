# Changelog

## 2026-05-27 (v2.1.1)

### Added
- **North Korea (DPRK)** as an active power (`data/powers-data.js`, `js/ai.js`): military 68,
  nuclear 7, riskTolerance 0.85, patience 0.35, priorityDomains military/nuclear/cyber.
  Personality: brinkmanship doctrine, survival-first. Not yet featured in a scenario.

### Fixed
- **IR absent from world.powers in iran_nuclear_2026** (`data/scenarios-data.js`): Iran appeared
  in crisis descriptions but was not in any `crisis.involved` array, so `State.init()` never
  included it in the world. Result: 0 IR actions across all LLM runs. Fixed by adding IR to
  `involved` for `iran_nuclear_program`, `hormuz_blockade_threat`, and `iran_proxy_escalation`.
- **Iran scenario escalation stacking** (`data/scenarios-data.js`): starting escalation reduced
  from 2→1 on the two military crises. `iran_nuclear_program` involved list narrowed to
  [US, IR]; `iran_proxy_escalation` to [US, IR, EU, GB]. With all 7 powers previously in
  `involved`, each power's military action applied +1 escalation per turn — easy +5 stacking
  in one turn triggered the nuclear hair-trigger immediately. New heuristic baseline: 4% nuclear,
  4.5 avg turns (was 0% nuclear/0 IR actions; scenario was effectively unplayable as designed).
- **world.powers guard in ai.js** (`js/ai.js`): `getMostHostile()` and cooperative target
  selection iterated `power.relationships` including absent powers (e.g. DPRK, which is in
  POWERS_DATA but not in most scenarios). Absent power selected as target → cascade called
  `State.getPower('DPRK').name` → crash. Both loops now guard with `otherId in world.powers`.

### Calibration note
Iran Nuclear heuristic baseline (50-run seed 200): 4% nuclear, avg stability 20.0, avg turns 4.5.
Prior baseline (v2.0.6, no active IR): 0% nuclear, avg stability 21.2, avg turns 4.7.

## 2026-05-26 (v2.1.0)

### Added
- **DeepSeek LLM NPC backend** (`js/ai-deepseek.js`): headless-only LLM backend for NPC
  decision-making. Replaces the rule-based heuristic for any subset of powers via
  `--ai-backend deepseek --ai-powers CN,RU` (or `all`). Requires `DEEPSEEK_API_KEY` env var.
  Supports `deepseek-chat` (default) and `deepseek-reasoner` (chain-of-thought via
  `--thinking`). Prompt version tracked in `PROMPT_VERSION` constant for reproducibility.
- **Dry-run cost estimate** (`scripts/run-bop.js --dry-run`): estimates token usage and
  API cost before making any API calls.
- **Prompt logging** (`--log-prompts`): saves every system+user prompt and raw LLM response
  to a `.jsonl` sidecar file alongside the batch output, keyed by `promptVersion`.
- **Phase 0 smoke test** (`scripts/test-deepseek.js`): single-turn integration test that
  validates API connectivity, action parsing, and cost reporting. Costs ~$0.0002.

### Fixed
- **Single-action bottleneck** (`js/ai-deepseek.js` prompt v1.1): LLM was returning one
  action per turn, leaving 2/3 AP unspent. Prompt now requests a JSON array; parser
  validates the AP budget and deduplicates action IDs across the array.
- **Hallucinated power targets** (`js/ai-deepseek.js` prompt v1.2): LLM targeted `"IR"`
  in `iran_nuclear_2026` — Iran appears in crisis names but is not a playable power.
  `_parseResponse` now validates all targets against `world.powers`; invalid targets are
  dropped; `requiresTarget` actions with no valid target are skipped rather than forwarded
  to cascade.
- **Rate-limit fetch failures** (`js/ai-deepseek.js`): burst API calls across 5 NPCs hit
  DeepSeek's rate limit (34.7% fallback rate in Phase 3). Replaced silent fallback with
  exponential backoff retry (1s → 2s → 4s → 8s, 4 attempts) on HTTP 429/503 and transient
  network errors.
- **Smoke test require path** (`scripts/test-deepseek.js`): corrected
  `./ai-deepseek` → `../js/ai-deepseek`.

### Research note (v2.1.0 LLM baseline)
Phase 2 comparison, 20 seeds, CN+RU as LLM NPCs vs. full heuristic:
- Taiwan Strait: avg stability 21.6 → 26.4 (+4.8), avg turns 4.5 → 5.2 (+0.7)
- Iran Nuclear: avg stability 21.3 → 28.6 (+7.3), avg turns 5.3 → 5.1 (−0.2)

LLM NPCs consistently raise global stability without increasing nuclear risk.
RU shows the highest action diversity (17–21 action types); CN defaults toward diplomatic
actions (`trade_deal`, `bilateral_negotiation`, `cyber_defense_hardening`).

## 2026-05-26 (v2.0.6)

### Fixed
- **ORACLE.md schema** (`docs/ORACLE.md`): split `TurnResult` into raw vs. analytics-export schemas; removed stale field references that no longer matched the actual output.
- **GROK_PROJECT.md** (`docs/GROK_PROJECT.md`): removed "partially outdated" label and Known Limitations bullet that flagged the now-resolved ORACLE.md doc gap.

## 2026-05-26 (v2.0.5)

### Fixed
- **Misleading tooltips** (`js/domains.js`): `coalition_shoring` no longer claims AP restoration (it never existed). `reshoring_investment` no longer promises a turn-5 payoff (delayed effect was unimplemented).

### Improved
- **Patience governs AP spending** (`js/ai.js`): NPCs with patience > 0.65 now cap AP expenditure to ~73% in low-crisis turns (crisisLevel < 3). China (patience 0.9) conserves ~1 AP per turn during peacetime; EU and US (patience ≤ 0.5) unchanged.
- **Generalized stat-health scoring** (`js/ai.js`): replaced three hardcoded action-ID checks with a general rule — any action that boosts a stat currently below 45 gets +15 score. NPCs now prefer healing all critical stats, not just cyber and domestic.
- **Delayed effects queue** (`js/cascades.js`, `js/state.js`): `effects2nd` entries with a `delay` field now queue to `world.pendingDelayedEffects` and fire in the correct future turn. `reshoring_supply_chain`'s delayed +8 economic payoff now works. New field initialized in `State.init()`.
- **Pressure marker expiry** (`js/cascades.js`): `*_pressure` markers in `activeSystemicEvents` are cleared at the start of each `Cascades.resolve()` and re-added only if conditions still hold that turn. Markers no longer accumulate for the entire game.

### Calibration note
- Patience AP hoarding and pressure marker expiry may shift baseline numbers slightly. Prior baseline (v2.0.2, 100-run seed 0–99) remains directionally valid; re-calibration recommended before next formal release.

## 2026-05-25 (v2.0.4)

### Improved
- **Strategic posture system** (`js/ai.js`): `getStrategicPosture()` derives a turn-level intent (escalate / hold / de-escalate / consolidate) from active crisis levels, merge risk, persona `riskTolerance`, and domestic stats. De-escalate posture hard-excludes actions that raise crisis level to 4+.
- **Merge-risk detection** (`js/ai.js`): `getMergeRisk()` detects when a power faces two crises in the same region at level 2+ — a precursor to compound-crisis merges — and triggers de-escalate posture.
- **Stance persistence / flip-flop penalty** (`js/ai.js`): `power.memory` is now read, not just written. Deploy/withdraw flip-flops within two turns penalized -35/-40; repeating the same action in consecutive turns gets -8.
- **Noise scaling** (`js/ai.js`): random score noise shrinks with crisis level (±5 at level 0, ±1 at level 4), making AI choices more deterministic under pressure.

### Calibration note
- Iran Nuclear nuclear rate drops from ~73% (v2.0.2 baseline) to ~0%; avg run length increases from ~2 to ~4.6 turns. Taiwan Strait shows similar stabilization.

## 2026-05-26 (v2.0.3)

### Fixed
- **Save Log button unclickable** (`css/panels.css`): `#log-panel` had `pointer-events: none` to let map clicks pass through, which also blocked the Save Log button inside it. Fixed with `pointer-events: auto` on `#save-log-btn`.

### Added
- **Auto-save on game over** (`js/turn.js`): game log downloads automatically when the game reaches a terminal state (nuclear exchange, domestic collapse, global order failure, doctrine end condition). File downloads before the game-over modal appears.
- **Date-stamped log filenames** (`js/ui.js`): interactive save filename is now `bop-{scenarioId}-{YYYY-MM-DD}-t{turn}-{result}.json` (e.g. `bop-taiwan_strait_2026-2026-05-26-t12-lose.json`) instead of the generic `bop-log-turn{N}.json`.
- **CLI default output to `logs/`** (`scripts/run-bop.js`): when `--out` is not specified, output goes to `logs/bop-{scenario}-{date}-s{seed}-x{runs}.json`. The `logs/` directory is created automatically. Explicit `--out` still works unchanged.
- **Tests 11–12** in `scripts/test-analytics.js`: verify completed game has `outcome.result` for post-mortem filename, and verify `saveLog` payload shape + filename pattern.

## 2026-05-25 (v2.0.2)

### Added
- **Iran Nuclear proxy events** (6 new events in `data/events-data.js`): `hezbollah_surge`, `hezbollah_degraded`, `houthi_red_sea_escalation`, `houthi_degraded`, `gulf_bloc_aligns_us`, `gulf_bloc_hedges_china`. All conditioned on Iran-specific crisis IDs — fire only during `iran_nuclear_2026` games.
- **`minValue` condition support** in `js/events.js` `conditionsMet()`: mirrors the existing `maxValue` check. Enables events conditioned on a stat being above a threshold (e.g., US military high enough to have struck).
- **2 new tests** in `scripts/test-analytics.js` (tests 9–10): `minValue` block/pass behavior and Iran proxy events firing in headless batch.

### Fixed
- **Events never fired in headless batch runs** (`js/oracle.js`): `Events.init(EVENT_TABLE)` was called only in `js/main.js` (browser bootstrap), not in `BoP.init()`. Events returned `[]` in all Node/Oracle runs since the system launched. Fixed by adding `Events.init(_data('EVENT_TABLE'))` to `BoP.init()`. All three scenario baseline numbers in README updated to reflect events now firing correctly.

### Calibration note
- Iran Nuclear nuclear rate rises from 73% to 79%, avg turns drops from 4.0 to 3.0 with events active. Proxy pressure (Hezbollah, Houthi) accelerates state collapse. Stability distribution remains bimodal.

## 2026-05-25 (v2.0.1)

### Added
- **Supply Chain domain** (4 actions): `critical_minerals_deal`, `supply_chain_chokepoint`, `tech_export_ban`, `reshoring_investment`. Models rare earth/semiconductor leverage, export control coercion, and industrial decoupling.
- **Autonomous domain** (4 actions): `drone_swarm_deploy`, `autonomous_defense_net`, `counter_swarm_ops`, `ai_surveillance_grid`. Models UCAV swarm tactics, AI-curated surveillance, and electronic warfare counter-drone operations.
- **South China Sea 2026 scenario**: Third playable scenario. 4 crises — SCS Island Seizure (military), Sea Lane Blockade Threat (economic), Semiconductor Chokepoint (supply_chain), Autonomous Engagement (autonomous). Region-keyed `scs_waters+scs_waters` compound crisis `south_seas_blockade`.
- **4 SCS-specific events**: `scs_drone_escalation`, `rare_earth_export_halt`, `asean_neutrality_shift`, `undersea_cable_cut`. All conditioned on SCS crisis IDs.
- **`scs_waters+scs_waters` compound crisis** in `js/cascades.js`: `south_seas_blockade` — fires when island seizure and sea lane crises both reach level 3+.

### Calibration notes
- SCS nuclear event rate ~13% at baseline (30-run seed=42), vs. Taiwan 0%. Difference is intentional: SCS is the highest direct US-CN military confrontation scenario.
- New domain actions avoid double-escalation: `supply_chain_chokepoint` and `drone_swarm_deploy` use `escalationDelta: 1` without additional `crisis_escalation` second-order effects.
- `tech_export_ban` and `counter_swarm_ops` set to `escalationDelta: 0` (coercive/defensive, not direct military escalation).

## 2026-05-25

### Added
- Analytics export: `BoP.exportAnalytics(simResult)` and `BoP.exportBatchAnalytics(batchResults)` produce a structured `bop2026-analytics-v1` JSON format with per-turn `stateDeltas` (stat changes, relationship shifts, crisis escalation levels), metadata, and compact initial/final state summaries.
- `js/oracle.js`: `BoP.step()` now computes and attaches `stateDeltas` to each `TurnResult`; `BoP.run()` now includes `initialState` (pre-game snapshot) in `SimResult`.
- `scripts/run-bop.js`: `--out` now writes `bop2026-analytics-v1` format by default instead of raw batch dump.
- Browser batch runner: JSON download now calls `BoP.exportBatchAnalytics()` and saves `bop-analytics.json`.
- Browser interactive: "Save Log" button in the event log panel exports game log and final state snapshot as JSON.
- `scripts/test-analytics.js`: 8 regression tests for export correctness, including delta-reconstruction checks that verify stat and relationship deltas compose correctly from `initialState` to `finalState`.

### Fixed
- `exportAnalytics` set `initialState` to the post-turn-1 snapshot instead of the pre-game state. Fixed by capturing `getState()` in `BoP.run()` before the turn loop and threading it through `SimResult`.

## 2026-05-24

### Added
- `LICENSE` (MIT, Daniyel Yaacov Bilar)
- `README.md` with quick start, CLI flag reference, Oracle API docs, baseline results table, limitations, citation placeholder
- `docs/model-notes.md`: theoretical grounding (Fearon, Waltz, Jervis, Schelling), parameter calibration rationale, known limitations
- `docs/findings.md`: formal discussion of baseline findings framed as a research contribution
- `scripts/analyze-results.js`: reads batch JSON output, prints outcome distribution, stability histogram, top actions by power, systemic event counts, optional parameter sensitivity table (`--verbose`)
- `scripts/sensitivity-sweep.js`: sweeps RU/CN riskTolerance (Sweep A) and cascade severity (Sweep B), outputs markdown tables for papers
- `scripts/run-bop.js`: new flags `--player <id>` and `--cascade-scale <f>`
- `js/oracle.js`: `init()` now accepts `player` and `cascadeScale` options
- `js/state.js`: `world.sim.cascadeScale` field (default 1.0)
- `js/cascades.js`: systemic event deltas now respect `cascadeScale`
- `.gitignore`: excludes `.claude/`, `node_modules/`, local baseline JSON files

### Fixed
- Iran Nuclear scenario crash: `adjustRelationship` called with a null target when all of a power's relationships drift positive and `threatSource` becomes null. Fixed with a null guard in `cascades.js` `apply1stOrder` and a defensive `if (!p) return` in `state.js` `adjustRelationship`.
