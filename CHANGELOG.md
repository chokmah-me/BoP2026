# Changelog

## 2026-06-01 (v2.8.0)

Urban Operations domain + **Megacity Siege 2026** scenario — closes Krepinevich scenario #6
("The Urban Insurgency"), completing **7 of 7** scenario coverage. No new stat: urban actions act on
the existing `military`/`domestic`/`economic`/`info` stats, which the GSI and win/lose checks already
read.

### Added
- **Urban Operations action domain** (`js/domains.js`): 4 actions on the defensive→escalatory arc —
  `urban_stabilization` (hold-and-build, defensive, delayed domestic payoff), `precision_clearance_ops`
  (targeted clearance: target military −8, self domestic −5), `siege_encirclement` (most escalatory:
  target economic −10/domestic −8/military −5, escalationDelta 2; seeds the urban quagmire), and
  `civil_evacuation_corridor` (de-escalatory/humanitarian: target domestic +8, helps lift the
  quagmire). Registered in the domain lookups (icon 🏙️); surfaces in the browser UI automatically.
- **Megacity Siege 2026 scenario** (`data/scenarios-data.js`): `megacity_siege_2026`, player US.
  Four `megacity`-region crises — `coastal_megacity_siege` (urban, L2), `insurgent_network` (urban),
  `humanitarian_corridor_crisis` (diplomatic), `urban_infrastructure_collapse` (economic). NPCs adopt
  urban actions via active-crisis domain matching (no `priorityDomains` change).
- **Urban quagmire cascade** (`js/cascades.js`): unlike the one-shot systemic events, this is a
  *persistent* marker modeling protracted megacity combat. `siege_encirclement` seeds `urban_quagmire`
  (3rd order); while active and an urban crisis stays at escalation ≥2, it grinds the engaged powers
  each turn (military −4 / domestic −3 / info −2, 4th order); the marker **lifts** once no urban crisis
  is ≥2 (de-escalation or `civil_evacuation_corridor`). A `urban_humanitarian_catastrophe` one-shot
  fires when the quagmire coincides with ≥2 powers below domestic 35 (global domestic −10 / info −6).
  `megacity+megacity` merges to the `urban_cauldron` compound at level 3.
- **2 scenario-scoped events** (`data/events-data.js`): `mass_displacement_wave` (conditioned on
  `coastal_megacity_siege` ≥ L2; all powers domestic −10 / info −5; `cascadeRisk:
  urban_humanitarian_catastrophe`) and `insurgent_ied_campaign` (conditioned on `insurgent_network`;
  random_2 military −6 / domestic −5). Both scoped so they never fire outside the scenario.

### Research notes (v2.8.0 baseline, heuristic, 100 runs, seed 0)
- **Megacity Siege**: 0% nuclear, avg stability 24.4, avg turns 7.5. The quagmire grind makes this a
  steady attrition scenario rather than a spike-to-collapse one; avg turns sit in the normal band
  (no degenerate every-turn collapse). The quagmire seed/grind/lift and the `urban_cauldron` compound
  were verified to fire correctly under crafted conditions.

### Calibration note
- The two new events are added to the global `EVENT_TABLE`; because `Events.drawEvents()` rolls
  `Math.random()` once per event before checking conditions, this shifts the seeded RNG stream for all
  scenarios (as with the v2.0.2 / v2.3.0 / v2.7.0 event additions). Existing scenarios re-baselined
  (100 runs, seed 0) and unbroken: Taiwan 27.2 / 0%, Iran 28.8 / 8%, SCS 25.7 / 0%, Korean Peninsula
  33.6 / 0%, Orbital Warfare 27.7 / 0%. `npm test` green.

## 2026-06-01 (v2.7.0)

Space (counterspace) domain + **Orbital Warfare 2026** scenario — closes Krepinevich scenario #5
("The War for Space"), taking domain coverage to 6 of 7. Builds on the `space` stat that already
existed on every power; no new stat introduced.

### Added
- **Space action domain** (`js/domains.js`): 4 actions spanning the defensive→escalatory arc,
  mirroring the EMP domain's shape —
  `satellite_hardening` (defensive: space +8/cyber +3, delayed resilience payoff, no escalation),
  `orbital_isr_surge` (intel: space +5/info +8), `asat_strike` (most escalatory counterspace action:
  target space −18/military −8/info −6, escalationDelta 2, seeds the Kessler debris cascade), and
  `debris_remediation_pact` (de-escalatory: self+target space +6, strong relationship payoff). The
  domain is registered in `getDomainList`/`getDomainLabel`/`getDomainIcon` (icon 🛰️) and surfaces
  automatically in the browser UI (which already renders the `space` stat).
- **Orbital Warfare 2026 scenario** (`data/scenarios-data.js`): `orbital_warfare_2026`, player US,
  four `orbit`-region crises — `asat_demonstration` (space), `gnss_jamming` (space),
  `commsat_blackout` (cyber, ties Space to the existing cyber domain), and `lunar_resource_claim`
  (diplomatic, cislunar norms). NPCs pick up space actions via active-crisis domain matching, so no
  `priorityDomains` change was needed (the same mechanism by which non-IR powers adopt bio actions).
- **Kessler-syndrome cascade** (`js/cascades.js`), mirroring the EMP collateral→C4ISR pattern:
  - 3rd-order: any `asat_strike` pushes the `kessler_pressure` marker and bleeds bystander `space`
    (−6 × cascadeScale) via the existing `getBystanderPowers` helper.
  - 4th-order: `kessler_pressure` + ≥2 powers with `space < 30` → `kessler_cascade`
    (global space −12, military −8, info −6 — debris renders LEO unusable; ISR/PNT/comms degrade).
  - Compound: `orbit+orbit` → `orbital_denial` ("Orbital Denial Regime") when two orbit-region
    crises both reach level 3, matching the `scs_waters+scs_waters` entry.
- **2 Space events** (`data/events-data.js`): `kessler_debris_alert` (conditioned on
  `asat_demonstration` ≥ L2; all powers space −12; `cascadeRisk: kessler_cascade`) and
  `commercial_constellation_loss` (conditioned on `gnss_jamming`; random_2 space −8/economic −6).
  Both are scoped to orbital-scenario crises so they never *fire* elsewhere.

### Research notes (v2.7.0 baselines, heuristic)
- **Orbital Warfare** (50 runs, seed 42): 0% nuclear, avg stability 26.x, avg turns ~9.
  Heuristic NPCs favor the de-escalatory `debris_remediation_pact`; `asat_strike` is rarely selected
  under de-escalate posture (the same dynamic that keeps `emp_strike` rare in EMP baselines), so the
  Kessler cascade is a latent tail risk rather than a baseline outcome. The 3rd/4th-order cascade and
  the `orbital_denial` compound were verified to fire correctly under crafted conditions
  (asat_strike + ≥2 powers below space 30; two orbit crises at L3).

### Calibration note
- The two new events are added to the global `EVENT_TABLE`. Because `Events.drawEvents()` rolls
  `Math.random()` once per event in the table *before* checking conditions, adding any events shifts
  the seeded RNG stream for **all** scenarios (the same effect noted for the v2.0.2 Iran proxy events
  and the v2.3.0 bio/EMP events). Existing scenarios are **not** broken — re-baselined at 100 runs,
  seed 0: Taiwan 27.5 / 0% nuclear, Iran 29.4 / 5%, SCS 25.1 / 0%, Korean Peninsula 33.8 / 0% — all
  within their established ranges and distributions. `npm test` is green (no test assertions depend
  on absolute seeded outcomes).

## 2026-05-31 (v2.6.0)

Symmetric AOM prompt is now the default for the DeepSeek backend, closing a prompt-role artifact
documented in `docs/notes/llm-wargame-prompt-asymmetry.md`. No change to heuristic outcomes —
`npm test` is green and the rule-based engine is untouched; this affects LLM-backed runs only.

### Changed
- **Default DeepSeek AOM framing is now symmetric** (`js/ai-deepseek.js`, `scripts/run-bop.js`):
  the latency-governance block previously handed LLM *adversaries* an "Exploit paths" paragraph
  (escalate boost-phase crises / c2_blackout to fire the sovereignty void against the player) that
  the player branch never saw. In `sovereignty_void_2026` this drove a 75–83% void rate when the
  LLM sat on the adversary side versus ~8–16% on the player side — the model was reciting the
  prompt's framing, not reasoning independently (the word "exploit" appeared in 63% of adversary
  reasoning traces under the old prompt, 8% under the new one). The default prompt now gives every
  agent neutral "Strategic options" framing, a shared systemic-survival objective ("a terminal
  sovereignty void or nuclear exchange is a loss for you too"), and gates escalation language on the
  agent's own `riskTolerance`/`patience`. **Behavior change for LLM runs:** default runs no longer
  reproduce the asymmetric artifact — pass `--asymmetric-aom` to get the old prompt back. Every
  logged call records its `aomMode` (`symmetric`|`asymmetric`). `PROMPT_VERSION` bumped to `v1.3`.

### Added
- **`--asymmetric-aom` / `--symmetric-aom` flags** (`scripts/run-bop.js`): toggle the AOM prompt
  variant; symmetric is the default, `--asymmetric-aom` reproduces the study's "before" condition.
- **Sovereignty-void hypothesis harness** (`scripts/sv-hypotheses.ps1`, `scripts/sv-summary.mjs`):
  blocks A–E sweep (doctrine confound, cascade-scale, NPC-risk, paid DeepSeek doctrine A/B, and the
  role-asymmetry 2×2), `-LLMOnly` / `-Asymmetric` switches, and a side-by-side analytics table
  reporting the faithful `void%` metric (stabilityIndex is confounded by game length).
- **Prompt-asymmetry study** (`docs/notes/llm-wargame-prompt-asymmetry.md`): documents the doctrine
  confound (a doctrine silently sets which power you play) and the prompt-role artifact, with the
  before/after sweep (16 cells, N=12) confirming the symmetric fix collapses the void rate in every
  cell.

## 2026-05-28 (v2.5.0)

AOM / sovereignty-void hardening and engine/infra debt cleanup. No change to
heuristic outcomes — a seeded Taiwan batch (`--seed 42 --runs 10`) is byte-identical
before and after, confirming the RNG dedup and loader change are behavior-neutral.

### Changed
- **`sovereignty_void_2026` now requires a doctrine** (`data/scenarios-data.js`,
  `js/oracle.js`, `js/main.js`): the scenario carries `requiresDoctrine: true`.
  Without a doctrine, `t_rat` fell back to `999`, so the sovereignty void fired every
  turn and boost-phase crises ran straight to a nuclear loss — degenerate by default.
  `BoP.init()` now throws (listing the valid doctrine ids) if the scenario needs one
  and none is given, and the standard-mode scenario list hides it until a doctrine is
  chosen.
- **`revert_midcourse_defense` now restores human control** (`js/cascades.js`,
  `js/epistemic.js`, `js/domains.js`): in addition to skipping the latency gate for the
  turn, it clears `autonomyDelegated[actor]` and lifts the Rice mask via the new
  `Epistemic.clearRiceMask()`. The tooltip previously claimed "No Rice mask" while doing
  nothing of the sort — now corrected.
- **Shared Node engine loader** (`scripts/load-engine.js`, new): `run-bop.js`,
  `test-cascades.js`, `test-analytics.js`, `test-deepseek.js`, and `sensitivity-sweep.js`
  all `require('./load-engine')` instead of each copying the VM bootstrap. The
  module-rewrite regex changed from `/m` (first match only) to `/gm` (all top-level
  declarations), with a comment on why indented IIFE-internal `const`s stay untouched.
- **Unified oracle turn executors** (`js/oracle.js`): `_executeTurn` and
  `_executeTurnAsync` now share `_beginTurn()`/`_finishTurn()` helpers; only the
  sync-vs-await action-collection loop differs. The mulberry32 PRNG, previously copied
  into `run-bop.js`, `test-analytics.js`, and `research-ui.js`, now lives once in the
  oracle and is reached via the new `BoP.seed(n)` / `BoP.unseed()` public methods.

### Added
- **`State.getSystemicRiskIndex()`** (`js/state.js`): a second composite outcome metric
  alongside GSI. Returns `{ index, crisisPressure, maxNuclear }` — GSI minus penalties for
  summed crisis escalation and peak nuclear posture, so research isn't keyed on mean-domestic
  alone (which can read "stable" one escalation from a nuclear exchange). Exposed in the
  oracle `outcome.systemicRisk` and printed by `run-bop.js` as `Avg syst. risk`. GSI and its
  win/lose thresholds are unchanged.
- **AOM world-field schema** (`js/state.js`): `autonomyDelegated`, `autonomyMasks`, and
  `bpiReverted` are now initialized in the `world` literal with one documenting comment
  block (previously created lazily and undocumented).
- **`package.json` + CI** (`package.json`, `.github/workflows/ci.yml`, new): zero-dependency
  manifest wiring the dependency-free Node tests as `npm test` (the browser test stays under
  `npm run test:browser` since it needs Playwright). GitHub Actions runs `npm test` on push/PR.

### Known issue
- One pre-existing `test-cascades.js` assertion ("crisis does NOT decay when its actor took an
  action") fails and predates this release; CI will be red until the decay logic or that test
  is addressed.

## 2026-05-28 (v2.4.2)

UI readability and accessibility pass. No engine or research-API behavior
changes — browser presentation only (plus the game log scroll fix).

### Fixed
- **Game log is now scrollable** (`css/main.css`, `js/ui.js`): `#log-panel` had
  `pointer-events: none`, so the mouse could not scroll it even though it had
  `overflow-y: auto` — during simulation, entries scrolled past unread. Set to
  `pointer-events: auto`, raised the panel `120px → 200px`, and `renderLog()`
  now preserves the panel's scroll position across the per-phase re-render
  (history of up to 200 entries was always retained; it just wasn't reachable).
  Pause + scroll now let you read back the full turn.
- **Tiny fonts eliminated** (`css/main.css`, `css/map.css`, `css/panels.css`,
  `index.html`, `js/ui.js`): no UI text below 11px remains. The 8px relationship
  matrix and map crisis labels, 9px stat/map labels, and 10px chrome were all
  raised; base body text `13px → 15px`; the 11px tier → 12px; log entries → 13px.
- **Low-contrast text** (`css/main.css`, `css/map.css`): `--text-dim` lightened
  `#5a6278 → #8a93ad` (most labels/values now meet WCAG AA ≈4.5:1 on the dark
  surface); map/crisis label fill opacity raised to 0.9.

### Added
- **Keyboard + screen-reader support** (`index.html`, `css/main.css`, `js/ui.js`):
  global `:focus-visible` outline on interactive elements; the SVG world map has
  `role="img"`, `aria-label`, and a `<title>`; the Relations matrix toggle (was a
  click-only `<div>`) is now `role="button"` with `tabindex`, Enter/Space
  handling, and a live-updating `aria-expanded`.
- **Reduced-motion support** (`css/main.css`): `@media (prefers-reduced-motion:
  reduce)` neutralizes the infinite `pulse`/`sim-pulse`/`rice-pulse` animations.
- **Viewport reflow** (`css/main.css`): `html, body` `overflow: hidden → auto`
  and `#app` gains `min-height: 100vh`, so the layout no longer clips on short or
  narrow viewports and tolerates browser zoom; grid rows/columns widened to fit
  the larger type.

## 2026-05-28 (v2.4.1)

### Fixed
- **`checkGameOver` catches autonomous-domain crises** (`js/state.js`): lv5 on
  `boost_phase_north_korea` or `hypersonic_taiwan` now ends the game with
  "Sovereignty void cascaded to terminal threshold." Previously only `military`
  and `compound` domain crises triggered this check.
- **Boost-phase crisis starting escalation: 2 → 0** (`data/scenarios-data.js`):
  latency gate skips `escalationLevel ≤ 0` crises, so the void no longer fires
  on turn 1. Crises must be escalated above 0 by NPC actions before the
  t_rat/t_event gap becomes decisive. Avg turns: 1.0 → 8.2 (heuristic baseline).
- **Truncated-run outcomes** (`js/oracle.js`): `run()` / `runAsync()` hitting
  `maxTurns` now return `result: 'draw'` (GSI ≥ 40) or `result: 'lose'` (GSI < 40)
  with a stability summary, not `result: 'incomplete'` with an empty reason string.
- **AOM context injection always-on** (`js/ai-deepseek.js`): `_buildPrompt()`
  now injects the `LATENCY GOVERNANCE (AOM):` block whenever the scenario has
  boost-phase crises (`t_event != null`), not only when `escalationLevel > 0`.
  Dormant crises (lv=0) are shown as activatable threats with per-doctrine
  close/void verdict. Adversary framing explains how to activate them.
- **Pre-delegation idempotent** (`js/cascades.js`): `apply1stOrder()` uses an
  `alreadyDelegated` flag so a second `pre_delegate_authority` pick neither
  re-applies the Rice mask nor re-triggers DoDD review.
- **`playerOnly` actions filtered from NPCs** (`js/domains.js`, `js/ai.js`,
  `js/ai-deepseek.js`): `pre_delegate_authority` and `revert_midcourse_defense`
  marked `playerOnly: true`. Heuristic AI strips them from the NPC action pool;
  DeepSeek backend strips them from the NPC affordance list. DPRK was picking
  `pre_delegate_authority` with no mechanical effect but costing domestic -8.
- **Delegated-status prompt** (`js/ai-deepseek.js`): after `pre_delegate_authority`
  fires, subsequent player prompts show "ALREADY ACTIVE — do not select again"
  instead of the three-paths menu.

### Added
- **`oracle.setPlayerOverride(fn)`** (`js/oracle.js`): allows LLM backends to
  control the player power in headless mode, not just NPCs. Cleared by
  `clearOverrides()`. Async path only (sync `run()` / `runBatch()` ignore it).
- **`--doctrine <id>`** (`scripts/run-bop.js`): passes doctrine to `BoP.init`.
  Valid ids: `MAGA`, `TWELVER`, `EU_FATALISM`, `MING`, `JUCHE`. Shown in run header.
- **Player power in LLM override** (`scripts/run-bop.js`): `--ai-powers all`
  (or explicit player id in the list) now routes the player through the LLM
  backend via `setPlayerOverride`.

### Research notes (v2.4.1 baseline — deepseek-reasoner)
- **MAGA doctrine, seed 42, max-turns 5, US+CN+DPRK thinking**: US chose
  `revert_midcourse_defense` turns 2-3 (preserving human control while DPRK
  escalated C2 blackout to lv5), then `pre_delegate_authority` on turn 4 once
  the DPRK boost-phase crisis reached lv2, then `boost_phase_intercept` on turn 5
  through the autonomous path. No double-delegation; no NPC playerOnly picks.
  Stability 28; lose via cascade. Cost: $0.011 (31k output tokens, deepseek-reasoner).

## 2026-05-28 (v2.4.0)

### Added
- **Sovereignty Void scenario** (`data/scenarios-data.js`): `sovereignty_void_2026` — models
  the AOM latency-governance gap from [Zenodo 19368682]. Golden Dome is online; boost-phase
  physics set the clock. Four crises: DPRK Boost-Phase Launch (`t_event=90s`), PLA Hypersonic
  Strike (`t_event=120s`), C2 Comms Blackout (`t_rat_penalty=30s` when escalated), DoDD 3000.09
  Review (dormant; fires on pre-delegation). Player is US.
- **AOM latency framework** (`js/cascades.js`): `_latencyGate()` runs before every 1st-order
  cascade pass. Compares `world.doctrine.profile.t_rat` (doctrinal ratification time, seconds)
  against each active crisis's `t_event` (intercept window, seconds). Three resolution paths:
  (1) `boost_phase_intercept` — registers only if `t_rat ≤ t_event`; (2) `pre_delegate_authority`
  — bypasses t_rat, violates DoDD 3000.09, applies Rice-Theorem epistemic mask to military/autonomous
  stats (renders `???` in UI); (3) `revert_midcourse_defense` — preserves human control, forfeits
  strategic advantage. If none taken and `t_rat > t_event`, sovereignty void fires: crisis escalates
  +2 and the player's intercept action is nullified.
- **Three new autonomous domain actions** (`js/domains.js`): `boost_phase_intercept`,
  `pre_delegate_authority`, `revert_midcourse_defense`.
- **`t_rat` on all 4 doctrines** (`data/doctrines-data.js`): MAGA=180s, TWELVER=240s,
  EU_FATALISM=300s, MING=120s. MING (CN) is the only doctrine that can close the Taiwan
  hypersonic window (t_event=120s). No doctrine closes the DPRK window (t_event=90s) —
  the structural gap holds regardless of doctrine choice.
- **JUCHE doctrine** (`data/doctrines-data.js`): DPRK playable for the first time. Expert
  difficulty. t_rat=45s (fastest — closes both BPI windows). riskTolerance=0.85, patience=0.35.
  Win condition: DPRK nuclear ≥ 4 without exchange and US military lead ≤ 30.
- **DPRK as targetable NPC** (`data/scenarios-data.js`): added to `boost_phase_north_korea.involved`;
  DPRK now enters `world.powers`, appears in the target selector, and takes NPC turns in
  `sovereignty_void_2026`. DPRK AI personality was already present in `js/ai.js`.
- **AOM-aware heuristic AI** (`js/ai.js`): `scoreAction()` adds +120 + posture-restore for
  `boost_phase_intercept` when `t_rat ≤ t_event`; scores `pre_delegate_authority` by
  riskTolerance when no window is closeable; scores `revert_midcourse_defense` for low-risk
  powers.
- **AOM-aware DeepSeek prompt** (`js/ai-deepseek.js`): `_buildPrompt()` injects a
  `LATENCY GOVERNANCE (AOM):` block when boost-phase crises are active. Player receives own
  t_rat, per-crisis void/close verdict, and all three resolution paths. NPCs receive the
  player's t_rat and explicit exploit framing (escalate BPI crises; escalate c2_blackout to
  widen the ratification gap).
- **Rice-Theorem epistemic mask** (`js/epistemic.js`, `css/panels.css`): `applyRiceMask()`
  marks stats unverifiable after authority delegation. Masked stats render as `???` with
  pulsing red animation.

### Fixed
- **Escalation log noise** (`js/cascades.js`): `apply1stOrder()` now guards the log push behind
  `if (crisis.escalationLevel !== prev)`, suppressing 0→0 and 5→5 no-op entries (eliminated
  10+ spurious entries per turn in `sovereignty_void_2026`).
- **DPRK not targetable** (`data/scenarios-data.js`): `boost_phase_north_korea.involved` missing
  `"DPRK"` — DPRK never entered `world.powers` and never appeared in the target selector.

### Research notes (v2.4.0 baselines)
- **Heuristic, no doctrine** (10 runs, seed 42): sovereignty_void 0% nuclear / 31.9 avg stability /
  11.0 avg turns. Both BPI crises void every turn; game ends via domestic fragility cascade.
- **JUCHE (DPRK player, t_rat=45s)**: closes both BPI windows; heuristic selects
  `boost_phase_intercept` targeting US every turn it has AP.
- **DeepSeek**: `DEEPSEEK_API_KEY=... node scripts/run-bop.js --scenario sovereignty_void_2026 --runs 5 --seed 42 --ai-backend deepseek --ai-powers all --log-prompts`

## 2026-05-28 (v2.3.0)

### Added
- **Biological Epidemic domain** (`js/domains.js`): 4 new actions covering the full response arc —
  `bio_surveillance_network` (early warning, defensive), `pandemic_response_pact` (bilateral
  health cooperation, de-escalatory), `medical_reserve_deployment` (emergency stockpile release),
  `bio_program_attribution` (accusatory, escalatory, high backfire risk). Domain icon 🧬.
- **EMP Attacks domain** (`js/domains.js`): 4 new actions —
  `emp_hardening` (Faraday/HEMP shielding, defensive), `emp_capability_signal` (deterrence test,
  escalation +1), `emp_strike` (high-altitude EMP, most escalatory non-nuclear action in game:
  target cyber −18, military −10, economic −8, escalation +2), `grid_restoration_aid`
  (partner infrastructure rebuild, de-escalatory). Domain icon ⚡.
- **New cascade rules** (`js/cascades.js`):
  - Bio 3rd-order: 2+ biological actions in one turn pushes `bio_acceleration_pressure` marker.
  - Bio 4th-order: `bio_acceleration_pressure` + 2 powers with domestic < 40 → global
    `pandemic_outbreak` (all: domestic −10, economic −8).
  - EMP 3rd-order: any `emp_strike` → bystander powers take cyber −6 (electromagnetic spillover),
    pushes `emp_cascade_pressure` marker.
  - EMP 4th-order: `emp_cascade_pressure` + 2 powers with cyber < 30 → global `c4isr_collapse`
    (all: military −12, info −8, space −6).
- **4 new stochastic events** (`data/events-data.js`):
  - `bio_treaty_breakdown` — fires when `iran_bio_program` crisis is active (all: info −6, domestic −4).
  - `weaponized_pathogen_alert` — fires at crisis level 2+ (2 random powers: domestic −14, economic −9).
  - `dprk_haed_test` — fires when `dprk_emp_threat` hits level 2 (US/CN/IN: cyber −10, military −6, space −5).
  - `solar_geomagnetic_storm` — rare natural/ambiguous event (prob 0.04, all powers: cyber −12, space −14, economic −6).
- **`iran_bio_program` crisis** in Iran Nuclear 2026 (`data/scenarios-data.js`): biological domain,
  IR/US/EU, escalation level 1. Dual-use IRGC fermentation facilities outside Tabriz.
- **`dprk_emp_threat` crisis** in Korean Peninsula 2026 (`data/scenarios-data.js`): EMP domain,
  DPRK/US/CN, escalation level 1. KN-23s repositioned consistent with HAED launch profile.
- **AI priority domains** (`js/ai.js`): IR gets `biological`; DPRK gets `emp` in `priorityDomains`.
  Other powers pick up new domain actions via active crisis domain matching.

### Fixed
- **`findRelevantCrisis` escalation over-triggering** (`js/cascades.js`): the broad any-crisis
  fallback allowed untargeted escalatory actions (most notably `public_statement`, escalationDelta +1)
  to cascade into any crisis an actor happened to be involved in, regardless of domain match.
  In the Iran scenario with 6 LLM NPCs all using `public_statement`, this stacked 5–6 escalation
  steps per turn across Iran's already-stressed crises, causing 100% nuclear outcomes at 2.4 avg
  turns. Fix: untargeted actions now only escalate domain-matched crises (no fallback). Targeted
  actions fall back only when both actor and target share the same crisis. Iran LLM chat result
  post-fix: 40% nuclear, 34.5 avg stability, 4.1 avg turns (was 100% / 48.6 / 2.4).

### Research notes (v2.3.0 baselines)
- **Heuristic** (20 runs, seed 42): Iran 0% nuclear / 28.0 stability / 8.0 turns;
  KP 0% nuclear / 33.0 stability / 8.0 turns.
- **Iran LLM chat post-fix** (10 runs, seed 42, all NPCs): 40% nuclear / 34.5 stability / 4.1 turns.
  LLM NPCs adopt biological actions naturally when `iran_bio_program` crisis is active
  (11 bio-action calls observed across 10 runs).
- **KP LLM chat** (10 runs, seed 42, all NPCs): 0% nuclear / 31.0 stability / 5.1 turns.
  EMP domain heavily used: 41 `emp_hardening`, 26 `emp_capability_signal`, 2 `emp_strike`.

## 2026-05-27 (v2.2.3)

### Fixed
- **Cost estimation** (`js/ai-deepseek.js`): script was using reasoner list prices
  ($0.55/$2.19 per 1M) but DeepSeek bills `deepseek-reasoner` at `deepseek-v4-flash` chat
  prices ($0.14/$0.28 per 1M). Also added cache-hit token tracking — cache hits are 50x
  cheaper ($0.0028/1M) and were silently counted as full-price input. Actual cost for the
  25-run KP thinking batch: ~$0.69 (dashboard-confirmed), not $3.36 as previously estimated.
  `getCostSummary()` now returns `inputCacheHitTokens` and the cost breakdown is correct.

### Research notes
- **KP post-fix DeepSeek thinking baseline** (25 runs, seed 42, `deepseek-reasoner`, all NPCs):
  avg turns 6.4 (was 2.8 pre-fix), avg stability 28.9 (was 23.2). Actual cost ~$0.69
  (dashboard), ~$0.028/run. Budget ~$1.40/50-run for KP thinking mode.

## 2026-05-27 (v2.2.1)

### Fixed
- **Entanglement cascade stacking** (`js/cascades.js`): Bystander powers were taking the -3
  domestic penalty for *each* simultaneous entanglement event in the same cascade resolution.
  In Korean Peninsula (3 concurrent multi-targeted powers per turn) this stacked to -9 domestic/turn
  per bystander before any action effects landed, guaranteeing collapse in 2–3 turns. Fixed with a
  `penalizedByEntanglement` Set in `apply3rdOrder()`: each bystander now takes the penalty at most
  once per resolution. All scenarios benefit; most impactful in multi-crisis configurations.
- **Korean Peninsula escalation rebalance** (`data/scenarios-data.js`): Starting escalation reduced:
  ICBM Test Series 2→1, Sanctions Regime Collapse 2→1, Forward Nuclear Posture 3→2. Sum 8→5,
  now in range with other scenarios (Iran 4, Taiwan 7). Post-fix heuristic baseline (25 runs,
  seed 42): avg turns 9.1 (was 2.8), avg stability 28.7 (was 23.2). Scenario now supports
  meaningful play arcs.

## 2026-05-27 (v2.2.0)

### Added
- **Korean Peninsula 2026 scenario** (`data/scenarios-data.js`): DPRK as active NPC. Four crises:
  ICBM Test Series (military, L2), Sanctions Regime Collapse (economic, L2), Lazarus Financial
  Operations (cyber, L1), Forward Nuclear Posture (military, L3). DPRK intel matrix added —
  US-on-DPRK quality 0.30 (most opaque state in game). Heuristic baseline (100 runs, seed 0–99):
  0% nuclear, avg stability 19.7 (σ 3.0), avg turns 5.3 (σ 1.1).

## 2026-05-27 (v2.1.1)

### Added
- **North Korea (DPRK)** as an active power (`data/powers-data.js`, `js/ai.js`): military 68,
  nuclear 7, riskTolerance 0.85, patience 0.35, priorityDomains military/nuclear/cyber.
  Personality: brinkmanship doctrine, survival-first. Featured in Korean Peninsula 2026 (v2.2.0).

### Fixed
- **IR absent from world.powers in iran_nuclear_2026** (`data/scenarios-data.js`): Iran appeared
  in crisis descriptions but was not in any `crisis.involved` array, so `State.init()` never
  included it in the world. Result: 0 IR actions across all LLM runs. Fixed by adding IR to
  `involved` for `iran_nuclear_program`, `hormuz_blockade_threat`, and `iran_proxy_escalation`.
- **Iran scenario escalation stacking** (`data/scenarios-data.js`): starting escalation reduced
  from 2→1 on the two military crises. `iran_nuclear_program` involved list narrowed to
  [US, IR]; `iran_proxy_escalation` to [US, IR, EU, GB]. With all 7 powers previously in
  `involved`, each power's military action applied +1 escalation per turn — easy +5 stacking
  in one turn triggered the nuclear hair-trigger immediately. New heuristic baseline: 4% nuclear,
  4.5 avg turns (was 0% nuclear/0 IR actions; scenario was effectively unplayable as designed).
- **world.powers guard in ai.js** (`js/ai.js`): `getMostHostile()` and cooperative target
  selection iterated `power.relationships` including absent powers (e.g. DPRK, which is in
  POWERS_DATA but not in most scenarios). Absent power selected as target → cascade called
  `State.getPower('DPRK').name` → crash. Both loops now guard with `otherId in world.powers`.

### Calibration note
Iran Nuclear heuristic baseline (50-run seed 200): 4% nuclear, avg stability 20.0, avg turns 4.5.
Prior baseline (v2.0.6, no active IR): 0% nuclear, avg stability 21.2, avg turns 4.7.

## 2026-05-26 (v2.1.0)

### Added
- **DeepSeek LLM NPC backend** (`js/ai-deepseek.js`): headless-only LLM backend for NPC
  decision-making. Replaces the rule-based heuristic for any subset of powers via
  `--ai-backend deepseek --ai-powers CN,RU` (or `all`). Requires `DEEPSEEK_API_KEY` env var.
  Supports `deepseek-chat` (default) and `deepseek-reasoner` (chain-of-thought via
  `--thinking`). Prompt version tracked in `PROMPT_VERSION` constant for reproducibility.
- **Dry-run cost estimate** (`scripts/run-bop.js --dry-run`): estimates token usage and
  API cost before making any API calls.
- **Prompt logging** (`--log-prompts`): saves every system+user prompt and raw LLM response
  to a `.jsonl` sidecar file alongside the batch output, keyed by `promptVersion`.
- **Phase 0 smoke test** (`scripts/test-deepseek.js`): single-turn integration test that
  validates API connectivity, action parsing, and cost reporting. Costs ~$0.0002.

### Fixed
- **Single-action bottleneck** (`js/ai-deepseek.js` prompt v1.1): LLM was returning one
  action per turn, leaving 2/3 AP unspent. Prompt now requests a JSON array; parser
  validates the AP budget and deduplicates action IDs across the array.
- **Hallucinated power targets** (`js/ai-deepseek.js` prompt v1.2): LLM targeted `"IR"`
  in `iran_nuclear_2026` — Iran appears in crisis names but is not a playable power.
  `_parseResponse` now validates all targets against `world.powers`; invalid targets are
  dropped; `requiresTarget` actions with no valid target are skipped rather than forwarded
  to cascade.
- **Rate-limit fetch failures** (`js/ai-deepseek.js`): burst API calls across 5 NPCs hit
  DeepSeek's rate limit (34.7% fallback rate in Phase 3). Replaced silent fallback with
  exponential backoff retry (1s → 2s → 4s → 8s, 4 attempts) on HTTP 429/503 and transient
  network errors.
- **Smoke test require path** (`scripts/test-deepseek.js`): corrected
  `./ai-deepseek` → `../js/ai-deepseek`.

### Research note (v2.1.0 LLM baseline)
Phase 2 comparison, 20 seeds, CN+RU as LLM NPCs vs. full heuristic:
- Taiwan Strait: avg stability 21.6 → 26.4 (+4.8), avg turns 4.5 → 5.2 (+0.7)
- Iran Nuclear: avg stability 21.3 → 28.6 (+7.3), avg turns 5.3 → 5.1 (−0.2)

LLM NPCs consistently raise global stability without increasing nuclear risk.
RU shows the highest action diversity (17–21 action types); CN defaults toward diplomatic
actions (`trade_deal`, `bilateral_negotiation`, `cyber_defense_hardening`).

## 2026-05-26 (v2.0.6)

### Fixed
- **ORACLE.md schema** (`docs/ORACLE.md`): split `TurnResult` into raw vs. analytics-export schemas; removed stale field references that no longer matched the actual output.
- **GROK_PROJECT.md** (`docs/GROK_PROJECT.md`): removed "partially outdated" label and Known Limitations bullet that flagged the now-resolved ORACLE.md doc gap.

## 2026-05-26 (v2.0.5)

### Fixed
- **Misleading tooltips** (`js/domains.js`): `coalition_shoring` no longer claims AP restoration (it never existed). `reshoring_investment` no longer promises a turn-5 payoff (delayed effect was unimplemented).

### Improved
- **Patience governs AP spending** (`js/ai.js`): NPCs with patience > 0.65 now cap AP expenditure to ~73% in low-crisis turns (crisisLevel < 3). China (patience 0.9) conserves ~1 AP per turn during peacetime; EU and US (patience ≤ 0.5) unchanged.
- **Generalized stat-health scoring** (`js/ai.js`): replaced three hardcoded action-ID checks with a general rule — any action that boosts a stat currently below 45 gets +15 score. NPCs now prefer healing all critical stats, not just cyber and domestic.
- **Delayed effects queue** (`js/cascades.js`, `js/state.js`): `effects2nd` entries with a `delay` field now queue to `world.pendingDelayedEffects` and fire in the correct future turn. `reshoring_supply_chain`'s delayed +8 economic payoff now works. New field initialized in `State.init()`.
- **Pressure marker expiry** (`js/cascades.js`): `*_pressure` markers in `activeSystemicEvents` are cleared at the start of each `Cascades.resolve()` and re-added only if conditions still hold that turn. Markers no longer accumulate for the entire game.

### Calibration note
- Patience AP hoarding and pressure marker expiry may shift baseline numbers slightly. Prior baseline (v2.0.2, 100-run seed 0–99) remains directionally valid; re-calibration recommended before next formal release.

## 2026-05-25 (v2.0.4)

### Improved
- **Strategic posture system** (`js/ai.js`): `getStrategicPosture()` derives a turn-level intent (escalate / hold / de-escalate / consolidate) from active crisis levels, merge risk, persona `riskTolerance`, and domestic stats. De-escalate posture hard-excludes actions that raise crisis level to 4+.
- **Merge-risk detection** (`js/ai.js`): `getMergeRisk()` detects when a power faces two crises in the same region at level 2+ — a precursor to compound-crisis merges — and triggers de-escalate posture.
- **Stance persistence / flip-flop penalty** (`js/ai.js`): `power.memory` is now read, not just written. Deploy/withdraw flip-flops within two turns penalized -35/-40; repeating the same action in consecutive turns gets -8.
- **Noise scaling** (`js/ai.js`): random score noise shrinks with crisis level (±5 at level 0, ±1 at level 4), making AI choices more deterministic under pressure.

### Calibration note
- Iran Nuclear nuclear rate drops from ~73% (v2.0.2 baseline) to ~0%; avg run length increases from ~2 to ~4.6 turns. Taiwan Strait shows similar stabilization.

## 2026-05-26 (v2.0.3)

### Fixed
- **Save Log button unclickable** (`css/panels.css`): `#log-panel` had `pointer-events: none` to let map clicks pass through, which also blocked the Save Log button inside it. Fixed with `pointer-events: auto` on `#save-log-btn`.

### Added
- **Auto-save on game over** (`js/turn.js`): game log downloads automatically when the game reaches a terminal state (nuclear exchange, domestic collapse, global order failure, doctrine end condition). File downloads before the game-over modal appears.
- **Date-stamped log filenames** (`js/ui.js`): interactive save filename is now `bop-{scenarioId}-{YYYY-MM-DD}-t{turn}-{result}.json` (e.g. `bop-taiwan_strait_2026-2026-05-26-t12-lose.json`) instead of the generic `bop-log-turn{N}.json`.
- **CLI default output to `logs/`** (`scripts/run-bop.js`): when `--out` is not specified, output goes to `logs/bop-{scenario}-{date}-s{seed}-x{runs}.json`. The `logs/` directory is created automatically. Explicit `--out` still works unchanged.
- **Tests 11–12** in `scripts/test-analytics.js`: verify completed game has `outcome.result` for post-mortem filename, and verify `saveLog` payload shape + filename pattern.

## 2026-05-25 (v2.0.2)

### Added
- **Iran Nuclear proxy events** (6 new events in `data/events-data.js`): `hezbollah_surge`, `hezbollah_degraded`, `houthi_red_sea_escalation`, `houthi_degraded`, `gulf_bloc_aligns_us`, `gulf_bloc_hedges_china`. All conditioned on Iran-specific crisis IDs — fire only during `iran_nuclear_2026` games.
- **`minValue` condition support** in `js/events.js` `conditionsMet()`: mirrors the existing `maxValue` check. Enables events conditioned on a stat being above a threshold (e.g., US military high enough to have struck).
- **2 new tests** in `scripts/test-analytics.js` (tests 9–10): `minValue` block/pass behavior and Iran proxy events firing in headless batch.

### Fixed
- **Events never fired in headless batch runs** (`js/oracle.js`): `Events.init(EVENT_TABLE)` was called only in `js/main.js` (browser bootstrap), not in `BoP.init()`. Events returned `[]` in all Node/Oracle runs since the system launched. Fixed by adding `Events.init(_data('EVENT_TABLE'))` to `BoP.init()`. All three scenario baseline numbers in README updated to reflect events now firing correctly.

### Calibration note
- Iran Nuclear nuclear rate rises from 73% to 79%, avg turns drops from 4.0 to 3.0 with events active. Proxy pressure (Hezbollah, Houthi) accelerates state collapse. Stability distribution remains bimodal.

## 2026-05-25 (v2.0.1)

### Added
- **Supply Chain domain** (4 actions): `critical_minerals_deal`, `supply_chain_chokepoint`, `tech_export_ban`, `reshoring_investment`. Models rare earth/semiconductor leverage, export control coercion, and industrial decoupling.
- **Autonomous domain** (4 actions): `drone_swarm_deploy`, `autonomous_defense_net`, `counter_swarm_ops`, `ai_surveillance_grid`. Models UCAV swarm tactics, AI-curated surveillance, and electronic warfare counter-drone operations.
- **South China Sea 2026 scenario**: Third playable scenario. 4 crises — SCS Island Seizure (military), Sea Lane Blockade Threat (economic), Semiconductor Chokepoint (supply_chain), Autonomous Engagement (autonomous). Region-keyed `scs_waters+scs_waters` compound crisis `south_seas_blockade`.
- **4 SCS-specific events**: `scs_drone_escalation`, `rare_earth_export_halt`, `asean_neutrality_shift`, `undersea_cable_cut`. All conditioned on SCS crisis IDs.
- **`scs_waters+scs_waters` compound crisis** in `js/cascades.js`: `south_seas_blockade` — fires when island seizure and sea lane crises both reach level 3+.

### Calibration notes
- SCS nuclear event rate ~13% at baseline (30-run seed=42), vs. Taiwan 0%. Difference is intentional: SCS is the highest direct US-CN military confrontation scenario.
- New domain actions avoid double-escalation: `supply_chain_chokepoint` and `drone_swarm_deploy` use `escalationDelta: 1` without additional `crisis_escalation` second-order effects.
- `tech_export_ban` and `counter_swarm_ops` set to `escalationDelta: 0` (coercive/defensive, not direct military escalation).

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
