#!/usr/bin/env node
/**
 * Scenario smoke matrix — every scenario boots and finishes.
 *
 * Not a calibration study. Crashes, empty runs, and unknown action ids fail.
 * Scenario-scoped event reachability is only asserted where the event is
 * available from turn 1 at default escalation (no rare-event flakes).
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEngine } = require('./load-engine');

const ROOT = path.join(__dirname, '..');
const ctx = loadEngine();
const BoP = ctx.BoP;

let passed = 0, failed = 0;
const origRandom = Math.random;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${name}\n        ${e.message}`);
    failed++;
  } finally {
    Math.random = origRandom;
    try { BoP.unseed(); } catch (_) { /* no-op */ }
    try { BoP.clearOverrides(); } catch (_) { /* no-op */ }
  }
}

const SCENARIOS = [
  { id: 'taiwan_strait_2026' },
  { id: 'iran_nuclear_2026' },
  { id: 'south_china_sea_2026' },
  { id: 'korean_peninsula_2026' },
  { id: 'orbital_warfare_2026' },
  { id: 'megacity_siege_2026' },
  { id: 'financial_contagion_2026' },
  { id: 'sovereignty_void_2026', init: { doctrine: 'MING' } }
];

const VALID_RESULTS = new Set(['win', 'lose', 'draw', 'incomplete']);

// ── init ───────────────────────────────────────────────────────────────────

console.log('\n=== scenarios: init ===');

for (const s of SCENARIOS) {
  test(`${s.id} inits with expected player, crises, and involved powers`, () => {
    const snap = BoP.init(s.id, { ...(s.init || {}), seed: 1 });
    const def = ctx.SCENARIOS_DATA[s.id];
    const expectedPlayer = s.init?.doctrine
      ? ctx.DOCTRINES_DATA.find(d => d.id === s.init.doctrine).power
      : def.player;
    assert.strictEqual(snap.player, expectedPlayer, `player ${snap.player} !== ${expectedPlayer}`);
    assert.ok(snap.crises.length >= 1, 'no crises');
    for (const c of snap.crises) {
      for (const pid of c.involved) {
        assert.ok(snap.powers[pid], `involved power ${pid} missing from world.powers`);
      }
    }
  });
}

// ── completion ─────────────────────────────────────────────────────────────

console.log('\n=== scenarios: 5-run completion ===');

for (const s of SCENARIOS) {
  test(`${s.id} completes 5 seeded runs with valid outcomes and registered actions`, () => {
    const results = BoP.runBatch({
      scenarioId: s.id,
      runs: 5,
      seeds: [1, 2, 3, 4, 5],
      initOptions: s.init || {},
      runOptions: { maxTurns: 20 }
    });
    assert.strictEqual(results.length, 5, `got ${results.length} results`);
    const knownIds = new Set(ctx.Domains.getAll().map(a => a.id));
    let npcCount = 0;
    for (const r of results) {
      assert.ok(r.result, `run ${r.runId} missing result`);
      assert.ok(r.result.turns.length >= 1, `run ${r.runId} produced 0 turns`);
      const result = r.result.outcome.result;
      assert.ok(VALID_RESULTS.has(result), `run ${r.runId} outcome ${result}`);
      for (const t of r.result.turns) {
        for (const a of (t.npcActions || [])) {
          npcCount++;
          assert.ok(knownIds.has(a.actionId), `unknown NPC action ${a.actionId}`);
        }
        for (const a of (t.playerActions || [])) {
          assert.ok(knownIds.has(a.actionId), `unknown player action ${a.actionId}`);
        }
      }
    }
    assert.ok(npcCount >= 1, `${s.id}: no NPC actions across 5 runs`);
  });
}

// ── scenario-scoped events (turn-1 reachable only) ─────────────────────────

console.log('\n=== scenarios: event reachability ===');

function eventFired(batch, ids) {
  const want = new Set(ids);
  for (const r of batch) {
    for (const t of r.analytics.turns) {
      if ((t.events || []).some(e => want.has(e.id))) return true;
    }
  }
  return false;
}

test('orbital_warfare_2026 fires a space-scenario event across 20 runs', () => {
  const results = BoP.runBatch({
    scenarioId: 'orbital_warfare_2026',
    runs: 20,
    seeds: Array.from({ length: 20 }, (_, i) => i),
    runOptions: { maxTurns: 20 }
  });
  const batch = BoP.exportBatchAnalytics(results);
  assert.ok(
    eventFired(batch, ['kessler_debris_alert', 'commercial_constellation_loss']),
    'no orbital scenario event in 20 runs'
  );
});

test('megacity_siege_2026 fires an urban-scenario event across 20 runs', () => {
  const results = BoP.runBatch({
    scenarioId: 'megacity_siege_2026',
    runs: 20,
    seeds: Array.from({ length: 20 }, (_, i) => i),
    runOptions: { maxTurns: 20 }
  });
  const batch = BoP.exportBatchAnalytics(results);
  assert.ok(
    eventFired(batch, ['mass_displacement_wave', 'insurgent_ied_campaign']),
    'no megacity scenario event in 20 runs'
  );
});

// korean dprk_haed_test needs dprk_emp_threat >= 2 (starts at 1) — skipped as flaky.

// ── CLI process smoke ──────────────────────────────────────────────────────

console.log('\n=== scenarios: CLI process ===');

function runCli(args, relOut) {
  // run-bop.js joins path.dirname(--out) onto cwd, so --out must be repo-relative.
  const abs = path.join(ROOT, relOut);
  const r = spawnSync(process.execPath, ['scripts/run-bop.js', ...args, '--out', relOut], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.strictEqual(r.status, 0, `cli exit ${r.status}\n${r.stderr || r.stdout}`);
  const payload = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const first = Array.isArray(payload) ? payload[0] : payload;
  const analytics = first.analytics || first;
  assert.strictEqual(analytics.schema, 'bop2026-analytics-v1', `schema ${analytics.schema}`);
  try { fs.unlinkSync(abs); } catch (_) { /* leave it if locked */ }
  return analytics;
}

test('run-bop.js taiwan 1-run seed 0 writes analytics JSON', () => {
  runCli(
    ['--scenario', 'taiwan_strait_2026', '--runs', '1', '--seed', '0', '--max-turns', '5'],
    'logs/_cli-smoke-tw.json'
  );
});

test('run-bop.js sovereignty_void --doctrine MING writes analytics JSON', () => {
  runCli([
    '--scenario', 'sovereignty_void_2026',
    '--doctrine', 'MING',
    '--runs', '1',
    '--seed', '0',
    '--max-turns', '5'
  ], 'logs/_cli-smoke-sv.json');
});

// ── summary ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
