#!/usr/bin/env node
/**
 * Catalog integrity — data contracts, no full games.
 *
 * Pins that scenarios, actions, events, doctrines, personalities, and the
 * headless load order are well-formed. Does not play turns.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { loadEngine } = require('./load-engine');

const ROOT = path.join(__dirname, '..');
const ctx = loadEngine();

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
    try { ctx.BoP.unseed(); } catch (_) { /* no-op */ }
  }
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ── scenarios ──────────────────────────────────────────────────────────────

console.log('\n=== catalog: scenarios ===');

test('every SCENARIOS_DATA key matches its id and has a known player', () => {
  const powers = Object.keys(ctx.POWERS_DATA);
  for (const [key, s] of Object.entries(ctx.SCENARIOS_DATA)) {
    assert.strictEqual(s.id, key, `scenario key ${key} has id ${s.id}`);
    assert.ok(powers.includes(s.player), `${key}: player ${s.player} not in POWERS_DATA`);
    assert.ok(Array.isArray(s.crises) && s.crises.length >= 1, `${key}: no crises`);
  }
});

test('every crisis has id, domain, involved, escalationLevel, and location {x,y}', () => {
  for (const [sid, s] of Object.entries(ctx.SCENARIOS_DATA)) {
    const seen = new Set();
    for (const c of s.crises) {
      assert.ok(c.id, `${sid}: crisis missing id`);
      assert.ok(!seen.has(c.id), `${sid}: duplicate crisis id ${c.id}`);
      seen.add(c.id);
      assert.ok(typeof c.domain === 'string' && c.domain.length, `${sid}/${c.id}: missing domain`);
      assert.ok(Array.isArray(c.involved) && c.involved.length, `${sid}/${c.id}: involved empty`);
      assert.strictEqual(typeof c.escalationLevel, 'number', `${sid}/${c.id}: escalationLevel`);
      assert.ok(c.location && typeof c.location.x === 'number' && typeof c.location.y === 'number',
        `${sid}/${c.id}: location {x,y} required`);
      for (const pid of c.involved) {
        assert.ok(ctx.POWERS_DATA[pid], `${sid}/${c.id}: involved power ${pid} unknown`);
      }
    }
  }
});

test('requiresDoctrine scenarios throw without a doctrine and accept every doctrine id', () => {
  const requiring = Object.entries(ctx.SCENARIOS_DATA).filter(([, s]) => s.requiresDoctrine);
  assert.ok(requiring.length >= 1, 'expected at least one requiresDoctrine scenario');
  const doctrines = ctx.DOCTRINES_DATA.map(d => d.id);
  assert.ok(doctrines.length >= 1, 'no doctrines loaded');
  for (const [sid] of requiring) {
    assert.throws(() => ctx.BoP.init(sid), /requires a doctrine/);
    for (const did of doctrines) {
      const snap = ctx.BoP.init(sid, { doctrine: did, seed: 1 });
      assert.strictEqual(snap.doctrine.id, did, `${sid} rejected doctrine ${did}`);
      assert.ok(snap.crises.length >= 1, `${sid} + ${did}: no crises after init`);
    }
  }
});

// ── actions ────────────────────────────────────────────────────────────────

console.log('\n=== catalog: actions ===');

test('every action has id, domain, cost, requiresTarget, effects1st; ids are unique', () => {
  const actions = ctx.Domains.getAll();
  assert.ok(actions.length >= 40, `expected a full catalog, got ${actions.length}`);
  const seen = new Set();
  for (const a of actions) {
    assert.ok(a.id, 'action missing id');
    assert.ok(!seen.has(a.id), `duplicate action id ${a.id}`);
    seen.add(a.id);
    assert.ok(typeof a.domain === 'string' && a.domain.length, `${a.id}: missing domain`);
    assert.strictEqual(typeof a.cost, 'number', `${a.id}: cost`);
    assert.strictEqual(typeof a.requiresTarget, 'boolean', `${a.id}: requiresTarget`);
    assert.ok(a.effects1st && typeof a.effects1st === 'object', `${a.id}: missing effects1st`);
  }
});

test('playerOnly actions are exactly the AOM pair', () => {
  const only = ctx.Domains.getAll().filter(a => a.playerOnly).map(a => a.id).sort();
  // join: vm-realm arrays fail deepStrictEqual even when contents match
  assert.strictEqual(only.join(','), 'pre_delegate_authority,revert_midcourse_defense');
});

test('every rdProgram has stat, baseGain, leadTime, step', () => {
  const rds = ctx.Domains.getAll().filter(a => a.rdProgram);
  assert.ok(rds.length >= 4, `expected four R&D programs, got ${rds.length}`);
  for (const a of rds) {
    const p = a.rdProgram;
    assert.ok(p.stat, `${a.id}: rdProgram.stat`);
    assert.strictEqual(typeof p.baseGain, 'number', `${a.id}: baseGain`);
    assert.strictEqual(typeof p.leadTime, 'number', `${a.id}: leadTime`);
    assert.strictEqual(typeof p.step, 'number', `${a.id}: step`);
  }
});

test('intelRefresh actions are the three wired collectors', () => {
  const ids = ctx.Domains.getAll().filter(a => a.intelRefresh).map(a => a.id).sort();
  assert.strictEqual(ids.join(','),
    'ai_surveillance_grid,cyber_infrastructure_probe,orbital_isr_surge');
});

// ── events ─────────────────────────────────────────────────────────────────

console.log('\n=== catalog: events ===');

test('EVENT_TABLE event ids are unique', () => {
  const events = ctx.EVENT_TABLE.events;
  assert.ok(Array.isArray(events) && events.length > 0, 'EVENT_TABLE.events missing');
  const counts = {};
  for (const e of events) {
    assert.ok(e.id, 'event missing id');
    counts[e.id] = (counts[e.id] || 0) + 1;
  }
  const dupes = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 1));
  assert.deepStrictEqual(dupes, {}, `duplicate event ids: ${JSON.stringify(dupes)}`);
});

test('every event has probability and an effects object', () => {
  for (const e of ctx.EVENT_TABLE.events) {
    assert.strictEqual(typeof e.probability, 'number', `${e.id}: probability`);
    assert.ok(e.effects && typeof e.effects === 'object', `${e.id}: effects`);
  }
});

// ── personalities & doctrines ──────────────────────────────────────────────

console.log('\n=== catalog: personalities & doctrines ===');

test('every POWERS_DATA id has a PERSONALITIES entry in ai.js', () => {
  const src = read('js/ai.js');
  const block = src.match(/const PERSONALITIES = \{([\s\S]*?)\n  \};/);
  assert.ok(block, 'PERSONALITIES block not found in ai.js');
  const keys = [...block[1].matchAll(/^\s{4}([A-Z]+):/gm)].map(m => m[1]);
  const powerIds = Object.keys(ctx.POWERS_DATA);
  for (const id of powerIds) {
    assert.ok(keys.includes(id), `POWERS_DATA.${id} has no PERSONALITIES entry`);
  }
});

test('every doctrine has profile.t_rat and a winCondition.id', () => {
  const ids = [];
  for (const d of ctx.DOCTRINES_DATA) {
    ids.push(d.id);
    assert.strictEqual(typeof d.profile?.t_rat, 'number', `${d.id}: t_rat`);
    assert.ok(d.winCondition?.id, `${d.id}: winCondition.id`);
    assert.ok(ctx.POWERS_DATA[d.power], `${d.id}: power ${d.power} unknown`);
  }
  assert.deepStrictEqual(ids.sort(), ['EU_FATALISM', 'JUCHE', 'MAGA', 'MING', 'TWELVER']);
});

test('checkDoctrineWin implements MAGA/TWELVER/EU_FATALISM/MING/JUCHE', () => {
  const src = read('js/state.js');
  const fn = src.match(/function checkDoctrineWin\(world\) \{([\s\S]*?)\n  \}/);
  assert.ok(fn, 'checkDoctrineWin not found');
  const body = fn[1];
  for (const id of ['MAGA', 'TWELVER', 'EU_FATALISM', 'MING', 'JUCHE']) {
    assert.ok(body.includes(`d.id === '${id}'`), `missing checkDoctrineWin branch for ${id}`);
  }
});

// ── load order ─────────────────────────────────────────────────────────────

console.log('\n=== catalog: load order ===');

test('load-engine MODULES keep the same relative order as index.html scripts', () => {
  const html = read('index.html');
  const htmlScripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const loader = read('scripts/load-engine.js');
  const block = loader.match(/const MODULES = \[([\s\S]*?)\];/);
  assert.ok(block, 'MODULES list not found');
  const modules = [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const shared = modules.filter(m => htmlScripts.includes(m));
  assert.deepStrictEqual(shared, modules, 'load-engine lists a file index.html does not');
  const positions = shared.map(m => htmlScripts.indexOf(m));
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1],
      `load order drift: ${shared[i - 1]} should precede ${shared[i]} in index.html`);
  }
});

// ── summary ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
