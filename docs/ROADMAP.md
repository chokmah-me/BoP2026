# Balance of Power 2026 — Development Roadmap

**Current version:** v2.4.1 (2026-05-28)  
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
| 5 | The War for Space                     | Attacks on satellites and space assets          | Space domain (future scenario)                     | Medium |
| 6 | The Urban Insurgency                  | Megacity warfare and prolonged urban combat     | Urban Operations (future scenario)                 | Medium |
| 7 | The Collapse of the Global Financial System | Systemic financial warfare and economic collapse | Covered via **Economic** + **Supply Chain** domains | Partial ✓ |

---

## Shipped

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

### Medium Priority (future)

| Feature | Description |
|---|---|
| **Enhanced Epistemic Model** | Perception drift + intelligence quality decay. Perceived vs. true state divergence accumulates over time. |
| **Technology Development Track** | R&D investment with delayed capability gains. |
| **Arms Race Dynamics** | Military stat growth curves based on sustained spending. |
| **Space domain** | Attacks on satellites and space assets. New military actions + scenario. |
| **Urban Operations** | Megacity warfare mechanics. Planned for a future scenario. |

---

## Documentation & Community Goals

- Publish baseline dataset from v2.1.x runs for academic use (Taiwan, Iran, SCS — 100-run seed 0)
- Publish 2–3 tutorial videos (Taiwan scenario walkthrough + sensitivity analysis)
- Create `CONTRIBUTING.md` and contributor guidelines

---

## Success Metrics

- [x] Compound crisis mechanics: Supply Chain + Autonomous (SCS), Iran proxy + nuclear (Iran) — **met v2.0.x**
- [x] Model at least 3 compound crises with divergent trajectories — **met v2.0.x**
- [x] Cover at least 4 of 7 Krepinevich scenarios with playable domain content — **met v2.3.0** (5 of 7: Supply Chain, Autonomous, partial Financial, Biological, EMP)
- [x] Korean Peninsula scenario playable with DPRK as active NPC — **shipped v2.2.0**
- [ ] Biological + EMP domains complete and integrated into at least one scenario each

---

**Next Milestone:** v2.4.0 — Domestic Faction System

---

*"The future is already here — it's just not evenly distributed."* — William Gibson (quoted in Krepinevich, 2009)
