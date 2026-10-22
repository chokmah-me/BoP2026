# AGENTS.md — BoP2026

Turn-based multipolar crisis simulation: eight scenarios, thirteen domains, eight actors. Browser wargame plus a headless Oracle API.

## Commands

```powershell
# Interactive: open index.html in a browser. No server, no build.
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 50 --seed 42 --out results.json
node scripts/run-bop.js --runs 100 --cn-risk 0.9 --us-patience 0.2
```

## Work rules

- Vanilla HTML/CSS/JS. No frameworks, bundler, or npm.
- Script load order in `index.html` is the dependency graph.
- Game data the browser loads is `data/*-data.js` (`window.*` globals). The `.json` files in `data/` are drafts.
- World mutations go through `State.*`. UI renders; it does not own game logic.

## Pointers

- `README.md` — purpose and status
- `CLAUDE.md` — engine modules, Oracle API, content-add recipes
- `docs/notes/workplan.md` — resume thread
