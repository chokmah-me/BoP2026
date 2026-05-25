# Changelog

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
