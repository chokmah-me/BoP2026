#!/usr/bin/env node
/**
 * BoP2026 CLI runner — headless batch simulation for IR research.
 *
 * Usage:
 *   node scripts/run-bop.js [options]
 *
 * Options:
 *   --scenario   <id>      Scenario id (default: taiwan_strait_2026)
 *   --runs       <n>       Number of runs (default: 10)
 *   --seed       <n>       Base seed (each run gets seed+i). Omit for random.
 *   --out        <path>    Output JSON file (default: bop-results.json)
 *   --max-turns  <n>       Max turns per run (default: 20)
 *   --[powerId]-risk <f>   Override a power's riskTolerance (e.g. --cn-risk 0.9)
 *   --[powerId]-patience <f>
 *
 * Examples:
 *   node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --out results.json
 *   node scripts/run-bop.js --runs 50 --seed 42 --cn-risk 0.9 --us-patience 0.2
 */
'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Set up a shared context that mimics the browser global scope.
// All BoP modules use IIFE pattern and reference each other by name.
// vm.createContext(global) makes global act as the script's global object.
global.window = global;
const ctx = vm.createContext(global);

function load(rel) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, 'utf8');
  // vm.runInContext with `const` top-level — rewrite to `var` so names
  // are available on the context object across subsequent script calls.
  const patched = code.replace(/^(const|let) ([A-Z][A-Za-z_]*)\s*=/m, 'var $2 =');
  vm.runInContext(patched, ctx, { filename: file });
}

// Load in the same order as index.html
load('data/powers-data.js');
load('data/scenarios-data.js');
load('data/doctrines-data.js');
load('data/events-data.js');
load('js/state.js');
load('js/domains.js');
load('js/cascades.js');
load('js/epistemic.js');
load('js/events.js');
load('js/ai.js');
load('js/oracle.js');

const BoP = ctx.BoP;
if (!BoP) { console.error('Failed to load BoP oracle.'); process.exit(1); }

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  scenario: 'taiwan_strait_2026',
  runs: 10,
  seed: null,
  out: null,
  maxTurns: 20,
  paramOverrides: {}
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const val = () => { i++; return args[i]; };

  if (arg === '--scenario') opts.scenario = val();
  else if (arg === '--runs') opts.runs = parseInt(val());
  else if (arg === '--seed') opts.seed = parseInt(val());
  else if (arg === '--out') opts.out = val();
  else if (arg === '--max-turns') opts.maxTurns = parseInt(val());
  else if (arg === '--player') opts.player = val().toUpperCase();
  else if (arg === '--cascade-scale') opts.cascadeScale = parseFloat(val());
  else {
    // --<powerId>-risk or --<powerId>-patience  e.g. --cn-risk 0.9
    const m = arg.match(/^--([a-z]+)-(risk|patience)$/);
    if (m) {
      const powerId = m[1].toUpperCase();
      const param = m[2] === 'risk' ? 'riskTolerance' : 'patience';
      opts.paramOverrides[powerId] = opts.paramOverrides[powerId] || {};
      opts.paramOverrides[powerId][param] = parseFloat(val());
    }
  }
}

// ── Resolve output path ───────────────────────────────────────────────────────
if (!opts.out) {
  const date = new Date().toISOString().slice(0, 10);
  const seedTag = opts.seed != null ? opts.seed : 'rnd';
  opts.out = `logs/bop-${opts.scenario}-${date}-s${seedTag}-x${opts.runs}.json`;
}
fs.mkdirSync(path.join(process.cwd(), path.dirname(opts.out)), { recursive: true });

// ── Run ─────────────────────────────────────────────────────────────────────
console.log(`\nBoP2026 Oracle — ${opts.scenario}`);
console.log(`Runs: ${opts.runs}  Seed base: ${opts.seed ?? 'random'}  Max turns: ${opts.maxTurns}`);
if (Object.keys(opts.paramOverrides).length) {
  console.log('Param overrides:', JSON.stringify(opts.paramOverrides));
}
console.log('');

const seeds = [];
for (let i = 0; i < opts.runs; i++) {
  seeds.push(opts.seed != null ? opts.seed + i : Math.floor(Math.random() * 0xFFFFFF));
}

const results = BoP.runBatch({
  scenarioId: opts.scenario,
  runs: opts.runs,
  seeds,
  initOptions: {
    paramOverrides: Object.keys(opts.paramOverrides).length ? opts.paramOverrides : undefined,
    player: opts.player || undefined,
    cascadeScale: opts.cascadeScale != null ? opts.cascadeScale : undefined
  },
  runOptions: { maxTurns: opts.maxTurns },
  onProgress: (done, total) => {
    const bar = '='.repeat(Math.round(done / total * 30)).padEnd(30, '-');
    process.stdout.write(`\r  [${bar}] ${done}/${total}`);
  }
});

console.log('\n');

// ── Summary table ────────────────────────────────────────────────────────────
const valid = results.filter(r => r.result);
const wins = valid.filter(r => r.result.outcome.result === 'win').length;
const nuclear = valid.filter(r => r.result.outcome.reason?.toLowerCase().includes('nuclear')).length;
const avgStab = valid.length
  ? (valid.reduce((s, r) => s + r.result.outcome.stabilityIndex, 0) / valid.length).toFixed(1)
  : 0;
const avgTurns = valid.length
  ? (valid.reduce((s, r) => s + r.result.outcome.turnsPlayed, 0) / valid.length).toFixed(1)
  : 0;

console.log('─'.repeat(40));
console.log(`  Runs completed : ${valid.length} / ${opts.runs}`);
console.log(`  Win rate       : ${valid.length ? Math.round(wins / valid.length * 100) : 0}%`);
console.log(`  Avg stability  : ${avgStab}`);
console.log(`  Avg turns      : ${avgTurns}`);
console.log(`  Nuclear events : ${nuclear} (${valid.length ? Math.round(nuclear / valid.length * 100) : 0}%)`);
console.log('─'.repeat(40));

// ── Write output ─────────────────────────────────────────────────────────────
const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(process.cwd(), opts.out);
const analytics = BoP.exportBatchAnalytics(results);
fs.writeFileSync(outPath, JSON.stringify(analytics, null, 2));
console.log(`\n  Output written: ${outPath}  (schema: bop2026-analytics-v1)\n`);
