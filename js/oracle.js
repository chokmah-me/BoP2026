/**
 * BoP Oracle API
 * Exposes the simulation engine for programmatic use in IR research.
 * Works in both browser (window.BoP) and Node.js (module.exports).
 *
 * Quick start:
 *   BoP.init('taiwan_strait_2026');
 *   const result = BoP.run();
 *   console.log(result.outcome);
 *
 * Batch:
 *   BoP.runBatch({ scenarioId: 'taiwan_strait_2026', runs: 100, seed: 42 });
 */
const BoP = (() => {
  'use strict';

  // ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let _overrides = {};
  let _playerOverride = null;
  let _origRandom = null;

  function _patchRNG(seed) {
    if (seed == null) return;
    // Idempotent: only capture the true native RNG once. Repeated seed() calls
    // without an intervening unseed() must not overwrite _origRandom with a
    // previous mulberry32 instance, or unseed() would restore a stale seeded
    // closure instead of the real Math.random.
    if (_origRandom == null) _origRandom = Math.random;
    Math.random = mulberry32(seed);
  }

  function _restoreRNG() {
    if (_origRandom) { Math.random = _origRandom; _origRandom = null; }
  }

  // ── Data accessors (browser globals or Node context) ─────────────────────
  function _data(key) {
    if (typeof global !== 'undefined' && global[key]) return global[key];
    return window[key];
  }

  // ── State snapshot helpers ───────────────────────────────────────────────

  function _snapshotForDelta(world) {
    const snap = { stats: {}, relationships: {}, crises: {} };
    for (const [id, pw] of Object.entries(world.powers)) {
      snap.stats[id] = { ...pw.trueState };
      snap.relationships[id] = { ...pw.relationships };
    }
    for (const c of world.crises) {
      snap.crises[c.id] = c.escalationLevel;
    }
    return snap;
  }

  function _computeDeltas(before, world) {
    const deltas = { stats: {}, relationships: {}, crises: {} };

    for (const [id, pw] of Object.entries(world.powers)) {
      for (const [stat, after] of Object.entries(pw.trueState)) {
        const bv = before.stats[id]?.[stat];
        if (bv != null && bv !== after) {
          if (!deltas.stats[id]) deltas.stats[id] = {};
          deltas.stats[id][stat] = { before: bv, after, delta: after - bv };
        }
      }
      for (const [otherId, after] of Object.entries(pw.relationships)) {
        const bv = before.relationships[id]?.[otherId];
        if (bv != null && bv !== after) {
          deltas.relationships[`${id}->${otherId}`] = { before: bv, after, delta: after - bv };
        }
      }
    }

    for (const c of world.crises) {
      const bv = before.crises[c.id];
      if (bv != null && bv !== c.escalationLevel) {
        deltas.crises[c.id] = { escalationLevel: { before: bv, after: c.escalationLevel, delta: c.escalationLevel - bv } };
      }
    }

    return deltas;
  }

  // ── Headless turn executor ───────────────────────────────────────────────
  // No UI calls, no sleeps. Returns raw turn data.
  //
  // The sync (_executeTurn) and async (_executeTurnAsync) variants share the same
  // setup and teardown; only the action-collection loop differs (the async path
  // awaits overrides so LLM backends can be injected). A pure sync-adapter-over-
  // async core isn't possible because step() must stay synchronous for the
  // heuristic path and Node tests, so the shared work lives in these helpers.

  function _beginTurn(world) {
    const beforeSnap = _snapshotForDelta(world);
    State.clearPendingActions();
    for (const p of Object.values(world.powers)) p.actionPointsRemaining = p.actionPoints;
    return beforeSnap;
  }

  function _finishTurn(world, beforeSnap, allActions, playerActions, npcActions) {
    const cascadeLog = Cascades.resolve(allActions, world);
    Epistemic.update(world);
    const events = Events.drawEvents(world);

    const turnNum = world.turn;
    const yearNum = world.year;
    State.advanceTurn();
    const over = State.checkGameOver();

    const stateDeltas = _computeDeltas(beforeSnap, State.get());

    return { turnNum, yearNum, playerActions, npcActions, cascadeLog, events, over, stateDeltas };
  }

  // Async variant — awaits NPC/player overrides so LLM backends can be injected.
  async function _executeTurnAsync(playerActionsOverride) {
    const world = State.get();
    const beforeSnap = _beginTurn(world);

    const playerActions = playerActionsOverride != null
      ? playerActionsOverride
      : _playerOverride
        ? await _playerOverride(world.player, world)
        : AI.decideTurn(world.player, world);
    for (const a of playerActions) State.queueAction(a);

    const allActions = [...world.pendingActions];
    const npcActions = [];
    for (const npcId of Object.keys(world.powers).filter(id => id !== world.player)) {
      const acts = _overrides[npcId]
        ? await _overrides[npcId](npcId, world)
        : AI.decideTurn(npcId, world);
      for (const a of acts) { allActions.push(a); npcActions.push(a); }
    }

    return _finishTurn(world, beforeSnap, allActions, playerActions, npcActions);
  }

  function _executeTurn(playerActionsOverride) {
    const world = State.get();
    const beforeSnap = _beginTurn(world);

    const playerActions = playerActionsOverride != null
      ? playerActionsOverride
      : AI.decideTurn(world.player, world);
    for (const a of playerActions) State.queueAction(a);

    const allActions = [...world.pendingActions];
    const npcActions = [];
    for (const npcId of Object.keys(world.powers).filter(id => id !== world.player)) {
      const acts = _overrides[npcId]
        ? _overrides[npcId](npcId, world)
        : AI.decideTurn(npcId, world);
      for (const a of acts) { allActions.push(a); npcActions.push(a); }
    }

    return _finishTurn(world, beforeSnap, allActions, playerActions, npcActions);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Initialize a new game run.
   * @param {string} scenarioId  e.g. 'taiwan_strait_2026'
   * @param {object} options
   *   doctrine?:        string   doctrine id
   *   player?:          string   override which power the player controls (e.g. 'CN')
   *   seed?:            number   RNG seed (enables reproducibility)
   *   cascadeScale?:    number   multiplier on systemic event deltas (0 = off, 1 = default)
   *   paramOverrides?:  { [powerId]: { riskTolerance?, patience?, trueState?, relationships? } }
   *   crisisOverrides?: { [crisisId]: { escalationLevel? } }
   * @returns {object} WorldSnapshot
   */
  function init(scenarioId, options = {}) {
    const scenarios = _data('SCENARIOS_DATA');
    const scenario = scenarios[scenarioId];
    if (!scenario) throw new Error(`Unknown scenario: "${scenarioId}". Available: ${Object.keys(scenarios).join(', ')}`);

    // Some scenarios (e.g. sovereignty_void_2026) are built around the doctrine's
    // t_rat. Without one, baseTRat falls back to 999 and the sovereignty void fires
    // every turn — a degenerate run. Require a doctrine for those scenarios.
    if (scenario.requiresDoctrine && !options.doctrine) {
      const doctrines = _data('DOCTRINES_DATA') || [];
      const ids = doctrines.map(d => d.id).join(', ');
      throw new Error(`Scenario "${scenarioId}" requires a doctrine. Pass options.doctrine (one of: ${ids}).`);
    }

    // Honor the documented init-time seed option. Patch RNG before State.init so
    // the epistemic noise it applies during world setup is reproducible too.
    _patchRNG(options.seed);

    State.init(_data('POWERS_DATA'), scenario, options.doctrine || null);
    Events.init(_data('EVENT_TABLE'));

    const world = State.get();

    if (options.player && world.powers[options.player]) {
      world.player = options.player;
    }

    if (options.cascadeScale != null) {
      world.sim.cascadeScale = options.cascadeScale;
    }

    if (options.paramOverrides) {
      for (const [powerId, ov] of Object.entries(options.paramOverrides)) {
        const pw = world.powers[powerId];
        if (!pw) continue;
        if (ov.riskTolerance != null) pw.riskTolerance = ov.riskTolerance;
        if (ov.patience != null) pw.patience = ov.patience;
        if (ov.trueState) Object.assign(pw.trueState, ov.trueState);
        if (ov.relationships) Object.assign(pw.relationships, ov.relationships);
      }
    }

    if (options.crisisOverrides) {
      for (const [crisisId, ov] of Object.entries(options.crisisOverrides)) {
        const crisis = world.crises.find(c => c.id === crisisId);
        if (crisis && ov.escalationLevel != null) crisis.escalationLevel = ov.escalationLevel;
      }
    }

    return getState();
  }

  /**
   * Execute one turn.
   * @param {Array?} playerActions  [{actor, actionId, target}] or omit to let AI decide
   * @returns {TurnResult}
   */
  function step(playerActions) {
    const r = _executeTurn(playerActions != null ? playerActions : null);
    return {
      turn: r.turnNum,
      year: r.yearNum,
      playerActions: r.playerActions,
      npcActions: r.npcActions,
      cascadeLog: r.cascadeLog,
      events: r.events,
      stateDeltas: r.stateDeltas,
      stateSnapshot: getState(),
      gameOver: r.over ? State.get().gameOver : null
    };
  }

  /**
   * Run a full game to completion (or maxTurns).
   * @param {object} options  { maxTurns?: number }
   * @returns {SimResult}
   */
  function run(options = {}) {
    const world = State.get();
    const scenarioId = world.scenarioId;
    const maxTurns = options.maxTurns || 20;
    const initialState = getState();
    const turns = [];

    while (!State.get().gameOver && State.get().turn <= maxTurns) {
      const t = step();
      turns.push(t);
      if (t.gameOver) break;
    }

    const fw = State.get();
    const gsi = State.getGlobalStabilityIndex();
    const sri = State.getSystemicRiskIndex();
    const resolvedOutcome = fw.gameOver || {
      result: gsi >= 40 ? 'draw' : 'lose',
      reason: gsi >= 40
        ? `Ran ${turns.length} turns. Stability held at ${gsi} — no decisive outcome.`
        : `Ran ${turns.length} turns. Stability collapsed to ${gsi}.`
    };
    return {
      scenarioId,
      initialState,
      outcome: {
        result: resolvedOutcome.result,
        reason: resolvedOutcome.reason,
        stabilityIndex: gsi,
        systemicRisk: sri,
        turnsPlayed: turns.length
      },
      turns,
      finalState: getState()
    };
  }

  /**
   * Async variant of step() — awaits NPC overrides (needed for LLM backends).
   * @param {Array?} playerActions
   * @returns {Promise<TurnResult>}
   */
  async function stepAsync(playerActions) {
    const r = await _executeTurnAsync(playerActions != null ? playerActions : null);
    return {
      turn: r.turnNum,
      year: r.yearNum,
      playerActions: r.playerActions,
      npcActions: r.npcActions,
      cascadeLog: r.cascadeLog,
      events: r.events,
      stateDeltas: r.stateDeltas,
      stateSnapshot: getState(),
      gameOver: r.over ? State.get().gameOver : null
    };
  }

  /**
   * Async variant of run() — awaits NPC overrides each turn.
   * @param {object} options  { maxTurns?: number }
   * @returns {Promise<SimResult>}
   */
  async function runAsync(options = {}) {
    const world = State.get();
    const scenarioId = world.scenarioId;
    const maxTurns = options.maxTurns || 20;
    const initialState = getState();
    const turns = [];

    while (!State.get().gameOver && State.get().turn <= maxTurns) {
      const t = await stepAsync();
      turns.push(t);
      if (t.gameOver) break;
    }

    const fw = State.get();
    const gsi = State.getGlobalStabilityIndex();
    const sri = State.getSystemicRiskIndex();
    const resolvedOutcome = fw.gameOver || {
      result: gsi >= 40 ? 'draw' : 'lose',
      reason: gsi >= 40
        ? `Ran ${turns.length} turns. Stability held at ${gsi} — no decisive outcome.`
        : `Ran ${turns.length} turns. Stability collapsed to ${gsi}.`
    };
    return {
      scenarioId,
      initialState,
      outcome: {
        result: resolvedOutcome.result,
        reason: resolvedOutcome.reason,
        stabilityIndex: gsi,
        systemicRisk: sri,
        turnsPlayed: turns.length
      },
      turns,
      finalState: getState()
    };
  }

  /**
   * Run many games with parameter variations.
   * @param {object} config
   *   scenarioId:   string
   *   runs:         number
   *   seeds?:       number[]          one per run; random if omitted
   *   initOptions?: object            passed to init() for each run
   *   runOptions?:  object            passed to run() for each run
   *   paramSweep?:  { [powerId]: { [param]: number[] } }  round-robin per run
   *   onProgress?:  (done, total) => void
   * @returns {BatchResult[]}
   */
  function runBatch(config) {
    const { runs = 1, scenarioId, seeds, paramSweep, onProgress, initOptions = {}, runOptions = {} } = config;
    const results = [];

    for (let i = 0; i < runs; i++) {
      const seed = seeds ? seeds[i] : Math.floor(Math.random() * 0xFFFFFF);

      // Build paramOverrides for this run from sweep
      const sweepOverrides = {};
      if (paramSweep) {
        for (const [powerId, params] of Object.entries(paramSweep)) {
          sweepOverrides[powerId] = {};
          for (const [param, values] of Object.entries(params)) {
            sweepOverrides[powerId][param] = values[i % values.length];
          }
        }
      }

      const mergedParamOverrides = {};
      for (const [pid, ov] of Object.entries({ ...initOptions.paramOverrides, ...sweepOverrides })) {
        mergedParamOverrides[pid] = { ...(initOptions.paramOverrides?.[pid] || {}), ...ov };
      }

      _patchRNG(seed);
      try {
        init(scenarioId, { ...initOptions, paramOverrides: mergedParamOverrides });
        const result = run(runOptions);
        results.push({ runId: i, seed, params: sweepOverrides, result });
      } finally {
        _restoreRNG();
      }

      if (onProgress) onProgress(i + 1, runs);
    }

    return results;
  }

  /**
   * Get a deep clone of current world state (JSON-serializable).
   */
  function getState() {
    return JSON.parse(JSON.stringify(State.get()));
  }

  /**
   * Restore world state from a snapshot (e.g. from getState()).
   * Useful for branching: save at turn 10, explore multiple turn-11 decisions.
   */
  function setState(snapshot) {
    State.restore(snapshot);
  }

  /** Override the AI decision function for one power. */
  function setNPCOverride(powerId, fn) {
    _overrides[powerId] = fn;
  }

  /** Override the AI decision function for the player power (async path only). */
  function setPlayerOverride(fn) {
    _playerOverride = fn;
  }

  /** Remove all NPC and player overrides. */
  function clearOverrides() {
    _overrides = {};
    _playerOverride = null;
  }

  /**
   * Seed Math.random with the engine's mulberry32 PRNG for reproducible runs.
   * The single shared implementation lives here; callers (CLI runner, tests,
   * research UI) use this rather than copying the generator. Call unseed() to
   * restore the original Math.random.
   */
  function seed(seedVal) { _patchRNG(seedVal); }

  /** Restore the original Math.random saved by seed(). */
  function unseed() { _restoreRNG(); }

  // ── Analytics export ─────────────────────────────────────────────────────

  function _powerSummary(powers) {
    const out = {};
    for (const [id, pw] of Object.entries(powers)) {
      out[id] = {
        name: pw.name,
        trueState: { ...pw.trueState },
        relationships: { ...pw.relationships },
        riskTolerance: pw.riskTolerance,
        patience: pw.patience
      };
    }
    return out;
  }

  function _crisesSummary(crises) {
    return crises.map(c => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      involved: c.involved,
      escalationLevel: c.escalationLevel
    }));
  }

  /**
   * Convert a SimResult (from BoP.run()) to a clean analytics object.
   * Strips raw stateSnapshot from each turn — use initialState/finalState instead.
   */
  function exportAnalytics(simResult, meta = {}) {
    const turns = simResult.turns.map(t => ({
      turn: t.turn,
      year: t.year,
      actions: {
        player: t.playerActions,
        npc: t.npcActions
      },
      cascades: t.cascadeLog,
      events: t.events.map(e => ({ id: e.id, name: e.name, description: e.description })),
      stateDeltas: t.stateDeltas || {},
      gameOver: t.gameOver
    }));

    const initial = simResult.initialState || simResult.turns[0]?.stateSnapshot || simResult.finalState;

    return {
      schema: 'bop2026-analytics-v1',
      exportedAt: new Date().toISOString(),
      scenarioId: simResult.scenarioId,
      player: simResult.finalState.player,
      doctrine: simResult.finalState.doctrine?.id || null,
      paramOverrides: meta.paramOverrides || {},
      seed: meta.seed != null ? meta.seed : null,
      outcome: simResult.outcome,
      initialState: {
        powers: _powerSummary(initial.powers),
        crises: _crisesSummary(initial.crises)
      },
      turns,
      finalState: {
        powers: _powerSummary(simResult.finalState.powers),
        crises: _crisesSummary(simResult.finalState.crises)
      }
    };
  }

  /**
   * Convert runBatch() output to an array of analytics objects.
   */
  function exportBatchAnalytics(batchResults) {
    return batchResults.map(r => ({
      runId: r.runId,
      seed: r.seed,
      analytics: r.result
        ? exportAnalytics(r.result, { paramOverrides: r.params, seed: r.seed })
        : { error: r.error }
    }));
  }

  const api = { init, step, stepAsync, run, runAsync, runBatch, getState, setState, setNPCOverride, setPlayerOverride, clearOverrides, seed, unseed, exportAnalytics, exportBatchAnalytics };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = api;
  } else {
    window.BoP = api;
  }

  return api;
})();
