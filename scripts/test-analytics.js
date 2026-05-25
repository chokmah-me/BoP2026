#!/usr/bin/env node
/**
 * Analytics export regression tests.
 * Usage: node scripts/test-analytics.js
 * Exit 0 = all pass, exit 1 = failures.
 */
'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

global.window = global;
const ctx = vm.createContext(global);

function load(rel) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const patched = code.replace(/^(const|let) ([A-Z][A-Za-z_]*)\s*=/m, 'var $2 =');
  vm.runInContext(patched, ctx, { filename: rel });
}

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
if (!BoP) { console.error('Failed to load BoP.'); process.exit(1); }

// ── Test harness ─────────────────────────────────────────────────────────────

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${e.message}`);
    failures++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function runOne(seed) {
  const saved = Math.random;
  Math.random = mulberry32(seed);
  try {
    BoP.init('taiwan_strait_2026');
    return BoP.run({ maxTurns: 10 });
  } finally {
    Math.random = saved;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

console.log('\nBoP2026 Analytics Export Tests\n');

// 1. Schema and top-level structure
test('1. exportBatchAnalytics returns array', () => {
  const result = runOne(42);
  const batch = BoP.exportBatchAnalytics([{ runId: 0, seed: 42, params: {}, result }]);
  assert(Array.isArray(batch), 'not an array');
  assert(batch.length === 1, 'expected 1 element');
  const r = batch[0];
  assert('runId' in r, 'missing runId');
  assert('seed' in r, 'missing seed');
  assert('analytics' in r, 'missing analytics');
});

test('2. analytics schema and exportedAt', () => {
  const result = runOne(42);
  const a = BoP.exportAnalytics(result, { seed: 42 });
  assert(a.schema === 'bop2026-analytics-v1', `wrong schema: ${a.schema}`);
  assert(typeof a.exportedAt === 'string' && !isNaN(Date.parse(a.exportedAt)), 'exportedAt not a valid ISO date');
  assert(Array.isArray(a.turns) && a.turns.length > 0, 'turns empty');
  assert(a.initialState && a.finalState, 'missing initialState or finalState');
  assert(typeof a.outcome === 'object', 'missing outcome');
});

// 2. Per-turn structure
test('3. turn has required keys', () => {
  const result = runOne(42);
  const a = BoP.exportAnalytics(result);
  const t = a.turns[0];
  for (const k of ['turn', 'year', 'actions', 'cascades', 'events', 'stateDeltas', 'gameOver']) {
    assert(k in t, `turn missing key: ${k}`);
  }
  assert(Array.isArray(t.actions.player), 'actions.player not array');
  assert(Array.isArray(t.actions.npc), 'actions.npc not array');
  assert('stats' in t.stateDeltas, 'stateDeltas missing stats');
  assert('relationships' in t.stateDeltas, 'stateDeltas missing relationships');
  assert('crises' in t.stateDeltas, 'stateDeltas missing crises');
});

// 3. stateSnapshot stripped
test('4. stateSnapshot stripped from exported turns', () => {
  const result = runOne(42);
  const a = BoP.exportAnalytics(result);
  for (const t of a.turns) {
    assert(!('stateSnapshot' in t), `turn ${t.turn} still has stateSnapshot`);
  }
});

// 4. Delta correctness: reconstruct final state from initial + deltas
test('5. stat deltas reconstruct finalState correctly', () => {
  const result = runOne(7);
  const a = BoP.exportAnalytics(result);

  // Start from initialState
  const running = {};
  for (const [id, pw] of Object.entries(a.initialState.powers)) {
    running[id] = { ...pw.trueState };
  }

  // Apply each turn's deltas
  for (const t of a.turns) {
    for (const [powerId, stats] of Object.entries(t.stateDeltas.stats || {})) {
      for (const [stat, d] of Object.entries(stats)) {
        assert(running[powerId][stat] === d.before,
          `Turn ${t.turn} ${powerId}.${stat}: expected before=${running[powerId][stat]}, got ${d.before}`);
        running[powerId][stat] = d.after;
      }
    }
  }

  // Compare to finalState
  for (const [id, pw] of Object.entries(a.finalState.powers)) {
    for (const [stat, val] of Object.entries(pw.trueState)) {
      assert(running[id][stat] === val,
        `${id}.${stat}: reconstructed=${running[id][stat]}, finalState=${val}`);
    }
  }
});

test('6. relationship deltas reconstruct finalState correctly', () => {
  const result = runOne(7);
  const a = BoP.exportAnalytics(result);

  const running = {};
  for (const [id, pw] of Object.entries(a.initialState.powers)) {
    running[id] = { ...pw.relationships };
  }

  for (const t of a.turns) {
    for (const [key, d] of Object.entries(t.stateDeltas.relationships || {})) {
      const [from, to] = key.split('->');
      assert(running[from][to] === d.before,
        `Turn ${t.turn} ${key}: expected before=${running[from][to]}, got ${d.before}`);
      running[from][to] = d.after;
    }
  }

  for (const [id, pw] of Object.entries(a.finalState.powers)) {
    for (const [otherId, val] of Object.entries(pw.relationships)) {
      assert(running[id][otherId] === val,
        `${id}->${otherId}: reconstructed=${running[id][otherId]}, finalState=${val}`);
    }
  }
});

// 5. Batch size
test('7. batch produces correct runId sequence', () => {
  const saved = Math.random;
  let results;
  try {
    results = BoP.runBatch({ scenarioId: 'taiwan_strait_2026', runs: 3, seeds: [1, 2, 3], runOptions: { maxTurns: 5 } });
  } finally {
    Math.random = saved;
  }
  const batch = BoP.exportBatchAnalytics(results);
  assert(batch.length === 3, `expected 3 runs, got ${batch.length}`);
  assert(batch[0].runId === 0 && batch[1].runId === 1 && batch[2].runId === 2, 'runId sequence wrong');
});

// 6. Determinism
test('8. same seed produces identical turn-1 stateDeltas', () => {
  const r1 = BoP.exportAnalytics(runOne(99));
  const r2 = BoP.exportAnalytics(runOne(99));
  const d1 = JSON.stringify(r1.turns[0].stateDeltas);
  const d2 = JSON.stringify(r2.turns[0].stateDeltas);
  assert(d1 === d2, 'stateDeltas differ between identical seeds');
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('');
if (failures === 0) {
  console.log(`All tests passed.\n`);
} else {
  console.log(`${failures} test(s) failed.\n`);
  process.exit(1);
}
