# Balance of Power 2026 — Development Roadmap

**Current version:** v2.10.0 (2026-06-02)  
**Principal Investigator:** Daniyel Yaacov Bilar, Chokmah LLC  
**Status:** Active development

---

## Strategic Inspiration

This roadmap draws from **Andrew Krepinevich's *7 Deadly Scenarios: A Military Futurist Explores War in the 21st Century*** (2009). The book emphasizes strategic foresight in an era of rapid technological change and multipolar competition — highlighting how traditional military power is increasingly challenged by non-traditional threats (cyber, biological, space, supply chain, and autonomous systems).

BoP2026 operationalizes several of these insights through expanded domains and compound crisis mechanics.

---

## Krepinevich's 7 Deadly Scenarios — Mapping to BoP2026

| # | Scenario                              | Core Threat                                      | BoP2026 Coverage                                   | Status |
|---|---------------------------------------|--------------------------------------------------|----------------------------------------------------|--------|
| 1 | The Global Supply Chain War           | Disruption of critical global supply chains     | **Supply Chain** domain (4 actions)                | **v2.0.1 ✓** |
| 2 | The EMP Nightmare                     | Electromagnetic pulse attack on infrastructure  | **EMP Attacks** domain                             | **v2.3.0 ✓** |
| 3 | Pandemic as Strategic Weapon          | Biological attack or engineered pandemic        | **Biological Epidemic** domain                     | **v2.3.0 ✓** |
| 4 | The Rise of the Machines              | Autonomous weapons and AI-driven warfare        | **Autonomous** domain + AOM latency governance + sovereignty void | **v2.4.0 ✓** |
| 5 | The War for Space                     | Attacks on satellites and space assets          | **Space** domain (4 actions) + Orbital Warfare scenario + Kessler cascade | **v2.7.0 ✓** |
| 6 | The Urban Insurgency                  | Megacity warfare and prolonged urban combat     | **Urban** domain (4 actions) + Megacity Siege scenario + urban quagmire cascade | **v2.8.0 ✓** |
| 7 | The Collapse of the Global Financial System | Systemic financial warfare and economic collapse | **Financial** domain actions + **Financial Contagion 2026** scenario + debt spiral cascade | **v2.9.0 ✓** |

---

## Shipped

### v2.10.x (2026-06-02)

- **Enhanced epistemic model** `v2.10.0` — first engine-realism feature past the Krepinevich suite.
  Intelligence is now perishable: `State.decayIntelQuality()` pulls every `world.intelQuality`
  viewer→target link toward a 0.15 floor each turn (~11-turn half-life); collection actions
  (`ai_surveillance_grid`, `orbital_isr_surge`, `cyber_infrastructure_probe`, via a declarative
  `intelRefresh` field applied in `js/cascades.js`) refresh quality back toward a per-scenario
  ceiling. `driftPerceptions()` adds a `(1 - quality)`-scaled per-turn random walk on top of the
  convergence-toward-truth term, so high-quality viewers track truth while near-blind viewers
  accumulate divergence. Player/research-facing only (NPC heuristics still read `trueState`). Fixes a
  latent bug where `world.intelQuality` aliased `SCENARIOS_DATA` (now cloned at init). 7 new tests.
  Re-baselined all seeded scenarios — see the v2.10.0 calibration note in `CHANGELOG.md`. Closes the
  Medium-Priority "Enhanced Epistemic Model" item below.

### v2.9.x (2026-06-02)

- **Financial domain actions** `v2.9.0` — 2 new economic-domain actions: `emergency_swap_lines`
  (bilateral central bank liquidity injection, de-escalatory, relationship payoff) and
  `sovereign_debt_restructuring` (IMF/G20 debt relief: target economic +10 / domestic +5, self
  economic −4). Both surface automatically in the browser UI under the Economic domain (icon 💰).
- **Financial Contagion 2026 scenario** `v2.9.0` — `financial_contagion_2026`, player US. Four
  `global_finance`-region crises: `clearing_network_failure` (economic, L2), `sovereign_debt_crisis`
  (economic, L1), `dollar_weaponization_backlash` (supply\_chain, L1), `g20_coordination_collapse`
  (diplomatic, L1). Closes Krepinevich #7 (Financial System Collapse) with a dedicated scenario
  (previously "Partial" — only domains existed, no scenario). Heuristic baseline (100 runs, seed 0):
  0% nuclear, 32.3 stability, 3.1 systemic risk, 8.7 avg turns.
- **Debt spiral cascade** `v2.9.0` — `js/cascades.js`. A *persistent* marker modeled on
  `urban_quagmire`: seeds when `financial_fragmentation` has fired AND ≥2 powers have economic < 35
  AND a `global_finance` crisis is ≥ L2 (scenario-gated). Grinds weakened economies each turn
  (economic −5, domestic −3 for all powers with economic < 55). Lifts when financial crises
  de-escalate and economic weakness abates. `great_deleveraging` compound crisis fires when two
  `global_finance` crises both hit escalation 3. Plus 2 scenario-scoped events.

### v2.8.x (2026-06-01)

- **Urban Operations domain** `v2.8.0` — closes Krepinevich #6, completing **7 of 7** scenario
  coverage. Four actions on existing stats (no new stat): `urban_stabilization` (hold-and-build),
  `precision_clearance_ops` (targeted clearance), `siege_encirclement` (most escalatory — seeds the
  quagmire), `civil_evacuation_corridor` (de-escalatory). Icon 🏙️.
- **Megacity Siege 2026 scenario** `v2.8.0` — `megacity_siege_2026`, player US. Four
  `megacity`-region crises (coastal siege, insurgent network, humanitarian corridor, infrastructure
  collapse). NPCs adopt urban actions via active-crisis domain matching. Heuristic baseline
  (100 runs, seed 0): 0% nuclear, 24.4 stability, 7.5 turns.
- **Urban quagmire cascade** `v2.8.0` — `js/cascades.js`. Unlike the one-shot systemic events, a
  *persistent* marker: `siege_encirclement` seeds `urban_quagmire`, which grinds the engaged powers
  each turn (military/domestic/info) while an urban crisis stays ≥ L2 and lifts on de-escalation; a
  `urban_humanitarian_catastrophe` one-shot fires with ≥2 fragile states; `megacity+megacity` merges
  to the `urban_cauldron` compound. Plus two scenario-scoped events. Adding events shifts seeded
  baselines for all scenarios (per `Events.drawEvents`); existing scenarios re-baselined and unbroken.

### v2.7.x (2026-06-01)

- **Space (counterspace) domain** `v2.7.0` — closes Krepinevich #5, coverage now 6 of 7. Four
  actions on the pre-existing `space` stat: `satellite_hardening` (defensive), `orbital_isr_surge`
  (intel), `asat_strike` (most escalatory — seeds debris), `debris_remediation_pact` (de-escalatory).
  Registered in the domain lookups (icon 🛰️); surfaces in the browser UI automatically.
- **Orbital Warfare 2026 scenario** `v2.7.0` — `orbital_warfare_2026`, player US. Four `orbit`-region
  crises (ASAT demonstration, GNSS denial, comms-sat blackout, cislunar resource claim). NPCs adopt
  space actions via active-crisis domain matching (no `priorityDomains` change). Heuristic baseline
  (50 runs, seed 42): 0% nuclear, ~26 stability, ~9 turns.
- **Kessler-syndrome cascade** `v2.7.0` — `js/cascades.js`, mirroring the EMP collateral→C4ISR
  pattern: `asat_strike` pushes a `kessler_pressure` marker + bystander `space` bleed (3rd order);
  `kessler_pressure` + ≥2 powers below space 30 → global `kessler_cascade` (space −12 / military −8 /
  info −6, 4th order); `orbit+orbit` merges to the `orbital_denial` compound at level 3. Plus two
  scenario-scoped events (`kessler_debris_alert`, `commercial_constellation_loss`). Adding events
  shifts seeded baselines for all scenarios (per `Events.drawEvents` rolling once per table entry —
  same as the v2.0.2 / v2.3.0 event additions); existing scenarios re-baselined and unbroken.

### v2.6.x (2026-05-31)

- **Symmetric AOM prompt by default** `v2.6.0` — closes a prompt-role artifact in the DeepSeek
  backend. The `LATENCY GOVERNANCE (AOM)` block previously gave LLM adversaries an "Exploit paths"
  paragraph the player never saw, driving a 75–83% sovereignty-void rate on the adversary side vs
  ~8–16% on the player side. The default prompt now gives every agent neutral "Strategic options"
  framing, a shared systemic-survival objective, and escalation gated on its own
  `riskTolerance`/`patience`. `--asymmetric-aom` reproduces the old prompt; `aomMode` is logged per
  call. `PROMPT_VERSION` → `v1.3`. Heuristic outcomes unchanged.
- **Prompt-asymmetry study + harness** `v2.6.0` — `docs/notes/llm-wargame-prompt-asymmetry.md`
  documents the doctrine confound (a doctrine silently sets the player power) and the prompt-role
  artifact, with a 16-cell, N=12 before/after sweep confirming the symmetric prompt collapses the
  void rate in every cell (e.g. adversaries-only 83→25%, TWELVER/EU 58→0%) and removes "exploit"
  from the models' reasoning (63→8%). Reproduce via `scripts/sv-hypotheses.ps1` (blocks A–E,
  `-LLMOnly`/`-Asymmetric`) + `scripts/sv-summary.mjs`.

### v2.5.x (2026-05-28)

- **Sovereignty Void requires a doctrine** `v2.5.0` — `requiresDoctrine` gate. Without a
  doctrine `t_rat` defaulted to 999s and the void fired every turn (degenerate). `BoP.init()`
  throws when the scenario needs a doctrine and none is supplied; standard mode hides the
  scenario until one is chosen.
- **AOM revert restores human control** `v2.5.0` — `revert_midcourse_defense` now clears
  `autonomyDelegated` and lifts the Rice mask (`Epistemic.clearRiceMask()`), matching the
  (corrected) tooltip.
- **Systemic Risk Index** `v2.5.0` — `State.getSystemicRiskIndex()` folds crisis escalation
  and nuclear posture into a second outcome metric (`outcome.systemicRisk`), so research isn't
  keyed on mean-domestic GSI alone. GSI and its thresholds unchanged.
- **Engine/infra cleanup** `v2.5.0` — shared `scripts/load-engine.js` (regex `/m`→`/gm`),
  unified oracle turn executors (`_beginTurn`/`_finishTurn`), single mulberry32 via
  `BoP.seed`/`BoP.unseed`, documented AOM world-field schema in `state.js`, and a
  zero-dependency `package.json` + GitHub Actions CI wiring `npm test`.

### v2.4.x (2026-05-28)

- **Sovereignty Void scenario** `v2.4.0` — `sovereignty_void_2026`. Operationalizes the AOM
  latency-governance framework from [Zenodo 19368682] (Golden Dome / boost-phase intercept).
  `_latencyGate()` in `js/cascades.js` compares doctrinal `t_rat` against crisis `t_event` each
  turn; sovereignty void fires (+2 escalation, player action nullified) when the gap is positive.
  Three resolution paths: intercept (if fast enough), pre-delegate (Rice-Theorem mask on stats),
  revert to midcourse. Structural gap: no doctrine closes the DPRK window (t_event=90s); MING
  (t_rat=120s) can close the Taiwan window (t_event=120s).
- **JUCHE doctrine** `v2.4.0` — DPRK playable for the first time. t_rat=45s (fastest), Expert
  difficulty. Win condition: nuclear deterrence achieved without triggering exchange.
- **AOM-aware AI** `v2.4.0` — Heuristic `scoreAction()` and DeepSeek `_buildPrompt()` both
  understand the latency mechanic. Heuristic selects `boost_phase_intercept` when the window is
  closeable (score +120 + posture restore); DeepSeek NPCs receive exploit framing for the US
  player's ratification constraint.
- **DPRK as full NPC** `v2.4.0` — Active in `sovereignty_void_2026`. Existing DPRK AI personality
  (riskTolerance 0.85, patience 0.35, priorityDomains: military/nuclear/cyber/emp).
- **AOM engine fixes** `v2.4.1` — Idempotent pre-delegation, `playerOnly` action filter,
  autonomous-domain game-over check, dormant-crisis AOM context injection, truncated-run
  `draw`/`lose` outcomes, `oracle.setPlayerOverride()`, `--doctrine` CLI flag.
- **UI readability + accessibility** `v2.4.2` — Browser presentation only. Scrollable game log
  (fixed `pointer-events`, scroll position preserved across re-renders), no UI text below 11px,
  lighter `--text-dim` for WCAG-AA contrast, `:focus-visible` outlines, SVG map ARIA, keyboard-
  operable Relations toggle, `prefers-reduced-motion`, and viewport reflow/zoom tolerance.

### v2.3.x (2026-05-28)

- **Biological Epidemic domain** `v2.3.0` — 4 actions: `bio_surveillance_network`, `pandemic_response_pact`, `medical_reserve_deployment`, `bio_program_attribution`. 3rd-order bio acceleration marker + 4th-order pandemic outbreak threshold (all: domestic −10, economic −8). 2 new events. `iran_bio_program` crisis added to Iran Nuclear 2026 (IR/US/EU, L1). IR gets `biological` in priorityDomains.
- **EMP Attacks domain** `v2.3.0` — 4 actions: `emp_hardening`, `emp_capability_signal`, `emp_strike` (most escalatory non-nuclear action: cyber −18/military −10/economic −8/escalation +2), `grid_restoration_aid`. 3rd-order EMP collateral burst (bystander cyber −6) + 4th-order C4ISR collapse threshold (all: military −12, info −8, space −6). 2 new events. `dprk_emp_threat` crisis added to Korean Peninsula 2026 (DPRK/US/CN, L1). DPRK gets `emp` in priorityDomains.
- **Escalation fix** `v2.3.0` — `findRelevantCrisis` fallback tightened: untargeted escalatory actions no longer cascade into domain-mismatched crises; targeted actions fall back only when both actor and target share the crisis. Eliminated 100% nuclear collapse in LLM-backed Iran runs. Iran LLM chat post-fix: 40% nuclear / 34.5 stability / 4.1 avg turns.

### v2.0.x (2026-05-25 – 2026-05-26)

- **Supply Chain domain** `v2.0.1` — 4 actions: `critical_minerals_deal`, `supply_chain_chokepoint`, `tech_export_ban`, `reshoring_investment`. Models rare earth and semiconductor leverage, export control coercion, and industrial decoupling.
- **Autonomous domain** `v2.0.1` — 4 actions: `drone_swarm_deploy`, `autonomous_defense_net`, `counter_swarm_ops`, `ai_surveillance_grid`. Models UCAV swarm tactics and AI-curated counter-drone operations.
- **South China Sea 2026 scenario** `v2.0.1` — 4 crises (SCS Island Seizure, Sea Lane Blockade, Semiconductor Chokepoint, Autonomous Engagement). Compound crisis `south_seas_blockade`. Highest direct US-China confrontation of the three scenarios (4% baseline nuclear rate).
- **Iran proxy network events** `v2.0.2` — 6 stochastic events: Hezbollah surge/degradation, Houthi Red Sea escalation/degradation, Gulf Bloc alignment choices. `minValue` condition support added.
- **Headless event engine** `v2.0.2` — `Events.init()` wired into `BoP.init()`. Stochastic events now fire in all batch and Oracle runs (were browser-only before).
- **Log save / auto-save** `v2.0.3` — Save Log button in event log panel; auto-save on game over. Date-stamped filenames (`bop-{scenario}-{date}-t{turn}-{result}.json`). CLI output defaults to `logs/` directory.
- **Strategic posture system** `v2.0.4` — `getStrategicPosture()` derives turn-level intent (escalate / hold / de-escalate / consolidate) from crisis levels, merge risk, and persona `riskTolerance`. De-escalate posture hard-excludes actions that would push any crisis to level 4+.
- **AI audit** `v2.0.5` — Patience-gated AP hoarding (high-patience NPCs conserve in low-crisis turns). Generalized stat-health scoring. Delayed effects queue (`effects2nd` + `delay`). Pressure marker expiry (markers no longer accumulate for the full game).

### v2.1.x (2026-05-26 – 2026-05-27)

- **DeepSeek LLM NPC backend** `v2.1.0` — headless NPC decision-making via `deepseek-chat` (default) or `deepseek-reasoner` (`--thinking`, chain-of-thought). Requires `DEEPSEEK_API_KEY`. Prompt version `v1.2` tracked in `js/ai-deepseek.js` for cross-run reproducibility.
- **Dry-run cost estimate** `v2.1.0` — `--dry-run` estimates token usage and API cost before any API calls.
- **Prompt logging** `v2.1.0` — `--log-prompts` saves every prompt and raw LLM response to a `.jsonl` sidecar file.
- **Iran (IR) as active NPC** `v2.1.1` — IR now acts each turn in `iran_nuclear_2026`. Fixed: IR was in powers-data but absent from all `crisis.involved` arrays, so `State.init()` never included it. Fixed scenario escalation stacking (narrowed `involved` lists, reduced starting levels from 2 to 1). Heuristic baseline: 14% nuclear, avg stability 20.7, avg turns 4.4.
- **North Korea (DPRK) in engine** `v2.1.1` — Added to `data/powers-data.js` and `js/ai.js`. Stats: military 68, nuclear 7, riskTolerance 0.85, patience 0.35. Brinkmanship/survival-first doctrine.
- **Korean Peninsula 2026 scenario** `v2.2.0` — DPRK active NPC. 4 crises: ICBM Test Series (military, L1), Sanctions Regime Collapse (economic, L1), Lazarus Financial Operations (cyber, L1), Forward Nuclear Posture (military, L2). DPRK intel matrix added (US-on-DPRK: 0.30 — most opaque state). `v2.2.1` rebalanced escalation levels (sum 8→5) and fixed entanglement cascade stacking. Heuristic post-fix baseline: avg stability 28.7, avg turns 9.1. DeepSeek thinking post-fix baseline (v2.2.2, 25 runs): avg stability 28.9, avg turns 6.4, cost $3.36.

**LLM chat vs. thinking mode:**

| Mode | Flag | Model | Cost/50-run (all NPCs) | Use when |
|------|------|-------|------------------------|----------|
| Chat (default) | _(none)_ | `deepseek-chat` | ~$0.10 | Baseline comparison, parameter sweeps, quick iteration |
| Thinking | `--thinking` | `deepseek-reasoner` | ~$0.70–1.40 | Deep case studies, reasoning-chain analysis, pedagogical use |

Both models bill at `deepseek-v4-flash` rates. Cost scales with game length: ~$0.70/50-run for Taiwan/Iran (4–5 turns), ~$1.40/50-run for Korean Peninsula (6–9 turns). Cache hits (typically 20%+ of input) reduce cost further. `--thinking` logs a chain-of-thought reasoning trace per NPC per turn (readable via `--log-prompts`). Useful for studying *how* an LLM agent reasons about crisis escalation. ~14x chat cost — not worth it for bulk sweeps.

---

## Planned

### High Priority (v2.2 target)

| Domain / Feature | Description | Krepinevich Link |
|---|---|---|
| ~~**Biological Epidemic**~~ | ~~Engineered or natural outbreaks with international response mechanics.~~ | **Shipped v2.3.0** |
| ~~**EMP Attacks**~~ | ~~Nuclear or non-nuclear EMP strikes causing infrastructure collapse, cyber blackouts, and command disruption.~~ | **Shipped v2.3.0** |
| **Domestic Faction System** | Replace unitary actor model with hardliner vs. moderate factions. Internal politics shapes action selection. | Compound threat modeling |
| ~~**Korean Peninsula scenario**~~ | ~~Wire DPRK into a Northeast Asia scenario as an active NPC.~~ | **Shipped v2.2.0** |

### LLM-agent methodology (follow-ups from the prompt-asymmetry study)

| Feature | Description |
|---|---|
| **AOM reasoning in the per-turn message** | Move the situational AOM framing out of the static system prompt and into the per-turn user message, so each agent's doctrine and `riskTolerance`/`patience` shape escalation turn by turn rather than via a fixed block. |
| **Cross-model replication** | Repeat the corrected role 2×2 / doctrine sweep with Claude or GPT-4o to separate the prompt effect from DeepSeek's own documented hawkishness (CSIS Futures Lab, 2025). |
| **Tighter void-rate estimates** | DeepSeek sampling is unseeded, so per-cell void rates carry noise. Repeat across multiple seed-bases and a second player power for confidence intervals rather than directional contrasts. |

### Medium Priority (future)

| Feature | Description |
|---|---|
| ~~**Enhanced Epistemic Model**~~ | ~~Perception drift + intelligence quality decay. Perceived vs. true state divergence accumulates over time.~~ **Shipped v2.10.0** |
| **Technology Development Track** | R&D investment with delayed capability gains. |
| **Arms Race Dynamics** | Military stat growth curves based on sustained spending. |
| ~~**Space domain**~~ | ~~Attacks on satellites and space assets. New actions + scenario.~~ | **Shipped v2.7.0** |
| ~~**Urban Operations**~~ | ~~Megacity warfare mechanics (Krepinevich #6).~~ | **Shipped v2.8.0** (urban quagmire attrition cascade; no new stat) |

---

## Documentation & Community Goals

- Publish baseline dataset from v2.1.x runs for academic use (Taiwan, Iran, SCS — 100-run seed 0)
- Publish 2–3 tutorial videos (Taiwan scenario walkthrough + sensitivity analysis)
- Create `CONTRIBUTING.md` and contributor guidelines

---

## Success Metrics

- [x] Compound crisis mechanics: Supply Chain + Autonomous (SCS), Iran proxy + nuclear (Iran) — **met v2.0.x**
- [x] Model at least 3 compound crises with divergent trajectories — **met v2.0.x**
- [x] Cover at least 4 of 7 Krepinevich scenarios with playable domain content — **met v2.3.0; complete 7/7 as of v2.8.0** (Supply Chain, Autonomous, Financial, Biological, EMP, Space, Urban)
- [x] Korean Peninsula scenario playable with DPRK as active NPC — **shipped v2.2.0**
- [ ] Biological + EMP domains complete and integrated into at least one scenario each

---

**Krepinevich coverage is now complete (7 of 7)** as of v2.9.0, with dedicated scenarios for all
seven scenarios. With the scenario-breadth arc closed, the **Next Milestone** shifts to depth: the
Domestic Faction System (replace the unitary-actor model with hardliner vs. moderate factions —
directly attacks the unitary-actor limitation in `docs/findings.md`), and the LLM-agent methodology
follow-ups above (per-turn AOM framing, cross-model replication, tighter void-rate CIs).

---

*"The future is already here — it's just not evenly distributed."* — William Gibson (quoted in Krepinevich, 2009)
