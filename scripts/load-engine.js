'use strict';
/**
 * Shared Node loader for the browser-style engine modules.
 *
 * The game ships as vanilla IIFE modules that attach singletons to the global
 * scope and reference each other by name (the load order in index.html is the
 * dependency graph). To run them under Node we mirror that: point `window` at
 * `global`, create a VM context over it, and execute each module in order.
 *
 * Usage:
 *   const { loadEngine } = require('./load-engine');
 *   const ctx = loadEngine();        // ctx.BoP, ctx.AI, ctx.Domains, ctx.Events, ...
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Files in the same order as index.html.
const MODULES = [
  'data/powers-data.js',
  'data/scenarios-data.js',
  'data/doctrines-data.js',
  'data/events-data.js',
  'js/state.js',
  'js/domains.js',
  'js/cascades.js',
  'js/epistemic.js',
  'js/events.js',
  'js/ai.js',
  'js/oracle.js'
];

function loadEngine() {
  global.window = global;
  const ctx = vm.createContext(global);

  function load(rel) {
    const file = path.join(ROOT, rel);
    const code = fs.readFileSync(file, 'utf8');
    // Top-level `const/let X =` declarations are block-scoped to the script and
    // would not persist on the context across separate runInContext calls, so the
    // next module couldn't see them. Rewrite them to `var` so the names land on
    // the shared global. The `m` flag anchors `^` to line starts and the `g` flag
    // converts every top-level declaration (not just the first). Indentation in
    // the pattern is none, so IIFE-internal `const`s — which are indented — are
    // left untouched; only column-0 (top-level) declarations are rewritten.
    const patched = code.replace(/^(const|let) ([A-Z][A-Za-z_]*)\s*=/gm, 'var $2 =');
    vm.runInContext(patched, ctx, { filename: file });
  }

  MODULES.forEach(load);

  // If a module ever stops matching the `const/let NAME =` rewrite pattern above
  // (e.g. switches to `class Foo {}`, destructuring, or multi-name `const`), its
  // singleton silently stays script-scoped and never lands on `ctx`. Fail loudly
  // here instead of letting it surface later as an unrelated ReferenceError deep
  // inside cascades.js or ai.js.
  const EXPECTED_GLOBALS = ['State', 'Domains', 'Cascades', 'Epistemic', 'Events', 'AI', 'BoP'];
  const missing = EXPECTED_GLOBALS.filter(name => !ctx[name]);
  if (missing.length) {
    throw new Error(`load-engine: module(s) failed to attach to global scope: ${missing.join(', ')}. ` +
      `Check for a top-level declaration in one of ${MODULES.join(', ')} that the const/let rewrite regex doesn't match (e.g. class, destructuring, or multi-name const).`);
  }
  return ctx;
}

module.exports = { loadEngine };
