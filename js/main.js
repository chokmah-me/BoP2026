// Bootstrap: uses inline data globals, no fetch needed

let _pendingDoctrineId = null;

function showScenarioSelect(doctrineId = null) {
  _pendingDoctrineId = doctrineId;

  const screen = document.getElementById('scenario-select');
  const app = document.getElementById('app');
  app.style.display = 'none';
  screen.style.display = 'flex';

  const doctrine = doctrineId && window.DOCTRINES_DATA
    ? window.DOCTRINES_DATA.find(d => d.id === doctrineId)
    : null;

  document.getElementById('scenario-title').textContent = doctrine
    ? `${doctrine.flag} ${doctrine.name.toUpperCase()}`
    : 'BALANCE OF POWER 2026';

  document.getElementById('scenario-subtitle').textContent = doctrine
    ? `"${doctrine.tagline}"`
    : 'A multipolar crisis management simulation';

  document.getElementById('scenario-footer').textContent = doctrine
    ? `Choose your starting scenario. Win condition: ${doctrine.winCondition.description}`
    : 'Standard mode: you play as the United States. Every decision cascades.';

  const grid = document.getElementById('scenario-grid');

  // Scenarios flagged requiresDoctrine (e.g. Sovereignty Void) are degenerate
  // without a doctrine, so they only appear once one has been chosen.
  let scenarioCards = Object.values(window.SCENARIOS_DATA)
    .filter(s => !s.requiresDoctrine || doctrineId)
    .map(s => `
    <div class="scenario-card" data-id="${s.id}">
      <div class="scenario-card-name">${s.name}</div>
      <div class="scenario-card-desc">${s.description}</div>
      <div class="scenario-card-crises">
        ${s.crises.map(c => `<span class="scenario-crisis-tag">${Domains.getDomainIcon(c.domain)} ${c.name}</span>`).join('')}
      </div>
      <div class="scenario-card-start">Select →</div>
    </div>
  `).join('');

  if (!doctrineId) {
    scenarioCards += `
      <div class="scenario-card scenario-card-sim" id="sim-mode-btn">
        <div class="sim-mode-icon">⚙</div>
        <div class="scenario-card-name">SIMULATION MODE</div>
        <div class="scenario-card-desc">Play as a civilizational ideology. MAGA, 12er Shiism, European Fatalism, or Ming Restoration. Different goals. Different voice. Different history.</div>
        <div class="scenario-card-start">Enter Simulation →</div>
      </div>
    `;
  } else {
    scenarioCards = `
      <div class="scenario-card scenario-card-back" id="back-btn">
        ← Back to Doctrine Select
      </div>
    ` + scenarioCards;
  }

  grid.innerHTML = scenarioCards;

  grid.querySelectorAll('.scenario-card:not(.scenario-card-sim):not(.scenario-card-back)').forEach(card => {
    card.addEventListener('click', () => {
      screen.style.display = 'none';
      app.style.display = 'grid';
      initGame(card.dataset.id, _pendingDoctrineId);
    });
  });

  const simBtn = document.getElementById('sim-mode-btn');
  if (simBtn) {
    simBtn.addEventListener('click', showDoctrineSelect);
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', showDoctrineSelect);
  }
}

function showDoctrineSelect() {
  const screen = document.getElementById('scenario-select');
  screen.style.display = 'flex';

  document.getElementById('scenario-title').textContent = 'SIMULATION MODE';
  document.getElementById('scenario-subtitle').textContent = 'Choose your civilizational doctrine';
  document.getElementById('scenario-footer').textContent = 'Each doctrine reshapes your goals, your voice, and what counts as victory.';

  const grid = document.getElementById('scenario-grid');
  grid.innerHTML = `
    <div class="scenario-card scenario-card-back" id="back-to-standard">
      ← Standard Mode
    </div>
    ${window.DOCTRINES_DATA.map(d => `
      <div class="doctrine-card" data-id="${d.id}">
        <div class="doctrine-flag">${d.flag}</div>
        <div class="doctrine-name">${d.name}</div>
        <div class="doctrine-tagline">${d.tagline}</div>
        <div class="doctrine-ideology">${d.ideology}</div>
        <div class="doctrine-win">🎯 ${d.winCondition.description}</div>
        <div class="doctrine-briefing">"${d.openingBriefing}"</div>
        <div class="doctrine-difficulty difficulty-${d.difficulty.toLowerCase()}">${d.difficulty}</div>
      </div>
    `).join('')}
  `;

  document.getElementById('back-to-standard').addEventListener('click', () => showScenarioSelect(null));

  grid.querySelectorAll('.doctrine-card').forEach(card => {
    card.addEventListener('click', () => showScenarioSelect(card.dataset.id));
  });
}

function initGame(scenarioId, doctrineId = null) {
  Events.init(window.EVENT_TABLE);

  const scenario = window.SCENARIOS_DATA[scenarioId];
  const world = State.init(window.POWERS_DATA, scenario, doctrineId);

  // update player stats panel title to reflect actual player power
  const playerPower = world.powers[world.player];
  const statsTitle = document.getElementById('player-stats-title');
  if (statsTitle && playerPower) {
    statsTitle.textContent = `${playerPower.flag} ${playerPower.name}`;
  }

  // wire map region clicks to dossier
  document.querySelectorAll('.map-region').forEach(el => {
    el.addEventListener('click', () => UI.showDossier(el.dataset.power));
  });

  Turn.startTurn(world);
}

document.addEventListener('DOMContentLoaded', () => showScenarioSelect(null));
