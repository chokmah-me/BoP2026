# Changelog

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
