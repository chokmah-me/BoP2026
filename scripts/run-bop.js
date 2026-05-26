#!/usr/bin/env node
/**
 * BoP2026 CLI runner — headless batch simulation for IR research.
 *
 * Usage:
 *   node scripts/run-bop.js [options]
 *
 * Options:
 *   --scenario        <id>             Scenario id (default: taiwan_strait_2026)
 *   --runs            <n>              Number of runs (default: 10)
 *   --seed            <n>              Base seed (each run gets seed+i). Omit for random.
 *   --out             <path>           Output JSON file (default: auto-generated)
 *   --max-turns       <n>              Max turns per run (default: 20)
 *   --[powerId]-risk  <f>              Override a power's riskTolerance (e.g. --cn-risk 0.9)
 *   --[powerId]-patience <f>
 *   --ai-backend      heuristic|deepseek  NPC AI backend (default: heuristic)
 *   --ai-powers       all|CN,RU,...    Which NPCs use LLM backend (default: all)
 *   --log-prompts                      Save each LLM prompt+response to a JSONL file
 *   --thinking                         Use deepseek-reasoner (chain-of-thought) model
 *
 * DeepSeek requires DEEPSEEK_API_KEY env var.
 *
 * Examples:
 *   node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --out results.json
 *   node scripts/run-bop.js --runs 50 --seed 42 --cn-risk 0.9 --us-patience 0.2
 *   DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js --ai-backend deepseek --runs 5
 */
'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Set up a shared context that mimics the browser global scope.
// All BoP modules use IIFE pattern and reference each other by name.
// vm.createContext(global) makes global act as the script's global object.
global.window = global;
const ctx = vm.createContext(global);

function load(rel) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, 'utf8');
  // vm.runInContext with `const` top-level — rewrite to `var` so names
  // are available on the context object across subsequent script calls.
  const patched = code.replace(/^(const|let) ([A-Z][A-Za-z_]*)\s*=/m, 'var $2 =');
  vm.runInContext(patched, ctx, { filename: file });
}

// Load in the same order as index.html
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
if (!BoP) { console.error('Failed to load BoP oracle.'); process.exit(1); }

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  scenario: 'taiwan_strait_2026',
  runs: 10,
  seed: null,
  out: null,
  maxTurns: 20,
  paramOverrides: {},
  aiBackend: 'heuristic',
  aiPowers: 'all',
  logPrompts: false,
  thinking: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const val = () => { i++; return args[i]; };

  if (arg === '--scenario') opts.scenario = val();
  else if (arg === '--runs') opts.runs = parseInt(val());
  else if (arg === '--seed') opts.seed = parseInt(val());
  else if (arg === '--out') opts.out = val();
  else if (arg === '--max-turns') opts.maxTurns = parseInt(val());
  else if (arg === '--player') opts.player = val().toUpperCase();
  else if (arg === '--cascade-scale') opts.cascadeScale = parseFloat(val());
  else if (arg === '--ai-backend') opts.aiBackend = val();
  else if (arg === '--ai-powers') opts.aiPowers = val();
  else if (arg === '--log-prompts') opts.logPrompts = true;
  else if (arg === '--thinking') opts.thinking = true;
  else {
    // --<powerId>-risk or --<powerId>-patience  e.g. --cn-risk 0.9
    const m = arg.match(/^--([a-z]+)-(risk|patience)$/);
    if (m) {
      const powerId = m[1].toUpperCase();
      const param = m[2] === 'risk' ? 'riskTolerance' : 'patience';
      opts.paramOverrides[powerId] = opts.paramOverrides[powerId] || {};
      opts.paramOverrides[powerId][param] = parseFloat(val());
    }
  }
}

// ── Resolve output path ───────────────────────────────────────────────────────
if (!opts.out) {
  const date = new Date().toISOString().slice(0, 10);
  const seedTag = opts.seed != null ? opts.seed : 'rnd';
  opts.out = `logs/bop-${opts.scenario}-${date}-s${seedTag}-x${opts.runs}.json`;
}
fs.mkdirSync(path.join(process.cwd(), path.dirname(opts.out)), { recursive: true });

// ── Run ─────────────────────────────────────────────────────────────────────
console.log(`\nBoP2026 Oracle — ${opts.scenario}`);
console.log(`Runs: ${opts.runs}  Seed base: ${opts.seed ?? 'random'}  Max turns: ${opts.maxTurns}`);
console.log(`AI backend: ${opts.aiBackend}${opts.aiBackend === 'deepseek' ? ` (${opts.thinking ? 'deepseek-reasoner' : 'deepseek-chat'}, powers: ${opts.aiPowers})` : ''}`);
if (Object.keys(opts.paramOverrides).length) {
  console.log('Param overrides:', JSON.stringify(opts.paramOverrides));
}
console.log('');

// ── Validate DeepSeek config ──────────────────────────────────────────────────
if (opts.aiBackend === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
  console.error('ERROR: --ai-backend deepseek requires DEEPSEEK_API_KEY env var.');
  process.exit(1);
}

const seeds = [];
for (let i = 0; i < opts.runs; i++) {
  seeds.push(opts.seed != null ? opts.seed + i : Math.floor(Math.random() * 0xFFFFFF));
}

const initOptions = {
  paramOverrides: Object.keys(opts.paramOverrides).length ? opts.paramOverrides : undefined,
  player: opts.player || undefined,
  cascadeScale: opts.cascadeScale != null ? opts.cascadeScale : undefined
};
const runOptions = { maxTurns: opts.maxTurns };

async function runAll() {
  let results;

  if (opts.aiBackend === 'deepseek') {
    // ── DeepSeek async path ───────────────────────────────────────────────
    const DeepSeekBackend = require(path.join(__dirname, '../js/ai-deepseek.js'));
    const allActions = ctx.Domains.getAll();
    const logFile = opts.logPrompts
      ? path.join(process.cwd(), opts.out.replace(/\.json$/, '-prompts.jsonl'))
      : null;

    const backend = new DeepSeekBackend({
      model: opts.thinking ? 'deepseek-reasoner' : 'deepseek-chat',
      logPrompts: opts.logPrompts,
      logFile,
      actions: allActions
    });

    // Determine which NPC powers use the LLM
    const llmPowers = opts.aiPowers === 'all'
      ? null  // null = all NPCs
      : opts.aiPowers.split(',').map(s => s.trim().toUpperCase());

    const heuristicFallback = (powerId, world) => ctx.AI.decideTurn(powerId, world);

    results = [];
    for (let i = 0; i < opts.runs; i++) {
      const seed = seeds[i];
      const bar = '='.repeat(Math.round((i) / opts.runs * 30)).padEnd(30, '-');
      process.stdout.write(`\r  [${bar}] ${i}/${opts.runs}`);

      // Seed the RNG (same mulberry32 logic as oracle internals)
      let s = seed;
      const origRandom = Math.random;
      Math.random = (() => {
        return function () {
          s |= 0; s = (s + 0x6D2B79F5) | 0;
          let t = Math.imul(s ^ (s >>> 15), 1 | s);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      })();

      try {
        BoP.init(opts.scenario, initOptions);
        BoP.clearOverrides();

        // Register LLM overrides
        const world0 = BoP.getState();
        const npcIds = Object.keys(world0.powers).filter(id => id !== world0.player);
        for (const npcId of npcIds) {
          if (!llmPowers || llmPowers.includes(npcId)) {
            BoP.setNPCOverride(npcId, (id, world) =>
              backend.decideTurn(id, world, heuristicFallback)
            );
          }
        }

        const result = await BoP.runAsync(runOptions);
        results.push({ runId: i, seed, params: {}, result });
      } catch (err) {
        results.push({ runId: i, seed, params: {}, error: err.message });
      } finally {
        Math.random = origRandom;
      }
    }

    const bar = '='.repeat(30);
    process.stdout.write(`\r  [${bar}] ${opts.runs}/${opts.runs}`);
    console.log('\n');

    // ── DeepSeek cost report ────────────────────────────────────────────────
    const cost = backend.getCostSummary();
    console.log('─'.repeat(40));
    console.log(`  DeepSeek model : ${cost.model}`);
    console.log(`  Input tokens   : ${cost.inputTokens.toLocaleString()}`);
    console.log(`  Output tokens  : ${cost.outputTokens.toLocaleString()}`);
    console.log(`  Estimated cost : $${cost.estimatedCostUSD}`);
    console.log('─'.repeat(40));
    console.log('');

  } else {
    // ── Heuristic sync path (unchanged) ──────────────────────────────────
    results = BoP.runBatch({
      scenarioId: opts.scenario,
      runs: opts.runs,
      seeds,
      initOptions,
      runOptions,
      onProgress: (done, total) => {
        const bar = '='.repeat(Math.round(done / total * 30)).padEnd(30, '-');
        process.stdout.write(`\r  [${bar}] ${done}/${total}`);
      }
    });
    console.log('\n');
  }

  return results;
}

(async () => {
  const results = await runAll();

  // ── Summary table ────────────────────────────────────────────────────────
  const valid = results.filter(r => r.result);
  const wins = valid.filter(r => r.result.outcome.result === 'win').length;
  const nuclear = valid.filter(r => r.result.outcome.reason?.toLowerCase().includes('nuclear')).length;
  const avgStab = valid.length
    ? (valid.reduce((s, r) => s + r.result.outcome.stabilityIndex, 0) / valid.length).toFixed(1)
    : 0;
  const avgTurns = valid.length
    ? (valid.reduce((s, r) => s + r.result.outcome.turnsPlayed, 0) / valid.length).toFixed(1)
    : 0;

  console.log('─'.repeat(40));
  console.log(`  Runs completed : ${valid.length} / ${opts.runs}`);
  console.log(`  Win rate       : ${valid.length ? Math.round(wins / valid.length * 100) : 0}%`);
  console.log(`  Avg stability  : ${avgStab}`);
  console.log(`  Avg turns      : ${avgTurns}`);
  console.log(`  Nuclear events : ${nuclear} (${valid.length ? Math.round(nuclear / valid.length * 100) : 0}%)`);
  console.log('─'.repeat(40));

  // ── Write output ──────────────────────────────────────────────────────────
  const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(process.cwd(), opts.out);
  const analytics = BoP.exportBatchAnalytics(results);
  fs.writeFileSync(outPath, JSON.stringify(analytics, null, 2));
  console.log(`\n  Output written: ${outPath}  (schema: bop2026-analytics-v1)\n`);
})().catch(err => { console.error('\nFatal:', err.message); process.exit(1); });
