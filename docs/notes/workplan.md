# BoP2026 workplan — resume here

**As of:** 2026-09-17 (docs/metadata sync after `730338c`)  
**Repo HEAD when written:** post-`730338c` (Playwright CI, HEAD I1, robustness, AOM v1.4, void CI pilot) + README/ZENODO/CITATION prose sync  
**Engine:** v2.13.4 (no package bump; no Zenodo remint)  
**Why this file exists:** handoff for a fresh session. Do not treat chat memory as source of truth; re-read this file, `CHANGELOG.md`, `docs/baselines/v2.13.4/summary.json`, and `docs/baselines/v2.13.4/sv-summary.json`.

Death of this file: replace it when the next milestone ships, or when every open item below is done or explicitly dropped.

---

## Frozen facts (do not relitigate)

- Vanilla HTML/CSS/JS. No frameworks, bundler, or npm as a runtime. `package.json` is tests + Playwright only.
- May 2026 `docs/findings.md` table (Iran **73%** nuclear, Taiwan **1%**, GSI 25.8 / 5.9 turns) is a **snapshot**, not HEAD. Bound in `docs/findings-may2026-summary.json`. Original 100-run dumps: **recovered** from git `62dd916` (see ledger `recovery`). Do not overwrite those figures with HEAD rates.
- HEAD heuristic 100-run table (seed 0, n=100, 2026-09-17): `docs/baselines/v2.13.4/summary.json`. Iran nuclear **12%**, all rows **0% wins**. Per-run JSON (~12–18 MB) lives on disk under `docs/baselines/v2.13.4/<scenario>_2026.json` and is **gitignored**.
- HEAD SV doctrine matrix (seed 0, n=100): `docs/baselines/v2.13.4/sv-summary.json`. Doctrine-conditioned; `void%` ≠ `nuclear%`. Not a row in the seven-scenario table.
- Instrument eval (`scripts/test-instrument.js`, n=20) gates **shape**, not GSI bands. It may print Iran ~20% nuclear; that is small-n, not the 100-run rate.
- Standing gates: `npm test`, `npm run test:browser` (Playwright; also CI `browser` job), `claim-manifest.json` → computational-claim-gate, root `integrity-manifest.json` → May findings I1, `docs/head-i1/` → HEAD baseline I1.
- CI (`.github/workflows/ci.yml`): job `test` = `npm test` (no install); job `browser` = `npm ci` + Playwright Chromium + `npm run test:browser`.

### Resume smoke (first 5 minutes of a new session)

```
git log -3 --oneline
npm test
python C:\Users\Elke Shayna\Documents\00Dev\computational-claim-gate\scripts\verify_claim_project.py --project .
python C:\Users\Elke Shayna\Documents\00Dev\manuscript-integrity-gate\scripts\audit_manuscript.py --project .
python C:\Users\Elke Shayna\Documents\00Dev\manuscript-integrity-gate\scripts\audit_manuscript.py --project docs/head-i1 --companion .
```

Optional UI locally: `npm run test:browser` (needs `node_modules` + Chromium). CI runs the browser job on every push/PR.

---

## Open work (priority order)

### 1. Sovereignty Void 100-run matrix — DONE

Published: `docs/baselines/v2.13.4/sv-summary.json` (five doctrines, n=100 seed 0). CHANGELOG/README note doctrine conditioning + void% vs nuclear%. Dumps `sovereignty_void_<doctrine>_2026.json` gitignored.

### 2. Playwright on CI — DONE

`.github/workflows/ci.yml` job `browser`: `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:browser`. Job `test` still runs headless `npm test` with no install. Game remains vanilla (Playwright is test-only).

### 3. May 2026 73% dump — DONE (recovered)

Bound in `docs/findings-may2026-summary.json` → `recovery` (git commit `62dd916`, sha256s, extract commands). Working-tree `docs/*-baseline.json` is a later overwrite (~14% Iran) and stays gitignored. Search closed; do not keep hunting.

### 4. Bind HEAD table for manuscript I1 — DONE

Non-skipped prose: `docs/HEAD-baseline.md`. Second I1 bag: `docs/head-i1/integrity-manifest.json` (companion = repo root). May bag remains root `integrity-manifest.json` → `docs/findings.md`. Break-tested: editing a HEAD table rate without updating bindings fails I1.

### 5. `paper-robustness-check` on Findings 1–4 — DONE

Survival map: [`docs/notes/findings-1-4-robustness.md`](findings-1-4-robustness.md). Surface R01–R18 frozen before runs. Shape claims C1–C4 **survive**; keystones named (`cascadeScale` OR-limb; domestic thresholds unswept; heuristic-AI quote caveat). Instrument thresholds not loosened.

### 6. LLM-agent methodology (from `docs/ROADMAP.md`)

Already shipped: symmetric AOM default, `--asymmetric-aom`, prompt-asymmetry note, DeepSeek parse + batch checkpoints, **per-turn AOM in user message (`PROMPT_VERSION` v1.4)**.

Still open:

| Item | Intent |
|---|---|
| ~~Per-turn AOM framing~~ | **Done** — situational AOM → user message; system keeps role/personality |
| Cross-model replication | Repeat role 2×2 / doctrine sweep on Claude or GPT-4o (not DeepSeek-only). `ANTHROPIC_API_KEY` present in shell; `OPENAI_API_KEY` not set |
| ~~Tighter void-rate CIs (pilot)~~ | **Done** — `docs/notes/sv-void-ci-pilot.md`: MING/MAGA × seeds 0,100 × n=12 chat. Per-cell Wilson CIs still wide; MAGA seed-sensitive (33% vs 8%). Optional: larger n or `-Thinking`. |

Needs `DEEPSEEK_API_KEY` (or other keys). Paid. Checkpointed batches via `scripts/run-bop.js`. Use `ai-failure-mode-hygiene` if scoring void% as a proxy. Key check (this host): `DEEPSEEK_API_KEY` set in process env (not in repo `.env`).

### 7. Domestic faction system (ROADMAP next milestone)

Replace unitary actor with hardliner vs moderate factions. Named in `docs/ROADMAP.md` as the depth milestone after Krepinevich 7/7. This is a **design** job first (`/design` or a spec in `docs/`), not a drive-by edit to `ai.js`.

- Done when: spec exists, contract tests pin faction influence on `decideTurn`, seeded baselines re-run (expect RNG-stream shift).

### 8. Release / Zenodo (`release-sync`)

Do **not** mint or tag unless asked. Surfaces already present: `CITATION.cff`, `ZENODO.md`, `CHANGELOG.md`, README badges.

- When cutting a version: `/release-sync`, bump `package.json` if it is a real release, do not merge paper PDF and software zip under one Zenodo concept.
- OSF: no new mirrors after 2026-11-16.

### 9. Community / docs leftovers — MOSTLY DONE

- [x] Citable baseline pointer: `docs/baselines/DATASET.md` → v2.13.4 `summary.json` / `sv-summary.json`.
- [x] `CONTRIBUTING.md` at repo root; linked from README.
- [x] Biological + EMP success metric: confirmed integrated (`iran_bio_program` on Iran; `dprk_emp_threat` on Korea); ROADMAP checkbox closed.
- [ ] Tutorial videos (2–3) — still open; not produced in-repo.

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

1. Resume smoke (`npm test` + May I1 + HEAD I1 + CCG).  
2. Pick among open items **6** (LLM-agent methodology, paid keys), **7** (Domestic factions — spec first), **8** (release-sync only if asked), or tutorial videos (remaining slice of **9**).  
3. Stop and report; do not start Domestic Factions without a spec.

## Explicit non-goals until asked

- Recalibrating cascade thresholds to restore Iran 73%.  
- Putting Playwright behind a new framework.  
- Rewriting `docs/findings.md` as if it were HEAD.  
- Social announcement / Zenodo mint.
