# BoP2026 workplan — resume here

**As of:** 2026-09-17  
**Repo HEAD when written:** `7667856` (`Rebaseline heuristic 100-run table at v2.13.4 HEAD.`)  
**Engine:** v2.13.4  
**Why this file exists:** handoff for a fresh session. Do not treat chat memory as source of truth; re-read this file, `CHANGELOG.md`, and `docs/baselines/v2.13.4/summary.json`.

Death of this file: replace it when the next milestone ships, or when every open item below is done or explicitly dropped.

---

## Frozen facts (do not relitigate)

- Vanilla HTML/CSS/JS. No frameworks, bundler, or npm as a runtime. `package.json` is tests + Playwright only.
- May 2026 `docs/findings.md` table (Iran **73%** nuclear, Taiwan **1%**, GSI 25.8 / 5.9 turns) is a **snapshot**, not HEAD. Bound in `docs/findings-may2026-summary.json`. Original 100-run dumps: **unrecovered**. Do not overwrite those figures with HEAD rates.
- HEAD heuristic 100-run table (seed 0, n=100, 2026-09-17): `docs/baselines/v2.13.4/summary.json`. Iran nuclear **12%**, all rows **0% wins**. Per-run JSON (~12–18 MB) lives on disk under `docs/baselines/v2.13.4/<scenario>_2026.json` and is **gitignored**.
- Instrument eval (`scripts/test-instrument.js`, n=20) gates **shape**, not GSI bands. It may print Iran ~20% nuclear; that is small-n, not the 100-run rate.
- Standing gates: `npm test`, `npm run test:browser` (Playwright), `claim-manifest.json` → computational-claim-gate, `integrity-manifest.json` → manuscript I1 on findings.
- CI (`.github/workflows/ci.yml`) runs **only** `npm test` on Node 20. No Playwright install.

### Resume smoke (first 5 minutes of a new session)

```
git log -3 --oneline
npm test
python C:\Users\Elke Shayna\Documents\00Dev\computational-claim-gate\scripts\verify_claim_project.py --project .
python C:\Users\Elke Shayna\Documents\00Dev\manuscript-integrity-gate\scripts\audit_manuscript.py --project .
```

Optional UI: `npm run test:browser` (needs local `node_modules` + Chromium).

---

## Open work (priority order)

### 1. Sovereignty Void 100-run matrix (not in the v2.13.4 table)

SV requires `--doctrine`. Not comparable to the seven-row heuristic table without a doctrine column.

- Run at least `MING` (and ideally MAGA / JUCHE / TWELVER / EU_FATALISM) at n=100 seed 0.
- Write a **summary** (not 50 MB dumps) under `docs/baselines/v2.13.4/sovereignty_void-<doctrine>.json` or one `sv-summary.json`.
- Done when: summary committed, CHANGELOG/README note that SV is doctrine-conditioned, void% vs nuclear% distinguished (`void%` is AOM/prompt, not LLM skill).

```
node scripts/run-bop.js --scenario sovereignty_void_2026 --doctrine MING --runs 100 --seed 0 --out docs/baselines/v2.13.4/sovereignty_void_2026-MING.json
```

### 2. Playwright on CI (optional product gate)

`test:browser` is green locally after `npm install` + `npx playwright install chromium`. CI never installs deps.

- Done when: workflow installs Playwright Chromium (or a documented skip), `npm run test:browser` runs on ubuntu-latest, still no runtime framework in the game.
- Cost: slower CI. Ask before enabling if the owner does not want the extra minutes.

### 3. May 2026 73% dump — recover or retire in writing

No in-repo 100-run JSON reproduces Iran 73% / Taiwan 25.8 GSI. Ledger already says `original_run_dumps: unrecovered`.

- Search old Zenodo/OSF/Drive copies; if found, bind `source_path` to that dump and keep findings numbers.
- If never found: one sentence in `docs/findings-may2026-summary.json` + findings banner stays; **do not** silently replace 73% with 12%.
- Done when: either a real dump is bound, or “unrecovered, retired as historical-only” is explicit and we stop looking.

### 4. Bind HEAD table for manuscript I1 (README/CHANGELOG are skipped)

`audit_manuscript.py` skips `README.md` / `CHANGELOG.md`. The HEAD 100-run numbers are therefore **not** I1-gated except via `docs/baselines/v2.13.4/summary.json` existing.

- Optional: short `docs/baselines/v2.13.4/README.md` (or a `docs/HEAD-baseline.md`) that reprints the table so integrity can target it, with `claimed_numbers` in `integrity-manifest.json` **or a second manifest**. Do not mix May 2026 and HEAD in one I1 bag without ids.
- Done when: a non-skipped markdown file’s HEAD rates fail I1 if someone edits them without updating `summary.json`.

### 5. `paper-robustness-check` on Findings 1–4

Shape claims already have death conditions in `scripts/test-instrument.js`. Robustness check is for: 0% wins, cascade vs nuclear contrast, persona fingerprints, cascadeScale sign — **perturb and freeze the surface** before claiming they survive.

- Invoke skill `paper-robustness-check`. Do not loosen instrument thresholds to stay green.
- Done when: a frozen perturbation list exists and the claims that fail it are named.

### 6. LLM-agent methodology (from `docs/ROADMAP.md`)

Already shipped: symmetric AOM default, `--asymmetric-aom`, prompt-asymmetry note, DeepSeek parse + batch checkpoints.

Still open:

| Item | Intent |
|---|---|
| Per-turn AOM framing | Move situational AOM out of the static system prompt into the per-turn user message |
| Cross-model replication | Repeat role 2×2 / doctrine sweep on Claude or GPT-4o (not DeepSeek-only) |
| Tighter void-rate CIs | Multiple seed-bases + a second player power; DeepSeek sampling is unseeded |

Needs `DEEPSEEK_API_KEY` (or other keys). Paid. Checkpointed batches via `scripts/run-bop.js`. Use `ai-failure-mode-hygiene` if scoring void% as a proxy.

### 7. Domestic faction system (ROADMAP next milestone)

Replace unitary actor with hardliner vs moderate factions. Named in `docs/ROADMAP.md` as the depth milestone after Krepinevich 7/7. This is a **design** job first (`/design` or a spec in `docs/`), not a drive-by edit to `ai.js`.

- Done when: spec exists, contract tests pin faction influence on `decideTurn`, seeded baselines re-run (expect RNG-stream shift).

### 8. Release / Zenodo (`release-sync`)

Do **not** mint or tag unless asked. Surfaces already present: `CITATION.cff`, `ZENODO.md`, `CHANGELOG.md`, README badges.

- When cutting a version: `/release-sync`, bump `package.json` if it is a real release, do not merge paper PDF and software zip under one Zenodo concept.
- OSF: no new mirrors after 2026-11-16.

### 9. Community / docs leftovers (`docs/ROADMAP.md`)

- Publish a citable baseline dataset (HEAD `summary.json` is the start; full dumps are local).
- Tutorial videos, `CONTRIBUTING.md`.
- Success metric still open: “Biological + EMP domains complete and integrated into at least one scenario each” — domains exist; confirm scenario coverage vs that checkbox.

### 10. Full 100-run JSON in git?

Owner left dumps gitignored (~95 MB). Only commit them if explicitly requested (Git LFS or a Zenodo software zip is better than git).

---

## Skill routing (this repo)

| Job | Gate / skill |
|---|---|
| Engine / cascade / Oracle change | `npm test` |
| Start screen / Save Log / DOM | `npm run test:browser` |
| “Does the model still say the same *kind* of thing?” | CCG `claim-manifest.json` → `node scripts/test-instrument.js` |
| Findings.md numbers | `integrity-manifest.json` + manuscript-integrity-gate |
| Load-bearing sim claim with a command | computational-claim-gate |
| SV / C2 / `t_rat` write-up | attrition-c2-scenario-analyst, then re-run |
| New scenario *content* | geopolitical-insight, then catalog tests |
| Tag / DOI | release-sync |
| After a non-trivial patch | check-work (re-run; do not trust the actor) |

Not default: lean-proof-forge, geometry-mesh, hashline, Cloudflare Workers, omnicompetence TestForge.

---

## Suggested next session (if the owner says “continue”)

1. Resume smoke (`npm test` + both Python gates).  
2. Item **1** (SV 100-run doctrine matrix) unless they pick CI, robustness, or factions instead.  
3. Stop and report; do not start Domestic Factions without a spec.

## Explicit non-goals until asked

- Recalibrating cascade thresholds to restore Iran 73%.  
- Putting Playwright behind a new framework.  
- Rewriting `docs/findings.md` as if it were HEAD.  
- Social announcement / Zenodo mint.
