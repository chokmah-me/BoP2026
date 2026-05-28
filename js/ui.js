const UI = (() => {

  let _prevRels = {};

  // ── top-level render ────────────────────────────────────────────────────────

  function render() {
    const world = State.get();
    renderHeader(world);
    renderMap(world);
    renderCrisisPanel(world);
    renderAdvisorPanel(world);
    renderSimControls();
    renderActionPanel();
    renderPlayerStats();
    renderLog();
    renderRelationshipMatrix(world);
  }

  function renderHeader(world) {
    const el = document.getElementById('header-info');
    if (!el) return;
    const gsi = State.getGlobalStabilityIndex();
    const doctrineBanner = world.doctrine
      ? `<span class="doctrine-banner">${world.doctrine.flag} ${world.doctrine.name} — <em>${world.doctrine.tagline}</em></span>`
      : '';
    el.innerHTML = `
      <span class="year">YEAR ${world.year}</span>
      <span class="turn">Turn ${world.turn} / 20</span>
      <span class="gsi ${gsi < 40 ? 'gsi-danger' : gsi < 60 ? 'gsi-warn' : 'gsi-ok'}">
        Global Stability: ${gsi}
      </span>
      ${doctrineBanner}
      <span class="phase-label" id="phase-label">${phaseLabel(world.phase)}</span>
    `;
  }

  function phaseLabel(phase) {
    return {
      player_action: 'Your Move',
      npc_resolution: 'World Responds...',
      cascade: 'Cascades Resolving...',
      epistemic: 'Intel Update...',
      events: 'World Events...',
      end_turn: 'Turn Ending...'
    }[phase] || phase;
  }

  // ── map ─────────────────────────────────────────────────────────────────────

  function renderMap(world) {
    const regions = document.querySelectorAll('.map-region');
    for (const region of regions) {
      const powerId = region.dataset.power;
      const power = world.powers[powerId];
      if (!power) continue;
      const stability = power.trueState.domestic;
      region.style.fill = stabilityColor(stability);
      region.title = `${power.name}: Stability ${stability}`;
      region.setAttribute('data-stability', stability);
    }

    const NS = 'http://www.w3.org/2000/svg';
    const markersGroup = document.getElementById('crisis-markers');
    if (!markersGroup) return;
    markersGroup.innerHTML = '';

    for (const crisis of world.crises) {
      if (!crisis.location) continue;
      const { x, y } = crisis.location;
      const level = crisis.escalationLevel;
      const isCompound = !!crisis.compoundOf;
      const r = isCompound ? 7 : 3 + level;

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', r);
      circle.setAttribute('class', `crisis-dot level-${level}${isCompound ? ' compound-dot' : ''}`);
      markersGroup.appendChild(circle);

      const label = document.createElementNS(NS, 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', y + r + 9);
      label.setAttribute('class', 'map-crisis-label');
      const shortName = isCompound ? '⚡ ' + crisis.name.split(':')[0] : crisis.name.split(' ').slice(0, 2).join(' ');
      label.textContent = shortName;
      markersGroup.appendChild(label);
    }
  }

  function stabilityColor(val) {
    if (val >= 70) return '#2d6a2d';
    if (val >= 50) return '#6a6a2d';
    if (val >= 35) return '#8b4a00';
    return '#8b1a1a';
  }

  // ── crisis panel ────────────────────────────────────────────────────────────

  function renderCrisisPanel(world) {
    const el = document.getElementById('crisis-list');
    if (!el) return;
    el.innerHTML = world.crises.map(c => `
      <div class="crisis-item crisis-${c.domain}" data-id="${c.id}">
        <div class="crisis-header">
          <span class="crisis-domain-icon">${domainIcon(c.domain)}</span>
          <span class="crisis-name">${c.name}</span>
          ${c.compoundOf ? '<span class="compound-badge">MERGED</span>' : ''}
        </div>
        <div class="crisis-escalation">
          ${escalationBar(c.escalationLevel)}
          <span class="crisis-level">Level ${c.escalationLevel}/5</span>
        </div>
        <div class="crisis-actors">${c.involved.map(id => world.powers[id]?.flag || id).join(' ')}</div>
      </div>
    `).join('');
  }

  function escalationBar(level) {
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      const cls = i <= level ? `esc-bar esc-filled esc-${level}` : 'esc-bar';
      bars.push(`<span class="${cls}"></span>`);
    }
    return `<div class="esc-track">${bars.join('')}</div>`;
  }

  // ── advisor panel ───────────────────────────────────────────────────────────

  function showAdvisorWarnings(warnings) {
    const el = document.getElementById('advisor-log');
    if (!el) return;
    if (warnings.length === 0) {
      el.innerHTML = '<div class="advisor-empty">No significant anomalies detected this turn.</div>';
      return;
    }
    el.innerHTML = warnings.map(w => `
      <div class="advisor-entry severity-${w.severity || 'low'}">
        <span class="advisor-icon">${w.severity === 'high' ? '⚠️' : 'ℹ️'}</span>
        <span class="advisor-text">${w.text}</span>
      </div>
    `).join('');
  }

  function renderAdvisorPanel(world) {
    showAdvisorWarnings(AI.getAdvisorWarnings(world));
  }

  // ── action panel ────────────────────────────────────────────────────────────

  function renderActionPanel() {
    const world = State.get();
    const player = State.getPlayer();
    const panel = document.getElementById('action-panel');
    if (!panel) return;

    const isPlayerTurn = world.phase === 'player_action';
    const ap = player.actionPointsRemaining;

    panel.innerHTML = `
      <div class="action-header">
        <span class="ap-display">Action Points: <strong>${ap} / ${player.actionPoints}</strong></span>
        <div class="domain-tabs" id="domain-tabs"></div>
      </div>
      <div class="action-cards" id="action-cards"></div>
      <div class="action-footer">
        <button id="end-turn-btn" class="${isPlayerTurn ? '' : 'disabled'}"
          ${isPlayerTurn ? '' : 'disabled'}>
          End Turn →
        </button>
      </div>
    `;

    const tabsEl = document.getElementById('domain-tabs');
    const cardsEl = document.getElementById('action-cards');
    const currentDomain = window._activeDomain || Domains.getDomainList()[0];

    tabsEl.innerHTML = Domains.getDomainList().map(d => `
      <button class="domain-tab ${d === currentDomain ? 'active' : ''}" data-domain="${d}">
        ${Domains.getDomainIcon(d)} ${Domains.getDomainLabel(d)}
      </button>
    `).join('');

    const actions = Domains.getByDomain(currentDomain);
    cardsEl.innerHTML = actions.map(a => `
      <div class="action-card ${ap < a.cost || !isPlayerTurn ? 'disabled' : ''}"
           data-action="${a.id}"
           data-requires-target="${a.requiresTarget}"
           data-cost="${a.cost}">
        <div class="action-name">${a.name}</div>
        <div class="action-cost">AP: ${a.cost}</div>
        <div class="action-desc">${a.description}</div>
        <div class="action-tooltip">${a.tooltip}</div>
        ${a.escalationDelta !== 0 ? `<div class="action-escalation ${a.escalationDelta > 0 ? 'esc-up' : 'esc-down'}">
          Escalation ${a.escalationDelta > 0 ? '↑' : '↓'}
        </div>` : ''}
      </div>
    `).join('');

    // bind tab clicks
    tabsEl.querySelectorAll('.domain-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        window._activeDomain = btn.dataset.domain;
        renderActionPanel();
      });
    });

    // bind action card clicks
    cardsEl.querySelectorAll('.action-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        const actionId = card.dataset.action;
        const requiresTarget = card.dataset.requiresTarget === 'true';
        if (requiresTarget) {
          showTargetSelector(actionId, world);
        } else {
          Turn.queuePlayerAction(actionId, null);
        }
      });
    });

    const endBtn = document.getElementById('end-turn-btn');
    if (endBtn && isPlayerTurn) {
      endBtn.addEventListener('click', () => Turn.endPlayerTurn());
    }
  }

  function showTargetSelector(actionId, world) {
    const modal = document.getElementById('target-modal');
    if (!modal) return;

    const targets = Object.values(world.powers).filter(p => p.id !== world.player);
    modal.innerHTML = `
      <div class="modal-box">
        <h3>Select Target</h3>
        <div class="target-list">
          ${targets.map(t => `
            <button class="target-btn" data-target="${t.id}">
              ${t.flag} ${t.name}
            </button>
          `).join('')}
        </div>
        <button class="modal-cancel">Cancel</button>
      </div>
    `;
    modal.style.display = 'flex';

    modal.querySelectorAll('.target-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Turn.queuePlayerAction(actionId, btn.dataset.target);
        modal.style.display = 'none';
      });
    });
    modal.querySelector('.modal-cancel').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // ── player stats ─────────────────────────────────────────────────────────────

  function renderPlayerStats() {
    const world = State.get();
    const player = State.getPlayer();
    const el = document.getElementById('player-stats');
    if (!el) return;

    const stats = player.trueState;
    const doctrineSection = world.doctrine
      ? `<div class="doctrine-objective">🎯 ${world.doctrine.winCondition.description}</div>`
      : '';

    el.innerHTML = `
      ${doctrineSection}
      <div class="stat-row">
        ${Object.entries(stats).map(([k, v]) => {
          const masked = world.autonomyMasks?.[world.player]?.includes(k);
          return `
            <div class="stat-item">
              <div class="stat-label">${statLabel(k)}</div>
              <div class="stat-bar-wrap">
                ${masked ? '' : `<div class="stat-bar" style="width:${k === 'nuclear' ? v * 20 : v}%; background:${statColor(k, v)}"></div>`}
              </div>
              <div class="stat-val${masked ? ' rice-masked' : ''}">${masked ? '???' : (v + (k === 'nuclear' ? '/5' : ''))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function statLabel(k) {
    return { military: 'MIL', nuclear: 'NUC', economic: 'ECO', cyber: 'CYB', info: 'INF', domestic: 'DOM', space: 'SPC' }[k] || k;
  }

  function statColor(k, v) {
    if (k === 'nuclear') return v >= 4 ? '#c0392b' : v >= 2 ? '#e67e22' : '#27ae60';
    if (k === 'domestic') return v < 35 ? '#c0392b' : v < 55 ? '#e67e22' : '#27ae60';
    return v < 35 ? '#c0392b' : v < 55 ? '#e67e22' : '#2980b9';
  }

  // ── log ─────────────────────────────────────────────────────────────────────

  function renderLog() {
    const world = State.get();
    const el = document.getElementById('game-log');
    if (!el) return;

    el.innerHTML = world.log.slice(0, 60).map(entry => {
      const cls = logClass(entry.type);
      const order = entry.order ? `<span class="log-order order-${entry.order}">[${entry.order}°]</span>` : '';
      const conf = entry.confidence ? `<span class="log-conf">${entry.confidence}</span>` : '';
      return `
        <div class="log-entry ${cls}">
          ${order}${conf}
          <span class="log-text">${entry.text}</span>
          ${entry.subtext ? `<div class="log-subtext">${entry.subtext}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function logClass(type) {
    return {
      player: 'log-player',
      npc: 'log-npc',
      cascade: 'log-cascade',
      event: 'log-event',
      warning: 'log-warning',
      epistemic: 'log-epistemic',
      systemic_warning: 'log-systemic',
      systemic_event: 'log-systemic',
      relationship: 'log-relationship',
      sovereignty_void: 'log-systemic'
    }[type] || '';
  }

  // ── power dossier (click on map region) ─────────────────────────────────────

  function showDossier(powerId) {
    const world = State.get();
    const power = world.powers[powerId];
    if (!power) return;

    const isSelf = powerId === world.player;
    const modal = document.getElementById('target-modal');
    const perceived = isSelf ? power.trueState : world.powers[world.player]?.perceivedBy?.[powerId];
    const band = isSelf ? 0 : Epistemic.getUncertaintyBand(world.player, powerId, world);
    const rel = isSelf ? 0 : (State.getPlayer().relationships[powerId] || 0);

    modal.innerHTML = `
      <div class="modal-box dossier">
        <div class="dossier-header">
          <span class="power-flag">${power.flag}</span>
          <h3>${power.name}</h3>
          ${isSelf
            ? '<span class="rel-badge rel-neutral">Your Nation</span>'
            : `<span class="rel-badge ${rel > 20 ? 'rel-friendly' : rel < -20 ? 'rel-hostile' : 'rel-neutral'}">Relations: ${rel > 0 ? '+' : ''}${rel}</span>`
          }
        </div>
        <div class="dossier-stats">
          <h4>${isSelf ? 'True Capabilities' : `Perceived Capabilities <span class="band-note">(±${band} intel uncertainty)</span>`}</h4>
          ${perceived ? Object.entries(perceived).map(([stat, val]) => `
            <div class="dossier-stat">
              <span class="dossier-stat-label">${statLabel(stat)}</span>
              <div class="dossier-bar-wrap">
                <div class="dossier-bar" style="width:${stat === 'nuclear' ? val * 20 : val}%; background:${statColor(stat, val)}"></div>
              </div>
              <span class="dossier-val">${val}${stat === 'nuclear' ? '/5' : ''}${band > 0 ? ` ±${band}` : ''}</span>
            </div>
          `).join('') : '<p>No intelligence available.</p>'}
        </div>
        <div class="dossier-memory">
          <h4>Recent Actions</h4>
          ${power.memory.length > 0 ?
            power.memory.slice(-3).reverse().map(m =>
              m.actions.map(a => `<div class="memory-entry">Turn ${m.turn}: ${Domains.getById(a.actionId)?.name || a.actionId}</div>`).join('')
            ).join('') :
            '<p>No known actions.</p>'
          }
        </div>
        <button class="modal-cancel">Close</button>
      </div>
    `;
    modal.style.display = 'flex';
    modal.querySelector('.modal-cancel').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // ── simulation controls ──────────────────────────────────────────────────────

  function renderSimControls() {
    const el = document.getElementById('sim-controls');
    if (!el) return;
    const { sim } = State.get();

    if (!sim.active) {
      el.innerHTML = `
        <button class="sim-btn sim-start" onclick="Turn.runSimulation()">&#9654; Run Simulation</button>
      `;
      return;
    }

    el.innerHTML = `
      <span class="sim-label">&#9679; SIM</span>
      <span class="sim-speed-group">
        ${[1, 2, 5, 0].map(s => `
          <button class="sim-btn sim-speed ${sim.speed === s ? 'active' : ''}"
            onclick="State.setSim({speed:${s}});UI.renderSimControls()">
            ${s === 0 ? '&#9889;' : s + 'x'}
          </button>
        `).join('')}
      </span>
      <button class="sim-btn sim-pause"
        onclick="State.setSim({paused:${!sim.paused}});UI.renderSimControls()">
        ${sim.paused ? '&#9654; Resume' : '&#9646;&#9646; Pause'}
      </button>
      <button class="sim-btn sim-stop" onclick="State.setSim({active:false})">&#9632; Stop</button>
    `;
  }

  // ── relationship matrix ──────────────────────────────────────────────────────

  function renderRelationshipMatrix(world) {
    const el = document.getElementById('rel-matrix');
    if (!el || el.style.display === 'none') return;

    const ids = Object.keys(world.powers);
    const flags = ids.map(id => world.powers[id].flag || id);

    const headerCells = ['<th class="rmat-corner"></th>']
      .concat(flags.map(f => `<th class="rmat-th">${f}</th>`))
      .join('');

    const rows = ids.map((rowId, ri) => {
      const rels = world.powers[rowId].relationships || {};
      const cells = ids.map((colId, ci) => {
        if (rowId === colId) return '<td class="rmat-self"></td>';
        const val = rels[colId] || 0;
        const prev = (_prevRels[rowId] || {})[colId];
        const trend = prev === undefined ? '' : val > prev ? '↑' : val < prev ? '↓' : '';
        const trendCls = trend === '↑' ? 'rmat-up' : trend === '↓' ? 'rmat-dn' : '';
        const bg = relMatColor(val);
        const label = `${world.powers[rowId].name} → ${world.powers[colId].name}: ${val > 0 ? '+' : ''}${val}${trend ? ' ' + trend : ''}`;
        return `<td class="rmat-cell" style="background:${bg}" title="${label}">
          <span class="rmat-val">${val > 0 ? '+' : ''}${val}</span>
          ${trend ? `<span class="${trendCls}">${trend}</span>` : ''}
        </td>`;
      }).join('');
      return `<tr><th class="rmat-th rmat-row">${flags[ri]}</th>${cells}</tr>`;
    }).join('');

    el.innerHTML = `<table class="rmat-table"><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`;

    // snapshot current rels for next render
    _prevRels = {};
    for (const id of ids) {
      _prevRels[id] = Object.assign({}, world.powers[id].relationships || {});
    }
  }

  function relMatColor(val) {
    if (val <= -60) return '#5a0a0a';
    if (val <= -30) return '#8b1a1a';
    if (val < 20)   return '#1e2535';
    if (val < 50)   return '#1a3a28';
    return '#0d5c2a';
  }

  function toggleRelMatrix() {
    const el = document.getElementById('rel-matrix');
    const arrow = document.getElementById('rel-matrix-arrow');
    if (!el) return;
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : 'block';
    if (arrow) arrow.textContent = open ? '▶' : '▼';
    if (!open) renderRelationshipMatrix(State.get());
  }

  // ── misc ─────────────────────────────────────────────────────────────────────

  function showPhaseIndicator(text) {
    const el = document.getElementById('phase-label');
    if (el) el.textContent = text;
  }

  function showMessage(text, type = 'info') {
    const el = document.getElementById('message-bar');
    if (!el) return;
    el.textContent = text;
    el.className = `message-bar message-${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  function showGameOver(result) {
    const world = State.get();
    const doctrine = world.doctrine;
    const modal = document.getElementById('target-modal');
    const title = result.result === 'win'
      ? (doctrine ? `${doctrine.flag} Victory` : '🌐 Stability Maintained')
      : (doctrine ? `${doctrine.flag} Doctrine Failed` : '💀 Order Collapsed');
    const subtitle = doctrine
      ? `<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:8px">${doctrine.name} — ${doctrine.tagline}</div>`
      : '';
    modal.innerHTML = `
      <div class="modal-box game-over ${result.result}">
        <h2>${title}</h2>
        ${subtitle}
        <p>${result.reason}</p>
        <button onclick="location.reload()">New Game</button>
      </div>
    `;
    modal.style.display = 'flex';
  }

  function domainIcon(domain) {
    if (domain === 'compound') return '⚡';
    return Domains.getDomainIcon(domain);
  }

  // ── log export ───────────────────────────────────────────────────────────────

  function saveLog() {
    const world = State.get();

    const powers = {};
    for (const [id, pw] of Object.entries(world.powers)) {
      powers[id] = {
        name: pw.name,
        trueState: { ...pw.trueState },
        relationships: { ...pw.relationships },
        riskTolerance: pw.riskTolerance,
        patience: pw.patience
      };
    }

    const crises = world.crises.map(c => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      involved: c.involved,
      escalationLevel: c.escalationLevel
    }));

    const payload = {
      schema: 'bop2026-analytics-v1',
      exportedAt: new Date().toISOString(),
      scenarioId: world.scenarioId,
      player: world.player,
      doctrine: world.doctrine?.id || null,
      note: 'interactive-snapshot — stateDeltas not available; see world.log for turn-by-turn events',
      outcome: world.gameOver || { result: 'incomplete', reason: 'game in progress', turnsPlayed: world.turn - 1 },
      log: world.log.slice().reverse(),
      finalState: { powers, crises }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const result = world.gameOver?.result || 'inprogress';
    a.download = `bop-${world.scenarioId}-${date}-t${world.turn - 1}-${result}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return {
    render, renderHeader, renderMap, renderCrisisPanel, renderAdvisorPanel,
    renderSimControls, renderActionPanel, renderPlayerStats, renderLog,
    renderRelationshipMatrix, toggleRelMatrix,
    showAdvisorWarnings, showDossier, showPhaseIndicator, showMessage, showGameOver,
    saveLog
  };
})();
