/**
 * Browser smoke test for v2.0.3 log-saving changes.
 * Tests: Save Log button clickable, date-stamped filename, auto-save on game over.
 * Usage: node scripts/test-browser.js
 */
'use strict';

const { chromium } = require('C:/Users/Elke Shayna/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const INDEX = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';
const DOWNLOAD_DIR = path.join(os.tmpdir(), 'bop-test-downloads-' + Date.now());
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

let failures = 0;
function pass(msg) { console.log(`  PASS  ${msg}`); }
function fail(msg, detail) { console.log(`  FAIL  ${msg}`); if (detail) console.log(`        ${detail}`); failures++; }

(async () => {
  console.log('\nBoP2026 Browser Tests (v2.0.3 log-saving)\n');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ acceptDownloads: true, downloadsPath: DOWNLOAD_DIR });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // ── 1. Page loads ───────────────────────────────────────────────────────────
  await page.goto(INDEX);
  await page.waitForTimeout(800);
  const title = await page.title();
  if (title.includes('BoP') || title.includes('Balance') || title.includes('Power')) {
    pass('1. page loads');
  } else {
    fail('1. page loads', `title: ${title}`);
  }

  // ── 2. Start a game (standard mode: click first scenario card) ─────────────
  try {
    // Wait for cards to render
    await page.waitForSelector('.scenario-card:not(.scenario-card-sim)', { timeout: 4000 });
    await page.click('.scenario-card:not(.scenario-card-sim)');
    // Wait for game screen to appear
    await page.waitForSelector('#end-turn-btn', { timeout: 4000 });
    pass('2. scenario selected, game started');
  } catch (e) {
    fail('2. scenario selection and game start', e.message);
  }

  // ── 3. Save Log button is clickable and downloads dated file ───────────────
  try {
    await page.waitForSelector('#save-log-btn', { timeout: 3000 });
    const dlPromise = ctx.waitForEvent('download', { timeout: 6000 });
    await page.click('#save-log-btn');
    const dl = await dlPromise;
    const filename = dl.suggestedFilename();
    const datePattern = /^bop-[\w]+-\d{4}-\d{2}-\d{2}-t\d+-\w+\.json$/;
    if (datePattern.test(filename)) {
      pass(`3. Save Log clickable + dated filename: ${filename}`);
    } else {
      fail('3. Save Log dated filename', `got: ${filename}`);
    }

    // Validate JSON contents
    const savePath = path.join(DOWNLOAD_DIR, filename);
    await dl.saveAs(savePath);
    await page.waitForTimeout(200);
    const payload = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    if (payload.schema === 'bop2026-analytics-v1') pass('4. JSON schema correct');
    else fail('4. JSON schema', `got: ${payload.schema}`);
    if (payload.finalState?.powers) pass('5. JSON finalState.powers present');
    else fail('5. JSON finalState.powers', 'missing');
    if (payload.outcome && typeof payload.outcome.result === 'string') pass('6. JSON outcome.result present');
    else fail('6. JSON outcome.result', JSON.stringify(payload.outcome));
  } catch (e) {
    fail('3-6. Save Log button', e.message);
  }

  // ── 4. Auto-save on game over ────────────────────────────────────────────────
  // Force escalationLevel=5 on first crisis, then end the turn
  try {
    const dlPromise = ctx.waitForEvent('download', { timeout: 8000 });

    await page.evaluate(() => {
      // State is a script-level const, accessible directly (not via window)
      const world = State.get();
      // Set speed to 0 so sleep() calls are instant
      world.sim.speed = 0;
      // Find a military or compound crisis (required for nuclear game-over)
      // Fall back to setting first crisis domain to military
      const crisis = world.crises.find(c => c.domain === 'military' || c.domain === 'compound')
                  || world.crises[0];
      if (crisis) {
        crisis.domain = 'military';
        crisis.escalationLevel = 5;
      }
    });

    // Click End Turn to trigger the game-over check (which calls UI.saveLog)
    await page.click('#end-turn-btn');

    const dl = await dlPromise;
    const filename = dl.suggestedFilename();
    const datePattern = /^bop-[\w]+-\d{4}-\d{2}-\d{2}-t\d+-\w+\.json$/;
    if (datePattern.test(filename)) pass(`7. auto-save on game over — file: ${filename}`);
    else fail('7. auto-save filename', `got: ${filename}`);

    const savePath = path.join(DOWNLOAD_DIR, 'gameover-' + filename);
    await dl.saveAs(savePath);
    await page.waitForTimeout(200);
    const payload = JSON.parse(fs.readFileSync(savePath, 'utf8'));
    if (payload.outcome?.result === 'lose') pass('8. game-over JSON outcome.result=lose');
    else fail('8. game-over outcome.result', `got: ${JSON.stringify(payload.outcome)}`);

    // Game-over modal should be visible
    await page.waitForSelector('#target-modal .game-over', { timeout: 3000 });
    pass('9. game-over modal visible after auto-save');

  } catch (e) {
    fail('7-9. auto-save on game over', e.message);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (errors.length) console.log(`\n  JS errors during test:\n  ${errors.slice(0, 3).join('\n  ')}`);
  console.log('');
  if (failures === 0) console.log('All browser tests passed.\n');
  else { console.log(`${failures} browser test(s) failed.\n`); }

  await ctx.close();
  await browser.close();
  fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });

  if (failures > 0) process.exit(1);
})();
