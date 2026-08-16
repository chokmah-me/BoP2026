#!/usr/bin/env node
/**
 * test-engine.js — coverage for the core engine surfaces that the cascade and
 * analytics suites don't exercise directly:
 *
 *   • State game-over conditions (nuclear exchange, player collapse, two-power
 *     collapse, turn-20 GSI win/lose) and outcome-index math.
 *   • Oracle API (BoP): seeded determinism, getState/setState branching,
 *     runBatch seed/sweep behaviour, init overrides, unknown-scenario guard.
 *   • AI decideTurn invariants: action-point budget, valid action ids,
 *     domain priority, patience hoarding.
 *
 * Runs headless under Node via the shared vm loader (scripts/load-engine.js).
 * The harness mirrors test-cascades.js: every test gets a deterministic
 * Math.random restore on exit, so tests are order-independent.
 */
'use strict';

const assert = require('assert');
const { loadEngine } = require('./load-engine');

const ctx = loadEngine();
const BoP = ctx.BoP;

// ── harness ────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

// Capture the true native RNG once at module load. oracle.js's _patchRNG is now
// idempotent, but a native backstop guarantees order-independence even if a
// future test calls seed() without a matching unseed(), exactly like
// test-cascades.js does.
const origRandom = Math.random;

function maybeUnseed() {
  // Best-effort: unwind whatever oracle.js thinks the original is, then force
  // the true native RNG back regardless, so tests stay order-independent.
  try { BoP.unseed(); } catch (_) { /* no-op */ }
  Math.random = origRandom;
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${name}\n        ${e.message}`);
    failed++;
  } finally {
    maybeUnseed();
  }
}

function runScenario(scenarioId, options = {}) {
  BoP.init(scenarioId, options);
  return BoP;
}

// ── State: game-over conditions ─────────────────────────────────────────────

console.log('\n=== State: game-over conditions ===');

test('military crisis at escalation 5 triggers nuclear-exchange loss', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.crises[0].escalationLevel = 5;
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.strictEqual(w.gameOver.reason, 'Nuclear exchange. Civilization does not recover.');
});

test('autonomous-domain crisis at 5 uses sovereignty-void reason, not the nuclear string', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.crises.push({ id: 'void', name: 'Latency Void', domain: 'autonomous', involved: ['US', 'CN'], escalationLevel: 5, cascadeLog: [] });
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Sovereignty void cascaded to terminal threshold/);
});

test('player domestic collapse at <= 0 is a loss', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.powers[w.player].trueState.domestic = 0;
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.strictEqual(w.gameOver.reason, 'Domestic collapse. Your government has fallen.');
});

test('two major powers below domestic <= 15 is a cascading-failures loss', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.powers['US'].trueState.domestic = 10;
  w.powers['RU'].trueState.domestic = 5;
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.strictEqual(w.gameOver.reason, 'Cascading state failures. The international order has dissolved.');
});

test('single low domestic power does NOT trigger the two-power collapse', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.powers['US'].trueState.domestic = 10;
  assert.strictEqual(ctx.State.checkGameOver(), false);
  assert.strictEqual(w.gameOver, null);
});

test('turn 20 with GSI >= 40 is a win', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.turn = 20;
  for (const p of Object.values(w.powers)) p.trueState.domestic = 70;
  assert.ok(ctx.State.getGlobalStabilityIndex() >= 40);
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'win');
});

test('turn 20 with GSI < 40 is a loss', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  w.turn = 20;
  for (const p of Object.values(w.powers)) p.trueState.domestic = 20;
  assert.ok(ctx.State.getGlobalStabilityIndex() < 40);
  assert.strictEqual(ctx.State.checkGameOver(), true);
  assert.strictEqual(w.gameOver.result, 'lose');
});

test('GSI rounds a non-integer mean (round vs floor distinguishable)', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  // 6 active powers: 3 at 60 and 3 at 61 → mean 60.5. Math.round → 61,
  // Math.floor/trunc → 60. A rounding-mode regression is now caught.
  const ids = Object.keys(w.powers);
  assert.strictEqual(ids.length, 6, 'taiwan scenario should expose 6 active powers');
  ids.forEach((id, i) => { w.powers[id].trueState.domestic = i < 3 ? 60 : 61; });
  assert.strictEqual(ctx.State.getGlobalStabilityIndex(), 61);
});

test('systemic risk folds in crisis pressure and max nuclear posture', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  for (const p of Object.values(w.powers)) p.trueState.domestic = 80;
  w.crises[0].escalationLevel = 5;
  for (const p of Object.values(w.powers)) p.trueState.nuclear = 3;
  const s = ctx.State.getSystemicRiskIndex();
  assert.ok(s.index >= 0 && s.index <= 100, `index out of range: ${s.index}`);
  assert.strictEqual(s.maxNuclear, 3);
  // default taiwan crises are esc 2, 3, 1; the test sets crisis[0]=5 → 5+3+1.
  // Asserting the exact sum discriminates the level-5 mutation rather than the
  // already-6 default pressure.
  assert.strictEqual(s.crisisPressure, 9, `expected 5+3+1, got ${s.crisisPressure}`);
});

test('state snapshot survives round-trip via getState/setState (deep clone)', () => {
  runScenario('taiwan_strait_2026');
  const snap = BoP.getState();
  // mutate live world, then restore and confirm it's untouched
  ctx.State.get().powers['US'].trueState.domestic = 99;
  BoP.setState(snap);
  const restored = BoP.getState();
  assert.strictEqual(restored.powers['US'].trueState.domestic, snap.powers['US'].trueState.domestic);
  assert.notStrictEqual(restored.powers['US'].trueState.domestic, 99);
});

// ── Oracle: determinism & branching ─────────────────────────────────────────

console.log('\n=== Oracle: determinism & branching ===');

test('same seed produces identical outcomes across two runs', () => {
  BoP.seed(42); runScenario('taiwan_strait_2026', { seed: 42 }); const r1 = BoP.run();
  BoP.unseed();
  BoP.seed(42); runScenario('taiwan_strait_2026', { seed: 42 }); const r2 = BoP.run();
  assert.deepStrictEqual(r1.outcome, r2.outcome);
});

test('init({ seed }) alone is reproducible (no separate BoP.seed call)', () => {
  // Regression guard for the dead `options.seed` bug: init() must honor the
  // documented seed option on its own, producing identical runs. The harness
  // backstop restores native Math.random between the two branches.
  runScenario('taiwan_strait_2026', { seed: 42 }); const r1 = BoP.run();
  runScenario('taiwan_strait_2026', { seed: 42 }); const r2 = BoP.run();
  assert.deepStrictEqual(r1.outcome, r2.outcome);
});

test('repeated BoP.seed() then one unseed() restores native Math.random', () => {
  // Regression guard for the _patchRNG idempotency bug: several seed() calls
  // without unseed() (the branching workflow) must not leave unseed() restoring
  // a stale seeded closure. Verify the real RNG is back by its name ("random"
  // is the native identifier; a mulberry32 closure has an empty name).
  BoP.seed(7);
  BoP.seed(7);
  BoP.seed(7);
  BoP.unseed();
  assert.strictEqual(Math.random.name, 'random');
});

test('getState/setState branching is deterministic when re-seeded identically', () => {
  // The classic save-at-turn-N / explore-more-decisions pattern. Because the RNG
  // cursor is global (not part of the snapshot), each branch must be re-seeded
  // with the same seed so the two continuations consume an identical stream.
  BoP.seed(7); runScenario('taiwan_strait_2026', { seed: 7 });
  for (let i = 0; i < 3; i++) BoP.step();
  const snap = BoP.getState();

  BoP.seed(7); runScenario('taiwan_strait_2026', { seed: 7 });
  for (let i = 0; i < 3; i++) BoP.step();
  BoP.setState(snap);
  const endA = BoP.run().outcome;

  BoP.seed(7); runScenario('taiwan_strait_2026', { seed: 7 });
  for (let i = 0; i < 3; i++) BoP.step();
  BoP.setState(snap);
  const endB = BoP.run().outcome;

  assert.deepStrictEqual(endA, endB);
});

test('run() stops at game over before maxTurns', () => {
  // seed 3 reliably collapses two powers by turn 8 ("Cascading state failures"),
  // well before the default maxTurns of 20 — so an early stop is provable.
  BoP.seed(3); runScenario('taiwan_strait_2026', { seed: 3 });
  const r = BoP.run();
  assert.ok(r.outcome.turnsPlayed < 20,
    `expected early stop but run reached ${r.outcome.turnsPlayed} turns`);
  assert.strictEqual(r.outcome.result, 'lose');
  assert.strictEqual(r.outcome.reason, 'Cascading state failures. The international order has dissolved.');
  assert.ok(r.turns[r.turns.length - 1].gameOver, 'last turn should carry a gameOver');
});

test('run() caps turns at maxTurns when no decisive outcome', () => {
  // seed 1 with maxTurns 5 runs the full cap without a game-over (fallback
  // "Ran 5 turns."), so the cap is reached with a non-decisive outcome.
  BoP.seed(1); runScenario('taiwan_strait_2026', { seed: 1 });
  const r = BoP.run({ maxTurns: 5 });
  assert.strictEqual(r.outcome.turnsPlayed, 5,
    `expected exactly maxTurns, got ${r.outcome.turnsPlayed}`);
  assert.strictEqual(r.turns[r.turns.length - 1].gameOver, null,
    'no decisive outcome should mean the last turn has no gameOver');
  assert.match(r.outcome.reason, /^Ran 5 turns\./);
});

// ── Oracle: runBatch & init overrides ───────────────────────────────────────

console.log('\n=== Oracle: runBatch & init overrides ===');

test('runBatch returns one result per run with runId 0..n-1 and seeded RNG', () => {
  const batch = BoP.runBatch({ scenarioId: 'taiwan_strait_2026', runs: 3, seeds: [11, 22, 33] });
  assert.strictEqual(batch.length, 3);
  // deepStrictEqual would cross vm-realm arrays; compare per element instead.
  assert.deepStrictEqual(batch.map(b => b.runId).join(','), '0,1,2');
  assert.deepStrictEqual(batch.map(b => b.seed).join(','), '11,22,33');
  for (const r of batch) assert.ok(r.result && r.result.outcome, 'each run has a result');
});

test('paramSweep round-robins values across runs', () => {
  const batch = BoP.runBatch({
    scenarioId: 'taiwan_strait_2026', runs: 3, seeds: [1, 2, 3],
    paramSweep: { CN: { riskTolerance: [0.1, 0.9] } }
  });
  assert.deepStrictEqual(batch.map(b => b.params.CN.riskTolerance).join(','), '0.1,0.9,0.1');
});

test('unknown scenario throws a clear error', () => {
  assert.throws(() => runScenario('no_such_scenario'), /Unknown scenario/);
});

test('a scenario requiring a doctrine throws without one', () => {
  const requiresD = Object.entries(ctx.SCENARIOS_DATA).find(([, s]) => s.requiresDoctrine);
  if (!requiresD) { console.log('        (no doctrine-requiring scenario defined — skipped)'); return; }
  const id = requiresD[0];
  assert.throws(() => runScenario(id), /requires a doctrine/);
});

test('player override changes the player power', () => {
  runScenario('taiwan_strait_2026', { player: 'CN' });
  assert.strictEqual(BoP.getState().player, 'CN');
});

test('crisisOverrides set escalation level at init', () => {
  runScenario('taiwan_strait_2026', { crisisOverrides: { taiwan_military: { escalationLevel: 4 } } });
  const w = BoP.getState();
  const crisis = w.crises.find(c => c.id === 'taiwan_military');
  assert.strictEqual(crisis.escalationLevel, 4);
});

test('paramOverrides apply riskTolerance/patience at init', () => {
  runScenario('taiwan_strait_2026', { paramOverrides: { CN: { riskTolerance: 0.95, patience: 0.1 } } });
  const w = BoP.getState();
  assert.strictEqual(w.powers['CN'].riskTolerance, 0.95);
  assert.strictEqual(w.powers['CN'].patience, 0.1);
});

// ── AI: action-selection invariants ─────────────────────────────────────────

console.log('\n=== AI: decideTurn invariants ===');

test('decideTurn never exceeds the power action-point budget', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  for (const id of Object.keys(w.powers)) {
    ctx.AI.decideTurn(id, w); // consumes remaining AP
    const total = w.powers[id].memory[0].actions
      .reduce((sum, a) => sum + (ctx.Domains.getById(a.actionId)?.cost || 100), 0);
    assert.ok(total <= w.powers[id].actionPoints, `${id} spent ${total} > ${w.powers[id].actionPoints}`);
  }
});

test('decideTurn returns only valid registered action ids', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  const valid = new Map(ctx.Domains.getAll().map(a => [a.id, a]));
  for (const id of Object.keys(w.powers)) {
    const acts = ctx.AI.decideTurn(id, w);
    for (const a of acts) {
      assert.ok(valid.has(a.actionId), `${id} chose unknown action ${a.actionId}`);
      assert.strictEqual(a.actor, id);
    }
  }
});

test('decideTurn sets actionPointsRemaining to zero and records memory', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  const id = 'US';
  ctx.AI.decideTurn(id, w);
  assert.strictEqual(w.powers[id].actionPointsRemaining, 0);
  assert.ok(Array.isArray(w.powers[id].memory));
  assert.strictEqual(w.powers[id].memory[0].turn, w.turn);
});

test('a patient power conserves actions in a low-crisis turn', () => {
  runScenario('taiwan_strait_2026');
  const w = ctx.State.get();
  // IN has patience 0.7 and (in taiwan_strait_2026) is involved in no crisis, so
  // its crisisLevel is 0 — the patience-hoarding branch in ai.js is active on a
  // calm board. Assert the AP actually available is the hoarded budget, proving
  // conservation, not just the (always-true) total <= actionPoints cap.
  const power = w.powers['IN'];
  const hoardedAP = Math.floor(power.actionPoints * (1 - power.patience * 0.3));
  // Reset remaining so decideTurn decides from a full hoardable budget.
  power.actionPointsRemaining = power.actionPoints;
  const acts = ctx.AI.decideTurn('IN', w);
  const total = acts.reduce((sum, a) => sum + (ctx.Domains.getById(a.actionId)?.cost || 0), 0);
  assert.ok(total <= hoardedAP,
    `patient power spent ${total} > hoarded budget ${hoardedAP}`);
  assert.ok(hoardedAP < power.actionPoints,
    `hoarded budget ${hoardedAP} should be below full ${power.actionPoints}`);
});

// ── summary ─────────────────────────────────────────────────────────────────

console.log('\n──────────────────────────────────────────────────');
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
