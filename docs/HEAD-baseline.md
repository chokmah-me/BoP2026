# BoP2026 HEAD baseline (v2.13.4)

> **Not the May 2026 findings snapshot.** These rates are the HEAD heuristic
> 100-run table bound in [`baselines/v2.13.4/summary.json`](baselines/v2.13.4/summary.json).
> The historical May table lives in [`findings.md`](findings.md) and
> [`findings-may2026-summary.json`](findings-may2026-summary.json); do not mix
> those rates into this bag.

**Engine:** v2.13.4  
**Runs:** 100 per scenario, seed 0, maxTurns 20, heuristic AI  
**Generated:** 2026-09-17  

| Scenario | Win% | Nuclear% | Avg stability | Avg turns |
|----------|------|----------|---------------|-----------|
| Taiwan Strait 2026 | 0% | 0% | 33.0 | 8.3 |
| Iran Nuclear 2026 | 0% | 12% | 30.1 | 8.1 |
| South China Sea 2026 | 0% | 0% | 26.9 | 8.7 |
| Korean Peninsula 2026 | 0% | 0% | 27.1 | 10.0 |
| Orbital Warfare 2026 | 0% | 1% | 30.6 | 9.0 |
| Megacity Siege 2026 | 0% | 0% | 25.1 | 7.8 |
| Financial Contagion 2026 | 0% | 0% | 32.0 | 8.7 |

All seven rows show **0%** heuristic wins. Iran nuclear rate is **12%**; Orbital is **1%**; the other five scenarios are **0%** nuclear.

Per-run analytics JSON under `docs/baselines/v2.13.4/` is gitignored. Reproduce with `node scripts/run-bop.js` (100 runs, seed 0) writing into that directory.

Manuscript I1 for this table: project `docs/head-i1` with companion repo root
(`python path/to/audit_manuscript.py --project docs/head-i1 --companion .`).
