# Citable baseline dataset (HEAD)

This directory holds the **published** heuristic baseline summaries for academic citation and replication. Full per-run analytics JSON is large and **gitignored**; the committed artifacts are the summary tables plus this note.

## What to cite

| Artifact | Contents | Engine |
|---|---|---|
| [`v2.13.4/summary.json`](v2.13.4/summary.json) | Seven-scenario 100-run table (seed 0, maxTurns 20, heuristic AI): win%, nuclear%, mean/sd stability, mean/sd turns | v2.13.4 |
| [`v2.13.4/sv-summary.json`](v2.13.4/sv-summary.json) | Sovereignty Void doctrine matrix (five doctrines, n=100 seed 0). `void%` ≠ `nuclear%`; not a row in the seven-scenario table | v2.13.4 |
| [`../HEAD-baseline.md`](../HEAD-baseline.md) | Human-readable reprint of the seven-scenario table (manuscript I1–gated via `docs/head-i1/`) | v2.13.4 |

Schema on the seven-scenario file: `bop2026-baseline-summary/v1`.

**Not HEAD:** the May 2026 Taiwan/Iran snapshot in [`../findings.md`](../findings.md) / [`../findings-may2026-summary.json`](../findings-may2026-summary.json) is a historical binding (Iran 73% nuclear). Do not treat it as the current engine.

## Reproduce per-run dumps locally

```bash
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --seed 0 --out docs/baselines/v2.13.4/taiwan_strait_2026.json
node scripts/analyze-results.js docs/baselines/v2.13.4/taiwan_strait_2026.json
# same pattern for iran_nuclear_2026, south_china_sea_2026, korean_peninsula_2026,
# orbital_warfare_2026, megacity_siege_2026, financial_contagion_2026
```

Sovereignty Void (requires doctrine):

```bash
node scripts/run-bop.js --scenario sovereignty_void_2026 --doctrine MING --runs 100 --seed 0 --out docs/baselines/v2.13.4/sovereignty_void_ming_2026.json
```

Expected size: about 12–18 MB per scenario file. Prefer Zenodo software zip or Git LFS if distributing full dumps; do not commit them to git unless explicitly requested.

## Software citation

Package / concept DOI: see root [`CITATION.cff`](../../CITATION.cff) and [`ZENODO.md`](../../ZENODO.md). When citing **numbers**, point at the `summary.json` (or May ledger) that matches the prose era you mean.
