# Zenodo Deposit — Balance of Power 2026 v2.2.2

**Permanent DOI:** https://doi.org/10.5281/zenodo.20370930  
**Deposit Date:** 24 May 2026 (updated 27 May 2026)  
**License:** MIT  
**Principal Investigator / Originator:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914

## Description

Balance of Power 2026 is a turn-based multipolar crisis simulation for IR research and war-studies pedagogy. Eight great powers (US, China, EU, Russia, India, Gulf Bloc, Iran, North Korea) compete across eight domains: military, economic, cyber, information, diplomatic, domestic, supply chain, and autonomous systems. Rule-based AI opponents select actions each turn based on risk tolerance, patience, and strategic priorities. Actions cascade through first- to fourth-order effects, with probabilistic second-order outcomes and systemic threshold events.

Four playable scenarios ship with the engine: Taiwan Strait 2026, Iran Nuclear Threshold 2026, South China Sea 2026, and Korean Peninsula 2026. The same engine runs headless via Node.js for batch parameter sweeps and counterfactual branching. Output follows the `bop2026-analytics-v1` schema: per-turn state deltas, relationship shifts, and crisis escalation levels, ready for analysis in Python or R.

Calibrated for face validity against open-source IR literature. Not intended for forecasting or policy prescription.

## Intended Use

- IR and war-studies pedagogy (classroom wargaming)
- Parameter sensitivity analysis and counterfactual exploration
- Generation of synthetic cascade data for method development

**Not intended for:**
- Forecasting real-world crises
- Policy prescription or validation
- Empirical testing of historical cases

All parameters are calibrated for **face validity** against open-source IR literature (Fearon 1995, Jervis 1976, Waltz 1979), not statistical fitting.

## Files Included in This Deposit (v2.2.2)

- Full source code (`js/`, `data/`, `scripts/`)
- Browser interface (`index.html`)
- Complete documentation (`README.md`, `docs/`)
- 100-run baseline results for all four scenarios
- Model assumptions and known limitations

## Release Notes — v2.2.2

**What is this?**

BoP2026 is a crisis simulation you can play in a browser or run headless from the command line to generate synthetic geopolitical data. v2.2.2 is a docs-only release with updated KP baselines and corrected thinking-mode cost estimates. v2.2.1 patched the Korean Peninsula scenario. v2.2.0 added it. See Version History below for the full changelog from v2.0.6 through v2.2.2.

**KP post-fix DeepSeek thinking baseline (v2.2.2)**

25 runs, seed 42, `deepseek-reasoner`, all NPCs: avg turns 6.4, avg stability 28.9, cost $3.36. Confirms the v2.2.1 fixes hold under LLM-driven play. Also corrects thinking-mode cost estimates — prior figures were based on broken 2–3 turn games.

**Entanglement cascade fix + KP rebalance (v2.2.1)**

Bystander powers were taking -3 domestic for each simultaneous entanglement event in the same cascade resolution. In Korean Peninsula (3 concurrent targeting nodes per turn) this stacked to -9/turn per power, collapsing games in 2–3 turns. Fixed with a `penalizedByEntanglement` Set: each bystander now takes the penalty once per resolution. KP escalation levels also rebalanced (sum 8→5). Post-fix baseline: avg turns 9.1 (was 2.8), avg stability 28.7 (was 23.2).

**Korean Peninsula 2026 (v2.2.0)**

The fourth playable scenario. DPRK is the primary NPC antagonist — highest risk tolerance (0.85) and lowest patience (0.35) of any power. Four crises: ICBM Test Series (military, L1), Sanctions Regime Collapse (economic, L1), Lazarus Financial Operations (cyber, L1), Forward Nuclear Posture (military, L2). Post-fix heuristic baseline: avg stability 28.7, avg turns 9.1.

**Iran active + DPRK in engine (v2.1.1)**

Iran (IR) was previously listed as a power but absent from all crisis `involved` arrays, so it never acted. Fixed. Iran nuclear baseline: 14% nuclear rate, avg stability 20.7, avg turns 4.4. DPRK added to engine with brinkmanship/survival-first doctrine. Not featured in a scenario until v2.2.0.

**DeepSeek LLM NPC backend (v2.1.0)**

NPCs can use a DeepSeek LLM instead of the rule-based heuristic. Headless only, requires `DEEPSEEK_API_KEY`. Supports `deepseek-chat` (default, ~$0.002/run) and `deepseek-reasoner` with chain-of-thought (`--thinking`, ~$0.016/run).

**Original posture system (v2.0.6)**

The AI overhaul:

**The big change: the AI stopped being reckless**

In earlier versions the AI opponents made decisions with a lot of random noise and no memory of what they'd just done. A power could decide to deploy forces one turn and withdraw them the next, creating flip-flop cycles that drove crises to nuclear threshold almost by accident. Iran ran to nuclear exchange 79% of the time — not because the scenario is designed that way, but because the AI was thrashing.

v2.0.4 replaced that with a posture system. At the start of each turn, a power reads its situation and picks an intent: escalate, hold, de-escalate, or consolidate. If two crises in the same region are both heating up (a precursor to a compound crisis merge), it automatically shifts to de-escalate. If any crisis hits level 4, escalating actions are locked out entirely. Flip-flopping is penalized directly in the action-scoring. Random noise shrinks as crises get worse, so the AI gets more decisive under pressure, not more erratic.

Result: Iran nuclear rate dropped from 79% to 0%. SCS dropped from 9% to 4%. Taiwan was already low and stayed there. Average run length extended from 3 turns to 4.7 across all scenarios — games now play out rather than collapsing in the first few turns.

**Other improvements (v2.0.2–v2.0.5)**

- *Patient powers save resources.* China and India (high patience) now hold back action points in quiet turns instead of spending everything every turn. They prioritize repairing weak stats rather than always pushing offense.
- *Delayed effects actually work.* The reshoring investment action always promised an economic payoff a few turns later. That queue was never implemented — it silently discarded the delayed effect. Fixed.
- *Pressure warnings don't stack forever.* Systemic warnings (financial fragmentation, domestic fragility) used to accumulate turn after turn even if conditions had improved. They now clear each turn and only re-fire if the conditions still hold.
- *Headless runs now include random events.* A bug meant stochastic world events (Hezbollah pressure, Gulf Bloc alignment shifts, SCS drone incidents) never fired during batch simulations. They were browser-only. Fixed — headless runs now see the same event draws as interactive play.
- *Save and auto-save.* The game now downloads a timestamped JSON log automatically when it ends. You can also click Save Log at any point. The CLI defaults output to a `logs/` folder with a date-stamped filename.
- *South China Sea scenario.* Third playable scenario added: contested reef seizure, drone swarm engagement, semiconductor chokepoint. Two new action domains — supply chain and autonomous systems — ship with it.

**Heuristic baseline (v2.2.2, default parameters)**

| Scenario | Nuclear % | Avg stability | Avg turns |
|---|---|---|---|
| Taiwan Strait 2026 | 0% | 22.5 (σ 2.8) | 4.7 (σ 0.8) |
| Iran Nuclear 2026 | 14% | 20.7 (σ 5.4) | 4.4 (σ 0.9) |
| South China Sea 2026 | 4% | 21.2 (σ 6.4) | 4.7 (σ 1.2) |
| Korean Peninsula 2026† | 0% | 28.7 | 9.1 |

All scenarios end in loss under default conditions — they are designed to be hard. Win conditions require active crisis management the AI-controlled player does not attempt. †KP: 25-run post-fix baseline (seed 42).

## Recommended Citation

> Bilar, D. Y. (2026). *Balance of Power 2026* (v2.2.2). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Chokmah LLC. Zenodo. https://doi.org/10.5281/zenodo.20370930

## Version History

**v2.0.0 (2026-05-25):** Breaking change to output format. `run-bop.js --out` now writes `bop2026-analytics-v1` JSON with per-turn `stateDeltas`, `initialState`, and compact power/crisis summaries. New Oracle API methods `exportAnalytics()` / `exportBatchAnalytics()`. Browser Save Log button. New docs: `docs/ORACLE.md`, `docs/QUICKSTART.md`. New test suite: `scripts/test-analytics.js` (8 tests).

**v2.0.1 (2026-05-25):** Two new domains — `supply_chain` (4 actions: critical minerals deal, chokepoint seizure, tech export ban, industrial reshoring) and `autonomous` (4 actions: drone swarm deployment, autonomous defense net, counter-swarm ops, AI surveillance grid). New playable scenario: South China Sea 2026 with 4 crises across both new domains, a compound crisis (`south_seas_blockade`), and 4 SCS-specific events. No engine changes. Baseline nuclear rate: 9% (vs. 1% Taiwan, 73% Iran).

**v2.0.2 (2026-05-25):** Iran proxy event branches (6 events: Hezbollah surge/degraded, Houthi Red Sea escalation/degraded, Gulf Bloc US-alignment/China-hedging). `Events.init()` wired into `BoP.init()` — stochastic events now fire in all headless/Oracle runs (were silently skipped before). Iran nuclear rate rises to 79%, avg turns drops to 3.0.

**v2.0.3 (2026-05-26):** Save Log button unblocked (CSS `pointer-events` fix). Auto-save on game over — log downloads before game-over modal. Date-stamped filenames (`bop-{scenario}-{date}-t{turn}-{result}.json`). CLI defaults output to `logs/`. Tests 9–10 added (post-mortem filename shape, saveLog payload).

**v2.0.4 (2026-05-25):** Strategic posture system and merge-risk detection in `js/ai.js`. Stance persistence and flip-flop penalties. Noise scaling with crisis level. Iran nuclear rate drops to ~0%; avg run length 2 → 4.6 turns.

**v2.0.5 (2026-05-26):** AI audit — patience governs AP spending (patient powers conserve AP in low-crisis turns), generalized stat-health scoring (any stat below 45 prioritized, not just cyber/domestic), delayed effects queue now works (`reshoring_investment` +8 payoff fires in the correct future turn), pressure marker expiry (markers clear each turn and re-trigger only if conditions still hold).

**v2.0.6 (2026-05-26):** Docs only. `ORACLE.md` schema corrected — `TurnResult` split into raw vs. analytics-export shapes, stale field references removed. `GROK_PROJECT.md` updated to reflect accurate doc state. Baseline re-run; all version refs updated to v2.0.6.

**v2.1.0 (2026-05-26):** DeepSeek LLM NPC backend (`js/ai-deepseek.js`). Headless-only; supports `deepseek-chat` and `deepseek-reasoner` (chain-of-thought via `--thinking`). Dry-run cost estimate (`--dry-run`). Prompt logging (`--log-prompts`).

**v2.1.1 (2026-05-27):** Iran (IR) wired into `iran_nuclear_2026` as active NPC — was in powers-data but absent from all crisis `involved` arrays. Iran nuclear baseline: 14% nuclear, avg 4.4 turns. DPRK added to engine (`powers-data.js`, `ai.js`) with brinkmanship/survival-first doctrine. AI guard added for absent-power target selection.

**v2.2.0 (2026-05-27):** Korean Peninsula 2026 scenario. DPRK active NPC. Four crises: ICBM Test Series, Sanctions Collapse, Lazarus Cyber Ops, Forward Nuclear Posture. DPRK intel matrix (US-on-DPRK: 0.30).

**v2.2.1 (2026-05-27):** Entanglement cascade cap — bystanders penalized once per cascade resolution (was once per entanglement event, stacking to -9/turn in KP). KP escalation rebalanced: sum 8→5 (2,2,1,3 → 1,1,1,2). Post-fix baseline: avg turns 9.1, avg stability 28.7.

**v2.2.2 (2026-05-27):** Docs only. KP post-fix DeepSeek thinking baseline (25 runs, seed 42): avg turns 6.4, avg stability 28.9, cost $3.36. Corrected thinking-mode cost estimates (prior $0.80/50-run was derived from broken 2-turn games; actual cost scales with game length).

## Contact & Repository

**Principal:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914  
GitHub: https://github.com/chokmah-me/BoP2026  
Issues and pull requests welcome for new scenarios, actions, or domain extensions.
