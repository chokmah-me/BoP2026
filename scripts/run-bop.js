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
 *   --symmetric-aom                    Use symmetric, personality-gated AOM framing for all
 *                                      agents (default: asymmetric "exploit paths" for adversaries)
 *
 * DeepSeek requires DEEPSEEK_API_KEY env var.
 *
 * Examples:
 *   node scripts/run-bop.js --scenario taiwan_strait_2026 --runs 100 --out results.json
 *   node scripts/run-bop.js --runs 50 --seed 42 --cn-risk 0.9 --us-patience 0.2
 *   DEEPSEEK_API_KEY=sk-... node scripts/run-bop.js --ai-backend deepseek --runs 5
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadEngine } = require('./load-engine');

// Load the browser-style engine modules into a shared VM context.
const ctx = loadEngine();
const BoP = ctx.BoP;

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
  thinking: false,
  symmetricAom: false,
  dryRun: false,
  doctrine: null
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const val = () => { i++; return args[i]; };

  if (arg === '--scenario') opts.scenario = val();
  else if (arg === '--doctrine') opts.doctrine = val();
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
  else if (arg === '--symmetric-aom') opts.symmetricAom = true;
  else if (arg === '--dry-run') opts.dryRun = true;
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
if (opts.doctrine) console.log(`Doctrine: ${opts.doctrine}`);
if (opts.aiBackend === 'deepseek') console.log(`AOM framing: ${opts.symmetricAom ? 'symmetric (personality-gated)' : 'asymmetric (exploit paths)'}`);
if (Object.keys(opts.paramOverrides).length) {
  console.log('Param overrides:', JSON.stringify(opts.paramOverrides));
}
console.log('');

// ── Validate DeepSeek config ──────────────────────────────────────────────────
if (opts.aiBackend === 'deepseek' && !process.env.DEEPSEEK_API_KEY && !opts.dryRun) {
  console.error('ERROR: --ai-backend deepseek requires DEEPSEEK_API_KEY env var.');
  process.exit(1);
}

// ── Dry-run cost estimate (no API calls) ──────────────────────────────────────
if (opts.dryRun) {
  if (opts.aiBackend !== 'deepseek') {
    console.log('--dry-run only applies to --ai-backend deepseek. Nothing to estimate.\n');
    process.exit(0);
  }
  const isThinking = opts.thinking;
  const model = isThinking ? 'deepseek-reasoner' : 'deepseek-chat';
  // Conservative estimates per NPC per turn (system ~200t, user ~600t, output ~150t)
  const AVG_INPUT = 800;
  const AVG_OUTPUT = isThinking ? 2000 : 150;
  const PRICE_IN = isThinking ? 0.55 : 0.14;
  const PRICE_OUT = isThinking ? 2.19 : 0.28;

  const world0 = (() => {
    BoP.init(opts.scenario, { doctrine: opts.doctrine || undefined });
    return BoP.getState();
  })();
  const npcCount = opts.aiPowers === 'all'
    ? Object.keys(world0.powers).length - 1
    : opts.aiPowers.split(',').length;

  const totalCalls = npcCount * opts.runs * opts.maxTurns;
  const totalIn = totalCalls * AVG_INPUT;
  const totalOut = totalCalls * AVG_OUTPUT;
  const cost = (totalIn / 1e6) * PRICE_IN + (totalOut / 1e6) * PRICE_OUT;

  console.log(`\nDry-run estimate — no API calls made`);
  console.log('─'.repeat(44));
  console.log(`  Model          : ${model}`);
  console.log(`  NPCs using LLM : ${npcCount}`);
  console.log(`  Runs x turns   : ${opts.runs} x ${opts.maxTurns} = ${opts.runs * opts.maxTurns}`);
  console.log(`  Total API calls: ${totalCalls.toLocaleString()}`);
  console.log(`  Est. input tok : ${totalIn.toLocaleString()} (~${AVG_INPUT}/call)`);
  console.log(`  Est. output tok: ${totalOut.toLocaleString()} (~${AVG_OUTPUT}/call)`);
  console.log(`  Est. cost (USD): $${cost.toFixed(4)}`);
  console.log('─'.repeat(44));
  console.log('  Note: actual costs depend on crisis state and prompt caching.\n');
  process.exit(0);
}

const seeds = [];
for (let i = 0; i < opts.runs; i++) {
  seeds.push(opts.seed != null ? opts.seed + i : Math.floor(Math.random() * 0xFFFFFF));
}

const initOptions = {
  paramOverrides: Object.keys(opts.paramOverrides).length ? opts.paramOverrides : undefined,
  player: opts.player || undefined,
  cascadeScale: opts.cascadeScale != null ? opts.cascadeScale : undefined,
  doctrine: opts.doctrine || undefined
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
      actions: allActions,
      symmetricAom: opts.symmetricAom
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

      // Seed the RNG via the engine's shared mulberry32.
      BoP.seed(seed);

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
        // Also override the player when --ai-powers all or player explicitly listed
        if (!llmPowers || llmPowers.includes(world0.player)) {
          BoP.setPlayerOverride((id, world) =>
            backend.decideTurn(id, world, heuristicFallback)
          );
        }

        const result = await BoP.runAsync(runOptions);
        results.push({ runId: i, seed, params: {}, result });
      } catch (err) {
        results.push({ runId: i, seed, params: {}, error: err.message });
      } finally {
        BoP.unseed();
      }
    }

    const bar = '='.repeat(30);
    process.stdout.write(`\r  [${bar}] ${opts.runs}/${opts.runs}`);
    console.log('\n');

    // ── DeepSeek cost report ────────────────────────────────────────────────
    const cost = backend.getCostSummary();
    console.log('─'.repeat(40));
    console.log(`  DeepSeek model : ${cost.model}`);
    console.log(`  Input tokens   : ${cost.inputTokens.toLocaleString()} (cache miss)`);
    console.log(`  Cache hit tok  : ${cost.inputCacheHitTokens.toLocaleString()}`);
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
  const avgRisk = valid.length
    ? (valid.reduce((s, r) => s + (r.result.outcome.systemicRisk?.index ?? 0), 0) / valid.length).toFixed(1)
    : 0;
  const avgTurns = valid.length
    ? (valid.reduce((s, r) => s + r.result.outcome.turnsPlayed, 0) / valid.length).toFixed(1)
    : 0;

  console.log('─'.repeat(40));
  console.log(`  Runs completed : ${valid.length} / ${opts.runs}`);
  console.log(`  Win rate       : ${valid.length ? Math.round(wins / valid.length * 100) : 0}%`);
  console.log(`  Avg stability  : ${avgStab}`);
  console.log(`  Avg syst. risk : ${avgRisk}`);
  console.log(`  Avg turns      : ${avgTurns}`);
  console.log(`  Nuclear events : ${nuclear} (${valid.length ? Math.round(nuclear / valid.length * 100) : 0}%)`);
  console.log('─'.repeat(40));

  // ── Write output ──────────────────────────────────────────────────────────
  const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(process.cwd(), opts.out);
  const analytics = BoP.exportBatchAnalytics(results);
  fs.writeFileSync(outPath, JSON.stringify(analytics, null, 2));
  console.log(`\n  Output written: ${outPath}  (schema: bop2026-analytics-v1)\n`);
})().catch(err => { console.error('\nFatal:', err.message); process.exit(1); });
