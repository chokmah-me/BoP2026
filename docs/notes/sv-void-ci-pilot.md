# SV void-rate CI pilot (symmetric AOM, multi seed-base + second player)

**Status:** complete (2026-09-17).  
**Prompt:** `PROMPT_VERSION` v1.4 (situational AOM in user message), symmetric framing.  
**Model:** `deepseek-chat` (pilot; reasoner via `pwsh scripts/sv-void-ci-pilot.ps1 -Thinking`, ~30× dry-run cost).  
**Design:** 2 doctrines × 2 seed-bases × n=12 = **48** games.  
**Wall time:** ~38 min. **Est. API cost:** ~$0.48 (sum of per-cell DeepSeek footers).

| Cell | Doctrine | Player | Seed base | n | Log |
|---|---|---|---|---|---|
| 1 | MING | CN | 0 | 12 | `logs/sv-ci-pilot-ming-s0.json` |
| 2 | MING | CN | 100 | 12 | `logs/sv-ci-pilot-ming-s100.json` |
| 3 | MAGA | US | 0 | 12 | `logs/sv-ci-pilot-maga-s0.json` |
| 4 | MAGA | US | 100 | 12 | `logs/sv-ci-pilot-maga-s100.json` |

`--ai-powers all`, `--max-turns 8`, checkpointed via `run-bop.js`. Heuristic fallbacks: 1× GB (MING s0), 1× DPRK (MAGA s0).

## Why this pilot

Prior LLM void rates were n=12 on a **single** seed-base and one player framing (MING→CN in Block E). DeepSeek sampling is unseeded, so absolute void% needed at least: (1) a second seed-base, (2) a second player power (MAGA→US).

## Results

From `node scripts/sv-void-ci-summary.mjs logs/sv-ci-pilot-*.json` (Wilson 95% binomial):

| file | doctrine | seed | player | n | void% | CI95% | win% | avgTurns | avgStab |
|---|---|---|---|---|---|---|---|---|---|
| sv-ci-pilot-ming-s0 | MING | 0 | CN | 12 | 8.3 | 1.5–35.4 | 0 | 7.3 | 55.9 |
| sv-ci-pilot-ming-s100 | MING | 100 | CN | 12 | 0.0 | 0.0–24.3 | 0 | 7.8 | 58.8 |
| sv-ci-pilot-maga-s0 | MAGA | 0 | US | 12 | 33.3 | 13.8–60.9 | 0 | 5.8 | 51.2 |
| sv-ci-pilot-maga-s100 | MAGA | 100 | US | 12 | 8.3 | 1.5–35.4 | 0 | 7.3 | 50.4 |

**Pooled (all cells, descriptive only):** void 6/48 = **12.5%** (Wilson 95% **5.9–24.7%**).

### Heuristic reference (same doctrines, n=100 seed 0)

From `docs/baselines/v2.13.4/sv-summary.json`: MING void **49%**, MAGA void **20%**. Not a paired test against this chat pilot.

## What the CIs say

1. **n=12 is still wide.** A cell at 8.3% has Wilson 95% ≈ 1.5–35%; a 0/12 cell still allows up to ~24%. Absolute void% remains an estimate band, not a point for citation.
2. **Seed-base moves MAGA hard** (33.3% at seed 0 vs 8.3% at seed 100) under identical n and prompt — exactly the unseeded-LLM + RNG interaction the limitation called out. MING stayed low on both bases (0–8.3%).
3. **Second player matters as a different game** (MING/CN vs MAGA/US, different `t_rat`). Do not pool them into one void-rate estimand without saying so; the pooled 12.5% is a convenience aggregate only.
4. **Symmetric chat + v1.4** did **not** reproduce the old asymmetric high void artifact in this pilot (MING void stayed single-digit / zero). That is consistent with the prompt-fix story; it is not a reasoner replication.

## Follow-ups (still open)

- Raise n (e.g. 25–50) **per cell** if a quotable CI width is required.
- Optional `-Thinking` redo for comparability with the May reasoner study (budget ~$11 dry-run ×4 cells before caching).
- Cross-model (Claude) still separate workplan slice.

## Reproduce

```powershell
pwsh scripts/sv-void-ci-pilot.ps1 -DryRun
pwsh scripts/sv-void-ci-pilot.ps1
node scripts/sv-void-ci-summary.mjs logs/sv-ci-pilot-ming-s0.json logs/sv-ci-pilot-ming-s100.json logs/sv-ci-pilot-maga-s0.json logs/sv-ci-pilot-maga-s100.json
```
