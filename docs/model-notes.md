# BoP2026 Model Notes

## What this model is

BoP2026 is a stylized, rule-based simulation of great-power competition during acute crisis. It is designed for structured exploration of plausible causal mechanisms — not for forecasting, and not as a substitute for empirical analysis. Think of it the way economists use Cournot duopoly models: the point is to trace out implications of stated assumptions, not to claim the assumptions are literally true.

Appropriate uses:
- Illustrating cascade dynamics in a crisis management seminar
- Exploring sensitivity of outcomes to actor risk tolerance and patience
- Generating synthetic data for developing analysis methods
- Teaching IR students about second- and third-order effects

Inappropriate uses:
- Predicting actual outcomes of real crises
- Validating specific policy recommendations
- Replacing empirical case analysis

---

## Theoretical anchors

### Balance of power realism
Powers maintain an `economic`, `military`, and `space` stat that represents their relative capability. No power can sustain high-cost action indefinitely without domestic or economic cost. The engine does not enforce a structural balance (no automatic balancing coalition) — that emergent behavior depends on AI behavior and scenario design.

### Crisis bargaining (Fearon 1995)
Each crisis has an escalation level (0–5). Powers choose whether to escalate (costly signal), de-escalate (concession), or take lower-cost actions. The epistemic model (perceived vs. true state, per-dyad intelligence quality) creates the information asymmetry that is central to Fearon's crisis bargaining framework. Powers may act on perceived state, not true state, producing misperception-driven escalation.

### Deterrence theory
Nuclear posture (the `nuclear` stat) raises the cost of confrontation for all parties. At level 5, the system terminates — nuclear exchange ends the game. The model treats nuclear weapons as existential deterrents, not usable instruments; there are no "limited nuclear war" mechanics.

### Epistemic model (Jervis 1976, misperception)
Each power maintains a `perceivedBy` object: every other power's view of its stats, distorted by intelligence quality (0–1 per dyad) and updated each turn via `Epistemic.update()`. Low intel quality means perceptions drift further from truth. This can cause an actor to respond to a capability gap that doesn't exist, or fail to respond to one that does.

---

## Parameter calibration

Parameters are set for **face validity** — they produce outcomes that an IR scholar familiar with the scenarios would find plausible. They are not regression-estimated from historical data.

### AI personality values

| Power | riskTolerance | patience | Priority domains |
|-------|--------------|----------|-----------------|
| US | 0.55 | 0.50 | military, economic, diplomatic |
| China | 0.40 | 0.90 | economic, diplomatic, cyber |
| Russia | 0.75 | 0.35 | military, info, cyber |
| EU | 0.30 | 0.70 | diplomatic, economic |
| India | 0.45 | 0.70 | diplomatic, economic |
| Gulf Bloc | 0.50 | 0.60 | economic, military |
| Iran | 0.70 | 0.65 | military, info, cyber |

**riskTolerance**: probability weight given to escalatory actions. Russia at 0.75 reflects its demonstrated willingness to accept high escalation risk when it perceives a window of opportunity (see: 2008, 2014, 2022). China at 0.40 reflects strategic patience and preference for incremental gains.

**patience**: weight given to de-escalatory actions when in a crisis. High patience = prefers waiting and diplomacy. China's high patience (0.90) reflects the "long game" orientation visible in its Taiwan policy across decades.

These values can be overridden at run time via `paramOverrides`. Sensitivity analysis over these parameters is one of the main research uses of the model.

### Cascade effect weights

First-order effects (e.g. `deploy_forces`: self military +5, target military -3) represent the direct capability and signaling consequences of an action. The magnitudes are small by design: no single action should dominate a run. Second-order probabilities (0.2–0.7) represent the range from "this sometimes happens" to "this usually happens" — they are not empirically estimated.

The most consequential cascade thresholds:
- Financial fragmentation: 3+ economic crises at escalation ≥ 3 → all powers economic -15
- Domestic fragility cascade: 2+ powers at domestic < 30 → all powers domestic -8
- Crisis merging: 2 crises in the same or adjacent region at escalation ≥ 3 → compound crisis

These systemic events are designed to represent non-linear tipping dynamics that standard game-theoretic models often assume away.

---

## Known limitations

1. **Unitary actor assumption**: Each power is a single agent with fixed preferences. No domestic politics, no faction competition, no leader turnover.

2. **Domestic politics as scalar**: `domestic` (0–100) captures internal stability but says nothing about regime type, political institutions, or legitimacy.

3. **No arms race dynamics**: Military capability (`military`) changes each turn but there are no investment curves, technology development, or procurement timelines.

4. **Static geography**: The SVG map is decorative. No supply lines, no force projection costs, no contested sea lanes beyond what crises represent.

5. **Simultaneous action resolution**: All powers act in the same turn and effects are resolved simultaneously. This misses sequential signaling and response dynamics.

6. **No economic interdependence structure**: The `economic` stat does not model trade flows. Sanctions affect stats, but the structure of mutual dependence (e.g. US-China trade) is not explicitly represented.

7. **Rule-based AI, not learned**: AI behavior is deterministic rules with stochastic noise, not learned from data. It will not discover novel strategies.

---

## Differences from related tools

**Compared to RAND STRAT**: BoP2026 is open-source, runs in a browser, and is designed for public pedagogical use rather than classified wargaming.

**Compared to tabletop wargames (e.g. GMT's Twilight Struggle)**: BoP2026 is computationally tractable — you can run 1000 replications in minutes and compare outcome distributions. Tabletop games offer richer historical narrative but not systematic sensitivity analysis.

**Compared to agent-based models (e.g. Schelling segregation)**: BoP2026 has explicitly designed action catalogs and scenario content grounded in current IR cases, making outputs more interpretable to policy audiences than generic ABM outputs.

---

## References

Fearon, J. D. (1995). Rationalist explanations for war. *International Organization*, 49(3), 379–414.

Jervis, R. (1976). *Perception and Misperception in International Politics*. Princeton University Press.

Waltz, K. (1979). *Theory of International Politics*. Addison-Wesley.

Schelling, T. (1966). *Arms and Influence*. Yale University Press.
