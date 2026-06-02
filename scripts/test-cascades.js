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
  world.crises[0].escalationLevel = 2; // crisis 0: military, involved [CN, US]
  Math.random = () => 0.1; // < 0.15 decay threshold, so an unprotected crisis would decay
  // military_exercises (military, untargeted, escalationDelta 0) by US — findRelevantCrisis
  // primaryMatch links it to crisis 0 (domain military + US involved), protecting it from decay.
  ctx.Cascades.resolve([act('military_exercises', 'US')], world);
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

// ── new financial domain actions ──────────────────────────────────────────────

console.log('\n=== new financial domain actions ===');

function makeFinancialWorld() {
  const scenario = ctx.SCENARIOS_DATA['financial_contagion_2026'];
  ctx.State.init(ctx.POWERS_DATA, scenario);
  return ctx.State.get();
}

test('emergency_swap_lines boosts target economic (1st order)', () => {
  const world = makeWorld();
  const before = world.powers['CN'].trueState.economic;
  Math.random = () => 0.99; // suppress all 2nd-order effects
  ctx.Cascades.resolve([act('emergency_swap_lines', 'US', 'CN')], world);
  const after = world.powers['CN'].trueState.economic;
  assert.ok(after > before, `expected CN economic to increase, got ${before} → ${after}`);
});

test('sovereign_debt_restructuring boosts target economic+domestic, costs self economic (1st order)', () => {
  const world = makeWorld();
  const cnEconBefore = world.powers['CN'].trueState.economic;
  const cnDomBefore = world.powers['CN'].trueState.domestic;
  const usEconBefore = world.powers['US'].trueState.economic;
  Math.random = () => 0.99; // suppress all 2nd-order effects
  ctx.Cascades.resolve([act('sovereign_debt_restructuring', 'US', 'CN')], world);
  assert.ok(world.powers['CN'].trueState.economic > cnEconBefore,
    `expected CN economic to increase, got ${cnEconBefore} → ${world.powers['CN'].trueState.economic}`);
  assert.ok(world.powers['CN'].trueState.domestic > cnDomBefore,
    `expected CN domestic to increase, got ${cnDomBefore} → ${world.powers['CN'].trueState.domestic}`);
  assert.ok(world.powers['US'].trueState.economic < usEconBefore,
    `expected US economic to decrease, got ${usEconBefore} → ${world.powers['US'].trueState.economic}`);
});

// ── debt_spiral (positive) ────────────────────────────────────────────────────

console.log('\n=== debt_spiral (positive) ===');

test('debt_spiral fires: financial_fragmentation + 2 weak powers + global_finance crisis', () => {
  const world = makeFinancialWorld(); // clearing_network_failure at L2 in global_finance region
  world.activeSystemicEvents.push('financial_fragmentation');
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  Math.random = () => 0.99;
  ctx.Cascades.resolve([], world);
  assert.ok(world.activeSystemicEvents.includes('debt_spiral'),
    `expected debt_spiral, got: ${JSON.stringify(world.activeSystemicEvents)}`);
});

test('debt_spiral grinds weakened economies each turn while active', () => {
  const world = makeFinancialWorld();
  world.activeSystemicEvents.push('financial_fragmentation');
  world.activeSystemicEvents.push('debt_spiral'); // seed manually to isolate grind
  set(world, 'EU', { economic: 50 }); // < 55 grind threshold
  const euEconBefore = world.powers['EU'].trueState.economic;
  Math.random = () => 0.99;
  ctx.Cascades.resolve([], world);
  assert.ok(world.powers['EU'].trueState.economic < euEconBefore,
    `expected EU economic to drop from grind, got ${euEconBefore} → ${world.powers['EU'].trueState.economic}`);
});

test('debt_spiral lifts when global_finance crises cool and economies recover', () => {
  const world = makeFinancialWorld();
  world.activeSystemicEvents.push('debt_spiral');
  // Cool all global_finance crises below the L2 grind threshold
  for (const c of world.crises) { if (c.region === 'global_finance') c.escalationLevel = 1; }
  // Restore all powers above the weak threshold
  for (const p of Object.values(world.powers)) p.trueState.economic = 60;
  Math.random = () => 0.99; // prevent crisis decay
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('debt_spiral'),
    `expected debt_spiral to lift, still active`);
});

// ── debt_spiral (negative) ────────────────────────────────────────────────────

console.log('\n=== debt_spiral (negative) ===');

test('debt_spiral does NOT fire without a global_finance crisis (taiwan scenario)', () => {
  const world = makeWorld(); // taiwan_strait_2026 — no global_finance region crises
  world.activeSystemicEvents.push('financial_fragmentation');
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  set(world, 'EU', { economic: 30 }); // 3 powers critically weak — other conditions fully met
  Math.random = () => 0.99;
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('debt_spiral'),
    `debt_spiral should NOT fire in non-financial scenario (no global_finance crisis)`);
});

test('debt_spiral does NOT fire with only 1 critically weak power', () => {
  const world = makeFinancialWorld();
  world.activeSystemicEvents.push('financial_fragmentation');
  for (const p of Object.values(world.powers)) p.trueState.economic = 60;
  set(world, 'US', { economic: 30 }); // only 1 power below 35
  Math.random = () => 0.99;
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('debt_spiral'),
    `debt_spiral should NOT fire with criticalEconCount < 2`);
});

// ── debt_spiral idempotency ───────────────────────────────────────────────────

console.log('\n=== debt_spiral idempotency ===');

test('debt_spiral seeds only once across two resolve calls', () => {
  const world = makeFinancialWorld();
  world.activeSystemicEvents.push('financial_fragmentation');
  set(world, 'US', { economic: 30 });
  set(world, 'CN', { economic: 30 });
  Math.random = () => 0.99;
  ctx.Cascades.resolve([], world);
  const countAfterFirst = world.activeSystemicEvents.filter(e => e === 'debt_spiral').length;
  ctx.Cascades.resolve([], world);
  const countAfterSecond = world.activeSystemicEvents.filter(e => e === 'debt_spiral').length;
  assert.strictEqual(countAfterFirst, 1, `expected exactly 1 debt_spiral after first call, got ${countAfterFirst}`);
  assert.strictEqual(countAfterSecond, 1, `expected exactly 1 debt_spiral after second call, got ${countAfterSecond}`);
});

// ── enhanced epistemic model (v2.10.0) ────────────────────────────────────────

console.log('\n=== enhanced epistemic model ===');

test('decayIntelQuality pulls quality toward the floor', () => {
  const world = makeWorld();
  world.intelQuality.US.CN = 0.80;
  ctx.State.decayIntelQuality();
  assert.ok(world.intelQuality.US.CN < 0.80, `expected decay below 0.80, got ${world.intelQuality.US.CN}`);
  assert.ok(world.intelQuality.US.CN > 0.15, `should not undershoot the floor in one step, got ${world.intelQuality.US.CN}`);
});

test('decayIntelQuality never drops below the floor', () => {
  const world = makeWorld();
  world.intelQuality.US.CN = 0.15; // already at floor
  for (let i = 0; i < 50; i++) ctx.State.decayIntelQuality();
  assert.ok(world.intelQuality.US.CN >= 0.15 - 1e-9, `floor breached: ${world.intelQuality.US.CN}`);
});

test('refreshIntel restores toward base, capped at base', () => {
  const world = makeWorld();
  world.intelQualityBase.US.CN = 0.80;
  world.intelQuality.US.CN = 0.30;
  ctx.State.refreshIntel('US', 'CN', 0.5);
  assert.ok(world.intelQuality.US.CN > 0.30, 'refresh should raise quality');
  ctx.State.refreshIntel('US', 'CN', 1.0); // close the whole gap
  assert.ok(world.intelQuality.US.CN <= 0.80 + 1e-9, `must not exceed base, got ${world.intelQuality.US.CN}`);
  assert.ok(Math.abs(world.intelQuality.US.CN - 0.80) < 1e-9, `gain 1.0 should reach base, got ${world.intelQuality.US.CN}`);
});

test('intel-collection action refreshes quality via the cascade', () => {
  const world = makeWorld();
  world.intelQualityBase.US.CN = 0.80;
  world.intelQuality.US.CN = 0.30;
  Math.random = () => 0.99; // suppress probabilistic 2nd-order effects
  ctx.Cascades.resolve([act('cyber_infrastructure_probe', 'US', 'CN')], world);
  assert.ok(world.intelQuality.US.CN > 0.30, `probe should refresh US→CN intel, got ${world.intelQuality.US.CN}`);
});

test('low-quality perception accumulates divergence from truth', () => {
  const world = makeWorld();
  world.intelQuality.US.CN = 0.15; // near-blind
  world.powers.US.perceivedBy.CN.economic = world.powers.CN.trueState.economic; // start exactly on truth
  Math.random = () => 0.99; // deterministic positive noise each turn
  for (let i = 0; i < 8; i++) ctx.State.driftPerceptions();
  const divergence = Math.abs(world.powers.US.perceivedBy.CN.economic - world.powers.CN.trueState.economic);
  assert.ok(divergence > 5, `expected accumulated divergence, got ${divergence}`);
});

test('high-quality perception converges tightly on truth', () => {
  const world = makeWorld();
  world.intelQuality.US.CN = 0.95;
  world.powers.US.perceivedBy.CN.economic = world.powers.CN.trueState.economic - 30; // start far off
  Math.random = () => 0.5; // zero noise (0.5*2-1 = 0)
  for (let i = 0; i < 20; i++) ctx.State.driftPerceptions();
  const divergence = Math.abs(world.powers.US.perceivedBy.CN.economic - world.powers.CN.trueState.economic);
  // converges from 30 off to within a few points (integer-rounded drift stalls
  // once the per-turn step rounds to zero — a small, pre-existing asymptote)
  assert.ok(divergence <= 4, `expected convergence to truth, got divergence ${divergence}`);
});

test('decay mutates the live matrix, not shared scenario data', () => {
  const scenario = ctx.SCENARIOS_DATA['taiwan_strait_2026'];
  const before = scenario.intelQuality.US.CN;
  ctx.State.init(ctx.POWERS_DATA, scenario);
  const world = ctx.State.get();
  for (let i = 0; i < 20; i++) ctx.State.decayIntelQuality();
  assert.ok(world.intelQuality.US.CN < before, 'live matrix should have decayed');
  assert.strictEqual(scenario.intelQuality.US.CN, before, 'scenario data must not be mutated by decay');
});

// ── technology development track (v2.11.0) ────────────────────────────────────

console.log('\n=== technology development track ===');

test('R&D program raises tech tier and queues a delayed capability gain', () => {
  const world = makeWorld();
  assert.strictEqual(world.powers.US.techLevel.military, 0, 'tier should start at 0');
  Math.random = () => 0.99;
  ctx.Cascades.resolve([act('rd_military', 'US')], world);
  assert.strictEqual(world.powers.US.techLevel.military, 1, 'tier should increment to 1');
  const queued = (world.pendingDelayedEffects || []).find(e => e.effect.self && e.effect.self.military != null);
  assert.ok(queued, 'a delayed military gain should be queued');
  assert.strictEqual(queued.fireOnTurn, world.turn + 3, 'military program matures after a 3-turn lead time');
});

test('R&D capability matures into a stat gain after the lead time', () => {
  const world = makeWorld();
  set(world, 'US', { military: 50 });
  Math.random = () => 0.99; // suppress any probabilistic systemic effects
  ctx.Cascades.resolve([act('rd_military', 'US')], world); // launch at turn 1
  assert.strictEqual(world.powers.US.trueState.military, 50, 'no immediate military gain at launch');
  ctx.State.advanceTurn(); ctx.State.advanceTurn(); ctx.State.advanceTurn(); // turn 1 → 4
  const before = world.powers.US.trueState.military;
  ctx.Cascades.resolve([], world); // drains the matured effect at turn 4
  assert.strictEqual(world.powers.US.trueState.military, before + 6, `tier-1 program should mature to +6, got +${world.powers.US.trueState.military - before}`);
});

test('sustained R&D compounds: tier-2 gain exceeds tier-1', () => {
  const world = makeWorld();
  Math.random = () => 0.99;
  ctx.Cascades.resolve([act('rd_cyber', 'US')], world);
  const firstGain = world.pendingDelayedEffects.filter(e => e.effect.self && e.effect.self.cyber != null).pop().effect.self.cyber;
  ctx.Cascades.resolve([act('rd_cyber', 'US')], world);
  const cyberQueued = world.pendingDelayedEffects.filter(e => e.effect.self && e.effect.self.cyber != null);
  const secondGain = cyberQueued[cyberQueued.length - 1].effect.self.cyber;
  assert.strictEqual(world.powers.US.techLevel.cyber, 2, 'two programs should reach tier 2');
  assert.ok(secondGain > firstGain, `tier-2 gain (${secondGain}) should exceed tier-1 (${firstGain})`);
});

// ── broadened NPC domain pool (v2.12.0) ───────────────────────────────────────
// NPCs now pool + select the technology (R&D) domain and the other extended
// priority domains, not just their five-domain core. Positive: the rdProgram
// scoring branch fires for a patient, solvent, gap-facing tech-power and targets
// the weak capability. Negative: it stays off for non-tech personas, mid-crisis,
// when broke, or with no capability gap — and the broadening does not displace
// each persona's top-3 identity.

console.log('\n=== broadened NPC domain pool (v2.12.0) ===');

// ── positive (the pool broadening fires) ──────────────────────────────────────
test('a patient NPC invests in R&D to close a capability gap on a calm board', () => {
  const world = makeWorld();
  for (const c of world.crises) c.escalationLevel = 0; // calm: no active crisis
  set(world, 'CN', { cyber: 20 });                     // CN (patience 0.9) now has a cyber gap
  Math.random = () => 0.5;                              // pin noise term to zero
  const decided = ctx.AI.decideTurn('CN', world);
  assert.ok(decided.some(a => a.actionId === 'rd_cyber'),
    `CN should invest in cyber R&D to close the gap, got ${decided.map(a => a.actionId).join(',')}`);
});

test('R&D targets the lagging capability, not a healthy one', () => {
  const world = makeWorld();
  for (const c of world.crises) c.escalationLevel = 0;
  set(world, 'CN', { cyber: 20, space: 80, military: 70 }); // only cyber is below the 50 floor
  Math.random = () => 0.5;
  const ids = ctx.AI.decideTurn('CN', world).map(a => a.actionId);
  assert.ok(ids.includes('rd_cyber'),
    `CN should fund the weak capability (cyber), got ${ids.join(',')}`);
  assert.ok(!ids.includes('rd_space'),
    `CN should not fund an already-healthy capability (space), got ${ids.join(',')}`);
});

// ── negative (the pool broadening stays off) ──────────────────────────────────
test('NPCs without a technology priority never select R&D', () => {
  const world = makeWorld();
  for (const c of world.crises) c.escalationLevel = 0;
  Math.random = () => 0.5;
  for (const id of ['RU', 'GB']) { // RU/GB personas carry no `technology` domain
    if (!world.powers[id]) continue;
    const decided = ctx.AI.decideTurn(id, world);
    assert.ok(!decided.some(a => a.actionId.startsWith('rd_')),
      `${id} has no technology priority and must not pick R&D, got ${decided.map(a => a.actionId).join(',')}`);
  }
});

test('NPCs do not start R&D mid-crisis or when the economy is too weak', () => {
  Math.random = () => 0.5;
  // mid-crisis: CN is in the L3 trade war on the default board → long-term R&D suppressed
  const w1 = makeWorld();
  assert.ok(!ctx.AI.decideTurn('CN', w1).some(a => a.actionId.startsWith('rd_')),
    'CN should not launch an R&D program while in an active high-level crisis');
  // broke: a calm board with a depleted treasury → cannot absorb the budget hit
  const w2 = makeWorld();
  for (const c of w2.crises) c.escalationLevel = 0;
  set(w2, 'CN', { economic: 20, cyber: 20 });
  assert.ok(!ctx.AI.decideTurn('CN', w2).some(a => a.actionId.startsWith('rd_')),
    'CN should not fund R&D when the economy is too weak to absorb the cost');
});

test('a tech-power does not proactively fund R&D with no capability gap', () => {
  const world = makeWorld();
  for (const c of world.crises) c.escalationLevel = 0;
  set(world, 'CN', { cyber: 75, space: 75, military: 75, economic: 75, info: 75 }); // every stat healthy
  Math.random = () => 0.5;
  const ids = ctx.AI.decideTurn('CN', world).map(a => a.actionId);
  assert.ok(!ids.some(id => id.startsWith('rd_')),
    `CN should not spend a calm turn on R&D when no capability lags, got ${ids.join(',')}`);
});

test('broadening priorityDomains does not displace a persona\'s core identity', () => {
  const world = makeWorld();
  for (const c of world.crises) c.escalationLevel = 0;
  set(world, 'CN', { cyber: 20 }); // a reason to also invest in R&D this turn
  Math.random = () => 0.5;
  const ids = ctx.AI.decideTurn('CN', world).map(a => a.actionId);
  const domains = ids.map(id => { const d = ctx.Domains.getById(id); return d && d.domain; });
  assert.ok(domains.includes('economic'),
    `CN's #1 priority domain (economic) should still drive its turn, got domains ${domains.join(',')}`);
});

// ── summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
