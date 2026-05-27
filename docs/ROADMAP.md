# Balance of Power 2026 — Development Roadmap

**Current version:** v2.2.1 (2026-05-27)  
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
| 2 | The EMP Nightmare                     | Electromagnetic pulse attack on infrastructure  | **EMP Attacks** domain                             | Planned (v2.2) |
| 3 | Pandemic as Strategic Weapon          | Biological attack or engineered pandemic        | **Biological Epidemic** domain                     | Planned (v2.2) |
| 4 | The Rise of the Machines              | Autonomous weapons and AI-driven warfare        | **Autonomous** domain + **UCAV/Drone Swarms**      | **v2.0.1 ✓** |
| 5 | The War for Space                     | Attacks on satellites and space assets          | Space domain (future scenario)                     | Medium |
| 6 | The Urban Insurgency                  | Megacity warfare and prolonged urban combat     | Urban Operations (future scenario)                 | Medium |
| 7 | The Collapse of the Global Financial System | Systemic financial warfare and economic collapse | Covered via **Economic** + **Supply Chain** domains | Partial ✓ |

---

## Shipped

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
- **Korean Peninsula 2026 scenario** `v2.2.0` — DPRK active NPC. 4 crises: ICBM Test Series (military, L1), Sanctions Regime Collapse (economic, L1), Lazarus Financial Operations (cyber, L1), Forward Nuclear Posture (military, L2). DPRK intel matrix added (US-on-DPRK: 0.30 — most opaque state). `v2.2.1` rebalanced escalation levels (sum 8→5) and fixed entanglement cascade stacking; post-fix baseline: avg stability 28.7, avg turns 9.1.

**LLM chat vs. thinking mode:**

| Mode | Flag | Model | Cost/50-run (all NPCs) | Use when |
|------|------|-------|------------------------|----------|
| Chat (default) | _(none)_ | `deepseek-chat` | $0.10 | Baseline comparison, parameter sweeps, quick iteration |
| Thinking | `--thinking` | `deepseek-reasoner` | $0.80 | Deep case studies, reasoning-chain analysis, pedagogical use |

`--thinking` logs a chain-of-thought reasoning trace per NPC per turn (readable via `--log-prompts`). Useful for studying *how* an LLM agent reasons about crisis escalation. Not worth the 8x cost for sweeps.

---

## Planned

### High Priority (v2.2 target)

| Domain / Feature | Description | Krepinevich Link |
|---|---|---|
| **Biological Epidemic** | Engineered or natural outbreaks with international response mechanics. Interacts with domestic stability and sanctions. | "Pandemic as Strategic Weapon" |
| **EMP Attacks** | Nuclear or non-nuclear EMP strikes causing infrastructure collapse, cyber blackouts, and command disruption. | "The EMP Nightmare" |
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
- [ ] Cover at least 4 of 7 Krepinevich scenarios with playable domain content (currently 3: Supply Chain, Autonomous, partial Financial)
- [x] Korean Peninsula scenario playable with DPRK as active NPC — **shipped v2.2.0**
- [ ] Biological + EMP domains complete and integrated into at least one scenario each

---

**Next Milestone:** v2.3.0 — Biological Epidemic domain + EMP Attacks + Domestic Faction System

---

*"The future is already here — it's just not evenly distributed."* — William Gibson (quoted in Krepinevich, 2009)
