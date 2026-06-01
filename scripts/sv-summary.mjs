// sv-summary.mjs — print a side-by-side table from bop2026-analytics-v1 log files.
// Usage:
//   node scripts/sv-summary.mjs logs/sv-h1-*.json ...        # plain text table
//   node scripts/sv-summary.mjs --md logs/sv-*.json          # GitHub-markdown table
//
// Metrics: runs, win%, avgStab (stabilityIndex), avgTurns, avgRisk (systemicRisk.index),
// void% (runs whose game-over reason is the sovereignty-void terminal cascade). The old
// nuke% column counted reason ~ "nuclear", but in sovereignty_void_2026 the terminal mode
// is "Sovereignty void cascaded to terminal threshold" — void% is the faithful signal.
import fs from 'fs';
import path from 'path';

const argv = process.argv.slice(2);
const md = argv.includes('--md');
const files = argv.filter(a => a !== '--md');
if (!files.length) { console.error('No log files given.'); process.exit(1); }

const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const isVoid = (r) => /sovereignty void|terminal threshold/i.test(r || '');

const cols = ['file', 'runs', 'win%', 'avgStab', 'avgTurns', 'avgRisk', 'void%'];
const rows = [];

for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { rows.push([path.basename(f).replace(/\.json$/, ''), '—', '—', '—', '—', '—', '—']); continue; }
  if (!Array.isArray(arr)) arr = [arr];
  const o = arr.map(r => r.analytics?.outcome).filter(Boolean);
  const n = o.length || 1;
  const win  = o.filter(x => x.result === 'win').length / n * 100;
  const stab = avg(o.map(x => x.stabilityIndex ?? 0));
  const turns = avg(o.map(x => x.turnsPlayed ?? 0));
  const risk = avg(o.map(x => x.systemicRisk?.index ?? 0));
  const vd   = o.filter(x => isVoid(x.reason)).length / n * 100;
  rows.push([
    path.basename(f).replace(/\.json$/, ''),
    String(o.length), win.toFixed(0), stab.toFixed(1),
    turns.toFixed(1), risk.toFixed(2), vd.toFixed(0)
  ]);
}

if (md) {
  console.log('| ' + cols.join(' | ') + ' |');
  console.log('|' + cols.map((c, i) => i === 0 ? ' --- ' : ' ---: ').join('|') + '|');
  for (const r of rows) console.log('| ' + r.join(' | ') + ' |');
} else {
  const w = cols.map((c, i) => Math.max(c.length, ...rows.map(r => r[i].length)));
  const fmt = (r) => r.map((cell, i) => i === 0 ? cell.padEnd(w[i]) : cell.padStart(w[i])).join('  ');
  console.log(fmt(cols));
  console.log('-'.repeat(w.reduce((a, b) => a + b, 0) + 2 * (cols.length - 1)));
  for (const r of rows) console.log(fmt(r));
}
