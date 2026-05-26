const AI = (() => {

  const PERSONALITIES = {
    US: {
      riskTolerance: 0.55,
      patience: 0.5,
      priorityDomains: ['military', 'economic', 'diplomatic'],
      flavorText: [
        'Washington signals resolve with a forward deployment.',
        'The US leverages its economic network to apply pressure.',
        'State Department opens a diplomatic channel.',
        'The Pentagon adjusts its posture in the region.',
        'Washington issues a statement warning of consequences.'
      ]
    },
    CN: {
      riskTolerance: 0.4,
      patience: 0.9,
      priorityDomains: ['economic', 'diplomatic', 'cyber'],
      flavorText: [
        'China makes a calibrated economic move.',
        'Beijing signals displeasure through official channels.',
        'China activates cyber capabilities quietly.',
        'The PRC issues a carefully worded statement.'
      ]
    },
    RU: {
      riskTolerance: 0.75,
      patience: 0.35,
      priorityDomains: ['military', 'info', 'cyber'],
      flavorText: [
        'Russia exploits a perceived gap in deterrence.',
        'Moscow escalates in a domain where costs seem low.',
        'Russia amplifies information operations.',
        'The Kremlin tests resolve with a calculated provocation.'
      ]
    },
    EU: {
      riskTolerance: 0.3,
      patience: 0.7,
      priorityDomains: ['diplomatic', 'economic'],
      flavorText: [
        'The EU issues a strongly-worded communiqué.',
        'Brussels moves toward expanded sanctions.',
        'The EU activates its foreign policy coordination mechanism.',
        'European capitals signal concern through diplomatic channels.'
      ]
    },
    IN: {
      riskTolerance: 0.45,
      patience: 0.7,
      priorityDomains: ['diplomatic', 'economic'],
      flavorText: [
        'India hedges, refusing to publicly take sides.',
        'New Delhi opens parallel back-channels.',
        'India signals strategic autonomy with an independent statement.',
        'The Indian government prioritizes domestic stability over external commitment.'
      ]
    },
    GB: {
      riskTolerance: 0.5,
      patience: 0.6,
      priorityDomains: ['economic', 'military'],
      flavorText: [
        'The Gulf Bloc watches oil futures and adjusts posture.',
        'Gulf states quietly diversify their alignment.',
        'The Gulf Bloc signals willingness to broker.',
        'Gulf capitals prioritize energy revenue above strategic commitments.'
      ]
    },
    IR: {
      riskTolerance: 0.7,
      patience: 0.65,
      priorityDomains: ['military', 'info', 'cyber'],
      flavorText: [
        'Iran activates a proxy network with plausible deniability.',
        'The IRGC escalates in a domain where attribution is unclear.',
        'Tehran reads weakness as invitation.',
        'Iran leverages its resistance axis to apply pressure.',
        'The nuclear program advances, step by carefully calculated step.'
      ]
    }
  };

  function getMergeRisk(powerId, world) {
    const involved = world.crises.filter(c => c.involved.includes(powerId) && c.escalationLevel >= 2);
    if (involved.length < 2) return false;
    const regions = involved.map(c => (c.location && c.location.region) || c.domain);
    return regions.length !== new Set(regions).size;
  }

  function getStrategicPosture(powerId, persona, mergeRisk, world) {
    const power = world.powers[powerId];
    const involvedCrises = world.crises.filter(c => c.involved.includes(powerId));
    const maxLevel = involvedCrises.reduce((m, c) => Math.max(m, c.escalationLevel), 0);

    if (maxLevel >= 4) return 'de-escalate';
    if (mergeRisk) return 'de-escalate';
    if (maxLevel >= 3 && persona.riskTolerance < 0.6) return 'de-escalate';
    if (power.trueState.domestic < 35) return 'consolidate';
    if (maxLevel >= 3) return 'hold';
    if (maxLevel === 0) return persona.riskTolerance > 0.6 ? 'escalate' : 'hold';
    return 'hold';
  }

  function decideTurn(powerId, world) {
    const power = world.powers[powerId];
    const persona = PERSONALITIES[powerId] || {
      riskTolerance: 0.5,
      patience: 0.5,
      priorityDomains: ['diplomatic', 'economic'],
      flavorText: ['Acts cautiously.']
    };

    const actions = [];
    let apRemaining = power.actionPointsRemaining;

    const domesticConstrained = power.trueState.domestic < 40;
    const threatSource = getMostThreateningPower(powerId, world);
    const activeCrisis = world.crises.find(c =>
      c.involved.includes(powerId) && c.escalationLevel >= 2
    );

    const lastMem = power.memory[power.memory.length - 1];
    const lastActions = lastMem ? lastMem.actions.map(a => a.actionId) : [];
    const prevMem = power.memory[power.memory.length - 2];
    const prevActions = prevMem ? prevMem.actions.map(a => a.actionId) : [];
    const mergeRisk = getMergeRisk(powerId, world);
    const posture = getStrategicPosture(powerId, persona, mergeRisk, world);
    const involvedCrises = world.crises.filter(c => c.involved.includes(powerId));
    const crisisLevel = involvedCrises.reduce((m, c) => Math.max(m, c.escalationLevel), 0);

    let actionPool = selectActionPool(powerId, persona, activeCrisis, threatSource, domesticConstrained, world);

    while (apRemaining > 0 && actionPool.length > 0) {
      const scored = actionPool
        .filter(a => a.cost <= apRemaining)
        .map(a => ({ ...a, score: scoreAction(a, powerId, persona, activeCrisis, threatSource, posture, crisisLevel, lastActions, prevActions, world) }))
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) break;

      const chosen = scored[0];
      const target = chooseTarget(chosen, powerId, threatSource, activeCrisis, world);

      actions.push({
        actor: powerId,
        actionId: chosen.id,
        target,
        flavor: persona.flavorText[Math.floor(Math.random() * persona.flavorText.length)]
      });

      apRemaining -= chosen.cost;
      actionPool = actionPool.filter(a => a.id !== chosen.id);
    }

    power.actionPointsRemaining = 0;
    power.memory.push({ turn: world.turn, actions });
    if (power.memory.length > 10) power.memory.shift();

    return actions;
  }

  function getMostThreateningPower(powerId, world) {
    const power = world.powers[powerId];
    let mostHostile = null;
    let lowestRel = 0;
    for (const [otherId, rel] of Object.entries(power.relationships)) {
      if (rel < lowestRel) {
        lowestRel = rel;
        mostHostile = otherId;
      }
    }
    return mostHostile;
  }

  function selectActionPool(powerId, persona, activeCrisis, threatSource, domesticConstrained, world) {
    const allActions = Domains.getAll();
    let pool = [];

    // always include priority domain actions
    for (const domain of persona.priorityDomains) {
      pool.push(...Domains.getByDomain(domain));
    }

    // if in a crisis, add responses relevant to its domain
    if (activeCrisis) {
      pool.push(...Domains.getByDomain(activeCrisis.domain));
    }

    // if domestic constrained, add domestic actions, remove high military
    if (domesticConstrained) {
      pool.push(...Domains.getByDomain('domestic'));
      pool = pool.filter(a => !(a.domain === 'military' && a.escalationDelta > 0));
    }

    // deduplicate
    const seen = new Set();
    return pool.filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }

  function scoreAction(action, powerId, persona, activeCrisis, threatSource, posture, crisisLevel, lastActions, prevActions, world) {
    let score = 0;
    const power = world.powers[powerId];

    // base score from domain priority
    const domainPriority = persona.priorityDomains.indexOf(action.domain);
    if (domainPriority === 0) score += 30;
    else if (domainPriority === 1) score += 20;
    else if (domainPriority === 2) score += 10;

    // risk-tolerance modifies escalatory actions (baseline)
    if (action.escalationDelta > 0) score += persona.riskTolerance * 25;
    if (action.escalationDelta < 0) score += (1 - persona.riskTolerance) * 20;

    // crisis patience weight for de-escalation
    if (activeCrisis && activeCrisis.domain === action.domain && action.escalationDelta < 0) {
      score += persona.patience * 15;
    }

    // hard ceiling: crisis at level ≥ 4 → escalatory actions excluded
    if (crisisLevel >= 4 && action.escalationDelta > 0) return -999;

    // posture-driven overrides (dominant factor)
    if (action.escalationDelta > 0) {
      if (posture === 'de-escalate') score -= 80;
      else if (posture === 'hold') score -= 20;
      else if (posture === 'escalate') score += 20;
      else if (posture === 'consolidate') score -= 30;
    }
    if (action.escalationDelta < 0) {
      if (posture === 'de-escalate') score += 50;
      else if (posture === 'hold') score += 15;
      else if (posture === 'escalate') score -= 10;
      else if (posture === 'consolidate') score += 10;
    }

    // memory-based stance persistence
    if (lastActions.includes('deploy_forces') && action.id === 'force_withdrawal') score -= 40;
    if (lastActions.includes('force_withdrawal') && action.id === 'deploy_forces') score -= 35;
    if (posture === 'de-escalate' && lastActions.some(id => {
      const a = Domains.getById(id); return a && a.escalationDelta < 0;
    })) score += 10;
    // mild repeat-avoidance for non-posture actions
    if (lastActions.includes(action.id) && prevActions.includes(action.id)) score -= 8;

    // prefer defensive actions if stat is low
    if (action.id === 'cyber_defense_hardening' && power.trueState.cyber < 50) score += 20;
    if (action.id === 'grid_stabilization' && power.trueState.domestic < 45) score += 25;
    if (action.id === 'coalition_shoring' && power.trueState.domestic < 50) score += 15;

    // noise inversely proportional to crisis severity
    const maxNoise = Math.max(2, 10 - crisisLevel * 2);
    score += (Math.random() - 0.5) * maxNoise;

    return score;
  }

  function chooseTarget(action, actorId, threatSource, activeCrisis, world) {
    if (!action.requiresTarget) return null;

    // for hostile actions, target the threat source
    if (action.escalationDelta > 0 && threatSource) return threatSource;

    // for cooperative actions, find the most-aligned power
    if (action.escalationDelta < 0 || action.domain === 'diplomatic') {
      const actor = world.powers[actorId];
      let bestId = null;
      let bestRel = -Infinity;
      for (const [otherId, rel] of Object.entries(actor.relationships)) {
        if (otherId !== actorId && rel > bestRel) {
          bestRel = rel;
          bestId = otherId;
        }
      }
      return bestId;
    }

    // for crisis-relevant actions, target involved power
    if (activeCrisis) {
      return activeCrisis.involved.find(id => id !== actorId) || threatSource;
    }

    return threatSource;
  }

  function getAdvisorWarnings(world) {
    const warnings = [];
    const player = State.getPlayer();
    const playerPerceptions = player.perceivedBy;

    for (const [targetId, perceived] of Object.entries(playerPerceptions)) {
      const target = world.powers[targetId];
      if (!target) continue;

      for (const [stat, perceivedVal] of Object.entries(perceived)) {
        const trueVal = target.trueState[stat];
        if (stat === 'nuclear') continue;
        const gap = Math.abs(trueVal - perceivedVal);
        const quality = world.intelQuality[world.player]?.[targetId] ?? 0.5;
        const uncertainty = Math.round((1 - quality) * 25);

        if (gap > 15) {
          const direction = trueVal > perceivedVal ? 'higher' : 'lower';
          warnings.push({
            type: 'intel_gap',
            severity: gap > 25 ? 'high' : 'medium',
            text: `${target.name}'s ${stat} may be ${direction} than reported. Our models suggest ${perceivedVal} ± ${uncertainty}.`,
            targetId
          });
        }
      }

      // nuclear posture warnings
      if (target.trueState.nuclear >= 3) {
        warnings.push({
          type: 'nuclear',
          severity: 'high',
          text: `${target.name} nuclear posture elevated to level ${target.trueState.nuclear}. Strategic ambiguity narrowing.`,
          targetId
        });
      }
    }

    // domestic fragility warnings
    for (const [id, power] of Object.entries(world.powers)) {
      if (id === world.player) continue;
      if (power.trueState.domestic < 35) {
        warnings.push({
          type: 'domestic_fragility',
          severity: 'high',
          text: `${power.name} domestic stability critically low (${power.trueState.domestic}). Risk of constrained or irrational action elevated.`,
          targetId: id
        });
      }
    }

    // cascade warnings
    const sanctionsActive = world.crises.filter(c => c.domain === 'economic' && c.escalationLevel >= 3).length;
    if (sanctionsActive >= 2) {
      warnings.push({
        type: 'systemic',
        severity: 'medium',
        text: `Multiple high-level economic crises active. Financial clearing fragmentation risk: ELEVATED.`
      });
    }

    // doctrine-flavored briefing line
    if (world.doctrine) {
      const d = world.doctrine;
      const line = d.advisorLines[Math.floor(Math.random() * d.advisorLines.length)];
      const doctrineNote = buildDoctrineNote(d, world, warnings);
      warnings.unshift({
        type: 'doctrine',
        severity: 'low',
        text: `[${d.advisorTagline}] ${doctrineNote || line}`
      });
    }

    return warnings.slice(0, 6);
  }

  function buildDoctrineNote(doctrine, world, warnings) {
    const player = State.getPlayer();
    if (doctrine.id === 'MAGA') {
      if (world.bilateralDeals < 2) return `Deals on the board: ${world.bilateralDeals}/2. Close something.`;
      if (player.trueState.domestic < 65) return `Domestic at ${player.trueState.domestic}. Base is watching.`;
      if (world.multilateralUsed) return `WARNING: Multilateral forum entered. Doctrine integrity compromised.`;
    }
    if (doctrine.id === 'TWELVER') {
      const nuclear = player.trueState.nuclear;
      if (nuclear < 4) return `Nuclear program: level ${nuclear}/4. The threshold approaches.`;
      return `Threshold reached. The world holds its breath.`;
    }
    if (doctrine.id === 'EU_FATALISM') {
      return `Multilateral forums convened: ${world.multilateralForums}/3. Process continues.`;
    }
    if (doctrine.id === 'MING') {
      const taiwan = world.crises.find(c => c.id === 'taiwan_military' || c.domain === 'military' && c.involved.includes('CN') && c.involved.includes('US'));
      if (taiwan) return `Taiwan escalation: level ${taiwan.escalationLevel}/5. Keep it below 2. Patience.`;
      return `Economic: ${player.trueState.economic}/80 target. The long game proceeds.`;
    }
    return null;
  }

  return { decideTurn, getAdvisorWarnings };
})();
