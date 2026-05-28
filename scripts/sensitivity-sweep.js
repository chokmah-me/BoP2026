#!/usr/bin/env node
/**
 * BoP2026 Sensitivity Sweep
 * Maps how outcome rates change as key parameters vary.
 * Produces markdown tables suitable for pasting into a paper.
 *
 * Usage:
 *   node scripts/sensitivity-sweep.js [options]
 *
 * Options:
 *   --scenario <id>    Scenario (default: taiwan_strait_2026)
 *   --runs <n>         Runs per cell (default: 30)
 *   --seed <n>         Base seed (default: 0)
 *   --out <path>       Output markdown file (default: stdout)
 *   --sweep A|B|all    Which sweeps to run (default: all)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadEngine } = require('./load-engine');

const ctx = loadEngine();
const BoP = ctx.BoP;

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  scenario: 'taiwan_strait_2026',
  runs: 30,
  seed: 0,
  out: null,
  sweep: 'all'
};
for (let i = 0; i < args.length; i++) {
  const v = () => args[++i];
  if (args[i] === '--scenario') opts.scenario = v();
  else if (args[i] === '--runs') opts.runs = parseInt(v());
  else if (args[i] === '--seed') opts.seed = parseInt(v());
  else if (args[i] === '--out') opts.out = v();
  else if (args[i] === '--sweep') opts.sweep = v();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function runCells(cells, runsPerCell, baseSeed) {
  const results = [];
  let globalRun = 0;
  const totalRuns = cells.length * runsPerCell;

  for (const cell of cells) {
    const cellResults = { wins: 0, nuclear: 0, stab: [], turns: [], n: 0 };

    for (let i = 0; i < runsPerCell; i++) {
      const seed = baseSeed + globalRun++;
      try {
        BoP.init(opts.scenario, { seed, ...cell.initOptions });
        const result = BoP.run({ maxTurns: 20 });
        cellResults.n++;
        if (result.outcome.result === 'win') cellResults.wins++;
        if (result.outcome.reason?.toLowerCase().includes('nuclear')) cellResults.nuclear++;
        cellResults.stab.push(result.outcome.stabilityIndex);
        cellResults.turns.push(result.outcome.turnsPlayed);
      } catch (e) {
        // count failed runs as incomplete
      }

      const done = globalRun;
      const bar = '='.repeat(Math.round(done / totalRuns * 30)).padEnd(30, '-');
      process.stderr.write(`\r  [${bar}] ${done}/${totalRuns}`);
    }

    const avg = arr => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '—';
    results.push({
      label: cell.label,
      n: cellResults.n,
      winPct: cellResults.n ? Math.round(cellResults.wins / cellResults.n * 100) : 0,
      nuclearPct: cellResults.n ? Math.round(cellResults.nuclear / cellResults.n * 100) : 0,
      avgStab: avg(cellResults.stab),
      avgTurns: avg(cellResults.turns)
    });
  }

  process.stderr.write('\n');
  return results;
}

function mdTable(title, headers, rows) {
  const lines = [`\n### ${title}\n`];
  lines.push('| ' + headers.join(' | ') + ' |');
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  for (const row of rows) {
    lines.push('| ' + row.join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}

function tableFromResults(results) {
  return results.map(r => [
    r.label,
    String(r.n),
    `${r.winPct}%`,
    `${r.nuclearPct}%`,
    String(r.avgStab),
    String(r.avgTurns)
  ]);
}

// ── Sweep A: actor riskTolerance ─────────────────────────────────────────────
function sweepA() {
  const values = [0.1, 0.3, 0.5, 0.7, 0.9];
  const powers = ['RU', 'CN'];
  const output = [];

  for (const power of powers) {
    const defaultVal = power === 'RU' ? 0.75 : 0.40;
    const cells = values.map(v => ({
      label: `${power} riskTolerance = ${v}${v === defaultVal ? ' (default)' : ''}`,
      initOptions: { paramOverrides: { [power]: { riskTolerance: v } } }
    }));

    process.stderr.write(`\nSweep A — ${power} riskTolerance (${opts.runs} runs/cell)\n`);
    const results = runCells(cells, opts.runs, opts.seed);
    output.push(mdTable(
      `Sweep A: ${power} riskTolerance — ${opts.scenario}`,
      ['riskTolerance', 'n', 'win%', 'nuclear%', 'avg stability', 'avg turns'],
      tableFromResults(results)
    ));
  }

  // Joint sweep: both RU and CN at extremes
  const jointCells = [
    { label: 'RU 0.9, CN 0.9 (max risk)', initOptions: { paramOverrides: { RU: { riskTolerance: 0.9 }, CN: { riskTolerance: 0.9 } } } },
    { label: 'RU 0.75, CN 0.40 (default)', initOptions: {} },
    { label: 'RU 0.3, CN 0.2 (min risk)', initOptions: { paramOverrides: { RU: { riskTolerance: 0.3 }, CN: { riskTolerance: 0.2 } } } },
    { label: 'RU 0.1, CN 0.1 (pacifist)', initOptions: { paramOverrides: { RU: { riskTolerance: 0.1 }, CN: { riskTolerance: 0.1 } } } },
  ];
  process.stderr.write(`\nSweep A — Joint RU+CN\n`);
  const jointResults = runCells(jointCells, opts.runs, opts.seed + 10000);
  output.push(mdTable(
    `Sweep A: Joint RU+CN riskTolerance — ${opts.scenario}`,
    ['condition', 'n', 'win%', 'nuclear%', 'avg stability', 'avg turns'],
    tableFromResults(jointResults)
  ));

  return output.join('\n');
}

// ── Sweep B: cascade severity ─────────────────────────────────────────────────
function sweepB() {
  const values = [0, 0.25, 0.5, 0.75, 1.0];
  const cells = values.map(v => ({
    label: `cascadeScale = ${v}${v === 1.0 ? ' (default)' : ''}`,
    initOptions: { cascadeScale: v }
  }));

  process.stderr.write(`\nSweep B — cascadeScale (${opts.runs} runs/cell)\n`);
  const results = runCells(cells, opts.runs, opts.seed + 20000);

  return mdTable(
    `Sweep B: Cascade severity — ${opts.scenario}`,
    ['cascadeScale', 'n', 'win%', 'nuclear%', 'avg stability', 'avg turns'],
    tableFromResults(results)
  );
}

// ── Run ──────────────────────────────────────────────────────────────────────
const header = `## BoP2026 Sensitivity Analysis\n\nScenario: \`${opts.scenario}\`  Runs per cell: ${opts.runs}  Base seed: ${opts.seed}\n`;
let output = header;

if (opts.sweep === 'A' || opts.sweep === 'all') output += sweepA();
if (opts.sweep === 'B' || opts.sweep === 'all') output += sweepB();

output += `\n---\n*Generated ${new Date().toISOString().slice(0, 10)} with BoP2026 sensitivity-sweep.js*\n`;

if (opts.out) {
  fs.writeFileSync(path.resolve(opts.out), output);
  console.log(`\nOutput written: ${opts.out}`);
} else {
  console.log(output);
}
