#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { loadEngine } = require('./load-engine');

const ctx = loadEngine();

// ── harness ───────────────────────────────────────────────────────────────────

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
  }
}

function makeWorld() {
  const scenario = ctx.SCENARIOS_DATA['taiwan_strait_2026'];
  ctx.State.init(ctx.POWERS_DATA, scenario);
  return ctx.State.get();
}

function act(actionId, actor, target = null) {
  return { actionId, actor, target };
}

function set(world, powerId, patch) {
  Object.assign(world.powers[powerId].trueState, patch);
}

// taiwan_strait_2026 crises (indices):
//   0 — PLA mobilization  (CN, US)  escalation 2
//   1 — trade war         (US, CN)  escalation 3
//   2 — Baltic cyber probe (RU, EU) escalation 1
// IN and GB are standard powers but not in any Taiwan crisis.

// ── 2nd-order effect keys ─────────────────────────────────────────────────────

console.log('\n=== 2nd-order effect keys ===');

test('ally_relationship fires (force_withdrawal singular key)', () => {
  const world = makeWorld();
  const before = world.powers['US'].relationships['EU'];
  Math.random = () => 0.1; // prob 0.30 fires (0.1 < 0.30)
  ctx.Cascades.resolve([act('force_withdrawal', 'US')], world);
  const after = world.powers['US'].relationships['EU'];
  assert.ok(after < before, `expected US→EU to decrease, got ${before} → ${after}`);
});

test('relationship_ally fires (military_exercises alternate key)', () => {
  const world = makeWorld();
  const before = world.powers['US'].relationships['EU'];
  Math.random = () => 0.1; // prob 0.25 fires
  ctx.Cascades.resolve([act('military_exercises', 'US')], world);
  const after = world.powers['US'].relationships['EU'];
  assert.ok(after > before, `expected US→EU to increase, got ${before} → ${after}`);
});

test('ally_relationships fires (multilateral_forum plural key)', () => {
  const world = makeWorld();
  const before = world.powers['US'].relationships['EU'];
  Math.random = () => 0.1; // prob 0.50 fires
  ctx.Cascades.resolve([act('multilateral_forum', 'US')], world);
  const after = world.powers['US'].relationships['EU'];
  assert.ok(after > before, `expected US→EU to increase, got ${before} → ${after}`);
});

test('systemic_risk pushes pressure marker (financial_pressure)', () => {
  const world = makeWorld();
  Math.random = () => 0.1; // prob 0.30 fires
  ctx.Cascades.resolve([act('financial_pressure', 'US', 'CN')], world);
  assert.ok(
    world.activeSystemicEvents.includes('financial_fragmentation_pressure'),
    `activeSystemicEvents: ${JSON.stringify(world.activeSystemicEvents)}`
  );
});

test('target_perception_distorted calls Epistemic (plant_leak)', () => {
  const world = makeWorld();
  Math.random = () => 0.1; // prob 0.55 fires
  ctx.Cascades.resolve([act('plant_leak', 'US', 'CN')], world);
  const covertEntry = world.log.find(e => e.type === 'epistemic' && e.text.includes('[COVERT]'));
  assert.ok(covertEntry, 'expected [COVERT] epistemic log entry from Epistemic.applyDisinformation');
});

// ── findRelevantCrisis fallback ────────────────────────────────────────────────

console.log('\n=== findRelevantCrisis fallback ===');

test('no spurious escalation when actors not in any crisis (IN→GB)', () => {
  const world = makeWorld();
  const levels = world.crises.map(c => c.escalationLevel);
  Math.random = () => 0.99; // no probabilistic effects fire
  ctx.Cascades.resolve([act('deploy_forces', 'IN', 'GB')], world);
  for (let i = 0; i < world.crises.length; i++) {
    assert.strictEqual(
      world.crises[i].escalationLevel, levels[i],
      `crisis ${i} (${world.crises[i].name}): ${levels[i]} → ${world.crises[i].escalationLevel}`
    );
  }
});

// ── financial_fragmentation trigger ──────────────────────────────────────────

console.log('\n=== financial_fragmentation trigger ===');

test('fires when 3+ powers have economic < 40', () => {
  const world = makeWorld();
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  set(world, 'EU', { economic: 30 });
  const econBefore = world.powers['US'].trueState.economic;
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('financial_fragmentation'),
    `expected financial_fragmentation, got: ${JSON.stringify(world.activeSystemicEvents)}`);
  assert.ok(world.powers['US'].trueState.economic < econBefore,
    'expected economic to drop after fragmentation');
});

test('fires on pressure marker alone (only 2 powers low)', () => {
  const world = makeWorld();
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  world.activeSystemicEvents.push('financial_fragmentation_pressure');
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('financial_fragmentation'),
    'expected financial_fragmentation from pressure marker');
});

test('does NOT fire with only 2 powers low and no marker', () => {
  const world = makeWorld();
  // RU starts at 38 — reset all economics to 80 before selectively lowering 2
  for (const p of Object.values(world.powers)) p.trueState.economic = 80;
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('financial_fragmentation'),
    'should NOT fire with only 2 powers below threshold');
});

// ── new systemic thresholds (positive) ───────────────────────────────────────

console.log('\n=== new thresholds (positive) ===');

test('epistemic_cascade fires when 3+ powers have info < 30', () => {
  const world = makeWorld();
  set(world, 'US', { info: 25 });
  set(world, 'CN', { info: 25 });
  set(world, 'EU', { info: 25 });
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('epistemic_cascade'),
    `expected epistemic_cascade, got: ${JSON.stringify(world.activeSystemicEvents)}`);
});

test('communications_blackout fires when 2+ powers have cyber < 20', () => {
  const world = makeWorld();
  set(world, 'US', { cyber: 15 });
  set(world, 'CN', { cyber: 15 });
  const milBefore = world.powers['EU'].trueState.military;
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('communications_blackout'),
    `expected communications_blackout, got: ${JSON.stringify(world.activeSystemicEvents)}`);
  assert.ok(world.powers['EU'].trueState.military < milBefore,
    'expected EU military to drop from C4ISR degradation');
});

test('nuclear_hair_trigger fires when crisis escalation >= 4 with nuclear powers', () => {
  const world = makeWorld();
  // Keep crisis 1 at level 2 so the two east_asia crises don't merge before thresholds run
  world.crises[0].escalationLevel = 4; // taiwan_military (CN+US)
  world.crises[1].escalationLevel = 2;
  Math.random = () => 0.9; // prevent crisis decay from dropping level before systemic check
  const taiwanCrisis = world.crises.find(c => c.id === 'taiwan_military');
  const relBefore = world.powers['US'].relationships['CN'];
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('nuclear_hair_trigger'),
    `expected nuclear_hair_trigger, got: ${JSON.stringify(world.activeSystemicEvents)}`);
  assert.strictEqual(taiwanCrisis.escalationLevel, 5,
    `expected taiwan_military to escalate to 5, got ${taiwanCrisis.escalationLevel}`);
  assert.ok(world.powers['US'].relationships['CN'] < relBefore,
    `expected US→CN to deteriorate, got ${relBefore} → ${world.powers['US'].relationships['CN']}`);
});

test('internet_balkanization fires on 2+ cyber probes in one turn', () => {
  const world = makeWorld();
  Math.random = () => 0.1;
  const cyberBefore = world.powers['EU'].trueState.cyber;
  ctx.Cascades.resolve(
    [act('cyber_infrastructure_probe', 'US', 'CN'), act('cyber_infrastructure_probe', 'CN', 'US')],
    world
  );
  assert.ok(world.activeSystemicEvents.includes('internet_balkanization'),
    `expected internet_balkanization, got: ${JSON.stringify(world.activeSystemicEvents)}`);
  assert.ok(world.powers['EU'].trueState.cyber < cyberBefore,
    `expected EU cyber to drop from balkanization, got ${cyberBefore} → ${world.powers['EU'].trueState.cyber}`);
});

// ── new systemic thresholds (negative) ───────────────────────────────────────

console.log('\n=== new thresholds (negative) ===');

test('epistemic_cascade does NOT fire with only 2 powers low', () => {
  const world = makeWorld();
  set(world, 'US', { info: 25 });
  set(world, 'CN', { info: 25 });
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('epistemic_cascade'),
    'should NOT fire with only 2 powers below threshold');
});

test('communications_blackout does NOT fire with only 1 power low', () => {
  const world = makeWorld();
  set(world, 'US', { cyber: 15 });
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('communications_blackout'),
    'should NOT fire with only 1 power below threshold');
});

test('nuclear_hair_trigger does NOT fire when crisis at escalation 3', () => {
  const world = makeWorld();
  // Depress crisis 1 so the two east_asia crises don't merge to level 4
  world.crises[0].escalationLevel = 3;
  world.crises[1].escalationLevel = 2;
  Math.random = () => 0.9; // prevent decay
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('nuclear_hair_trigger'),
    'should NOT fire at escalation 3 (needs >= 4)');
});

test('internet_balkanization does NOT fire with only 1 cyber probe', () => {
  const world = makeWorld();
  Math.random = () => 0.1;
  ctx.Cascades.resolve([act('cyber_infrastructure_probe', 'US', 'CN')], world);
  assert.ok(!world.activeSystemicEvents.includes('internet_balkanization'),
    'should NOT fire with only 1 probe');
});

// ── crisis decay ──────────────────────────────────────────────────────────────

console.log('\n=== crisis decay ===');

test('crisis decays when untouched this turn', () => {
  const world = makeWorld();
  world.crises[2].escalationLevel = 2; // Baltic crisis (RU+EU), not touched by IN→GB
  Math.random = () => 0.1; // 0.1 < 0.15 decay threshold → decays
  ctx.Cascades.resolve([act('bilateral_negotiation', 'IN', 'GB')], world);
  assert.strictEqual(world.crises[2].escalationLevel, 1,
    `expected Baltic crisis to decay to 1, got ${world.crises[2].escalationLevel}`);
});

test('crisis does NOT decay when its actor took an action this turn', () => {
  const world = makeWorld();
  world.crises[0].escalationLevel = 2; // CN+US crisis, US acting
  Math.random = () => 0.1;
  // coalition_shoring by US — findRelevantCrisis finds crisis 0 (US involved), protects it
  ctx.Cascades.resolve([act('coalition_shoring', 'US')], world);
  assert.strictEqual(world.crises[0].escalationLevel, 2,
    `crisis 0 should be protected from decay, got ${world.crises[0].escalationLevel}`);
});

// ── idempotency ───────────────────────────────────────────────────────────────

console.log('\n=== idempotency ===');

test('financial_fragmentation fires only once across two resolve calls', () => {
  const world = makeWorld();
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  set(world, 'EU', { economic: 30 });
  ctx.Cascades.resolve([], world);
  const econAfterFirst = world.powers['RU'].trueState.economic;
  ctx.Cascades.resolve([], world);
  const econAfterSecond = world.powers['RU'].trueState.economic;
  assert.strictEqual(econAfterFirst, econAfterSecond,
    `RU economic dropped again on second call: ${econAfterFirst} → ${econAfterSecond}`);
});

test('nuclear_hair_trigger fires only once across two resolve calls', () => {
  const world = makeWorld();
  world.crises[0].escalationLevel = 4;
  world.crises[1].escalationLevel = 2; // prevent east_asia+east_asia merge
  Math.random = () => 0.9; // prevent decay
  const taiwanCrisis = world.crises.find(c => c.id === 'taiwan_military');
  ctx.Cascades.resolve([], world);
  assert.strictEqual(taiwanCrisis.escalationLevel, 5,
    `expected 5 after first call, got ${taiwanCrisis.escalationLevel}`);
  ctx.Cascades.resolve([], world);
  assert.strictEqual(taiwanCrisis.escalationLevel, 5,
    'crisis should not escalate beyond 5 on second resolve');
});

// ── summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
