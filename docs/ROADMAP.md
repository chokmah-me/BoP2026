# Balance of Power 2026 — v1.1 Development Roadmap

**Target Release Window:** Q3–Q4 2026  
**Principal Investigator:** Daniyel Yaacov Bilar, Chokmah LLC  
**Status:** In progress (v2.0.5 AI audit — patience, stat-health scoring, delayed effects, pressure marker expiry; v2.0.4 posture system + stance persistence; v2.0.3 log save/auto-save; v2.0.2 Iran proxy events + headless fix; v2.0.1 supply_chain + autonomous + SCS)

---

## Strategic Inspiration

This roadmap draws heavily from **Andrew Krepinevich’s *7 Deadly Scenarios: A Military Futurist Explores War in the 21st Century*** (2009). The book emphasizes the need for strategic foresight in an era of rapid technological change and multipolar competition. It highlights how traditional military power is increasingly challenged by non-traditional threats (cyber, biological, space, supply chain, and autonomous systems).

BoP2026 v1.1 will operationalize several of these insights by expanding the domain set and introducing compound crisis mechanics that reflect Krepinevich’s warnings about "compound threats" and "strategic surprise."

---

## Krepinevich’s 7 Deadly Scenarios — Mapping to BoP2026 v1.1

| # | Scenario                              | Core Threat                                      | Relevance to BoP2026 v1.1                          | Priority in v1.1 |
|---|---------------------------------------|--------------------------------------------------|----------------------------------------------------|------------------|
| 1 | The Global Supply Chain War           | Disruption of critical global supply chains     | New **Supply Chain Disruption** domain             | **v2.0.1 ✓**    |
| 2 | The EMP Nightmare                     | Electromagnetic pulse attack on infrastructure  | New **EMP Attacks** domain                         | **High**         |
| 3 | Pandemic as Strategic Weapon          | Biological attack or engineered pandemic        | New **Biological Epidemic** domain                 | **High**         |
| 4 | The Rise of the Machines              | Autonomous weapons and AI-driven warfare        | New **AI Warfare** + **UCAV/Drone Swarms** domains | **v2.0.1 ✓**    |
| 5 | The War for Space                     | Attacks on satellites and space assets          | Planned for v1.2 (Space domain)                    | Medium           |
| 6 | The Urban Insurgency                  | Megacity warfare and prolonged urban combat     | Planned for v1.2 (Urban Operations)                | Medium           |
| 7 | The Collapse of the Global Financial System | Systemic financial warfare and economic collapse | Covered via existing **Economic** + new **Supply Chain** domains | Medium           |

---

## v1.1 High-Priority Additions

### New Domains & Mechanics (Inspired by Krepinevich + User Input)

| Domain / Mechanic              | Description                                                                 | Krepinevich Link                  | Priority |
|--------------------------------|-----------------------------------------------------------------------------|-----------------------------------|----------|
| **Supply Chain Disruption**    | Attacks on semiconductors, rare earths, pharmaceuticals, and energy logistics. Creates cascading economic + domestic fragility. | "The Global Supply Chain War" scenario | **v2.0.1 ✓** |
| **AI Warfare & Autonomous Systems** | AI-driven targeting, swarm coordination, and adversarial AI attacks. Reduces human decision time and increases escalation speed. | "The Rise of the Machines" theme | **v2.0.1 ✓** |
| **UCAV / Drone Swarms**        | Low-cost unmanned combat aerial vehicles and loyal wingman concepts. New military actions with lower political cost but high escalation risk. | Drone proliferation warnings | **v2.0.1 ✓** |
| **Biological Epidemic**        | Engineered or natural biological outbreaks with international response mechanics. Interacts with domestic stability and sanctions. | "Pandemic as Strategic Weapon" | **High** |
| **EMP Attacks**                | Nuclear or non-nuclear electromagnetic pulse strikes causing infrastructure collapse, cyber blackouts, and command disruption. | "The EMP Nightmare" scenario | **High** |

### New Powers (Required)

- **Iran (IR)** — Must be added as a playable power. Currently IR appears in crisis names (`iran_nuclear_2026` scenario) but is not in `POWERS_DATA`, causing LLM NPCs to hallucinate it as a valid target and crash. Needed for the Iran scenario to be fully playable and for the LLM backend to reason about it correctly.
- **North Korea (DPRK)** — Must be added as a playable power. Key actor in any Northeast Asia / peninsula scenario; absence creates the same hallucination risk as IR.

Both should be added to `data/powers-data.js` with appropriate stats, relationships, and personalities in `js/ai.js` before any scenario that features them is promoted to a full LLM run.

### Other Core v1.1 Features

- **Domestic Faction System** — Replace unitary actor model with hardliner vs. moderate factions
- **Enhanced Epistemic Model** — Perception drift + intelligence quality decay
- **New Scenario: South China Sea 2026** — Contested sea lanes, island seizure, force projection costs **(v2.0.1 ✓)**
- **Iran proxy network events** — Hezbollah/Houthi probabilistic branches, Gulf Bloc alignment choices, `minValue` condition support **(v2.0.2 ✓)**
- **Headless event engine** — `Events.init()` wired into `BoP.init()`; stochastic events now fire in all batch/Oracle runs **(v2.0.2 ✓)**
- **Technology Development Track** — R&D investment with delayed capability gains
- **Arms Race Dynamics** — Military stat growth curves based on sustained spending

---

## Documentation & Community Goals

- Maintain `docs/ROADMAP.md` (this file)
- Create `CONTRIBUTING.md` and contributor guidelines
- Publish 2–3 tutorial videos (Taiwan scenario + sensitivity analysis walkthrough)
- Release synthetic dataset from v1.1 baseline runs for academic use

---

## Success Metrics for v1.1

- Achieve 20%+ increase in outcome variance through domestic factions and new domains
- Successfully model at least 3 compound crises (e.g., Supply Chain + Biological + EMP)
- Receive positive feedback from IR and war studies pilot users

---

**Next Milestone:** Feature freeze and internal playtesting — August 2026

---

*"The future is already here — it’s just not evenly distributed."* — William Gibson (quoted in Krepinevich, 2009)