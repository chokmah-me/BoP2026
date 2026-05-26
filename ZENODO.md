# Zenodo Deposit — Balance of Power 2026 v1.0

**Permanent DOI:** https://doi.org/10.5281/zenodo.20370930  
**Deposit Date:** 24 May 2026  
**License:** MIT  
**Principal Investigator / Originator:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914

## Intended Use

BoP2026 is a **stylized, rule-based multipolar crisis simulation** designed for:

- IR and war-studies pedagogy (classroom wargaming)
- Parameter sensitivity analysis and counterfactual exploration
- Generation of synthetic cascade data for method development

**It is explicitly NOT intended for:**
- Forecasting real-world crises
- Policy prescription or validation
- Empirical testing of historical cases

All parameters are calibrated for **face validity** against open-source IR literature (Fearon 1995, Jervis 1976, Waltz 1979), not statistical fitting.

## Files Included in This Deposit (v1.0)

- Full source code (`js/`, `data/`, `scripts/`)
- Browser interface (`index.html`)
- Complete documentation (`README.md`, `docs/model-notes.md`)
- 100-run baseline results for both scenarios (Taiwan Strait 2026 & Iran Nuclear 2026)
- Model assumptions and known limitations

## Recommended Citation

Please cite as:

> Bilar, D. Y. (2026). *Balance of Power 2026* (v2.0.0). Open-source multipolar crisis simulation for IR research and war studies pedagogy. Zenodo. https://doi.org/10.5281/zenodo.20370930

## Versioning Note

This v1.0 deposit represents the baseline personality vectors, cascade weights, and scenario content as of May 2026.

**v2.0.0 (2026-05-25):** Breaking change to output format. `run-bop.js --out` now writes `bop2026-analytics-v1` JSON with per-turn `stateDeltas`, `initialState`, and compact power/crisis summaries. New Oracle API methods `exportAnalytics()` / `exportBatchAnalytics()`. Browser Save Log button. New docs: `docs/ORACLE.md`, `docs/QUICKSTART.md`. New test suite: `scripts/test-analytics.js` (8 tests).

**v2.0.1 (2026-05-25):** Two new domains — `supply_chain` (4 actions: critical minerals deal, chokepoint seizure, tech export ban, industrial reshoring) and `autonomous` (4 actions: drone swarm deployment, autonomous defense net, counter-swarm ops, AI surveillance grid). New playable scenario: South China Sea 2026 with 4 crises across both new domains, a compound crisis (`south_seas_blockade`), and 4 SCS-specific events. No engine changes. Baseline nuclear rate: 9% (vs. 1% Taiwan, 73% Iran).

## Contact & Repository

**Principal:** Daniyel Yaacov Bilar, Chokmah LLC  
**ORCID:** 0000-0002-9040-6914  
GitHub: https://github.com/chokmah-me/BoP2026  
Issues and pull requests welcome for new scenarios, actions, or domain extensions.