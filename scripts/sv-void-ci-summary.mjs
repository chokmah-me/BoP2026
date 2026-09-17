#!/usr/bin/env node
/**
 * Summarize SV void-rate CI pilot logs with Wilson 95% intervals.
 * Usage: node scripts/sv-void-ci-summary.mjs logs/sv-ci-pilot-*.json
 */
import fs from 'fs';
import path from 'path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/sv-void-ci-summary.mjs <log.json>...');
  process.exit(1);
}

const isVoid = (r) => /sovereignty void|terminal threshold/i.test(r || '');
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Wilson score interval for a binomial proportion (z=1.96 ≈ 95%). */
function wilson(k, n, z = 1.96) {
  if (n <= 0) return { lo: NaN, hi: NaN, p: NaN };
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return {
    p,
    lo: Math.max(0, (centre - margin) / denom),
    hi: Math.min(1, (centre + margin) / denom)
  };
}

const rows = [];
let totalK = 0;
let totalN = 0;

for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    console.error(`skip ${f}: ${e.message}`);
    continue;
  }
  if (!Array.isArray(arr)) arr = [arr];
  const outcomes = arr.map((r) => r.analytics?.outcome).filter(Boolean);
  const n = outcomes.length;
  const k = outcomes.filter((o) => isVoid(o.reason)).length;
  const w = wilson(k, n);
  const meta = arr[0]?.analytics || {};
  totalK += k;
  totalN += n;
  rows.push({
    file: path.basename(f).replace(/\.json$/, ''),
    doctrine: meta.doctrine || '?',
    seed: meta.seedBase ?? meta.seed ?? '?',
    player: meta.player || '?',
    n,
    k,
    voidPct: (100 * w.p).toFixed(1),
    ci95: `${(100 * w.lo).toFixed(1)}–${(100 * w.hi).toFixed(1)}`,
    winPct: ((outcomes.filter((o) => o.result === 'win').length / Math.max(n, 1)) * 100).toFixed(0),
    avgTurns: avg(outcomes.map((o) => o.turnsPlayed ?? 0)).toFixed(1),
    avgStab: avg(outcomes.map((o) => o.stabilityIndex ?? 0)).toFixed(1)
  });
}

const cols = ['file', 'doctrine', 'seed', 'player', 'n', 'void%', 'CI95%', 'win%', 'avgTurns', 'avgStab'];
const table = rows.map((r) => [
  r.file, String(r.doctrine), String(r.seed), String(r.player),
  String(r.n), r.voidPct, r.ci95, r.winPct, r.avgTurns, r.avgStab
]);

const w = cols.map((c, i) => Math.max(c.length, ...table.map((r) => r[i].length)));
const fmt = (r) => r.map((cell, i) => (i <= 3 ? cell.padEnd(w[i]) : cell.padStart(w[i]))).join('  ');
console.log(fmt(cols));
console.log('-'.repeat(w.reduce((a, b) => a + b, 0) + 2 * (cols.length - 1)));
for (const r of table) console.log(fmt(r));

const pooled = wilson(totalK, totalN);
console.log('');
console.log(
  `Pooled (all cells): void ${totalK}/${totalN} = ${(100 * pooled.p).toFixed(1)}% ` +
  `(Wilson 95% ${(100 * pooled.lo).toFixed(1)}–${(100 * pooled.hi).toFixed(1)}%)`
);
console.log('Note: DeepSeek sampling is unseeded; seed-base only fixes scenario RNG, not LLM draws.');
console.log('Intervals are per-cell binomial CIs — not a mixed-effects model across cells.');
