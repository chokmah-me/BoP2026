# Robustness Check: BoP2026 Findings 1–4 (shape claims)

Mode: **own-draft**. Coverage: `docs/findings.md` §§ Finding 1–4; instrument register in `scripts/test-instrument.js`; sensitivity harness `scripts/sensitivity-sweep.js`; engine via `scripts/load-engine.js`. May 2026 **rates** (Iran 73% nuclear, Taiwan GSI 25.8, …) are a historical snapshot — this check is of **shape / invariance** claims that `npm test` still gates on HEAD, not of those May scalars.

Surface: **18** rows frozen; **0** post-freeze addenda.

**FREEZE (2026-09-17, before observing perturbation results):** rows **R01–R18** locked. No result-contingent rows joined this ledger.

---

## Verdict

Author-anchored (T0–T2) and full-surface agree on the four shape claims: they **survive** under the frozen estimand-preserving probes. Heuristic 0% wins (C1) held across seed-base shift, n=100 HEAD table, `cascadeScale` 0/0.5/1/2, RU or CN risk 0.1, RU+CN risk 0.95, and maxTurns 30 (still 0 wins; games end before the longer cap matters). Taiwan cascade-dominance and Iran-more-nuclear-than-Taiwan (C2) held at seeds 0–19 and 100–119 (n=20) and remain visible on HEAD n=100 (Taiwan 0% nuclear, Iran 12%). Persona fingerprints (C3) held on both seed bases. The `cascadeScale` **sign** (C4) survives because scale 0 lengthens mean turns (12.6 vs 8.7 at scale 1); the alternate limb “fewer 4th-order events” did **not** hold at n=10 (12 vs 11) — the instrument’s OR is load-bearing. Keystone: domestic fragility thresholds (`domestic < 30` trigger, `≤ 15` multi-power collapse) are design constants with no CLI sweep (R12 not recomputed). Quotation risk (R17–R18): stripping “heuristic AI” or citing May 73% as HEAD misstates the claim even when the engine is unchanged.

---

## Claim object(s)

### C1 — Universal heuristic failure / 0% wins (Findings 1 & 4)

| Component | Value | Locator |
|---|---|---|
| Outcome | No default-AI (heuristic) win under multipolar crisis play | F1 ¶1; F4 title |
| Exposure | Rule-based AI + domestic fragility cascade / systemic events | F1 mechanism ¶ |
| Estimand | Simulation-invariance (existence of zero wins in tested batches) | F4; instrument `heuristic-no-win-tw-ir` |
| Scope | Taiwan Strait 2026 + Iran Nuclear 2026; heuristic AI; maxTurns 20 | findings banner; instrument |
| Focal parameter | Win count = 0 (not a GSI band) | F1; REGISTER death condition |

### C2 — Termination-mechanism contrast (Finding 2)

| Component | Value | Locator |
|---|---|---|
| Outcome | Taiwan cascade/domestic-dominant losses; Iran more nuclear than Taiwan | F2 bullets; instrument |
| Exposure | Scenario initial conditions (crisis set / levels), same personas | F2 “What this contrast means” |
| Estimand | Associational contrast of termination reasons across scenarios | `taiwan-cascade-dominant`, `iran-more-nuclear-than-taiwan` |
| Scope | Heuristic AI; shape thresholds (≥70% cascade on Taiwan losses; Iran nuke rate > Taiwan) | test-instrument.js |
| Focal parameter | Ordered contrast, not a fixed % | F2; May rates are snapshot only |

### C3 — Persona / strategic-culture fingerprints (Finding 3)

| Component | Value | Locator |
|---|---|---|
| Outcome | CN economic-dominant; EU diplomatic-dominant; US more military than EU | F3 table; instrument |
| Exposure | `riskTolerance`, `patience`, `priorityDomains` | F3 ¶ after table |
| Estimand | Simulation-invariance of domain-frequency fingerprints | `cn-economic-fingerprint`, `eu-diplomatic-fingerprint`, `us-more-military-than-eu` |
| Scope | Taiwan batch action frequencies under heuristic AI | F3; instrument Taiwan n=20 |
| Focal parameter | Top domain (CN/EU) and military share ordering (US > EU) | REGISTER |

### C4 — cascadeScale sign (Finding 4 research avenue / instrument)

| Component | Value | Locator |
|---|---|---|
| Outcome | Lowering `cascadeScale` relieves Taiwan systemic pressure (longer runs and/or fewer 4th-order systemic events) | F4 Sweep B; instrument `cascade-scale-relieves-taiwan` |
| Exposure | `cascadeScale` multiplier on systemic event deltas | ORACLE / findings Sweep B |
| Estimand | Sign of intervention (not a win-rate target) | instrument assert `longer \|\| quieter` |
| Scope | Taiwan Strait; heuristic; scale 0 vs 1 at small-n | test-instrument SEEDS_10 |
| Focal parameter | Sign(meanTurns(scale0) − meanTurns(scale1)) or fewer 4th-order events | REGISTER |

---

## Frozen perturbation surface

| # | Axis | Namespace | Tier | Baseline value | Perturbed values | Estimand relation | Load-bearing for | Given as | Runnable? |
|---|---|---|---|---|---|---|---|---|---|
| R01 | Instrument default batch | `rc/` | T0 | n=20 seeds 0–19 TW+IR | (baseline rerun) | preserving | C1–C3 | measured (CI gate) | yes |
| R02 | Monte Carlo / seed base | `infer/` | T4 | seeds 0–19 | seeds 100–119 (n=20) | preserving | C1, C2, C3 | unstated alt | yes |
| R03 | Sample size vs HEAD table | `infer/` | T2 | instrument n=20 | HEAD n=100 seed 0 summary | preserving (shape only) | C1, C2 | measured HEAD | yes (read artifact) |
| R04 | cascadeScale = 0 vs 1 | `rc/` | T1 | scale 1 | scale 0 | preserving | C4 | disclosed Sweep B | yes |
| R05 | cascadeScale = 2 | `rc/` | T4 | scale 1 | scale 2 | preserving | C4 | skeptic ×2 | yes |
| R06 | cascadeScale mid | `rc/` | T2 | scale 1 | scale 0.5 | preserving | C4 | Sweep B family | yes |
| R07 | RU riskTolerance low | `sens/` | T1 | persona default | RU risk 0.1 | preserving | C1 | Sweep A | yes |
| R08 | CN riskTolerance low | `sens/` | T1 | persona default | CN risk 0.1 | preserving | C1 | Sweep A | yes |
| R09 | RU+CN risk high | `diag/` | T4 | defaults | RU+CN risk 0.95 | preserving | C1, C2 | adversarial prefs | yes |
| R10 | maxTurns cap | `sens/` | T3 | 20 | 30 | preserving (win rule still turn-20 GSI) | C1 | code default | yes |
| R11 | Win rule GSI threshold | `explore/` | T4 | GSI ≥ 40 at turn 20 | redefine win | **changing** | C1 | design constant | not run (scope) |
| R12 | Domestic cascade thresholds | `sens/` | T3 | `&lt;30` / `≤15` | no CLI sweep | preserving if coded | C1, C4 | design choice | code-read only |
| R13 | Scenario contrast baseline | `diag/` | T0 | TW vs IR | (baseline) | preserving | C2 | measured | yes (with R01) |
| R14 | Iran-only 0% wins | `rc/` | T0 | pooled | Iran n=20 | preserving | C1 | subset | yes (R01 slice) |
| R15 | Taiwan-only 0% wins | `rc/` | T0 | pooled | Taiwan n=20 | preserving | C1 | subset | yes (R01 slice) |
| R16 | LLM backend | `explore/` | T2 | heuristic | DeepSeek / AOM | **changing** | C1–C3 | ROADMAP / notes | not run (paid) |
| R17 | Quote without “heuristic AI” | `quote/` | T4 | findings caveat | “nobody wins” | claim-truth under misquote | C1 | F4 lim. 2 | judgment |
| R18 | May rates as if HEAD | `quote/` | T6 | bannered snapshot | 73% as current | misquotation | C2 rates | banner + ledger | judgment (excluded as science row) |

n/a from axis-discovery: regression SE/clusters; survey missing-data; log/level functional form.

---

## Survival table

| Claim | A1 params | A2 assumptions | A3 re-derivation | A4 diag | A5 alt model | A6 quotation | Overall (T0-2) | Overall (all) |
|---|---|---|---|---|---|---|---|---|
| C1 0% wins | survives (R01,R04–R08,R10) | survives (risk low; thresholds unread as sweep) | survives (R03 HEAD 0% wins) | survives (R09 still 0) | n.a. / explore R16 | weakens if caveat dropped (R17) | **survives** | **survives** (quote caveat) |
| C2 contrast | survives (R01,R06 family n/a) | survives (scenario IC held) | survives (R02,R03 Iran>TW nuke) | survives (R09) | explore R16 | flips under May-as-HEAD quote (R18) | **survives** | **survives** (quote separate) |
| C3 fingerprints | survives (R01) | survives (persona knobs held) | survives (R02 same tops) | n.a. | explore R16 | n.a. | **survives** | **survives** |
| C4 cascadeScale sign | survives on **turns** (R04–R06 monotonic-ish) | OR-limb needed (events limb fails R04) | matches instrument card | n.a. | n.a. | n.a. | **survives** | **survives** (keystone OR) |

---

## Keystones

1. **`longer \|\| quieter` disjunction (C4).** At n=10 seeds 0–9: scale0 mean turns **12.6** vs scale1 **8.7** (longer holds); 4th-order counts **12** vs **11** (quieter fails). Retiring either limb in the instrument without checking the other could false-fail or hide a real flip. Cheapest close: report both limbs in the instrument log line (already printed) and keep the OR explicit in findings Sweep B prose.

2. **Domestic thresholds `&lt;30` / `≤15` (C1/C4).** Coded in `js/cascades.js` and `js/state.js`; named in findings limitations; **not** exposed on `run-bop` CLI. A skeptic who moves only these constants can change collapse timing without touching `cascadeScale`. Cheapest evidence: wire a research-only override or document “not swept” as a standing limitation (already partially there).

3. **Heuristic-AI scope caveat (C1 quotation).** Finding 4 limitation 2 already states human / richer AI may find wins. One-line citations that omit it overclaim.

---

## Scope limits (explore/)

- **R11:** Changing GSI≥40 or the meaning of “reach turn 20” changes the win estimand.
- **R16:** LLM backend and prompt asymmetry are a different actor model (`docs/notes/llm-wargame-prompt-asymmetry.md`); void%/prompt artifacts are out of scope for F1–F4 heuristic claims.

---

## Perturbation log

| Row | What was tried | Result | Scale | Notes |
|---|---|---|---|---|
| R01 | `runBatch` TW+IR seeds 0–19 | C1: 0+0 wins; C2: TW cascade share 1.0, IR nuclear 0.20 vs TW 0; C3: CN economic, EU diplomatic, US mil 0.41 > EU 0 | full | recomputed |
| R02 | seeds 100–119 n=20 | C1: 0 wins; C2: IR nuclear 0.25 > TW 0, TW cascade 1.0; C3: same tops / US>EU | full | recomputed |
| R03 | Read `docs/baselines/v2.13.4/summary.json` | All scenarios win_pct 0; TW nuclear 0; IR nuclear 12 | full | artifact, not re-run |
| R04 | TW cascadeScale 0 vs 1, n=10 | turns 12.6 vs 8.7; 4th-order 12 vs 11; wins 0/0 | full | longer✓ quieter✗ — claim survives via OR |
| R05 | cascadeScale 2, n=10 | turns 7.0; 4th-order 10; wins 0 | full | shorter than scale 1 |
| R06 | cascadeScale 0.5, n=10 | turns 10.2; 4th-order 11; wins 0 | full | between 0 and 1 on turns |
| R07 | RU riskTolerance 0.1, TW n=10 | wins 0; turns 8.7; nuclear 0 | full | no win breach |
| R08 | CN riskTolerance 0.1, TW n=10 | wins 0; turns 8.7; nuclear 0 | full | no win breach |
| R09 | RU+CN risk 0.95, TW n=10 | wins 0; turns 8.7; nuclear 0 | full | still no wins |
| R10 | maxTurns 30, TW n=10 | wins 0; mean turns 8.7 | full | collapse before cap |
| R11 | redefine win rule | not run: estimand-changing | none | explore/ |
| R12 | threshold sweep | not run: no CLI; code confirms `&lt;30` / `≤15` | none | structural assumption named |
| R13 | TW vs IR contrast | same as R01 | full | |
| R14 | Iran-only wins | 0 / 20 | full | R01 slice |
| R15 | Taiwan-only wins | 0 / 20 | full | R01 slice |
| R16 | LLM backend | not run: paid / explor | none | see asymmetry note |
| R17 | drop “heuristic AI” in citation | **weakens** claim truth under misquote | none | judgment |
| R18 | May 73% as HEAD | **flips** quoted science; banner exists to prevent | none | judgment; T6 for science ledger |

---

## What this check could not do

- No full Sweep A/B markdown regeneration at n=50 (`sensitivity-sweep.js`); used n=10 targeted cells instead (denominator: **15/18** rows attempted with engine or artifact; **2** explore skipped; **1** code-read-only).
- Did not re-run HEAD n=100 dumps (gitignored; trusted committed `summary.json`).
- Did not move domestic thresholds in-process (R12).
- Did not run DeepSeek (R16).
- Instrument thresholds were **not** loosened; no REGISTER edits.
- This document is a survival map, not a manuscript-integrity or computational-claim “Verified” certificate.
