#!/usr/bin/env node
/**
 * BoP2026 Results Analyzer
 * Reads the JSON output from run-bop.js and prints a summary.
 *
 * Usage:
 *   node scripts/analyze-results.js bop-results.json
 *   node scripts/analyze-results.js bop-results.json --verbose
 */
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
const verbose = args.includes('--verbose');

if (!inputFile) {
  console.error('Usage: node scripts/analyze-results.js <results.json> [--verbose]');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'));

// Normalize: run-bop.js wraps each run in { runId, seed, params, result }
const runs = raw.map(r => r.result || r).filter(Boolean);

if (runs.length === 0) {
  console.error('No valid runs found in input.');
  process.exit(1);
}

// ── Outcome distribution ─────────────────────────────────────────────────────
const outcomes = { win: 0, lose: 0, incomplete: 0 };
const nuclearRuns = [];
const stabilityVals = [];
const turnsVals = [];

for (const run of runs) {
  const o = run.outcome;
  outcomes[o.result] = (outcomes[o.result] || 0) + 1;
  if (o.reason?.toLowerCase().includes('nuclear')) nuclearRuns.push(run);
  stabilityVals.push(o.stabilityIndex);
  turnsVals.push(o.turnsPlayed);
}

const n = runs.length;
const pct = v => `${Math.round(v / n * 100)}%`;
const avg = arr => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '—';
const stddev = arr => {
  if (arr.length < 2) return '—';
  const m = arr.reduce((s, v) => s + v, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length).toFixed(1);
};

// ── Action frequency by power ────────────────────────────────────────────────
const actionCounts = {};
const systemicEvents = {};

for (const run of runs) {
  for (const turn of (run.turns || [])) {
    for (const a of (turn.playerActions || []).concat(turn.npcActions || [])) {
      const key = `${a.actor}:${a.actionId}`;
      actionCounts[key] = (actionCounts[key] || 0) + 1;
    }
    for (const entry of (turn.cascadeLog || [])) {
      if (entry.type === 'systemic_event' || entry.type === 'systemic_warning') {
        const label = entry.text.replace(/^\[.*?\]\s*/, '').slice(0, 60);
        systemicEvents[label] = (systemicEvents[label] || 0) + 1;
      }
    }
  }
}

// Top actions per power
const byPower = {};
for (const [key, count] of Object.entries(actionCounts)) {
  const [power, action] = key.split(':');
  if (!byPower[power]) byPower[power] = [];
  byPower[power].push({ action, count });
}
for (const power of Object.keys(byPower)) {
  byPower[power].sort((a, b) => b.count - a.count);
}

// ── Stability histogram (buckets of 10) ─────────────────────────────────────
const hist = Array(10).fill(0);
for (const v of stabilityVals) {
  const bucket = Math.min(9, Math.floor(v / 10));
  hist[bucket]++;
}

// ── Print ────────────────────────────────────────────────────────────────────
const hr = '─'.repeat(52);
const scenarioId = runs[0]?.scenarioId || 'unknown';

console.log(`\n  BoP2026 Results Analysis`);
console.log(`  Scenario: ${scenarioId}   Runs: ${n}`);
console.log(`  ${hr}`);

console.log(`\n  OUTCOMES`);
console.log(`    Win        ${String(outcomes.win || 0).padStart(4)}  (${pct(outcomes.win || 0)})`);
console.log(`    Lose       ${String(outcomes.lose || 0).padStart(4)}  (${pct(outcomes.lose || 0)})`);
console.log(`    Incomplete ${String(outcomes.incomplete || 0).padStart(4)}  (${pct(outcomes.incomplete || 0)})`);
console.log(`    Nuclear    ${String(nuclearRuns.length).padStart(4)}  (${pct(nuclearRuns.length)})`);

console.log(`\n  STABILITY INDEX   avg ${avg(stabilityVals)}   σ ${stddev(stabilityVals)}`);
const barScale = Math.max(...hist) || 1;
for (let i = 0; i < 10; i++) {
  const lo = i * 10;
  const hi = lo + 9;
  const bar = '█'.repeat(Math.round(hist[i] / barScale * 20)).padEnd(20);
  console.log(`    ${String(lo).padStart(2)}–${String(hi).padStart(2)}  ${bar}  ${hist[i]}`);
}

console.log(`\n  TURNS   avg ${avg(turnsVals)}   σ ${stddev(turnsVals)}`);

console.log(`\n  TOP ACTIONS BY POWER`);
for (const [power, actions] of Object.entries(byPower).sort(([a], [b]) => a.localeCompare(b))) {
  const top = actions.slice(0, 3).map(a => `${a.action}(${a.count})`).join('  ');
  console.log(`    ${power.padEnd(4)}  ${top}`);
}

if (Object.keys(systemicEvents).length > 0) {
  console.log(`\n  SYSTEMIC EVENTS (across all runs)`);
  for (const [label, count] of Object.entries(systemicEvents).sort(([, a], [, b]) => b - a)) {
    console.log(`    ${String(count).padStart(4)}x  ${label}`);
  }
}

// ── Parameter sensitivity (if paramSweep was used) ──────────────────────────
const paramRuns = raw.filter(r => r.params && Object.keys(r.params).length > 0);
if (paramRuns.length > 0 && verbose) {
  console.log(`\n  PARAMETER SENSITIVITY`);
  const byParam = {};
  for (const r of paramRuns) {
    for (const [power, params] of Object.entries(r.params)) {
      for (const [param, val] of Object.entries(params)) {
        const key = `${power}.${param}`;
        if (!byParam[key]) byParam[key] = {};
        const bucket = String(val);
        if (!byParam[key][bucket]) byParam[key][bucket] = { wins: 0, nuclear: 0, stab: [], n: 0 };
        const o = r.result?.outcome;
        if (!o) continue;
        byParam[key][bucket].n++;
        if (o.result === 'win') byParam[key][bucket].wins++;
        if (o.reason?.toLowerCase().includes('nuclear')) byParam[key][bucket].nuclear++;
        byParam[key][bucket].stab.push(o.stabilityIndex);
      }
    }
  }
  for (const [param, buckets] of Object.entries(byParam)) {
    console.log(`\n    ${param}`);
    console.log(`    ${'val'.padEnd(8)} ${'n'.padStart(4)}  ${'win%'.padStart(6)}  ${'nuke%'.padStart(6)}  ${'avg_stab'.padStart(8)}`);
    for (const [val, d] of Object.entries(buckets).sort(([a], [b]) => parseFloat(a) - parseFloat(b))) {
      console.log(`    ${val.padEnd(8)} ${String(d.n).padStart(4)}  ${String(Math.round(d.wins / d.n * 100)).padStart(5)}%  ${String(Math.round(d.nuclear / d.n * 100)).padStart(5)}%  ${avg(d.stab).padStart(8)}`);
    }
  }
}

console.log(`\n  ${hr}\n`);
