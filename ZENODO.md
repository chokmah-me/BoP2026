# Zenodo Deposit — Balance of Power 2026 v2.13.2

**Concept DOI (always latest):** https://doi.org/10.5281/zenodo.20370929  
**This version:** v2.13.2 — version DOI assigned by the GitHub→Zenodo release hook  
**First version DOI (v1.0.1, superseded):** https://doi.org/10.5281/zenodo.20370930  
**Last minted before this remint:** v2.7.0 — https://doi.org/10.5281/zenodo.20498785  
**Deposit Date:** 24 May 2026 (updated 16 August 2026)  
**License:** MIT  
**Principal Investigator / Originator:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914

## Description

Balance of Power 2026 is a turn-based multipolar crisis simulation for IR research and war-studies pedagogy. Eight great powers (US, China, EU, Russia, India, Gulf Bloc, Iran, North Korea) compete across twelve domains: military, economic, cyber, information, diplomatic, domestic, supply chain, autonomous systems, biological, EMP, space, and urban. Rule-based AI opponents select actions each turn based on risk tolerance, patience, and strategic priorities. Actions cascade through first- to fourth-order effects, with probabilistic second-order outcomes and systemic threshold events.

Eight playable scenarios ship with the engine: Taiwan Strait 2026, Iran Nuclear Threshold 2026, South China Sea 2026, Korean Peninsula 2026, Sovereignty Void 2026, Orbital Warfare 2026, Megacity Siege 2026, and Financial Contagion 2026. Together they cover all seven of Krepinevich's *7 Deadly Scenarios* (Financial Contagion closes Krepinevich #7 with a dedicated scenario). The Sovereignty Void scenario operationalizes the AOM latency-governance framework [Zenodo 19368682]: when doctrinal ratification time (t_rat) exceeds the boost-phase intercept window (t_event), the system resolves autonomously before the player's action registers. The same engine runs headless via Node.js for batch parameter sweeps and counterfactual branching. Output follows the `bop2026-analytics-v1` schema.

Calibrated for face validity against open-source IR literature. Not intended for forecasting or policy prescription.

## Intended Use

- IR and war-studies pedagogy (classroom wargaming)
- Parameter sensitivity analysis and counterfactual exploration
- Generation of synthetic cascade data for method development
- Latency-governance research: AOM boost-phase intercept simulation

**Not intended for:**
- Forecasting real-world crises
- Policy prescription or validation
- Empirical testing of historical cases

All parameters are calibrated for **face validity** against open-source IR literature (Fearon 1995, Jervis 1976, Waltz 1979), not statistical fitting.

## Files Included in This Deposit (v2.13.2)

- Full source code (`js/`, `data/`, `scripts/`)
- Browser interface (`index.html`)
- Complete documentation (`README.md`, `docs/`)
- Baseline results for all eight scenarios
- Model assumptions and known limitations

## Release Notes — v2.4.0

**What is this?**

BoP2026 is a crisis simulation you can play in a browser or run headless from the command line to generate synthetic geopolitical data. v2.4.0 adds the Sovereignty Void scenario and the AOM latency-governance framework, extending the autonomous domain to model boost-phase missile intercept timing constraints.

**Sovereignty Void scenario (v2.4.0)**

`sovereignty_void_2026` operationalizes the latency-governance gap from the AOM paper [Zenodo 19368682]. Golden Dome is online. The DPRK boost-phase window is 90 seconds; the Taiwan hypersonic window is 120 seconds. Your doctrinal ratification time (t_rat) determines whether you can close the window. With EU_FATALISM (t_rat=300s), both crises void every turn. With MING (t_rat=120s), you can close the Taiwan window but not the DPRK one. No human-in-the-loop doctrine closes both — the structural gap is a feature of boost-phase physics, not a parameter to tune.

Three resolution paths: (1) authorize the intercept before the window closes; (2) pre-delegate launch authority to the autonomous system (closes the gap, violates DoDD 3000.09, renders your military stats epistemically opaque — Rice-Theorem mask); (3) revert to midcourse defense (preserves human control, forfeits the intercept advantage, adversary reads the stand-down as hesitation).

**JUCHE doctrine (v2.4.0)**

DPRK is now playable for the first time. Juche Self-Reliance doctrine: t_rat=45s (fastest of any doctrine — closes both boost-phase windows), riskTolerance=0.85, patience=0.35, Expert difficulty. Win condition: nuclear deterrence achieved (nuclear ≥ 4) without exchange and without US military dominance exceeding 30 points.

**AOM-aware AI (v2.4.0)**

Both the heuristic AI and DeepSeek LLM backend understand the latency mechanic. The heuristic scores `boost_phase_intercept` with a large posture-restoring bonus when the window is closeable, suppressing it when the window has already closed. DeepSeek NPCs receive an explicit `LATENCY GOVERNANCE (AOM):` block in their system prompt — player powers see their own t_rat and per-crisis verdicts; NPC powers see the player's t_rat and framing on how to exploit the ratification gap (escalate BPI crises; escalate c2_blackout to widen the gap by 30s).

**Heuristic baseline (v2.4.0, default parameters)**

| Scenario | Nuclear % | Avg stability | Avg turns | Notes |
|---|---|---|---|---|
| Taiwan Strait 2026 | 0% | 22.5 | 4.7 | |
| Iran Nuclear 2026 | 14% | 20.7 | 4.4 | |
| South China Sea 2026 | 4% | 21.2 | 4.7 | |
| Korean Peninsula 2026 | 0% | 28.7 | 9.1 | |
| Sovereignty Void 2026 | 0% | 31.9 | 11.0 | No doctrine — both crises void every turn |

## Recommended Citation

> Bilar, D. Y. (2026). *Balance of Power 2026* (v2.13.2). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Chokmah LLC. Zenodo. https://doi.org/10.5281/zenodo.20370929

## Version History

**v2.13.2 (2026-08-16):** `BoP.init({ seed })` now actually patches mulberry32 before `State.init`
(the documented option was dead). Repeated `BoP.seed()` no longer makes `unseed()` restore a
seeded closure. New 27-test engine suite is part of `npm test`. No game-logic / baseline change.

**v2.13.1 (2026-08-05):** Portable Playwright `require` for `test:browser`; `load-engine.js` asserts
every expected engine global attached after load.

**v2.13.0 (2026-06-19):** Arms Race Dynamics — a rival's lead on the `techLevel` ledger pulls a
calm-board power to fund the matching R&D program. Seeded Taiwan baseline re-aligned (small,
stabilizing).

**v2.12.0 (2026-06-02):** Broadened NPC domain pool — the heuristic AI now proactively pursues the
newer Krepinevich domains and the R&D track instead of leaving them player/research-only. Each
persona's `priorityDomains` gains 1–3 character-fit secondary domains (the top-3 identity is
preserved), a `+5` ladder floor in `scoreAction` lets those extended domains score, and a new
`rdProgram` scoring branch values the delayed capability gain so patient powers invest in R&D when
calm, solvent, and facing a capability gap (and never mid-crisis, broke, or without a `technology`
priority). Behavioral change → seeded baselines re-aligned and re-baselined (small, stabilizing
shifts; not byte-identical to v2.11.0, same convention as prior RNG-stream additions).

**v2.11.0 (2026-06-02):** Technology Development Track — the second engine-realism feature. A new
`technology` action domain (🔬) with four R&D programs (`rd_military`/`rd_cyber`/`rd_space`/`rd_info`)
converts economic investment now into a delayed, compounding capability gain via the existing
`pendingDelayedEffects` maturation queue. A per-power `techLevel` ledger compounds the payoff
(`baseGain + (tier - 1) * step`) with sustained investment in one capability, modeling development
lead time and learning curves. Resolution is fully deterministic, so seeded baselines are
byte-identical to v2.10.0. Player/research-facing — no persona prioritizes `technology` and no crisis
uses it, so default NPCs never select R&D; it is driven by the player (browser) or Oracle overrides.

**v2.10.0 (2026-06-02):** Enhanced epistemic model — the first engine-realism feature past the
completed Krepinevich suite. Intelligence is now perishable: `State.decayIntelQuality()` pulls every
`world.intelQuality` collection link toward a 0.15 floor each turn (~11-turn half-life), and intel
actions (`ai_surveillance_grid`, `orbital_isr_surge`, `cyber_infrastructure_probe`, via a declarative
`intelRefresh` field) restore quality toward a per-scenario ceiling. `driftPerceptions()` adds a
`(1 - quality)`-scaled per-turn random walk on top of convergence-toward-truth, so high-quality
viewers track truth while near-blind viewers accumulate divergence; the UI uncertainty bands widen
automatically. Player/research-facing only — NPC heuristics still decide on `trueState`. Fixes a
latent aliasing bug (`world.intelQuality` shared `SCENARIOS_DATA`; now cloned at init). The per-turn
noise draws share the global RNG stream, so seeded baselines realign for every scenario (same
mechanism as prior event additions); re-baselined 100 runs/seed 0, all green, no playability change.

**v2.9.0 (2026-06-02):** Financial domain depth — two new economic-domain actions
(`emergency_swap_lines`, `sovereign_debt_restructuring`) — plus the **Financial Contagion 2026**
scenario (`financial_contagion_2026`: clearing-network failure, sovereign debt crisis, dollar
weaponization backlash, G20 coordination collapse). Adds the **debt-spiral cascade** — a *persistent*
contagion marker (modeled on the urban quagmire) that seeds after `financial_fragmentation` with ≥2
weak economies and a live `global_finance` crisis, grinds every economy below 55 each turn, and lifts
on de-escalation — plus the `great_deleveraging` compound and two scenario-scoped events. **Closes
Krepinevich scenario #7 ("The Collapse of the Global Financial System") with a dedicated scenario,
completing the full 7-of-7 Deadly Scenarios suite.** Heuristic baseline (100 runs, seed 0): 0%
nuclear, 32.3 stability, 3.1 systemic risk, 8.7 avg turns. The debt spiral is gated on
`global_finance` crisis presence, so prior scenario baselines are unaffected.

**v2.8.0 (2026-06-01):** Urban Operations action domain — `urban_stabilization`,
`precision_clearance_ops`, `siege_encirclement`, `civil_evacuation_corridor` — on existing stats (no
new stat), plus the **Megacity Siege 2026** scenario (`megacity_siege_2026`: coastal siege, insurgent
network, humanitarian corridor, infrastructure collapse). Adds the urban-quagmire cascade — a
*persistent* attrition marker that grinds the engaged powers each turn the urban front stays hot and
lifts on de-escalation — plus the `urban_humanitarian_catastrophe` one-shot and the
`megacity+megacity` → `urban_cauldron` compound, with two scenario-scoped events. **Closes Krepinevich
scenario #6 ("The Urban Insurgency"), completing all 7 of the 7 Deadly Scenarios.** Adding events
shifts the seeded RNG stream for all scenarios (as with the v2.0.2 / v2.3.0 / v2.7.0 event additions);
existing scenarios re-baselined and remain in range.

**v2.7.0 (2026-06-01):** Space (counterspace) action domain — `satellite_hardening`,
`orbital_isr_surge`, `asat_strike`, `debris_remediation_pact` — on the pre-existing `space` stat, plus
the **Orbital Warfare 2026** scenario (`orbital_warfare_2026`: ASAT demonstration, GNSS denial,
comms-sat blackout, cislunar resource claim). Adds the Kessler-syndrome cascade (3rd-order debris
bleed → 4th-order `kessler_cascade` rendering LEO unusable) and the `orbit+orbit` → `orbital_denial`
compound crisis, with two scenario-scoped events. Closes Krepinevich scenario #5 ("The War for
Space"), bringing playable domain coverage to 6 of 7. Adding events shifts the seeded RNG stream for
all scenarios (as with the v2.0.2 / v2.3.0 event additions); existing scenarios were re-baselined and
remain in range. Heuristic outcomes for existing scenarios otherwise unchanged.

**v2.6.0 (2026-05-31):** Symmetric AOM prompt is now the default for the DeepSeek backend. The
latency-governance prompt block previously gave LLM adversaries an "exploit paths" framing the player
never saw, producing an artifactually high sovereignty-void rate; the default now gives every agent
neutral framing, a shared systemic-survival objective, and escalation gated on its own
`riskTolerance`/`patience` (`--asymmetric-aom` reproduces the old prompt; `aomMode` logged per call;
`PROMPT_VERSION` v1.3). Adds the prompt-asymmetry study (`docs/notes/llm-wargame-prompt-asymmetry.md`)
and its hypothesis harness (`scripts/sv-hypotheses.ps1`, `scripts/sv-summary.mjs`). Heuristic outcomes
unchanged.

**v2.5.0 (2026-05-28):** AOM / sovereignty-void hardening and infra cleanup. `sovereignty_void_2026` now requires a doctrine (`requiresDoctrine`; `BoP.init` throws without one). `revert_midcourse_defense` clears pre-delegation and lifts the Rice mask (`Epistemic.clearRiceMask()`). New `State.getSystemicRiskIndex()` second outcome metric (`outcome.systemicRisk`, folds crisis escalation + nuclear posture). Shared Node loader (`scripts/load-engine.js`), unified oracle turn executors, single mulberry32 via `BoP.seed`/`BoP.unseed`, documented AOM world-field schema, zero-dependency `package.json` + GitHub Actions CI.

**v2.4.0 (2026-05-28):** Sovereignty Void scenario. AOM latency-governance framework (`_latencyGate()` in `js/cascades.js`). Three new autonomous actions: `boost_phase_intercept`, `pre_delegate_authority`, `revert_midcourse_defense`. t_rat on all 4 doctrines. JUCHE doctrine (DPRK playable, t_rat=45s). DPRK as targetable NPC in sovereignty_void. AOM-aware heuristic AI and DeepSeek prompt. Rice-Theorem epistemic mask. Escalation log noise fix (0→0 suppressed).

**v2.3.0 (2026-05-28):** Biological Epidemic domain (4 actions). EMP Attacks domain (4 actions). Bio/EMP cascade rules (3rd-order markers + 4th-order systemic thresholds). 4 new stochastic events. `iran_bio_program` crisis (Iran Nuclear 2026). `dprk_emp_threat` crisis (Korean Peninsula 2026). Escalation fix: untargeted actions no longer cascade into domain-mismatched crises.

**v2.2.3 (2026-05-27):** Cost estimation fix. Cache-hit token tracking added. KP thinking baseline corrected.

**v2.2.2 (2026-05-27):** Docs only. KP DeepSeek thinking baseline (25 runs, seed 42): avg turns 6.4, stability 28.9.

**v2.2.1 (2026-05-27):** Entanglement cascade cap. KP escalation rebalanced (sum 8→5). Post-fix: avg turns 9.1, stability 28.7.

**v2.2.0 (2026-05-27):** Korean Peninsula 2026 scenario. DPRK active NPC. Four crises.

**v2.1.1 (2026-05-27):** Iran wired as active NPC. DPRK added to engine.

**v2.1.0 (2026-05-26):** DeepSeek LLM NPC backend. Dry-run. Prompt logging.

**v2.0.x (2026-05-25–26):** Supply Chain + Autonomous domains. South China Sea scenario. Strategic posture system. AI audit. Analytics output schema. Save/auto-save.

## Contact & Repository

**Principal:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914  
GitHub: https://github.com/chokmah-me/BoP2026  
Issues and pull requests welcome for new scenarios, actions, or domain extensions.
