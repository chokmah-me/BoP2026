#!/usr/bin/env node
/**
 * Phase 0 smoke test for the DeepSeek NPC backend.
 * Runs exactly 1 turn with CN as a DeepSeek NPC. Costs ~$0.0002.
 *
 * Usage:
 *   DEEPSEEK_API_KEY=sk-... node scripts/test-deepseek.js
 */
'use strict';

const vm   = require('vm');
const fs   = require('fs');
const path = require('path');

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('ERROR: DEEPSEEK_API_KEY env var not set.');
  process.exit(1);
}

// ── Load engine (same pattern as run-bop.js) ─────────────────────────────────
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
const DeepSeekBackend = require('../js/ai-deepseek.js');

// ── Run one turn ─────────────────────────────────────────────────────────────
(async () => {
  const backend = new DeepSeekBackend({
    actions: ctx.Domains.getAll()
  });

  BoP.init('taiwan_strait_2026', { seed: 42 });

  const world0 = BoP.getState();
  const playerPower = world0.player;

  // Register CN as LLM NPC (skip if CN is the player)
  const testPower = 'CN';
  if (testPower === playerPower) {
    console.log(`Note: CN is the player in this scenario. Testing RU instead.`);
  }
  const npcToTest = testPower === playerPower ? 'RU' : testPower;

  const fallback = (id, world) => ctx.AI.decideTurn(id, world);
  BoP.setNPCOverride(npcToTest, (id, world) => backend.decideTurn(id, world, fallback));

  console.log(`\nBoP DeepSeek smoke test — 1 turn, NPC: ${npcToTest}`);
  console.log('Calling API...\n');

  let result;
  try {
    result = await BoP.stepAsync();
  } catch (err) {
    console.error('FAIL — stepAsync threw:', err.message);
    process.exit(1);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────
  const failures = [];

  const npcAction = result.npcActions.find(a => a.actor === npcToTest);
  if (!npcAction) {
    failures.push(`No action recorded for ${npcToTest}`);
  } else {
    const allActionIds = ctx.Domains.getAll().map(a => a.id);
    if (!allActionIds.includes(npcAction.actionId)) {
      failures.push(`actionId "${npcAction.actionId}" not in domains list`);
    }
  }

  if (result.turn == null) failures.push('result.turn is null');
  if (!result.npcActions || !Array.isArray(result.npcActions)) failures.push('npcActions missing');

  const cost = backend.getCostSummary();

  // ── Report ──────────────────────────────────────────────────────────────────
  if (failures.length === 0) {
    console.log('PASS\n');
    console.log(`  Turn completed : ${result.turn}`);
    console.log(`  ${npcToTest} action    : ${npcAction.actionId}${npcAction.target ? ' → ' + npcAction.target : ''}`);
    console.log(`  Flavor         : ${npcAction.flavor}`);
    console.log(`  Input tokens   : ${cost.inputTokens}`);
    console.log(`  Output tokens  : ${cost.outputTokens}`);
    console.log(`  Prompt version : ${cost.promptVersion}`);
    console.log(`  Cost           : $${cost.estimatedCostUSD}\n`);
  } else {
    console.log('FAIL\n');
    failures.forEach(f => console.log(`  - ${f}`));
    console.log('');
    process.exit(1);
  }
})();
