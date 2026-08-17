const State = (() => {
  let world = null;

  // ── Epistemic model tuning (v2.10.0) ─────────────────────────────────────────
  // Intel is perishable. Each turn every viewer→target collection link decays
  // toward INTEL_FLOOR (sources go cold, networks roll up, the adversary changes
  // posture) unless an intel action refreshes it. Lower live quality slows the
  // convergence of perceptions toward truth (driftPerceptions) and widens the
  // estimation noise band, so perceived↔true divergence accumulates over time.
  const INTEL_FLOOR = 0.15;       // quality never decays below this
  const INTEL_DECAY_RATE = 0.06;  // fraction of the gap-above-floor lost per turn (~11-turn half-life)
  const PERCEPTION_NOISE = 4;     // max per-turn random-walk amplitude at quality 0 (scaled by 1 - quality)

  // intelQuality is a nested { viewer: { target: q } } matrix. Scenario data hands
  // it to us by reference; clone it so per-turn decay never mutates SCENARIOS_DATA
  // (which would corrupt later runs in a batch).
  function cloneIntelMatrix(src) {
    const out = {};
    for (const viewerId of Object.keys(src || {})) out[viewerId] = { ...src[viewerId] };
    return out;
  }

  function init(powersData, scenario, doctrineId = null) {
    const doctrine = doctrineId && window.DOCTRINES_DATA
      ? window.DOCTRINES_DATA.find(d => d.id === doctrineId) || null
      : null;

    const playerId = doctrine ? doctrine.power : scenario.player;

    // only include a power if it's a standard 6 OR is the doctrine player OR appears in scenario crises
    const standardPowers = new Set(['US', 'CN', 'EU', 'IN', 'RU', 'GB']);
    const scenarioPowerIds = new Set(scenario.crises.flatMap(c => c.involved));
    const activePowerIds = new Set([...standardPowers, ...scenarioPowerIds, playerId]);

    const powers = {};
    for (const [id, p] of Object.entries(powersData)) {
      if (!activePowerIds.has(id)) continue;
      powers[id] = {
        id: p.id,
        name: p.name,
        flag: p.flag,
        color: p.color,
        trueState: { ...p.trueState },
        perceivedBy: {},
        // Technology tier per researchable capability (v2.11.0). Each completed R&D
        // program raises a tier; sustained investment compounds the delayed payoff.
        techLevel: { military: 0, cyber: 0, space: 0, info: 0 },
        relationships: { ...p.relationships },
        riskTolerance: p.riskTolerance,
        patience: p.patience,
        priorityDomains: [...p.priorityDomains],
        actionPoints: p.actionPoints,
        actionPointsRemaining: p.actionPoints,
        memory: [],
        apReduced: false
      };
    }

    // apply doctrine profile overrides to player power
    if (doctrine) {
      const playerPower = powers[playerId];
      if (playerPower) {
        playerPower.riskTolerance = doctrine.profile.riskTolerance;
        playerPower.patience = doctrine.profile.patience;
        playerPower.priorityDomains = [...doctrine.profile.priorityDomains];
      }
    }

    // init epistemic perceptions with noise applied
    const intel = scenario.intelQuality;
    for (const viewerId of Object.keys(powers)) {
      for (const targetId of Object.keys(powers)) {
        if (viewerId === targetId) continue;
        const quality = intel[viewerId]?.[targetId] ?? 0.5;
        powers[viewerId].perceivedBy = powers[viewerId].perceivedBy || {};
        if (!powers[viewerId].perceivedBy[targetId]) {
          powers[viewerId].perceivedBy[targetId] = applyEpistemicNoise(
            powers[targetId].trueState, quality
          );
        }
      }
    }

    // ── AOM (autonomy / latency) state schema ────────────────────────────────
    // The Sovereignty Void mechanic (see cascades.js _latencyGate) reads and
    // writes these fields. They are initialized here so the shape is discoverable
    // and code can rely on them existing rather than guarding with `?.`/`|| {}`.
    //
    //   autonomyDelegated  { [powerId]: true }   set when a power takes a
    //       riceMaskStats action (pre_delegate_authority). Switches the latency
    //       gate from "uncommanded drift" to the "autonomous agent acts" branch.
    //       Cleared for a power by revert_midcourse_defense (cancelsBPI).
    //   autonomyMasks      { [powerId]: string[] }  stat domains hidden from all
    //       viewers (Rice-theorem mask). Read by Epistemic.getPerceivedValue,
    //       written by Epistemic.applyRiceMask, cleared by Epistemic.clearRiceMask.
    //   bpiReverted        boolean   one-shot flag. When true the latency gate is
    //       skipped for that turn, then reset back to false.
    //
    // Two related AOM fields live on individual crises (scenario data), not here:
    //   crisis.t_event       boost-phase intercept window in seconds; sovereignty
    //       void fires when t_rat > t_event on that crisis.
    //   crisis.t_rat_penalty seconds added to t_rat while that crisis (c2_blackout)
    //       is escalated.
    // activeSystemicEvents may carry the 'sovereignty_void_active' marker.
    world = {
      year: scenario.startYear,
      turn: 1,
      player: playerId,
      powers,
      crises: scenario.crises.map(c => ({ ...c, cascadeLog: [] })),
      log: [],
      phase: 'player_action',
      pendingActions: [],
      pendingDelayedEffects: [],
      activeSystemicEvents: [],
      intelQuality: cloneIntelMatrix(intel),       // live, decays/refreshes each turn
      intelQualityBase: cloneIntelMatrix(intel),   // ceiling a viewer can be refreshed back toward
      scenarioId: scenario.id,
      doctrine: doctrine || null,
      bilateralDeals: 0,
      multilateralForums: 0,
      multilateralUsed: false,
      playerMilitaryVsUS: 0,
      autonomyDelegated: {},
      autonomyMasks: {},
      bpiReverted: false,
      gameOver: null,
      sim: { active: false, paused: false, speed: 1, cascadeScale: 1.0 }
    };
    return world;
  }

  function applyEpistemicNoise(trueState, quality) {
    const perceived = {};
    for (const [stat, val] of Object.entries(trueState)) {
      if (stat === 'nuclear') {
        perceived[stat] = val;
        continue;
      }
      const noise = (1 - quality) * 25;
      const delta = (Math.random() * 2 - 1) * noise;
      perceived[stat] = Math.max(0, Math.min(100, Math.round(val + delta)));
    }
    return perceived;
  }

  function get() { return world; }

  function getPower(id) { return world.powers[id]; }

  function getPlayer() { return world.powers[world.player]; }

  function getCrisis(id) { return world.crises.find(c => c.id === id); }

  function applyStatDelta(powerId, statKey, delta, toTrueState = true) {
    const power = world.powers[powerId];
    if (!power || !(statKey in power.trueState)) return;
    if (toTrueState) {
      if (statKey === 'nuclear') {
        power.trueState[statKey] = Math.max(0, Math.min(5, power.trueState[statKey] + delta));
      } else {
        power.trueState[statKey] = Math.max(0, Math.min(100, power.trueState[statKey] + delta));
      }
    }
  }

  function adjustRelationship(fromId, toId, delta) {
    const p = world.powers[fromId];
    if (!p) return;
    p.relationships[toId] = Math.max(-100, Math.min(100, (p.relationships[toId] || 0) + delta));
  }

  function adjustCrisisEscalation(crisisId, delta) {
    const crisis = getCrisis(crisisId);
    if (!crisis) return;
    crisis.escalationLevel = Math.max(0, Math.min(5, crisis.escalationLevel + delta));
  }

  function addCrisis(crisis) {
    world.crises.push({ ...crisis, age: 0, cascadeLog: [] });
  }

  function mergeCrises(id1, id2, compound) {
    world.crises = world.crises.filter(c => c.id !== id1 && c.id !== id2);
    world.crises.push({ ...compound, age: 0, cascadeLog: [], compoundOf: [id1, id2] });
  }

  function addLog(entry) {
    world.log.unshift({ turn: world.turn, year: world.year, ...entry });
    if (world.log.length > 200) world.log.pop();
  }

  function advanceTurn() {
    world.turn++;
    if ((world.turn - 1) % 2 === 0) world.year++;
    world.crises.forEach(c => c.age++);
    for (const p of Object.values(world.powers)) {
      p.actionPointsRemaining = p.actionPoints;
      p.apReduced = false;
    }
    world.pendingActions = [];
  }

  function setPhase(phase) { world.phase = phase; }

  function queueAction(action) {
    world.pendingActions.push(action);
    // doctrine win condition tracking
    if (world.doctrine && action.actor === world.player) {
      if (action.actionId === 'trade_deal' || action.actionId === 'bilateral_negotiation') {
        world.bilateralDeals++;
      }
      if (action.actionId === 'multilateral_forum') {
        world.multilateralForums++;
        world.multilateralUsed = true;
      }
      if (world.doctrine.id === 'MING' && action.actionId === 'deploy_forces' && action.target === 'US') {
        world.playerMilitaryVsUS++;
      }
    }
  }

  function clearPendingActions() { world.pendingActions = []; }

  function setSim(patch) { Object.assign(world.sim, patch); }

  function restore(snapshot) { world = JSON.parse(JSON.stringify(snapshot)); }

  function updatePerception(viewerId, targetId, statKey, newValue) {
    const power = world.powers[viewerId];
    if (!power.perceivedBy[targetId]) power.perceivedBy[targetId] = {};
    power.perceivedBy[targetId][statKey] = newValue;
  }

  // Perishable intel: pull every collection link toward INTEL_FLOOR. Called once
  // per turn (Epistemic.update) before driftPerceptions, so the slower convergence
  // takes effect the same turn the source goes stale.
  function decayIntelQuality() {
    for (const viewerId of Object.keys(world.intelQuality)) {
      const row = world.intelQuality[viewerId];
      for (const targetId of Object.keys(row)) {
        const q = row[targetId];
        row[targetId] = Math.max(INTEL_FLOOR, q - (q - INTEL_FLOOR) * INTEL_DECAY_RATE);
      }
    }
  }

  // Fresh collection (an intel action) restores a viewer's quality on a target
  // back toward its scenario ceiling. gainFrac is the fraction of the gap closed.
  function refreshIntel(viewerId, targetId, gainFrac = 0.5) {
    const base = world.intelQualityBase?.[viewerId]?.[targetId];
    if (base == null) return;
    if (!world.intelQuality[viewerId]) world.intelQuality[viewerId] = {};
    const q = world.intelQuality[viewerId][targetId] ?? base;
    world.intelQuality[viewerId][targetId] = Math.min(base, q + (base - q) * gainFrac);
  }

  // Broad collection (a non-targeted grid/ISR action) refreshes the viewer's
  // quality on every target it has a baseline link to.
  function refreshIntelAll(viewerId, gainFrac = 0.5) {
    const targets = world.intelQualityBase?.[viewerId];
    if (!targets) return;
    for (const targetId of Object.keys(targets)) refreshIntel(viewerId, targetId, gainFrac);
  }

  function driftPerceptions() {
    for (const [viewerId, viewer] of Object.entries(world.powers)) {
      for (const [targetId, target] of Object.entries(world.powers)) {
        if (viewerId === targetId) continue;
        const quality = world.intelQuality[viewerId]?.[targetId] ?? 0.5;
        const driftRate = 0.05 + quality * 0.10;
        const perceived = viewer.perceivedBy[targetId];
        if (!perceived) continue;
        for (const [stat, trueVal] of Object.entries(target.trueState)) {
          if (stat === 'nuclear') continue;
          const cur = perceived[stat] ?? trueVal;
          // (1) convergence toward truth, sharpened by intel quality
          let next = cur + (trueVal - cur) * driftRate;
          // (2) estimation noise: poor collection wanders, so divergence
          //     accumulates each turn the viewer can't see clearly
          const noise = (Math.random() * 2 - 1) * (1 - quality) * PERCEPTION_NOISE;
          perceived[stat] = Math.max(0, Math.min(100, Math.round(next + noise)));
        }
      }
    }
  }

  function getGlobalStabilityIndex() {
    const powers = Object.values(world.powers);
    const avg = powers.reduce((sum, p) => sum + p.trueState.domestic, 0) / powers.length;
    return Math.round(avg);
  }

  // Second composite outcome metric. GSI alone keys on mean domestic stability and
  // ignores live crises and nuclear posture, so it can read "stable" while the
  // board is one escalation from a nuclear exchange. This folds both in and also
  // returns the raw components so research can key on any of them.
  function getSystemicRiskIndex() {
    const crisisPressure = world.crises.reduce((sum, c) => sum + (c.escalationLevel || 0), 0);
    const maxNuclear = Object.values(world.powers).reduce(
      (max, p) => Math.max(max, p.trueState.nuclear || 0), 0
    );
    const index = Math.max(0, Math.min(100,
      getGlobalStabilityIndex() - 4 * crisisPressure - 6 * maxNuclear
    ));
    return { index, crisisPressure, maxNuclear };
  }

  function checkGameOver() {
    // Nuclear exchange: any military, compound, or autonomous (boost-phase) crisis at level 5
    const nuclear = world.crises.find(c => (c.domain === 'military' || c.domain === 'compound' || c.domain === 'autonomous') && c.escalationLevel >= 5);
    if (nuclear) {
      const reason = nuclear.domain === 'autonomous'
        ? `Sovereignty void cascaded to terminal threshold. ${nuclear.name} exceeded all governance bounds.`
        : 'Nuclear exchange. Civilization does not recover.';
      world.gameOver = { result: 'lose', reason };
      return true;
    }
    // Player collapse
    const player = getPlayer();
    if (player.trueState.domestic <= 0) {
      world.gameOver = { result: 'lose', reason: 'Domestic collapse. Your government has fallen.' };
      return true;
    }
    // Two major power collapses
    const collapsed = Object.values(world.powers).filter(p => p.trueState.domestic <= 15);
    if (collapsed.length >= 2) {
      world.gameOver = { result: 'lose', reason: 'Cascading state failures. The international order has dissolved.' };
      return true;
    }
    // doctrine early failure (MAGA: entered multilateral forum)
    if (world.doctrine && world.doctrine.id === 'MAGA' && world.multilateralUsed) {
      world.gameOver = { result: 'lose', reason: world.doctrine.doctrineFailCondition };
      return true;
    }

    // Win: reach turn 20
    if (world.turn >= 20) {
      if (world.doctrine) {
        const docResult = checkDoctrineWin(world);
        if (docResult.win) {
          world.gameOver = { result: 'win', reason: world.doctrine.doctrineWinMessage };
        } else {
          world.gameOver = { result: 'lose', reason: docResult.failReason || world.doctrine.doctrineFailCondition };
        }
      } else {
        const gsi = getGlobalStabilityIndex();
        if (gsi >= 40) {
          world.gameOver = { result: 'win', reason: `You reached 2030 with a global stability index of ${gsi}. A precarious peace holds.` };
        } else {
          world.gameOver = { result: 'lose', reason: `You reached 2030, but the world stability index collapsed to ${gsi}. History will not be kind.` };
        }
      }
      return true;
    }
    return false;
  }

  function checkDoctrineWin(world) {
    const player = getPlayer();
    const d = world.doctrine;

    if (d.id === 'MAGA') {
      if (world.bilateralDeals >= 2 && player.trueState.domestic >= 65) {
        return { win: true };
      }
      const failReason = world.bilateralDeals < 2
        ? `Only ${world.bilateralDeals} deals struck. The art of the deal eluded you.`
        : `Domestic support collapsed to ${player.trueState.domestic}. The base didn't hold.`;
      return { win: false, failReason };
    }

    if (d.id === 'TWELVER') {
      const activeIRCrises = world.crises.filter(c => c.involved.includes('IR') && c.escalationLevel >= 2).length;
      if (player.trueState.nuclear >= 4 || activeIRCrises >= 2) {
        return { win: true };
      }
      return { win: false, failReason: `Nuclear program stalled at level ${player.trueState.nuclear}. The threshold was not crossed.` };
    }

    if (d.id === 'EU_FATALISM') {
      if (world.multilateralForums >= 3 && player.trueState.domestic >= 50) {
        return { win: true };
      }
      const failReason = world.multilateralForums < 3
        ? `Only ${world.multilateralForums} forums convened. Process failed.`
        : `Domestic stability collapsed to ${player.trueState.domestic}. The project failed from within.`;
      return { win: false, failReason };
    }

    if (d.id === 'MING') {
      const taiwan = world.crises.find(c =>
        (c.id === 'taiwan_military') ||
        (c.domain === 'military' && c.involved.includes('CN') && c.involved.includes('US'))
      );
      const taiwanResolved = !taiwan || taiwan.escalationLevel <= 1;
      if (player.trueState.economic >= 80 && taiwanResolved && world.playerMilitaryVsUS === 0) {
        return { win: true };
      }
      if (!taiwanResolved) return { win: false, failReason: `Taiwan crisis unresolved at level ${taiwan?.escalationLevel}. Patience failed.` };
      if (world.playerMilitaryVsUS > 0) return { win: false, failReason: d.doctrineFailCondition };
      return { win: false, failReason: `Economic strength at ${player.trueState.economic}/80. The restoration fell short.` };
    }

    if (d.id === 'JUCHE') {
      const n = player.trueState.nuclear;
      const us = world.powers.US;
      const usLead = us ? (us.trueState.military - player.trueState.military) : 0;
      if (n >= 4 && usLead <= 30) return { win: true };
      if (n < 4) {
        return { win: false, failReason: `Nuclear deterrent stalled at level ${n}. The threshold was not crossed.` };
      }
      return { win: false, failReason: `US conventional lead is ${usLead}. The deterrent is not credible.` };
    }

    // fallback: standard GSI check
    const gsi = getGlobalStabilityIndex();
    return gsi >= 40 ? { win: true } : { win: false, failReason: `Global stability: ${gsi}. Not enough.` };
  }

  return {
    init, get, getPower, getPlayer, getCrisis,
    applyStatDelta, adjustRelationship, adjustCrisisEscalation,
    addCrisis, mergeCrises, addLog, advanceTurn, setPhase, queueAction, clearPendingActions,
    updatePerception, driftPerceptions, decayIntelQuality, refreshIntel, refreshIntelAll,
    getGlobalStabilityIndex, getSystemicRiskIndex, checkGameOver,
    applyEpistemicNoise, setSim, restore
  };
})();
