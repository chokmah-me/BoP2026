#!/usr/bin/env node
/**
 * Instrument eval — shape claims, not vanity scalars.
 *
 * npm test already proves the engine still *runs*. This file asks whether
 * it still *says the same kind of thing*: scenario contrast, personality
 * fingerprints, 0% default-AI wins, cascadeScale sign.
 *
 * No GSI target. No "nuclear == 14%". No test-count goal.
 * Each claim has a death condition in the register below: if the science
 * changes, retire the claim in this file (and findings.md) — don't loosen
 * the threshold to stay green.
 *
 * Usage: node scripts/test-instrument.js
 */
'use strict';

const { loadEngine } = require('./load-engine');

const ctx = loadEngine();
const BoP = ctx.BoP;

const SEEDS_20 = Array.from({ length: 20 }, (_, i) => i);
const SEEDS_10 = Array.from({ length: 10 }, (_, i) => i);

// ── register ───────────────────────────────────────────────────────────────
// Death = when we would *retire the claim in writing*, not silently loosen CI.

const REGISTER = {
  'taiwan-cascade-dominant':
    'Retire if Taiwan is redesigned as a nuclear scenario (Finding 2).',
  'iran-more-nuclear-than-taiwan':
    'Retire if Iran is rebalanced into a cascade twin of Taiwan (Finding 2).',
  'heuristic-no-win-tw-ir':
    'Retire Finding 4 in writing before allowing default-AI wins.',
  'cn-economic-fingerprint':
    'Retire if the CN persona is rewritten away from economic statecraft.',
  'eu-diplomatic-fingerprint':
    'Retire if the EU persona is rewritten away from diplomatic hedging.',
  'us-more-military-than-eu':
    'Retire if US/EU domain identities are intentionally swapped.',
  'cascade-scale-relieves-taiwan':
    'Retire if systemic events are no longer the vice on Taiwan (sensitivity thesis).'
};

// ── harness ────────────────────────────────────────────────────────────────

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runBatch(scenarioId, seeds, initOptions = {}) {
  return BoP.runBatch({
    scenarioId,
    runs: seeds.length,
    seeds,
    initOptions,
    runOptions: { maxTurns: 20 }
  });
}

function reasonOf(entry) {
  return (entry.result?.outcome?.reason || '').toLowerCase();
}

function resultOf(entry) {
  return entry.result?.outcome?.result;
}

function isNuclearReason(reason) {
  return reason.includes('nuclear');
}

function isCascadeDeath(reason) {
  return reason.includes('cascading state failures') ||
    reason.includes('domestic collapse');
}

function nuclearRate(batch) {
  if (!batch.length) return 0;
  return batch.filter(e => isNuclearReason(reasonOf(e))).length / batch.length;
}

function winCount(batch) {
  return batch.filter(e => resultOf(e) === 'win').length;
}

function meanTurns(batch) {
  if (!batch.length) return 0;
  return batch.reduce((s, e) => s + (e.result?.outcome?.turnsPlayed || 0), 0) / batch.length;
}

function fourthOrderCount(batch) {
  let n = 0;
  for (const e of batch) {
    for (const t of (e.result?.turns || [])) {
      for (const c of (t.cascadeLog || [])) {
        if (c.order === 4 && (c.type === 'systemic_event' || c.type === 'systemic_warning')) n++;
      }
    }
  }
  return n;
}

function allActions(batch) {
  const out = [];
  for (const e of batch) {
    for (const t of (e.result?.turns || [])) {
      for (const a of (t.playerActions || []).concat(t.npcActions || [])) out.push(a);
    }
  }
  return out;
}

function domainOf(actionId) {
  return ctx.Domains.getById(actionId)?.domain || 'unknown';
}

function domainCounts(batch, powerId) {
  const counts = {};
  let total = 0;
  for (const a of allActions(batch)) {
    if (a.actor !== powerId) continue;
    const d = domainOf(a.actionId);
    counts[d] = (counts[d] || 0) + 1;
    total++;
  }
  return { counts, total };
}

function topDomain(batch, powerId) {
  const { counts, total } = domainCounts(batch, powerId);
  let best = null, n = -1;
  for (const [d, c] of Object.entries(counts)) {
    if (c > n) { best = d; n = c; }
  }
  return { domain: best, count: n, total, counts };
}

function militaryShare(batch, powerId) {
  const { counts, total } = domainCounts(batch, powerId);
  return total ? (counts.military || 0) / total : 0;
}

function pct(x) {
  return `${Math.round(x * 100)}%`;
}

// ── batches (shared; one Taiwan 20, one Iran 20, two Taiwan 10-scale) ──────

console.log('\nBoP2026 instrument eval — shape claims (not GSI, not test count)\n');

const taiwan20 = runBatch('taiwan_strait_2026', SEEDS_20);
const iran20 = runBatch('iran_nuclear_2026', SEEDS_20);
const taiwanScale1 = runBatch('taiwan_strait_2026', SEEDS_10, { cascadeScale: 1 });
const taiwanScale0 = runBatch('taiwan_strait_2026', SEEDS_10, { cascadeScale: 0 });

// ── claims ─────────────────────────────────────────────────────────────────

console.log('=== scenario contrast ===');

test('taiwan-cascade-dominant: ≥70% of Taiwan losses are cascade/domestic, not nuclear', () => {
  const losses = taiwan20.filter(e => resultOf(e) === 'lose');
  assert(losses.length >= 10, `too few losses to judge (${losses.length})`);
  const cascade = losses.filter(e => isCascadeDeath(reasonOf(e))).length;
  const nuke = losses.filter(e => isNuclearReason(reasonOf(e))).length;
  const share = cascade / losses.length;
  assert(share >= 0.70,
    `cascade/domestic ${cascade}/${losses.length} (${pct(share)}); nuclear ${nuke}. ` +
    `Death: ${REGISTER['taiwan-cascade-dominant']}`);
});

test('iran-more-nuclear-than-taiwan: Iran nuclear-reason rate > Taiwan', () => {
  const tw = nuclearRate(taiwan20);
  const ir = nuclearRate(iran20);
  assert(ir > tw,
    `Iran ${pct(ir)} vs Taiwan ${pct(tw)} (n=20 each). ` +
    `Death: ${REGISTER['iran-more-nuclear-than-taiwan']}`);
});

test('heuristic-no-win-tw-ir: 0 default-AI wins across Taiwan+Iran (n=40)', () => {
  const wins = winCount(taiwan20) + winCount(iran20);
  assert(wins === 0,
    `${wins} heuristic win(s) — Finding 4 is dead unless retired in writing. ` +
    `Death: ${REGISTER['heuristic-no-win-tw-ir']}`);
});

console.log('\n=== strategic-culture fingerprints ===');

test('cn-economic-fingerprint: CN top domain on Taiwan is economic', () => {
  const top = topDomain(taiwan20, 'CN');
  assert(top.total >= 10, `CN produced only ${top.total} actions`);
  assert(top.domain === 'economic',
    `CN top domain is ${top.domain} (${top.count}/${top.total}). ` +
    `Death: ${REGISTER['cn-economic-fingerprint']}`);
});

test('eu-diplomatic-fingerprint: EU top domain on Taiwan is diplomatic', () => {
  const top = topDomain(taiwan20, 'EU');
  assert(top.total >= 10, `EU produced only ${top.total} actions`);
  assert(top.domain === 'diplomatic',
    `EU top domain is ${top.domain} (${top.count}/${top.total}). ` +
    `Death: ${REGISTER['eu-diplomatic-fingerprint']}`);
});

test('us-more-military-than-eu: US military action share > EU', () => {
  const us = militaryShare(taiwan20, 'US');
  const eu = militaryShare(taiwan20, 'EU');
  assert(us > eu,
    `US military share ${pct(us)} ≤ EU ${pct(eu)}. ` +
    `Death: ${REGISTER['us-more-military-than-eu']}`);
});

console.log('\n=== intervention sign ===');

test('cascade-scale-relieves-taiwan: scale 0 lasts longer or fires fewer 4th-order events', () => {
  const t1 = meanTurns(taiwanScale1);
  const t0 = meanTurns(taiwanScale0);
  const s1 = fourthOrderCount(taiwanScale1);
  const s0 = fourthOrderCount(taiwanScale0);
  const longer = t0 > t1;
  const quieter = s0 < s1;
  assert(longer || quieter,
    `scale0 turns ${t0.toFixed(1)} vs scale1 ${t1.toFixed(1)}; ` +
    `4th-order events ${s0} vs ${s1}. Neither sign held. ` +
    `Death: ${REGISTER['cascade-scale-relieves-taiwan']}`);
});

// ── observed card (not a pass/fail metric) ─────────────────────────────────

console.log('\n=== observed (informational — not gated) ===');
console.log(`  Taiwan n=20  nuclear ${pct(nuclearRate(taiwan20))}  wins ${winCount(taiwan20)}  ` +
  `mean turns ${meanTurns(taiwan20).toFixed(1)}`);
console.log(`  Iran   n=20  nuclear ${pct(nuclearRate(iran20))}  wins ${winCount(iran20)}  ` +
  `mean turns ${meanTurns(iran20).toFixed(1)}`);
console.log(`  CN domains ${JSON.stringify(topDomain(taiwan20, 'CN').counts)}`);
console.log(`  EU domains ${JSON.stringify(topDomain(taiwan20, 'EU').counts)}`);
console.log(`  scale0 turns ${meanTurns(taiwanScale0).toFixed(1)} / 4th-order ${fourthOrderCount(taiwanScale0)}  |  ` +
  `scale1 turns ${meanTurns(taiwanScale1).toFixed(1)} / 4th-order ${fourthOrderCount(taiwanScale1)}`);

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed + failed} claims: ${passed} held, ${failed} broke`);
if (failed) {
  console.log('If the science changed, retire the claim in this file and findings.md.');
  console.log('Do not loosen a threshold to stay green.');
}
process.exit(failed > 0 ? 1 : 0);
