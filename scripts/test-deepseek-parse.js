#!/usr/bin/env node
/**
 * Offline parse contracts for the DeepSeek backend.
 * No API key, no network — pins empty-content recovery from reasoning_content.
 */
'use strict';

const assert = require('assert');
const DeepSeekBackend = require('../js/ai-deepseek.js');

const actions = [
  { id: 'trade_deal', name: 'Trade Deal', cost: 1, requiresTarget: true },
  { id: 'cyber_defense_hardening', name: 'Cyber Defense Hardening', cost: 1, requiresTarget: false },
  { id: 'secret_channel', name: 'Back-Channel Contact', cost: 1, requiresTarget: true },
  { id: 'military_exercises', name: 'Military Exercises', cost: 1, requiresTarget: false },
  { id: 'bilateral_negotiation', name: 'Bilateral Negotiation', cost: 1, requiresTarget: true }
];

const pw = { actionPoints: 3 };
const validTargets = new Set(['US', 'CN', 'RU', 'EU']);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

const backend = new DeepSeekBackend({ actions });

test('content JSON parses (baseline)', () => {
  const r = backend._resolveActions(
    '[{"actionId":"trade_deal","target":"US"},{"actionId":"cyber_defense_hardening","target":null}]',
    '',
    'CN', pw, validTargets
  );
  assert.strictEqual(r.source, 'content');
  assert.strictEqual(r.actions.length, 2);
  assert.strictEqual(r.actions[0].actionId, 'trade_deal');
  assert.strictEqual(r.actions[0].target, 'US');
  assert.strictEqual(r.actions[0].flavor.startsWith('[LLM]'), true);
});

test('empty content + JSON at end of reasoning recovers', () => {
  const reasoning = [
    'Given patience 0.70 we prefer quiet diplomacy.',
    'Secret channel with RU could help de-escalate baltic_cyber.',
    'Need output JSON array only.',
    '[{"actionId":"secret_channel","target":"RU"},{"actionId":"trade_deal","target":"EU"},{"actionId":"cyber_defense_hardening","target":null}]'
  ].join('\n');
  const r = backend._resolveActions('', reasoning, 'IN', pw, validTargets);
  assert.strictEqual(r.source, 'reasoning');
  assert.strictEqual(r.actions.map(a => a.actionId).join(','),
    'secret_channel,trade_deal,cyber_defense_hardening');
  assert.strictEqual(r.actions[0].target, 'RU');
});

test('prefers last action array in reasoning, not an earlier draft', () => {
  const reasoning = [
    'Draft: [{"actionId":"military_exercises","target":null}]',
    'Better: trade and talk.',
    '[{"actionId":"trade_deal","target":"US"},{"actionId":"bilateral_negotiation","target":"US"}]'
  ].join('\n');
  const r = backend._resolveActions('', reasoning, 'CN', pw, validTargets);
  assert.strictEqual(r.source, 'reasoning');
  assert.strictEqual(r.actions[0].actionId, 'trade_deal');
  assert.strictEqual(r.actions.length, 2);
});

test('fenced json in content still parses', () => {
  const r = backend._resolveActions(
    '```json\n[{"actionId":"military_exercises","target":null}]\n```',
    '',
    'US', pw, validTargets
  );
  assert.strictEqual(r.source, 'content');
  assert.strictEqual(r.actions[0].actionId, 'military_exercises');
});

test('content wins even if reasoning also has JSON', () => {
  const r = backend._resolveActions(
    '[{"actionId":"trade_deal","target":"CN"}]',
    '[{"actionId":"military_exercises","target":null}]',
    'US', pw, validTargets
  );
  assert.strictEqual(r.source, 'content');
  assert.strictEqual(r.actions[0].actionId, 'trade_deal');
});

test('empty content and empty reasoning is a real fallback', () => {
  const r = backend._resolveActions('', 'Given our patience we might prefer quiet diplomacy.', 'IN', pw, validTargets);
  assert.strictEqual(r.source, null);
  assert.strictEqual(r.actions.length, 0);
});

test('invalid target is dropped, not a fallback, when other actions remain', () => {
  const r = backend._resolveActions(
    '[{"actionId":"trade_deal","target":"IR"},{"actionId":"cyber_defense_hardening","target":null}]',
    '',
    'CN', pw, validTargets
  );
  assert.strictEqual(r.source, 'content');
  assert.strictEqual(r.actions.length, 1);
  assert.strictEqual(r.actions[0].actionId, 'cyber_defense_hardening');
});

test('getCostSummary exposes parse counters', () => {
  const c = backend.getCostSummary();
  assert.strictEqual(typeof c.calls, 'number');
  assert.strictEqual(typeof c.parsedContent, 'number');
  assert.strictEqual(typeof c.parsedReasoning, 'number');
  assert.strictEqual(typeof c.fallback, 'number');
  assert.ok(c.parsedContent >= 3);
  assert.ok(c.parsedReasoning >= 2);
});

// ── prompt placement (PROMPT_VERSION v1.4: AOM in user message) ─────────────

const aomActions = actions.concat([
  { id: 'pre_delegate_authority', name: 'Pre-Delegate', cost: 2, requiresTarget: false },
  { id: 'boost_phase_intercept', name: 'BPI', cost: 2, requiresTarget: false },
  { id: 'c2_blackout', name: 'C2 Blackout', cost: 2, requiresTarget: true }
]);

function fixtureWorld(overrides = {}) {
  return {
    turn: 2,
    year: 2026,
    player: 'CN',
    doctrine: { profile: { t_rat: 120 } },
    autonomyDelegated: {},
    powers: {
      CN: {
        trueState: { military: 70, domestic: 50 },
        relationships: { US: -40, RU: 20 },
        riskTolerance: 0.55,
        patience: 0.6,
        priorityDomains: ['economic', 'military'],
        actionPoints: 3
      },
      US: {
        trueState: { military: 80, domestic: 55 },
        relationships: { CN: -40 },
        riskTolerance: 0.5,
        patience: 0.5,
        priorityDomains: ['military'],
        actionPoints: 3
      },
      RU: {
        trueState: { military: 65, domestic: 40 },
        relationships: { CN: 20 },
        riskTolerance: 0.7,
        patience: 0.3,
        priorityDomains: ['military'],
        actionPoints: 3
      }
    },
    crises: [
      {
        id: 'boost_phase_intercept_window',
        t_event: 90,
        escalationLevel: 0,
        involved: ['CN', 'US', 'RU']
      }
    ],
    ...overrides
  };
}

test('AOM latency block lives in userMsg, not systemMsg (player)', () => {
  const b = new DeepSeekBackend({ actions: aomActions, symmetricAom: true });
  const world = fixtureWorld();
  const { systemMsg, userMsg } = b._buildPrompt('CN', world.powers.CN, world);
  assert.ok(!systemMsg.includes('LATENCY GOVERNANCE (AOM):'), 'system must not carry turn AOM');
  assert.ok(systemMsg.includes('LATENCY GOVERNANCE (AOM)'), 'system mentions AOM may appear in user');
  assert.ok(userMsg.includes('LATENCY GOVERNANCE (AOM):'));
  assert.ok(userMsg.includes('t_rat=120s'));
  assert.ok(userMsg.includes('DORMANT boost-phase'));
});

test('AOM latency block lives in userMsg for adversary (symmetric)', () => {
  const b = new DeepSeekBackend({ actions: aomActions, symmetricAom: true });
  const world = fixtureWorld();
  const { systemMsg, userMsg } = b._buildPrompt('US', world.powers.US, world);
  assert.ok(!systemMsg.includes('LATENCY GOVERNANCE (AOM):'));
  assert.ok(userMsg.includes('LATENCY GOVERNANCE (AOM):'));
  assert.ok(userMsg.includes('Strategic options:'));
  assert.ok(!userMsg.includes('Exploit paths:'));
});

test('asymmetric AOM still uses Exploit paths, still in userMsg', () => {
  const b = new DeepSeekBackend({ actions: aomActions, symmetricAom: false });
  const world = fixtureWorld();
  const { systemMsg, userMsg } = b._buildPrompt('US', world.powers.US, world);
  assert.ok(!systemMsg.includes('LATENCY GOVERNANCE (AOM):'));
  assert.ok(userMsg.includes('Exploit paths:'));
});

test('no AOM section when scenario has no t_event crises', () => {
  const b = new DeepSeekBackend({ actions: aomActions });
  const world = fixtureWorld({ crises: [{ id: 'trade_war', escalationLevel: 2, involved: ['CN', 'US'] }] });
  const { systemMsg, userMsg } = b._buildPrompt('CN', world.powers.CN, world);
  assert.ok(!userMsg.includes('LATENCY GOVERNANCE (AOM):'));
  assert.ok(systemMsg.includes('LATENCY GOVERNANCE (AOM)')); // pointer only
});

console.log('');
console.log(`DeepSeek parse: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
