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

console.log('');
console.log(`DeepSeek parse: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
