#!/usr/bin/env node
/**
 * Feature-family contracts for mechanics that the cascade/engine/analytics
 * suites never pinned: AOM / Sovereignty Void, EMP, bio, Kessler, urban
 * quagmire, compound merges, doctrine win/fail, strategic posture.
 *
 * Pins current engine semantics. JUCHE t_rat=45 closes the 90s DPRK window.
 */
'use strict';

const assert = require('assert');
const { loadEngine } = require('./load-engine');

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

function act(actionId, actor, target = null) {
  return { actionId, actor, target };
}

function setStat(world, powerId, patch) {
  Object.assign(world.powers[powerId].trueState, patch);
}

function quietRng() {
  // Suppress probabilistic 2nd-order rolls (all current probs are ≤ 0.70).
  Math.random = () => 0.99;
}

function makeTaiwan() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.taiwan_strait_2026);
  return ctx.State.get();
}

function makeSv(doctrineId) {
  BoP.init('sovereignty_void_2026', { doctrine: doctrineId, seed: 1 });
  return ctx.State.get();
}

function makeOrbital() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.orbital_warfare_2026);
  return ctx.State.get();
}

function makeMegacity() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.megacity_siege_2026);
  return ctx.State.get();
}

function makeIran() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.iran_nuclear_2026);
  return ctx.State.get();
}

function makeFinancial() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.financial_contagion_2026);
  return ctx.State.get();
}

function makeScs() {
  ctx.State.init(ctx.POWERS_DATA, ctx.SCENARIOS_DATA.south_china_sea_2026);
  return ctx.State.get();
}

function crisis(world, id) {
  return world.crises.find(c => c.id === id);
}

function hasLog(log, snippet) {
  return log.some(e => (e.text || '').includes(snippet));
}

// ── B1. AOM / Sovereignty Void ─────────────────────────────────────────────

console.log('\n=== AOM / Sovereignty Void ===');

test('MAGA (t_rat 180) on hypersonic_taiwan (120s) voids and nullifies BPI', () => {
  const world = makeSv('MAGA');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 1;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  const milBefore = world.powers.US.trueState.military;
  const actions = [act('boost_phase_intercept', 'US', 'CN')];
  const log = ctx.Cascades.resolve(actions, world);
  assert.ok(hasLog(log, '[SOVEREIGNTY VOID]'), `log: ${log.map(e => e.text).join(' | ')}`);
  assert.ok(hasLog(log, 't_rat (180s) > t_event (120s)'), 'expected 180>120 in void text');
  assert.strictEqual(actions.length, 0, 'BPI should be spliced out');
  assert.strictEqual(world.powers.US.trueState.military, milBefore, 'spliced BPI must not apply 1st-order');
  assert.ok(world.activeSystemicEvents.includes('sovereignty_void_active'));
  assert.strictEqual(crisis(world, 'hypersonic_taiwan').escalationLevel, 3, 'void +2');
});

test('MING (t_rat 120) closes the 120s hypersonic window — no void', () => {
  const world = makeSv('MING');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 1;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  const log = ctx.Cascades.resolve([act('boost_phase_intercept', 'CN', 'US')], world);
  assert.ok(!hasLog(log, '[SOVEREIGNTY VOID]'), `unexpected void: ${log.map(e => e.text).join(' | ')}`);
});

test('JUCHE (t_rat 45) closes the 90s DPRK window — no void', () => {
  const world = makeSv('JUCHE');
  quietRng();
  crisis(world, 'boost_phase_north_korea').escalationLevel = 1;
  crisis(world, 'hypersonic_taiwan').escalationLevel = 0;
  const log = ctx.Cascades.resolve([act('boost_phase_intercept', 'DPRK', 'US')], world);
  assert.ok(!hasLog(log, '[SOVEREIGNTY VOID]'),
    `JUCHE 45s should close 90s; got: ${log.map(e => e.text).join(' | ')}`);
});

test('c2_blackout +30s makes MING miss the 120s window', () => {
  const world = makeSv('MING');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 1;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  crisis(world, 'c2_blackout').escalationLevel = 1;
  const log = ctx.Cascades.resolve([act('boost_phase_intercept', 'CN', 'US')], world);
  assert.ok(hasLog(log, '[SOVEREIGNTY VOID]'), 'expected void after +30s penalty');
  assert.ok(hasLog(log, 't_rat (150s) > t_event (120s)'), 'expected 120+30=150');
});

test('pre_delegate_authority sets autonomyDelegated and applies the Rice mask', () => {
  const world = makeSv('MAGA');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 0;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  ctx.Cascades.resolve([act('pre_delegate_authority', 'US')], world);
  assert.strictEqual(world.autonomyDelegated.US, true);
  assert.ok((world.autonomyMasks.US || []).includes('military'),
    `masks: ${JSON.stringify(world.autonomyMasks)}`);
  assert.strictEqual(ctx.Epistemic.getPerceivedValue('CN', 'US', 'military', world), null);
  assert.strictEqual(crisis(world, 'policy_review_tribunal').escalationLevel, 1);
});

test('delegated gate logs AUTONOMOUS ENGAGEMENT and does not splice BPI', () => {
  const world = makeSv('MAGA');
  quietRng();
  world.autonomyDelegated.US = true;
  crisis(world, 'hypersonic_taiwan').escalationLevel = 1;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  const milBefore = world.powers.US.trueState.military;
  const actions = [act('boost_phase_intercept', 'US', 'CN')];
  const log = ctx.Cascades.resolve(actions, world);
  assert.ok(hasLog(log, '[AUTONOMOUS ENGAGEMENT]'), `log: ${log.map(e => e.text).join(' | ')}`);
  assert.ok(!hasLog(log, '[SOVEREIGNTY VOID]'));
  assert.strictEqual(actions.length, 1, 'BPI must remain');
  assert.ok(world.powers.US.trueState.military < milBefore, 'BPI 1st-order should apply');
  assert.strictEqual(crisis(world, 'hypersonic_taiwan').escalationLevel, 0, 'delegated void is -1');
});

test('revert_midcourse_defense clears delegation and lifts the Rice mask', () => {
  const world = makeSv('MAGA');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 0;
  ctx.Cascades.resolve([act('pre_delegate_authority', 'US')], world);
  assert.strictEqual(world.autonomyDelegated.US, true);
  ctx.Cascades.resolve([act('revert_midcourse_defense', 'US')], world);
  assert.ok(!world.autonomyDelegated.US, 'delegation should be cleared');
  assert.ok(!world.autonomyMasks.US, 'Rice mask should lift');
  assert.strictEqual(typeof ctx.Epistemic.getPerceivedValue('CN', 'US', 'military', world), 'number');
  assert.strictEqual(world.bpiReverted, true);
});

test('bpiReverted skips the latency gate for the next resolve', () => {
  const world = makeSv('MAGA');
  quietRng();
  crisis(world, 'hypersonic_taiwan').escalationLevel = 1;
  crisis(world, 'boost_phase_north_korea').escalationLevel = 0;
  world.bpiReverted = true;
  const before = crisis(world, 'hypersonic_taiwan').escalationLevel;
  const log = ctx.Cascades.resolve([], world);
  assert.ok(!hasLog(log, '[SOVEREIGNTY VOID]'));
  assert.ok(!hasLog(log, '[AUTONOMOUS ENGAGEMENT]'));
  assert.strictEqual(world.bpiReverted, false, 'one-shot flag must reset');
  assert.strictEqual(crisis(world, 'hypersonic_taiwan').escalationLevel, before);
});

test('NPCs never receive playerOnly AOM actions', () => {
  const world = makeSv('MAGA');
  const ids = ctx.AI.decideTurn('CN', world).map(a => a.actionId);
  assert.ok(!ids.includes('pre_delegate_authority'), `CN picked ${ids.join(',')}`);
  assert.ok(!ids.includes('revert_midcourse_defense'), `CN picked ${ids.join(',')}`);
});

test('player can inject pre_delegate_authority via BoP.step', () => {
  BoP.init('sovereignty_void_2026', { doctrine: 'MAGA', seed: 1 });
  const t = BoP.step([act('pre_delegate_authority', 'US')]);
  assert.ok(t.playerActions.some(a => a.actionId === 'pre_delegate_authority'));
  const w = ctx.State.get();
  assert.strictEqual(w.autonomyDelegated.US, true);
});

// ── B2. EMP ────────────────────────────────────────────────────────────────

console.log('\n=== EMP 3rd/4th order ===');

test('emp_strike seeds emp_cascade_pressure and bleeds bystander cyber', () => {
  const world = makeTaiwan();
  quietRng();
  const bystander = 'EU';
  const before = world.powers[bystander].trueState.cyber;
  const log = ctx.Cascades.resolve([act('emp_strike', 'IN', 'GB')], world);
  assert.ok(world.activeSystemicEvents.includes('emp_cascade_pressure'));
  assert.ok(world.powers[bystander].trueState.cyber < before,
    `EU cyber ${before} → ${world.powers[bystander].trueState.cyber}`);
  assert.ok(hasLog(log, 'EMP burst') || hasLog(log, 'electromagnetic'),
    `log: ${log.map(e => e.text).join(' | ')}`);
});

test('pressure + ≥2 cyber<30 fires c4isr_collapse (military −12, info −8, space −6)', () => {
  const world = makeTaiwan();
  quietRng();
  // Bystanders of IN→GB. 28 − 6 bleed = 22: under the collapse threshold
  // (<30) but above the communications_blackout threshold (<20).
  setStat(world, 'EU', { cyber: 28 });
  setStat(world, 'RU', { cyber: 28 });
  const mil = world.powers.US.trueState.military;
  const info = world.powers.US.trueState.info;
  const space = world.powers.US.trueState.space;
  const log = ctx.Cascades.resolve([act('emp_strike', 'IN', 'GB')], world);
  assert.ok(world.activeSystemicEvents.includes('c4isr_collapse'));
  assert.ok(hasLog(log, 'C4ISR collapse'));
  assert.strictEqual(world.powers.US.trueState.military, mil - 12);
  assert.strictEqual(world.powers.US.trueState.info, info - 8);
  assert.strictEqual(world.powers.US.trueState.space, space - 6);
});

test('c4isr_collapse does NOT fire with only 1 degraded cyber power', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { cyber: 25 });
  for (const id of Object.keys(world.powers)) {
    if (id !== 'US') setStat(world, id, { cyber: 80 });
  }
  ctx.Cascades.resolve([act('emp_strike', 'IN', 'GB')], world);
  assert.ok(!world.activeSystemicEvents.includes('c4isr_collapse'));
});

test('c4isr_collapse does NOT fire without the pressure marker', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { cyber: 20 });
  setStat(world, 'CN', { cyber: 20 });
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('c4isr_collapse'));
});

test('c4isr_collapse is idempotent across two resolve calls', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { cyber: 25 });
  setStat(world, 'CN', { cyber: 25 });
  ctx.Cascades.resolve([act('emp_strike', 'IN', 'GB')], world);
  assert.ok(world.activeSystemicEvents.includes('c4isr_collapse'));
  const mil = world.powers.EU.trueState.military;
  // Re-seed pressure: the _pressure marker is stripped at the start of resolve.
  ctx.Cascades.resolve([act('emp_strike', 'IN', 'GB')], world);
  assert.strictEqual(world.powers.EU.trueState.military, mil, 'collapse must not re-apply');
});

// ── B3. Bio ────────────────────────────────────────────────────────────────

console.log('\n=== Bio 3rd/4th order ===');

test('two bio-domain actions in one turn seed bio_acceleration_pressure', () => {
  const world = makeTaiwan();
  quietRng();
  ctx.Cascades.resolve([
    act('bio_surveillance_network', 'US'),
    act('pandemic_response_pact', 'CN')
  ], world);
  assert.ok(world.activeSystemicEvents.includes('bio_acceleration_pressure'));
});

test('a single bio action does NOT seed bio_acceleration_pressure', () => {
  const world = makeTaiwan();
  quietRng();
  ctx.Cascades.resolve([act('bio_surveillance_network', 'US')], world);
  assert.ok(!world.activeSystemicEvents.includes('bio_acceleration_pressure'));
});

test('marker + ≥2 domestic<40 fires pandemic_outbreak (domestic −10, economic −8)', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { domestic: 35 });
  setStat(world, 'CN', { domestic: 35 });
  const usDom = world.powers.US.trueState.domestic;
  const usEcon = world.powers.US.trueState.economic;
  const log = ctx.Cascades.resolve([
    act('bio_surveillance_network', 'EU'),
    act('medical_reserve_deployment', 'IN')
  ], world);
  assert.ok(world.activeSystemicEvents.includes('pandemic_outbreak'));
  assert.ok(hasLog(log, 'Pandemic outbreak'));
  assert.strictEqual(world.powers.US.trueState.domestic, usDom - 10);
  assert.strictEqual(world.powers.US.trueState.economic, usEcon - 8);
});

test('pandemic_outbreak does NOT fire with only 1 vulnerable power', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { domestic: 35 });
  for (const id of Object.keys(world.powers)) {
    if (id !== 'US') setStat(world, id, { domestic: 70 });
  }
  ctx.Cascades.resolve([
    act('bio_surveillance_network', 'EU'),
    act('pandemic_response_pact', 'IN')
  ], world);
  assert.ok(!world.activeSystemicEvents.includes('pandemic_outbreak'));
});

// ── B4. Kessler / space ────────────────────────────────────────────────────

console.log('\n=== Kessler / space ===');

test('asat_strike seeds kessler_pressure and bleeds bystander space', () => {
  const world = makeOrbital();
  quietRng();
  const before = world.powers.EU.trueState.space;
  ctx.Cascades.resolve([act('asat_strike', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('kessler_pressure'));
  assert.ok(world.powers.EU.trueState.space < before,
    `EU space ${before} → ${world.powers.EU.trueState.space}`);
});

test('pressure + ≥2 space<30 fires kessler_cascade', () => {
  const world = makeOrbital();
  quietRng();
  setStat(world, 'US', { space: 25 });
  setStat(world, 'CN', { space: 25 });
  const euSpace = world.powers.EU.trueState.space;
  const euMil = world.powers.EU.trueState.military;
  const euInfo = world.powers.EU.trueState.info;
  const log = ctx.Cascades.resolve([act('asat_strike', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('kessler_cascade'));
  assert.ok(hasLog(log, 'Kessler cascade'));
  // EU is a bystander: 3rd-order debris −6, then 4th-order cascade −12 / −8 / −6.
  assert.strictEqual(world.powers.EU.trueState.space, euSpace - 6 - 12);
  assert.strictEqual(world.powers.EU.trueState.military, euMil - 8);
  assert.strictEqual(world.powers.EU.trueState.info, euInfo - 6);
});

test('kessler_cascade does NOT fire without the marker or with only 1 degraded space power', () => {
  const world = makeOrbital();
  quietRng();
  setStat(world, 'US', { space: 20 });
  for (const id of Object.keys(world.powers)) {
    if (id !== 'US') setStat(world, id, { space: 80 });
  }
  ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('kessler_cascade'));
  ctx.Cascades.resolve([act('asat_strike', 'US', 'CN')], world);
  assert.ok(!world.activeSystemicEvents.includes('kessler_cascade'),
    'one degraded space power is not enough');
});

test('two orbit crises at ≥3 merge to orbital_denial', () => {
  const world = makeOrbital();
  quietRng();
  crisis(world, 'asat_demonstration').escalationLevel = 3;
  crisis(world, 'gnss_jamming').escalationLevel = 3;
  crisis(world, 'commsat_blackout').escalationLevel = 1;
  crisis(world, 'lunar_resource_claim').escalationLevel = 1;
  ctx.Cascades.resolve([], world);
  assert.ok(world.crises.some(c => c.id === 'orbital_denial'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

// ── B5. Urban quagmire ─────────────────────────────────────────────────────

console.log('\n=== Urban quagmire ===');

test('siege_encirclement seeds persistent urban_quagmire', () => {
  const world = makeMegacity();
  quietRng();
  ctx.Cascades.resolve([act('siege_encirclement', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('urban_quagmire'));
});

test('quagmire grinds engaged powers while an urban crisis is ≥ L2', () => {
  const world = makeMegacity();
  quietRng();
  // coastal_megacity_siege starts at L2 and involves US/CN/EU
  const mil = world.powers.US.trueState.military;
  const dom = world.powers.US.trueState.domestic;
  const info = world.powers.US.trueState.info;
  const log = ctx.Cascades.resolve([act('siege_encirclement', 'US', 'CN')], world);
  assert.ok(hasLog(log, 'Urban quagmire grinds'));
  assert.strictEqual(world.powers.US.trueState.military, mil - 3 - 4, '1st-order −3 then grind −4');
  assert.strictEqual(world.powers.US.trueState.domestic, dom - 3, 'grind domestic −3');
  assert.strictEqual(world.powers.US.trueState.info, info - 2);
});

test('cooling all urban crises below L2 lifts the quagmire', () => {
  const world = makeMegacity();
  quietRng();
  ctx.Cascades.resolve([act('siege_encirclement', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('urban_quagmire'));
  for (const c of world.crises) {
    if (c.domain === 'urban') c.escalationLevel = 1;
  }
  const log = ctx.Cascades.resolve([], world);
  assert.ok(!world.activeSystemicEvents.includes('urban_quagmire'));
  assert.ok(hasLog(log, 'Urban quagmire lifts'));
});

test('quagmire + ≥2 domestic<35 fires one-shot urban_humanitarian_catastrophe', () => {
  const world = makeMegacity();
  quietRng();
  setStat(world, 'US', { domestic: 32 });
  setStat(world, 'CN', { domestic: 32 });
  const euDom = world.powers.EU.trueState.domestic;
  const euInfo = world.powers.EU.trueState.info;
  const log = ctx.Cascades.resolve([act('siege_encirclement', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('urban_humanitarian_catastrophe'));
  assert.ok(hasLog(log, 'Urban humanitarian catastrophe'));
  assert.strictEqual(world.powers.EU.trueState.domestic, euDom - 3 - 10,
    'EU is engaged (grind −3) then catastrophe −10');
  assert.strictEqual(world.powers.EU.trueState.info, euInfo - 2 - 6,
    'EU is engaged (grind −2) then catastrophe −6');
});

test('urban_humanitarian_catastrophe does not re-fire', () => {
  const world = makeMegacity();
  quietRng();
  setStat(world, 'US', { domestic: 32 });
  setStat(world, 'CN', { domestic: 32 });
  ctx.Cascades.resolve([act('siege_encirclement', 'US', 'CN')], world);
  assert.ok(world.activeSystemicEvents.includes('urban_humanitarian_catastrophe'));
  // Lift everyone above the fragility (<30) and catastrophe (<35) thresholds
  // so the second resolve can only grind or (wrongly) re-apply catastrophe.
  for (const p of Object.values(world.powers)) p.trueState.domestic = 50;
  ctx.Cascades.resolve([], world);
  assert.strictEqual(world.powers.EU.trueState.domestic, 47,
    'second resolve should grind −3 only, not re-apply catastrophe −10');
});

test('two megacity crises at ≥3 merge to urban_cauldron', () => {
  const world = makeMegacity();
  quietRng();
  crisis(world, 'coastal_megacity_siege').escalationLevel = 3;
  crisis(world, 'insurgent_network').escalationLevel = 3;
  crisis(world, 'humanitarian_corridor_crisis').escalationLevel = 1;
  crisis(world, 'urban_infrastructure_collapse').escalationLevel = 1;
  ctx.Cascades.resolve([], world);
  assert.ok(world.crises.some(c => c.id === 'urban_cauldron'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

// ── B6. Compound merges ────────────────────────────────────────────────────

console.log('\n=== Compound crisis merges ===');

function forceMerge(world, idA, idB, keepLow = []) {
  quietRng();
  crisis(world, idA).escalationLevel = 3;
  crisis(world, idB).escalationLevel = 3;
  for (const id of keepLow) {
    const c = crisis(world, id);
    if (c) c.escalationLevel = 1;
  }
  ctx.Cascades.resolve([], world);
}

test('east_asia+east_asia merges to taiwan_decoupling', () => {
  const world = makeTaiwan();
  forceMerge(world, 'taiwan_military', 'us_china_trade', ['baltic_cyber']);
  assert.ok(world.crises.some(c => c.id === 'taiwan_decoupling'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('persian_gulf+persian_gulf merges to gulf_firestorm', () => {
  const world = makeIran();
  forceMerge(world, 'iran_nuclear_program', 'hormuz_blockade_threat', [
    'iran_proxy_escalation', 'gulf_bloc_fracture', 'iran_bio_program'
  ]);
  assert.ok(world.crises.some(c => c.id === 'gulf_firestorm'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('levant+persian_gulf merges to iran_axis_activation', () => {
  const world = makeIran();
  forceMerge(world, 'iran_proxy_escalation', 'iran_nuclear_program', [
    'hormuz_blockade_threat', 'gulf_bloc_fracture', 'iran_bio_program'
  ]);
  assert.ok(world.crises.some(c => c.id === 'iran_axis_activation'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('europe+europe merges to european_fragmentation', () => {
  const world = makeTaiwan();
  quietRng();
  crisis(world, 'baltic_cyber').escalationLevel = 3;
  crisis(world, 'taiwan_military').escalationLevel = 1;
  crisis(world, 'us_china_trade').escalationLevel = 1;
  world.crises.push({
    id: 'test_europe_2', name: 'Test Europe 2', domain: 'cyber',
    involved: ['RU', 'EU'], escalationLevel: 3, region: 'europe',
    location: { x: 510, y: 90 }, cascadeLog: []
  });
  ctx.Cascades.resolve([], world);
  assert.ok(world.crises.some(c => c.id === 'european_fragmentation'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('scs_waters+scs_waters merges to south_seas_blockade', () => {
  const world = makeScs();
  forceMerge(world, 'scs_island_seizure', 'scs_sea_lane', [
    'tech_supply_crunch', 'drone_swarm_incident'
  ]);
  assert.ok(world.crises.some(c => c.id === 'south_seas_blockade'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('global_finance+global_finance merges to great_deleveraging', () => {
  const world = makeFinancial();
  forceMerge(world, 'clearing_network_failure', 'sovereign_debt_crisis', [
    'dollar_weaponization_backlash', 'g20_coordination_collapse'
  ]);
  assert.ok(world.crises.some(c => c.id === 'great_deleveraging'),
    `crises: ${world.crises.map(c => c.id).join(',')}`);
});

test('two unmapped-region crises do not merge', () => {
  const world = makeTaiwan();
  quietRng();
  for (const c of world.crises) c.escalationLevel = 1;
  world.crises.push(
    { id: 'x1', name: 'X1', domain: 'military', involved: ['US'], escalationLevel: 3, region: 'nowhere_a', location: { x: 1, y: 1 }, cascadeLog: [] },
    { id: 'x2', name: 'X2', domain: 'military', involved: ['CN'], escalationLevel: 3, region: 'nowhere_b', location: { x: 2, y: 2 }, cascadeLog: [] }
  );
  const n = world.crises.length;
  ctx.Cascades.resolve([], world);
  assert.ok(world.crises.some(c => c.id === 'x1') && world.crises.some(c => c.id === 'x2'));
  assert.ok(!world.crises.some(c => c.compoundOf), `unexpected compound: ${world.crises.map(c => c.id).join(',')}`);
  assert.strictEqual(world.crises.length, n);
});

test('a compound already present is not duplicated on a second resolve', () => {
  const world = makeTaiwan();
  forceMerge(world, 'taiwan_military', 'us_china_trade', ['baltic_cyber']);
  const count = world.crises.filter(c => c.id === 'taiwan_decoupling').length;
  assert.strictEqual(count, 1);
  ctx.Cascades.resolve([], world);
  assert.strictEqual(world.crises.filter(c => c.id === 'taiwan_decoupling').length, 1);
});

// ── B7. Doctrine win / fail ────────────────────────────────────────────────

console.log('\n=== Doctrine win / fail ===');

function endAt20(doctrineId, scenarioId, patch) {
  BoP.init(scenarioId, { doctrine: doctrineId, seed: 1 });
  const w = ctx.State.get();
  w.turn = 20;
  if (patch) patch(w);
  ctx.State.checkGameOver();
  return w;
}

test('MAGA wins at turn 20 with ≥2 bilateral deals and domestic ≥ 65', () => {
  const w = endAt20('MAGA', 'taiwan_strait_2026', world => {
    world.bilateralDeals = 2;
    world.powers.US.trueState.domestic = 70;
  });
  assert.strictEqual(w.gameOver.result, 'win');
  assert.strictEqual(w.gameOver.reason, w.doctrine.doctrineWinMessage);
});

test('MAGA multilateralUsed is an early lose', () => {
  BoP.init('taiwan_strait_2026', { doctrine: 'MAGA', seed: 1 });
  const w = ctx.State.get();
  w.multilateralUsed = true;
  ctx.State.checkGameOver();
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.strictEqual(w.gameOver.reason, w.doctrine.doctrineFailCondition);
});

test('MAGA does NOT early-fail when multilateralUsed is false', () => {
  BoP.init('taiwan_strait_2026', { doctrine: 'MAGA', seed: 1 });
  const w = ctx.State.get();
  w.multilateralUsed = false;
  assert.strictEqual(ctx.State.checkGameOver(), false);
  assert.strictEqual(w.gameOver, null);
});

test('TWELVER wins with IR nuclear ≥ 4', () => {
  const w = endAt20('TWELVER', 'iran_nuclear_2026', world => {
    world.powers.IR.trueState.nuclear = 4;
    for (const c of world.crises) c.escalationLevel = 1;
  });
  assert.strictEqual(w.gameOver.result, 'win');
});

test('TWELVER wins with ≥2 IR crises at ≥ L2', () => {
  const w = endAt20('TWELVER', 'iran_nuclear_2026', world => {
    world.powers.IR.trueState.nuclear = 2;
    const ir = world.crises.filter(c => c.involved.includes('IR'));
    ir[0].escalationLevel = 2;
    ir[1].escalationLevel = 2;
    for (const c of world.crises) {
      if (c.escalationLevel >= 5) c.escalationLevel = 2;
    }
  });
  assert.strictEqual(w.gameOver.result, 'win');
});

test('TWELVER fails when nuclear is low and IR crises are quiet', () => {
  const w = endAt20('TWELVER', 'iran_nuclear_2026', world => {
    world.powers.IR.trueState.nuclear = 2;
    for (const c of world.crises) c.escalationLevel = 1;
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Nuclear program stalled at level 2/);
});

test('EU_FATALISM wins with ≥3 forums and domestic ≥ 50', () => {
  const w = endAt20('EU_FATALISM', 'taiwan_strait_2026', world => {
    world.multilateralForums = 3;
    world.powers.EU.trueState.domestic = 55;
  });
  assert.strictEqual(w.gameOver.result, 'win');
});

test('EU_FATALISM fails on too few forums', () => {
  const w = endAt20('EU_FATALISM', 'taiwan_strait_2026', world => {
    world.multilateralForums = 1;
    world.powers.EU.trueState.domestic = 55;
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Only 1 forums convened/);
});

test('MING wins with economic ≥ 80, Taiwan ≤ 1, no US-directed force', () => {
  const w = endAt20('MING', 'taiwan_strait_2026', world => {
    world.powers.CN.trueState.economic = 80;
    crisis(world, 'taiwan_military').escalationLevel = 1;
    world.playerMilitaryVsUS = 0;
  });
  assert.strictEqual(w.gameOver.result, 'win');
});

test('MING fails when Taiwan is still hot', () => {
  const w = endAt20('MING', 'taiwan_strait_2026', world => {
    world.powers.CN.trueState.economic = 80;
    crisis(world, 'taiwan_military').escalationLevel = 3;
    world.playerMilitaryVsUS = 0;
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Taiwan crisis unresolved at level 3/);
});

test('MING fails when playerMilitaryVsUS > 0', () => {
  const w = endAt20('MING', 'taiwan_strait_2026', world => {
    world.powers.CN.trueState.economic = 80;
    crisis(world, 'taiwan_military').escalationLevel = 1;
    world.playerMilitaryVsUS = 1;
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.strictEqual(w.gameOver.reason, w.doctrine.doctrineFailCondition);
});

test('JUCHE wins at turn 20 with nuclear ≥ 4 and US military lead ≤ 30', () => {
  const w = endAt20('JUCHE', 'korean_peninsula_2026', world => {
    world.powers.DPRK.trueState.nuclear = 4;
    world.powers.DPRK.trueState.military = 70;
    world.powers.US.trueState.military = 90; // lead 20
    for (const c of world.crises) {
      if (c.domain === 'military' || c.domain === 'compound' || c.domain === 'autonomous') {
        c.escalationLevel = Math.min(c.escalationLevel, 3);
      }
    }
  });
  assert.strictEqual(w.gameOver.result, 'win');
  assert.strictEqual(w.gameOver.reason, w.doctrine.doctrineWinMessage);
});

test('JUCHE fails when nuclear is below 4', () => {
  const w = endAt20('JUCHE', 'korean_peninsula_2026', world => {
    world.powers.DPRK.trueState.nuclear = 2;
    world.powers.DPRK.trueState.military = 70;
    world.powers.US.trueState.military = 90;
    for (const c of world.crises) {
      if (c.domain === 'military' || c.domain === 'compound' || c.domain === 'autonomous') {
        c.escalationLevel = Math.min(c.escalationLevel, 3);
      }
    }
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Nuclear deterrent stalled at level 2/);
});

test('JUCHE fails when US conventional lead exceeds 30', () => {
  const w = endAt20('JUCHE', 'korean_peninsula_2026', world => {
    world.powers.DPRK.trueState.nuclear = 5;
    world.powers.DPRK.trueState.military = 60;
    world.powers.US.trueState.military = 95; // lead 35
    for (const c of world.crises) {
      if (c.domain === 'military' || c.domain === 'compound' || c.domain === 'autonomous') {
        c.escalationLevel = Math.min(c.escalationLevel, 3);
      }
    }
  });
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /US conventional lead is 35/);
});

test('JUCHE does not win on high GSI when the deterrent is incomplete', () => {
  const w = endAt20('JUCHE', 'korean_peninsula_2026', world => {
    for (const p of Object.values(world.powers)) p.trueState.domestic = 70;
    world.powers.DPRK.trueState.nuclear = 1;
    world.powers.DPRK.trueState.military = 70;
    world.powers.US.trueState.military = 90;
  });
  assert.ok(ctx.State.getGlobalStabilityIndex() >= 40);
  assert.strictEqual(w.gameOver.result, 'lose');
  assert.match(w.gameOver.reason, /Nuclear deterrent stalled at level 1/);
});

// ── B8. Strategic posture ──────────────────────────────────────────────────

console.log('\n=== Strategic posture ===');

test('crisis at 4 excludes actions that would raise escalation', () => {
  const world = makeTaiwan();
  quietRng();
  crisis(world, 'taiwan_military').escalationLevel = 4;
  crisis(world, 'us_china_trade').escalationLevel = 2;
  world.powers.US.actionPointsRemaining = world.powers.US.actionPoints;
  const acts = ctx.AI.decideTurn('US', world);
  for (const a of acts) {
    const def = ctx.Domains.getById(a.actionId);
    assert.ok(def.escalationDelta <= 0,
      `US at crisis 4 picked escalatory ${a.actionId} (delta ${def.escalationDelta})`);
  }
});

test('domestic < 35 consolidates — no deploy_forces or emp_strike', () => {
  const world = makeTaiwan();
  quietRng();
  setStat(world, 'US', { domestic: 30 });
  crisis(world, 'taiwan_military').escalationLevel = 2;
  world.powers.US.actionPointsRemaining = world.powers.US.actionPoints;
  const ids = ctx.AI.decideTurn('US', world).map(a => a.actionId);
  assert.ok(!ids.includes('deploy_forces'), `consolidating US picked ${ids.join(',')}`);
  assert.ok(!ids.includes('emp_strike'), `consolidating US picked ${ids.join(',')}`);
});

// ── summary ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
