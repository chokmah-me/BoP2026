const Turn = (() => {

  async function startTurn(world) {
    State.setPhase('player_action');
    State.clearPendingActions();
    for (const p of Object.values(world.powers)) {
      p.actionPointsRemaining = p.actionPoints;
    }
    UI.render();
    UI.showAdvisorWarnings(AI.getAdvisorWarnings(world));
  }

  function queuePlayerAction(actionId, target) {
    const world = State.get();
    const player = State.getPlayer();
    const action = Domains.getById(actionId);
    if (!action) return;

    if (player.actionPointsRemaining < action.cost) {
      UI.showMessage('Not enough action points.', 'warning');
      return;
    }

    player.actionPointsRemaining -= action.cost;
    State.queueAction({ actor: world.player, actionId, target });

    State.addLog({
      type: 'player',
      text: `[YOU] ${action.name}${target ? ' → ' + world.powers[target]?.name : ''}`
    });

    UI.renderActionPanel();
    UI.renderPlayerStats();
    UI.renderLog();
  }

  async function endPlayerTurn(simCalled = false) {
    const world = State.get();
    if (!simCalled && world.phase !== 'player_action') return;

    State.setPhase('npc_resolution');
    UI.showPhaseIndicator('NPC Resolution...');

    await sleep(300);
    await waitIfPaused();

    // NPC decisions
    const allActions = [...world.pendingActions];
    const npcIds = Object.keys(world.powers).filter(id => id !== world.player);

    for (const npcId of npcIds) {
      const npcActions = AI.decideTurn(npcId, world);
      for (const a of npcActions) {
        allActions.push(a);
        const power = world.powers[npcId];
        const actionDef = Domains.getById(a.actionId);
        State.addLog({
          type: 'npc',
          actor: npcId,
          text: `[${power.name}] ${actionDef?.name || a.actionId}${a.target ? ' → ' + world.powers[a.target]?.name : ''}: ${a.flavor}`
        });
      }
      await sleep(150);
      UI.renderLog();
    }

    await waitIfPaused();

    // Cascade resolution
    State.setPhase('cascade');
    UI.showPhaseIndicator('Cascade Resolution...');
    await sleep(300);

    const cascadeLog = Cascades.resolve(allActions, world);
    for (const entry of cascadeLog) {
      State.addLog({ type: 'cascade', ...entry });
    }

    UI.renderLog();
    await sleep(400);
    await waitIfPaused();

    // Epistemic update
    State.setPhase('epistemic');
    Epistemic.update(world);

    // Event draw
    State.setPhase('events');
    UI.showPhaseIndicator('World Events...');
    await sleep(300);

    const events = Events.drawEvents(world);
    if (events.length > 0) {
      UI.renderLog();
      await sleep(400);
    }

    await waitIfPaused();

    // End of turn
    State.setPhase('end_turn');
    State.advanceTurn();

    const over = State.checkGameOver();
    if (over) {
      UI.showGameOver(world.gameOver);
      return;
    }

    await sleep(300);
    await startTurn(State.get());
  }

  // ── simulation ───────────────────────────────────────────────────────────

  async function simulateTurn() {
    const world = State.get();
    State.clearPendingActions();
    for (const p of Object.values(world.powers)) p.actionPointsRemaining = p.actionPoints;

    State.setPhase('player_action');
    UI.showPhaseIndicator('Simulating Player...');

    const playerActions = AI.decideTurn(world.player, world);
    for (const a of playerActions) {
      State.queueAction(a);
      const actionDef = Domains.getById(a.actionId);
      State.addLog({
        type: 'player',
        text: `[SIM] ${actionDef?.name || a.actionId}${a.target ? ' → ' + world.powers[a.target]?.name : ''}`
      });
    }
    UI.renderLog();
    await sleep(200);
    await waitIfPaused();

    await endPlayerTurn(true);
  }

  async function runSimulation() {
    State.setSim({ active: true, paused: false });
    UI.renderSimControls();

    while (!State.get().gameOver && State.get().sim.active) {
      await waitIfPaused();
      if (!State.get().sim.active) break;
      await simulateTurn();
    }

    State.setSim({ active: false, paused: false });
    if (!State.get().gameOver) {
      UI.render();
    } else {
      UI.renderSimControls();
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  function sleep(ms) {
    const { sim } = State.get();
    const speedFactors = { 1: 1, 2: 0.4, 5: 0.1, 0: 0 };
    const factor = sim.active ? (speedFactors[sim.speed] ?? 1) : 1;
    if (factor === 0) return Promise.resolve();
    return new Promise(r => setTimeout(r, ms * factor));
  }

  async function waitIfPaused() {
    while (State.get().sim.paused) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return { startTurn, queuePlayerAction, endPlayerTurn, runSimulation };
})();
