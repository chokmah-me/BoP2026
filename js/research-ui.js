/**
 * Research Mode UI — browser-side panel for IR batch simulation.
 * Requires oracle.js (BoP) loaded first.
 */
const ResearchUI = (() => {
  'use strict';

  let _panel = null;
  let _running = false;

  // ── Panel lifecycle ──────────────────────────────────────────────────────

  function open() {
    if (_panel) { _panel.style.display = 'flex'; return; }
    _panel = document.createElement('div');
    _panel.id = 'research-panel';
    _panel.innerHTML = _buildPanelHTML();
    document.body.appendChild(_panel);
    _bindEvents();
  }

  function close() {
    if (_panel) _panel.style.display = 'none';
  }

  // ── HTML builder ─────────────────────────────────────────────────────────

  function _buildPanelHTML() {
    const scenarios = Object.entries(window.SCENARIOS_DATA || {})
      .map(([id, s]) => `<option value="${id}">${s.name}</option>`)
      .join('');

    const powers = Object.keys(window.POWERS_DATA || {});
    const powerRows = powers.map(pid => {
      const p = window.POWERS_DATA[pid];
      return `
        <tr class="rui-power-row" data-power="${pid}">
          <td>${p.flag} ${p.name}</td>
          <td><input type="range" class="rui-slider" data-param="riskTolerance" min="0" max="1" step="0.05"
               value="${p.riskTolerance}" title="${p.riskTolerance}"> <span class="rui-val">${p.riskTolerance}</span></td>
          <td><input type="range" class="rui-slider" data-param="patience" min="0" max="1" step="0.05"
               value="${p.patience}" title="${p.patience}"> <span class="rui-val">${p.patience}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="rui-box">
        <div class="rui-header">
          <span class="rui-title">&#9678; RESEARCH MODE</span>
          <button class="rui-close" onclick="ResearchUI.close()">&#10005;</button>
        </div>

        <div class="rui-body">

          <!-- Run config -->
          <div class="rui-section">
            <div class="rui-section-title">Run Configuration</div>
            <div class="rui-row">
              <label>Scenario</label>
              <select id="rui-scenario">${scenarios}</select>
            </div>
            <div class="rui-row">
              <label>Iterations</label>
              <input type="number" id="rui-runs" value="20" min="1" max="500">
              <span class="rui-hint">max 500</span>
            </div>
            <div class="rui-row">
              <label>Seed</label>
              <input type="number" id="rui-seed" placeholder="random">
              <span class="rui-hint">blank = stochastic</span>
            </div>
          </div>

          <!-- Power parameter overrides -->
          <div class="rui-section">
            <div class="rui-section-title">Power Parameters
              <span class="rui-hint">(applies to all runs)</span>
            </div>
            <table class="rui-power-table">
              <thead><tr><th>Power</th><th>Risk Tolerance</th><th>Patience</th></tr></thead>
              <tbody>${powerRows}</tbody>
            </table>
          </div>

          <!-- Controls -->
          <div class="rui-controls">
            <button id="rui-run-btn" class="rui-btn rui-btn-primary" onclick="ResearchUI._startRun()">
              &#9654; Run Batch
            </button>
            <div id="rui-progress" style="display:none">
              <div class="rui-progress-bar"><div id="rui-progress-fill"></div></div>
              <span id="rui-progress-text">0 / 0</span>
            </div>
          </div>

          <!-- Results -->
          <div id="rui-results" style="display:none">
            <div class="rui-section-title">Results</div>
            <div id="rui-summary"></div>
            <div class="rui-download-row">
              <button class="rui-btn" onclick="ResearchUI._downloadJSON()">&#8659; JSON</button>
              <button class="rui-btn" onclick="ResearchUI._downloadCSV()">&#8659; CSV</button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  function _bindEvents() {
    // Live-update slider value labels
    _panel.querySelectorAll('.rui-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        slider.nextElementSibling.textContent = slider.value;
        slider.title = slider.value;
      });
    });
  }

  // ── Run logic ────────────────────────────────────────────────────────────

  let _lastResults = null;

  function _startRun() {
    if (_running) return;
    _running = true;

    const scenarioId = _panel.querySelector('#rui-scenario').value;
    const runs = Math.min(500, Math.max(1, parseInt(_panel.querySelector('#rui-runs').value) || 20));
    const seedRaw = _panel.querySelector('#rui-seed').value.trim();
    const baseSeed = seedRaw !== '' ? parseInt(seedRaw) : null;

    // Collect power param overrides
    const paramOverrides = {};
    _panel.querySelectorAll('.rui-power-row').forEach(row => {
      const pid = row.dataset.power;
      const defaults = window.POWERS_DATA[pid];
      const rt = parseFloat(row.querySelector('[data-param="riskTolerance"]').value);
      const pa = parseFloat(row.querySelector('[data-param="patience"]').value);
      // Only include if changed from default
      if (rt !== defaults.riskTolerance || pa !== defaults.patience) {
        paramOverrides[pid] = { riskTolerance: rt, patience: pa };
      }
    });

    // Build seeds array
    const seeds = [];
    for (let i = 0; i < runs; i++) {
      seeds.push(baseSeed != null ? baseSeed + i : Math.floor(Math.random() * 0xFFFFFF));
    }

    // Show progress
    const progressEl = _panel.querySelector('#rui-progress');
    const fillEl = _panel.querySelector('#rui-progress-fill');
    const textEl = _panel.querySelector('#rui-progress-text');
    progressEl.style.display = 'flex';
    _panel.querySelector('#rui-results').style.display = 'none';
    _panel.querySelector('#rui-run-btn').disabled = true;

    // Run asynchronously, yielding between iterations to keep UI responsive
    const results = [];
    let i = 0;

    function runNext() {
      if (i >= runs) {
        _running = false;
        _lastResults = results;
        _showResults(results, { scenarioId, runs, baseSeed });
        _panel.querySelector('#rui-run-btn').disabled = false;
        return;
      }

      const seed = seeds[i];
      const paramOverridesForRun = Object.keys(paramOverrides).length ? paramOverrides : undefined;

      try {
        BoP.init(scenarioId, { paramOverrides: paramOverridesForRun });
        // Seed this run via the engine's shared PRNG.
        BoP.seed(seed);
        try {
          const result = BoP.run();
          results.push({ runId: i, seed, params: paramOverridesForRun || {}, result });
        } finally {
          BoP.unseed();
        }
      } catch (e) {
        results.push({ runId: i, seed, error: e.message });
      }

      i++;
      const pct = Math.round((i / runs) * 100);
      fillEl.style.width = pct + '%';
      textEl.textContent = `${i} / ${runs}`;

      setTimeout(runNext, 0);
    }

    setTimeout(runNext, 0);
  }

  // ── Results display ──────────────────────────────────────────────────────

  function _showResults(results, meta) {
    const valid = results.filter(r => r.result);
    const wins = valid.filter(r => r.result.outcome.result === 'win').length;
    const loses = valid.filter(r => r.result.outcome.result === 'lose').length;
    const nuclear = valid.filter(r => r.result.outcome.reason && r.result.outcome.reason.toLowerCase().includes('nuclear')).length;
    const avgStab = valid.length ? Math.round(valid.reduce((s, r) => s + r.result.outcome.stabilityIndex, 0) / valid.length) : 0;
    const avgTurns = valid.length ? (valid.reduce((s, r) => s + r.result.outcome.turnsPlayed, 0) / valid.length).toFixed(1) : 0;

    const summaryEl = _panel.querySelector('#rui-summary');
    summaryEl.innerHTML = `
      <table class="rui-results-table">
        <tr><td>Runs completed</td><td>${valid.length} / ${meta.runs}</td></tr>
        <tr><td>Win rate</td><td>${valid.length ? Math.round(wins / valid.length * 100) : 0}%</td></tr>
        <tr><td>Avg stability</td><td>${avgStab}</td></tr>
        <tr><td>Avg turns played</td><td>${avgTurns}</td></tr>
        <tr><td>Nuclear exchange</td><td>${nuclear} runs (${valid.length ? Math.round(nuclear/valid.length*100) : 0}%)</td></tr>
        <tr><td>Seed base</td><td>${meta.baseSeed != null ? meta.baseSeed : 'random'}</td></tr>
      </table>
    `;

    _panel.querySelector('#rui-results').style.display = 'block';
  }

  // ── Download helpers ─────────────────────────────────────────────────────

  function _downloadJSON() {
    if (!_lastResults) return;
    const analytics = BoP.exportBatchAnalytics(_lastResults);
    _download('bop-analytics.json', JSON.stringify(analytics, null, 2), 'application/json');
  }

  function _downloadCSV() {
    if (!_lastResults) return;
    const rows = [
      ['runId', 'seed', 'scenario', 'outcome', 'stabilityIndex', 'turnsPlayed', 'reason']
    ];
    for (const r of _lastResults) {
      if (!r.result) continue;
      const o = r.result.outcome;
      rows.push([r.runId, r.seed, r.result.scenarioId, o.result, o.stabilityIndex, o.turnsPlayed, JSON.stringify(o.reason)]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    _download('bop-results.csv', csv, 'text/csv');
  }

  function _download(filename, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  window.ResearchUI = { open, close, _startRun, _downloadJSON, _downloadCSV };
  return { open, close, _startRun, _downloadJSON, _downloadCSV };
})();
