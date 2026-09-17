# Contributing to BoP2026

Thanks for considering a contribution. BoP2026 is a **vanilla HTML/CSS/JS** geopolitical crisis sim (no frameworks, no bundler, no runtime npm). Keep that constraint unless a change is explicitly about the test harness (`package.json` is tests + Playwright only).

## Before you start

1. Read [`CLAUDE.md`](CLAUDE.md) (architecture and load order) and [`docs/notes/workplan.md`](docs/notes/workplan.md) (current gates and non-goals).
2. Open `index.html` in a browser and run `npm test` (Node ≥18). Optional UI gate: `npm install` then `npx playwright install chromium` and `npm run test:browser`.
3. Prefer a short issue or note describing the change class: **content** (scenario/power/event), **engine** (cascade/AI/state), **docs/research**, or **tests/CI**.

## Stack rules

| Do | Don't |
|---|---|
| Edit `data/*-data.js` for content the game loads | Treat `data/*.json` drafts as runtime sources |
| Mutate world state through `State.*` | Bypass `State` with ad-hoc copies (except snapshots) |
| Keep script order in `index.html` as the dependency graph | Introduce React/Vue/Webpack/Vite/etc. |
| Add actions with `id`, `domain`, `cost`, `requiresTarget`, `effects` | Leave effects unimplemented in `cascades.js` |
| Retire instrument claims in writing if science changes | Loosen `scripts/test-instrument.js` thresholds to stay green |

## Local checks

```bash
npm test
# after UI / Save Log / start-screen changes:
npm run test:browser
```

Research number gates (optional, needs the gate repos checked out beside this one):

```bash
python path/to/computational-claim-gate/scripts/verify_claim_project.py --project .
python path/to/manuscript-integrity-gate/scripts/audit_manuscript.py --project .
python path/to/manuscript-integrity-gate/scripts/audit_manuscript.py --project docs/head-i1 --companion .
```

- **May 2026** findings table → root `integrity-manifest.json` + `docs/findings.md` (historical; do not overwrite with HEAD rates).
- **HEAD** 100-run table → `docs/HEAD-baseline.md` + `docs/head-i1/`.

## What to change where

| Kind of change | Primary files |
|---|---|
| New / edited action | `js/domains.js`, effects in `js/cascades.js`, catalog tests |
| New scenario | `data/scenarios-data.js` (crises need `location: {x,y}` for map markers) |
| New power / personality | `data/powers-data.js`, `PERSONALITIES` in `js/ai.js` |
| New stochastic event | `data/events-data.js` |
| Headless / Oracle API | `js/oracle.js`, `scripts/run-bop.js`, `docs/ORACLE.md` |
| UI only | `js/ui.js`, `css/*` — no game logic in the UI layer |

## Research / baseline hygiene

- Cite **HEAD** rates from [`docs/baselines/v2.13.4/summary.json`](docs/baselines/v2.13.4/summary.json) or [`docs/HEAD-baseline.md`](docs/HEAD-baseline.md).
- Cite the **May 2026** snapshot only via [`docs/findings.md`](docs/findings.md) / [`docs/findings-may2026-summary.json`](docs/findings-may2026-summary.json).
- Per-run JSON under `docs/baselines/` and `logs/` is gitignored (~12–18 MB each). Reproduce with `node scripts/run-bop.js --runs 100 --seed 0 --out …`. See [`docs/baselines/DATASET.md`](docs/baselines/DATASET.md).
- Do not recalibrate cascades to restore historical percentages unless that is the agreed goal of the PR.

## Pull requests

- Keep diffs scoped; match existing comment style (short, factual).
- Run `npm test` before opening the PR. Run `npm run test:browser` if you touched UI or log export.
- Say what you verified and what you did not (especially for LLM/`DEEPSEEK_API_KEY` paths).
- Large Domestic Faction or methodology changes need a written spec first (`docs/` or a design note) — see the workplan.

## License

By contributing, you agree your changes are licensed under the same [MIT License](LICENSE) as the project.
