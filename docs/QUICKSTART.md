# BoP2026 Quickstart for Researchers

You want analysis-ready data out of the engine. This gets you there in under 10 minutes.

---

## 1. Get the code

```bash
git clone https://github.com/chokmah-me/BoP2026.git
cd BoP2026
```

No npm, no build step. Node 16+ for headless runs. A modern browser for the game.

---

## 2. Single run, export to file

```bash
node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 1 --seed 42 --out run.json
# or: south_china_sea_2026, iran_nuclear_2026
```

`run.json` is an array with one element. The analytics object inside it looks like:

```json
{
  "schema": "bop2026-analytics-v1",
  "scenarioId": "taiwan_strait_2026",
  "player": "US",
  "outcome": { "result": "lose", "reason": "...", "stabilityIndex": 24, "turnsPlayed": 6 },
  "initialState": { "powers": {...}, "crises": [...] },
  "turns": [
    {
      "turn": 1,
      "year": 2026,
      "actions": { "player": [...], "npc": [...] },
      "cascades": [...],
      "events": [...],
      "stateDeltas": {
        "stats":         { "CN": { "military": { "before": 72, "after": 75, "delta": 3 } } },
        "relationships": { "US->CN": { "before": -55, "after": -72, "delta": -17 } },
        "crises":        {}
      },
      "gameOver": null
    }
  ],
  "finalState": { "powers": {...}, "crises": [...] }
}
```

`stateDeltas` only records changed values. If a stat didn't move, it won't appear.

---

## 3. Load in Python

```python
import json, pandas as pd

with open('run.json') as f:
    batch = json.load(f)

run = batch[0]['analytics']

# Flatten turn-level deltas into a DataFrame
rows = []
for t in run['turns']:
    for pid, stats in t['stateDeltas']['stats'].items():
        for stat, d in stats.items():
            rows.append({'turn': t['turn'], 'year': t['year'],
                         'power': pid, 'stat': stat, **d})

df = pd.DataFrame(rows)
print(df.head())
#    turn  year power      stat  before  after  delta
# 0     1  2026    US  military      92     81    -11
# 1     1  2026    US  economic      78     59    -19
```

---

## 4. Batch run with parameter sweep

```bash
node scripts/run-bop.js --runs 100 --seed 0 --cn-risk 0.9 --us-patience 0.2 --out high-risk.json
```

Each element of the array has `runId`, `seed`, and `analytics`. The `stateDeltas` on every turn let you reconstruct the full trajectory without storing redundant state snapshots.

From Python:

```python
with open('high-risk.json') as f:
    batch = json.load(f)

outcomes = [r['analytics']['outcome'] for r in batch if 'analytics' in r]
nuclear_rate = sum(1 for o in outcomes if 'nuclear' in o.get('reason','').lower()) / len(outcomes)
print(f"Nuclear rate: {nuclear_rate:.0%}")
```

---

## 5. Branching / counterfactuals (Oracle API)

```js
// In Node or browser console
BoP.init('taiwan_strait_2026', { seed: 42 });
const snap = BoP.getState();       // save branch point

const resultA = BoP.run();         // default CN behavior

BoP.setState(snap);                // reset
BoP.setNPCOverride('CN', (id, world) => {
  // force CN to stand down every turn
  return [{ actor: 'CN', actionId: 'military_standdown' }];
});
const resultB = BoP.run();

console.log(resultA.outcome.result, resultB.outcome.result);

// Export both
const a = BoP.exportAnalytics(resultA, { seed: 42, paramOverrides: {} });
const b = BoP.exportAnalytics(resultB, { seed: 42, paramOverrides: { CN: 'standdown-override' } });
```

---

## 6. Browser: interactive game + Save Log

```
# Windows
start index.html

# macOS
open index.html
```

Play a few turns, then click **Save Log** in the event log panel (bottom-left of the map). Downloads a JSON snapshot with the full event log and final state. Useful for capturing a specific human-played trajectory.

The **Research** button (top-right) runs batch simulations in the browser with a progress bar. Click **JSON** when done to download the analytics file.

---

## 7. Run the tests

```bash
node scripts/test-analytics.js
```

8 assertions, covering schema, delta reconstruction, determinism. Exit 0 = pass.

---

For full API reference, see [README.md](../README.md#oracle-api). For model assumptions and limitations, see [docs/model-notes.md](model-notes.md).
