# BoP2026 Baseline Findings

**Scenario**: Taiwan Strait 2026 and Iran Nuclear Threshold 2026  
**Runs**: 100 per scenario, seeds 0–99, default parameters, no doctrine  
**Generated**: May 2026

---

## Summary

| Scenario | Win% | Nuclear% | Avg stability | Avg turns |
|----------|------|----------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 1% | 25.8 (σ 3.6) | 5.9 (σ 0.5) |
| Iran Nuclear 2026 | 0% | 73% | 41.3 (σ 11.6) | 4.0 (σ 2.2) |

---

## Finding 1: Systemic failure is universal

No run in either scenario produces a win. The win condition requires reaching turn 20 with a Global Stability Index (GSI) ≥ 40. Neither scenario achieves this: Taiwan ends at avg turn 5.9, Iran at turn 4.0.

This is not a calibration error. It is the model's central output.

The mechanism is the domestic fragility cascade. The systemic event triggers when two or more powers simultaneously reach domestic stability < 30, then pushes all powers' domestic down by 8. This fires in 99 of 100 Taiwan runs. Once triggered, powers already near the threshold cross the "cascading collapse" condition (domestic ≤ 15 for two powers) within one to two additional turns. The game ends at turn 6.

**Why this happens under default AI behavior**: No single actor causes the cascade. Each power acts according to its own preferences — Russia and the US cycle between military deployment and withdrawal; China and the Gulf Bloc apply economic pressure through trade deals and sanctions; the EU and India pursue diplomatic channels. The compound effect of repeated sanctions (which impose domestic costs), military deployments (which also carry domestic penalties), and second-order economic blowback pushes multiple actors below the fragility threshold simultaneously. No actor has the incentive or the capacity to prevent this collectively.

This is emergent coordination failure. The model produces it without any actor intending it — which is precisely the point.

---

## Finding 2: The two scenarios have radically different termination mechanisms

**Taiwan** (99% cascade-driven, 1% nuclear):
- Tight distribution: σ 0.5 turns, σ 3.6 stability
- Runs are nearly deterministic — the cascade fires reliably regardless of random seed
- Nuclear escalation almost never reaches level 5 because the domestic collapse terminates the game first
- Every run produces the financial fragmentation systemic event (588 occurrences across 100 runs = avg 5.88 per run, nearly every turn)

**Iran** (73% nuclear, 37% cascade):
- Wide distribution: σ 2.2 turns, σ 11.6 stability — bimodal, not bell-shaped
- Two distinct failure modes: fast nuclear termination (avg ~3 turns) and slower cascade termination (avg ~5–6 turns)
- The compound "Gulf of Fire" crisis emerges in 64% of runs when the Hormuz and nuclear crises both reach escalation level 3 and merge
- Iran's riskTolerance (0.70) combined with four initial crises — two already at escalation level 2 — creates a shorter path to nuclear threshold

**What this contrast means**: the same engine, same actors, same AI personalities produce qualitatively different dynamics from different initial conditions. The Taiwan scenario's stability (literally — low variance) is a direct consequence of starting with one high-escalation crisis (trade war at level 3) that drives economic sanctions, which drives domestic costs, which drives the cascade. The Iran scenario's volatility is a consequence of multiple overlapping crises, more actors with high riskTolerance, and a nuclear-armed actor with explicit nuclear objectives.

This is consistent with IR theory. Deterrence stability under multipolarity depends heavily on initial conditions and the structure of the crisis, not just on actor preferences (Waltz, 1979; Powell, 1990). The model replicates this without structural balance or formal deterrence mechanics — it emerges from the cascade logic.

---

## Finding 3: Emergent strategic cultures match calibration

The action frequency data validates the personality calibration:

| Power | Top actions | Implied posture |
|-------|-------------|-----------------|
| US | force_withdrawal, deploy_forces, sanctions | Military cycling with economic coercion |
| RU | force_withdrawal, deploy_forces, arms_sale | Military cycling, slightly less economic |
| CN | trade_deal, financial_pressure, sanctions | Economic statecraft dominant |
| EU | secret_channel, bilateral_negotiation, multilateral_forum | Diplomatic hedging |
| IN | bilateral_negotiation, secret_channel, public_statement | Strategic autonomy — talks, signals, no commitment |
| GB | trade_deal, financial_pressure, sanctions | Revenue-first, aligned with CN |

These patterns are emergent from `riskTolerance`, `patience`, and `priorityDomains` — not hardcoded behavior. US and Russia both cycle military actions because their high-priority domain is military and their riskTolerance is moderate-to-high; EU and India prefer diplomatic channels because their priorityDomains are diplomatic/economic and their patience is high (0.70).

The fact that US and Russia both default to force_withdrawal as their top action is notable. This is not surrender — it reflects the AI's tendency to de-escalate when domestic constraint is active (`domestic < 40` blocks high-escalation military actions), then re-escalate once constraint lifts. The cycle is: deploy → domestic cost → withdraw → domestic recovers → deploy. This mirrors the action-reaction cycles in deterrence theory (Jervis 1976; Schelling 1966).

---

## Finding 4: The 0% win rate as a theoretical statement

The model says: under multipolar crisis conditions, with actors behaving according to their stated preferences, no one wins. This is not a game balance problem. It is a theoretical claim about crisis management under anarchy.

The argument, translated to IR theory: systemic pressures (financial interdependence, domestic political vulnerability) compound faster than any actor's diplomatic capacity to address them. Each actor's individually rational choices — apply economic pressure, signal military resolve, hedge diplomatically — produce collectively irrational aggregate outcomes. The system defaults to collapse.

This connects to three bodies of literature:

1. **The rationalist paradox (Fearon 1995)**: War should not happen between rational actors who share a common prior — it's ex-ante inefficient. Yet 73% of Iran runs end in nuclear exchange, which every actor wanted to avoid. The model shows this happening not through miscalculation but through the structure of cascading second-order effects: an actor escalates because its model of the other is inaccurate (epistemic noise), which triggers a response the first actor didn't intend, which triggers a counter-response. Each step is locally rational; the outcome is collectively catastrophic.

2. **Coordination failure under anarchy (Waltz 1979, Mearsheimer 2001)**: No central authority can enforce the cooperative outcome. Even if all actors prefer stability, no enforcement mechanism exists. The model formalizes this: the domestic fragility cascade fires because no single actor has both the incentive and the capacity to prevent it.

3. **The security dilemma and the spiral model (Jervis 1978)**: Actions taken for defensive purposes (military deployment to signal resolve) are interpreted as offensive by the target, triggering counter-mobilization, which the original actor interprets as offensive, and so on. The US/Russia military cycling pattern directly instantiates this.

---

## Research avenue: sensitivity of the 0% boundary

The key empirical question is: what changes to initial conditions or actor behavior would allow wins to occur? This maps the boundary of the "systemic failure zone."

The `sensitivity-sweep.js` script tests two classes of interventions:

**Sweep A — Actor behavior**: varying RU and CN riskTolerance across the 0–1 range. These are the two most consequential actors for escalation. If lowering their risk tolerance produces wins, it confirms that actor-level preferences are the binding constraint. If wins remain at 0%, it suggests the structural conditions (scenario design, cascade thresholds) dominate actor behavior.

**Sweep B — Cascade severity**: varying the `cascadeScale` parameter (0 = no systemic events, 1.0 = default). If wins appear only when cascadeScale approaches 0, it confirms that the systemic threshold is the binding constraint — actors would manage the crisis successfully if systemic pressures were absent. This tests whether the model's "claim" is that systemic pressures are the cause of failure, or whether actor behavior is.

Run both sweeps:

```bash
node scripts/sensitivity-sweep.js --scenario taiwan_strait_2026 --runs 50 --out docs/sensitivity-taiwan.md
node scripts/sensitivity-sweep.js --scenario iran_nuclear_2026 --runs 50 --out docs/sensitivity-iran.md
```

---

## Limitations of this analysis

1. These are 100 runs, seeded 0–99. A different seed range may produce slightly different rates; the Iran nuclear rate in particular (73%) has a 95% confidence interval of roughly ±9 percentage points for n=100.

2. The AI player (US) uses the same rule-based logic as all NPCs. A human player, or a more sophisticated AI, might find win paths that the default AI cannot. The 0% win rate is a statement about *rule-based AI behavior*, not about the possibility space.

3. The cascade threshold (domestic < 30 to trigger, ≤ 15 to collapse) is a design choice, not an empirical estimate. The sensitivity sweep will show how sensitive results are to this choice.

---

## References

Fearon, J. D. (1995). Rationalist explanations for war. *International Organization*, 49(3), 379–414.

Jervis, R. (1976). *Perception and Misperception in International Politics*. Princeton University Press.

Jervis, R. (1978). Cooperation under the security dilemma. *World Politics*, 30(2), 167–214.

Mearsheimer, J. J. (2001). *The Tragedy of Great Power Politics*. W.W. Norton.

Powell, R. (1990). *Nuclear Deterrence Theory*. Cambridge University Press.

Schelling, T. (1966). *Arms and Influence*. Yale University Press.

Waltz, K. (1979). *Theory of International Politics*. Addison-Wesley.
