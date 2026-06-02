const Cascades = (() => {

  function drainDelayedEffects(world, log) {
    if (!world.pendingDelayedEffects || world.pendingDelayedEffects.length === 0) return;
    const ready = world.pendingDelayedEffects.filter(e => e.fireOnTurn <= world.turn);
    world.pendingDelayedEffects = world.pendingDelayedEffects.filter(e => e.fireOnTurn > world.turn);
    for (const e of ready) {
      if (e.effect.self) {
        for (const [stat, delta] of Object.entries(e.effect.self)) {
          State.applyStatDelta(e.actor, stat, delta);
        }
      }
      if (e.effect.target && e.target) {
        for (const [stat, delta] of Object.entries(e.effect.target)) {
          State.applyStatDelta(e.target, stat, delta);
        }
      }
      log.push({ order: 2, confidence: 'CONFIRMED', actor: e.actor,
        text: `[delayed] ${e.label}`, type: 'cascade' });
    }
  }

  function _latencyGate(actions, world, log) {
    if (world.bpiReverted) { world.bpiReverted = false; return; }

    const baseTRat = world.doctrine?.profile?.t_rat ?? 999;
    const c2 = (world.crises || []).find(c => c.id === 'c2_blackout');
    const penalty = (c2 && c2.escalationLevel > 0) ? (c2.t_rat_penalty || 0) : 0;
    const t_rat = baseTRat + penalty;
    const delegated = world.autonomyDelegated?.[world.player];

    for (const crisis of (world.crises || [])) {
      if (!crisis.t_event || crisis.escalationLevel <= 0) continue;
      if (!delegated && t_rat <= crisis.t_event) continue;

      const escalationDelta = delegated ? -1 : 2;
      State.adjustCrisisEscalation(crisis.id, escalationDelta);
      if (!world.activeSystemicEvents.includes('sovereignty_void_active')) {
        world.activeSystemicEvents.push('sovereignty_void_active');
      }
      log.push({
        order: 1,
        confidence: 'CONFIRMED',
        actor: delegated ? 'AUTONOMOUS AGENT' : 'UNCOMMANDED DRIFT',
        text: delegated
          ? `[AUTONOMOUS ENGAGEMENT] ${crisis.name}: Pre-delegated agent acted. t_rat bypassed. DoDD 3000.09 violated.`
          : `[SOVEREIGNTY VOID] ${crisis.name}: t_rat (${t_rat}s) > t_event (${crisis.t_event}s). Uncommanded drift. Player input not registered.`,
        type: 'sovereignty_void'
      });
      if (!delegated) {
        const idx = actions.findIndex(a =>
          a.actor === world.player && a.actionId === 'boost_phase_intercept'
        );
        if (idx !== -1) actions.splice(idx, 1);
      }
    }
  }

  function resolve(pendingActions, world) {
    const log = [];

    // latency gate: fires before any player input registers on boost-phase crises
    _latencyGate(pendingActions, world, log);

    // drain queued delayed effects from prior turns
    drainDelayedEffects(world, log);

    // expire pressure markers so they re-evaluate each turn
    world.activeSystemicEvents = world.activeSystemicEvents.filter(e => !e.endsWith('_pressure'));

    // 1st order: apply all direct effects simultaneously
    for (const action of pendingActions) {
      apply1stOrder(action, world, log);
    }

    // 2nd order: probabilistic effects
    for (const action of pendingActions) {
      apply2ndOrder(action, world, log);
    }

    // 3rd order: conditional entanglements
    apply3rdOrder(pendingActions, world, log);

    // 3.5 order: cross-domain crisis merging
    applyCrisisMerging(world, log);

    // 3.75 order: crisis natural decay
    applyCrisisDecay(pendingActions, world, log);

    // 4th+ order: systemic thresholds
    applySystemicThresholds(world, log);

    return log;
  }

  function apply1stOrder(action, world, log) {
    const def = Domains.getById(action.actionId);
    if (!def) return;

    const actor = State.getPower(action.actor);
    const target = action.target ? State.getPower(action.target) : null;

    if (def.effects1st.self) {
      for (const [stat, delta] of Object.entries(def.effects1st.self)) {
        State.applyStatDelta(action.actor, stat, delta);
        if (Math.abs(delta) >= 3) {
          log.push({
            order: 1,
            confidence: 'CONFIRMED',
            actor: action.actor,
            text: `[${actor.name}] ${def.name}: ${stat} ${delta > 0 ? '+' : ''}${delta}`,
            type: 'stat_change'
          });
        }
      }
    }

    if (target && def.effects1st.target) {
      for (const [stat, delta] of Object.entries(def.effects1st.target)) {
        State.applyStatDelta(action.target, stat, delta);
        if (Math.abs(delta) >= 3) {
          log.push({
            order: 1,
            confidence: 'CONFIRMED',
            actor: action.actor,
            text: `[${actor.name} → ${target.name}] ${def.name}: ${target.name} ${stat} ${delta > 0 ? '+' : ''}${delta}`,
            type: 'stat_change'
          });
        }
      }
    }

    if (def.escalationDelta !== 0) {
      const crisis = findRelevantCrisis(action, world);
      if (crisis) {
        const prev = crisis.escalationLevel;
        State.adjustCrisisEscalation(crisis.id, def.escalationDelta);
        if (crisis.escalationLevel !== prev) {
          log.push({
            order: 1,
            confidence: 'CONFIRMED',
            actor: action.actor,
            text: `[${crisis.name}] Escalation: ${prev} → ${crisis.escalationLevel}`,
            type: 'escalation'
          });
        }
      }
    }

    if (def.domain === 'diplomatic' && def.escalationDelta < 0 && action.target) {
      State.adjustRelationship(action.actor, action.target, 8);
      State.adjustRelationship(action.target, action.actor, 5);
    }
    if ((def.id === 'sanctions' || def.id === 'financial_pressure') && action.target) {
      State.adjustRelationship(action.actor, action.target, -10);
      State.adjustRelationship(action.target, action.actor, -12);
    }

    // AOM: Rice-Theorem mask — applied when pre-delegating autonomous authority
    const alreadyDelegated = !!world.autonomyDelegated?.[action.actor];
    if (def.riceMaskStats && def.riceMaskStats.length > 0 && !alreadyDelegated) {
      Epistemic.applyRiceMask(action.actor, def.riceMaskStats, world);
      world.autonomyDelegated = world.autonomyDelegated || {};
      world.autonomyDelegated[action.actor] = true;
    }

    // AOM: trigger a dormant crisis (e.g. policy_review_tribunal on DoDD violation)
    if (def.triggersCrisis && !alreadyDelegated) {
      const tc = (world.crises || []).find(c => c.id === def.triggersCrisis);
      if (tc && tc.escalationLevel === 0) {
        State.adjustCrisisEscalation(tc.id, 1);
        log.push({
          order: 1, confidence: 'CONFIRMED', actor: action.actor,
          text: `[POLICY TRIGGER] ${tc.name} activated — DoDD 3000.09 pre-delegation threshold crossed.`,
          type: 'escalation'
        });
      }
    }

    // AOM: Path 3 — flag the latency gate to skip this turn, and restore human
    // control by undoing any prior pre-delegation (clears the autonomy flag and
    // lifts the Rice mask for this actor).
    if (def.cancelsBPI) {
      world.bpiReverted = true;
      if (world.autonomyDelegated) delete world.autonomyDelegated[action.actor];
      Epistemic.clearRiceMask(action.actor, world);
    }
  }

  function apply2ndOrder(action, world, log) {
    const def = Domains.getById(action.actionId);
    if (!def || !def.effects2nd) return;

    const target = action.target ? State.getPower(action.target) : null;

    for (const effect of def.effects2nd) {
      if (Math.random() > effect.prob) continue;

      const confidence = probToConfidence(effect.prob);

      if (effect.delay) {
        if (!world.pendingDelayedEffects) world.pendingDelayedEffects = [];
        world.pendingDelayedEffects.push({
          actor: action.actor,
          target: action.target,
          effect: effect.effect,
          label: effect.label,
          fireOnTurn: world.turn + effect.delay
        });
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order +${effect.delay}t] ${effect.label}`, type: 'cascade' });
        continue;
      }

      if (effect.effect.self) {
        for (const [stat, delta] of Object.entries(effect.effect.self)) {
          State.applyStatDelta(action.actor, stat, delta);
        }
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'cascade' });
      }

      if (effect.effect.target && target) {
        for (const [stat, delta] of Object.entries(effect.effect.target)) {
          State.applyStatDelta(action.target, stat, delta);
        }
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'cascade' });
      }

      if (effect.effect.crisis_escalation !== undefined) {
        const crisis = findRelevantCrisis(action, world);
        if (crisis) {
          State.adjustCrisisEscalation(crisis.id, effect.effect.crisis_escalation);
          log.push({ order: 2, confidence, actor: action.actor,
            text: `[2nd order] ${effect.label} → ${crisis.name} escalation shifted`, type: 'escalation' });
        }
      }

      if (effect.effect.relationship_target && target) {
        State.adjustRelationship(action.actor, action.target, effect.effect.relationship_target);
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'relationship' });
      }

      // ally_relationships / ally_relationship / relationship_ally are all the same intent
      const allyDelta = effect.effect.ally_relationships ?? effect.effect.ally_relationship ?? effect.effect.relationship_ally;
      if (allyDelta !== undefined) {
        const allies = getAlliesOf(action.actor, world);
        for (const ally of allies) {
          State.adjustRelationship(action.actor, ally, allyDelta);
        }
        if (allies.length > 0) {
          log.push({ order: 2, confidence, actor: action.actor,
            text: `[2nd order] ${effect.label}`, type: 'relationship' });
        }
      }

      if (effect.effect.adversary_relationship && target) {
        State.adjustRelationship(action.target, action.actor, effect.effect.adversary_relationship);
      }

      if (effect.effect.adversary_cyber && target) {
        State.applyStatDelta(action.target, 'cyber', effect.effect.adversary_cyber);
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'cascade' });
      }

      if (effect.effect.third_party_hostility) {
        const bystanders = getBystanderPowers(action.actor, action.target, world);
        for (const b of bystanders) {
          State.adjustRelationship(b, action.actor, -effect.effect.third_party_hostility);
        }
        if (bystanders.length > 0) {
          log.push({ order: 2, confidence, actor: action.actor,
            text: `[2nd order] ${effect.label}: regional powers grow wary`, type: 'relationship' });
        }
      }

      // systemic_risk: push pressure marker so threshold logic can fire later
      if (effect.effect.systemic_risk) {
        const marker = effect.effect.systemic_risk + '_pressure';
        if (!world.activeSystemicEvents.includes(marker)) {
          world.activeSystemicEvents.push(marker);
        }
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label} — systemic pressure building: ${effect.effect.systemic_risk}`,
          type: 'systemic_warning' });
      }

      // target_perception_distorted: plant disinformation via Epistemic
      if (effect.effect.target_perception_distorted && target) {
        const stats = Object.keys(target.trueState).filter(s => s !== 'nuclear');
        const stat = stats[Math.floor(Math.random() * stats.length)];
        const trueVal = target.trueState[stat];
        const sign = Math.random() < 0.5 ? -1 : 1;
        const distortion = sign * Math.round(trueVal * 0.25 + 5);
        const falseVal = Math.max(0, Math.min(100, trueVal + distortion));
        Epistemic.applyDisinformation(action.actor, action.target, stat, falseVal, world);
        log.push({ order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'epistemic' });
      }
    }
  }

  function apply3rdOrder(actions, world, log) {
    const scale = world.sim?.cascadeScale ?? 1.0;

    // Sanctions stacking: push pressure marker for threshold
    const sanctionsCount = actions.filter(a => a.actionId === 'sanctions' || a.actionId === 'financial_pressure').length;
    if (sanctionsCount >= 2) {
      const marker = 'financial_fragmentation_pressure';
      if (!world.activeSystemicEvents.includes(marker)) {
        world.activeSystemicEvents.push(marker);
      }
      log.push({ order: 3, confidence: 'POSSIBLE (40%)', actor: 'SYSTEM',
        text: `[3rd order] Multiple simultaneous sanctions — financial clearing network stress building. Fragmentation risk elevated.`,
        type: 'systemic_warning' });
    }

    // Multi-cyber probe: push internet_balkanization and apply immediate stat hit
    const cyberProbes = actions.filter(a => a.actionId === 'cyber_infrastructure_probe').length;
    if (cyberProbes >= 2) {
      if (!world.activeSystemicEvents.includes('internet_balkanization')) {
        world.activeSystemicEvents.push('internet_balkanization');
        const delta = Math.round(-6 * scale);
        for (const p of Object.values(world.powers)) {
          State.applyStatDelta(p.id, 'cyber', delta);
        }
        log.push({ order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[3rd order] Simultaneous cyber probes — internet balkanization threshold crossed. All powers cyber ${delta}.`,
          type: 'systemic_event' });
      } else {
        log.push({ order: 3, confidence: 'POSSIBLE (40%)', actor: 'SYSTEM',
          text: `[3rd order] Simultaneous cyber probes — internet balkanization pressure intensifying.`,
          type: 'systemic_warning' });
      }
    }

    // Force + sanctions combo: coordinated military + economic pressure on one target
    const combinedPressure = {};
    for (const action of actions) {
      if (!action.target) continue;
      if (!combinedPressure[action.target]) combinedPressure[action.target] = { military: 0, economic: 0 };
      const def = Domains.getById(action.actionId);
      if (!def) continue;
      if (def.domain === 'military') combinedPressure[action.target].military++;
      if (def.domain === 'economic') combinedPressure[action.target].economic++;
    }
    for (const [targetId, counts] of Object.entries(combinedPressure)) {
      if (counts.military >= 1 && counts.economic >= 1) {
        const delta = Math.round(-8 * scale);
        State.applyStatDelta(targetId, 'domestic', delta);
        State.applyStatDelta(targetId, 'military', delta);
        log.push({ order: 3, confidence: 'LIKELY (65%)', actor: 'SYSTEM',
          text: `[3rd order] Coordinated military + economic pressure on ${State.getPower(targetId).name} — compounding domestic strain. domestic ${delta}, military ${delta}.`,
          type: 'compound_pressure' });
      }
    }

    // Emergency powers spiral: two or more powers invoke emergency powers same turn
    const emergencyCount = actions.filter(a => a.actionId === 'emergency_powers').length;
    if (emergencyCount >= 2 && !world.activeSystemicEvents.includes('emergency_powers_spiral')) {
      world.activeSystemicEvents.push('emergency_powers_spiral');
      for (const action of actions.filter(a => a.actionId === 'emergency_powers')) {
        State.applyStatDelta(action.actor, 'domestic', Math.round(-6 * scale));
        State.adjustRelationship(action.actor,
          Object.keys(world.powers).find(id => id !== action.actor), -5);
      }
      log.push({ order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[3rd order] Multiple powers declare emergency powers simultaneously — allies alarmed, international legitimacy erodes.`,
        type: 'systemic_warning' });
    }

    // EMP strike collateral: electromagnetic burst bleeds into adjacent powers' cyber
    const empStrikes = actions.filter(a => a.actionId === 'emp_strike');
    if (empStrikes.length > 0) {
      const marker = 'emp_cascade_pressure';
      if (!world.activeSystemicEvents.includes(marker)) {
        world.activeSystemicEvents.push(marker);
      }
      const cyberDelta = Math.round(-6 * scale);
      for (const strike of empStrikes) {
        const bystanders = getBystanderPowers(strike.actor, strike.target, world);
        for (const b of bystanders) {
          State.applyStatDelta(b, 'cyber', cyberDelta);
        }
        if (bystanders.length > 0) {
          log.push({ order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
            text: `[3rd order] EMP burst from ${State.getPower(strike.actor).name} attack on ${State.getPower(strike.target).name} — electromagnetic spillover hits bystander C4ISR. All other powers cyber ${cyberDelta}.`,
            type: 'systemic_warning' });
        }
      }
    }

    // ASAT strike collateral: orbital debris field bleeds onto bystanders' space assets
    const asatStrikes = actions.filter(a => a.actionId === 'asat_strike');
    if (asatStrikes.length > 0) {
      const marker = 'kessler_pressure';
      if (!world.activeSystemicEvents.includes(marker)) {
        world.activeSystemicEvents.push(marker);
      }
      const spaceDelta = Math.round(-6 * scale);
      for (const strike of asatStrikes) {
        const bystanders = getBystanderPowers(strike.actor, strike.target, world);
        for (const b of bystanders) {
          State.applyStatDelta(b, 'space', spaceDelta);
        }
        if (bystanders.length > 0) {
          log.push({ order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
            text: `[3rd order] ASAT debris from ${State.getPower(strike.actor).name} strike on ${State.getPower(strike.target).name} — fragment cloud sweeps shared orbits. All other powers space ${spaceDelta}.`,
            type: 'systemic_warning' });
        }
      }
    }

    // Urban siege: an encirclement seeds a persistent quagmire (recurring attrition resolved in 4th order)
    const siegeActions = actions.filter(a => a.actionId === 'siege_encirclement');
    if (siegeActions.length > 0 && !world.activeSystemicEvents.includes('urban_quagmire')) {
      world.activeSystemicEvents.push('urban_quagmire');
      log.push({ order: 3, confidence: 'LIKELY (65%)', actor: 'SYSTEM',
        text: `[3rd order] Siege locks in — the urban front becomes a protracted quagmire. Expect recurring attrition until it de-escalates.`,
        type: 'systemic_warning' });
    }

    // Biological domain stacking: multiple bio actions in one turn signals pandemic acceleration
    const bioActions = actions.filter(a => Domains.getById(a.actionId)?.domain === 'biological').length;
    if (bioActions >= 2) {
      const marker = 'bio_acceleration_pressure';
      if (!world.activeSystemicEvents.includes(marker)) {
        world.activeSystemicEvents.push(marker);
      }
      log.push({ order: 3, confidence: 'POSSIBLE (40%)', actor: 'SYSTEM',
        text: `[3rd order] Multiple biological domain actions this turn — pandemic acceleration risk elevated. Surveillance or countermeasure surge underway.`,
        type: 'systemic_warning' });
    }

    // Information war feedback: simultaneous counter-narrative + plant_leak triggers epistemic noise
    const infoWarCount = actions.filter(a => a.actionId === 'counter_narrative' || a.actionId === 'plant_leak').length;
    if (infoWarCount >= 2 && !world.activeSystemicEvents.includes('infowar_saturation')) {
      world.activeSystemicEvents.push('infowar_saturation');
      const delta = Math.round(-7 * scale);
      for (const p of Object.values(world.powers)) {
        State.applyStatDelta(p.id, 'info', delta);
      }
      log.push({ order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[3rd order] Simultaneous information operations — global epistemic environment saturated. All powers info ${delta}.`,
        type: 'systemic_event' });
    }

    // Third-party entanglement: multiple powers targeting the same actor.
    // Each bystander takes -3 domestic at most once per cascade resolution,
    // regardless of how many simultaneous entanglement events fire.
    const targetCounts = {};
    for (const action of actions) {
      if (action.target) {
        targetCounts[action.target] = (targetCounts[action.target] || 0) + 1;
      }
    }
    const penalizedByEntanglement = new Set();
    for (const [targetId, count] of Object.entries(targetCounts)) {
      if (count >= 2) {
        const target = State.getPower(targetId);
        const bystanders = getBystanderPowers(null, targetId, world)
          .filter(id => !penalizedByEntanglement.has(id));
        for (const b of bystanders) {
          State.adjustRelationship(b, targetId, 8);
          State.applyStatDelta(b, 'domestic', -3);
          penalizedByEntanglement.add(b);
        }
        if (bystanders.length > 0) {
          log.push({ order: 3, confidence: 'LIKELY (65%)', actor: 'SYSTEM',
            text: `[3rd order] ${target.name} targeted by multiple powers simultaneously — neutral actors drawn in, domestic pressure rises.`,
            type: 'entanglement' });
        }
      }
    }
  }

  const COMPOUND_CRISES = {
    'persian_gulf+persian_gulf': {
      id: 'gulf_firestorm',
      name: 'Gulf of Fire: Iran Full-Spectrum Crisis',
      domain: 'compound',
      description: 'Nuclear brinksmanship and economic warfare lock into a single escalatory spiral. Hormuz closes. Oil at $200. No exit ramp visible.'
    },
    'east_asia+east_asia': {
      id: 'taiwan_decoupling',
      name: 'Taiwan Decoupling: Full Spectrum Confrontation',
      domain: 'compound',
      description: 'Military standoff and economic war in the Pacific merge. Decoupling accelerates into a self-reinforcing loop.'
    },
    'levant+persian_gulf': {
      id: 'iran_axis_activation',
      name: 'Iran Axis Activation',
      domain: 'compound',
      description: 'Iranian proxy network and direct nuclear pressure converge. Lebanon, Yemen, Iraq erupt simultaneously. Regional order fractures.'
    },
    'persian_gulf+levant': {
      id: 'iran_axis_activation',
      name: 'Iran Axis Activation',
      domain: 'compound',
      description: 'Iranian proxy network and direct nuclear pressure converge. Lebanon, Yemen, Iraq erupt simultaneously. Regional order fractures.'
    },
    'europe+europe': {
      id: 'european_fragmentation',
      name: 'European Security Unraveling',
      domain: 'compound',
      description: 'Cyber and diplomatic pressure on European institutions cross a threshold. Critical infrastructure down. NATO cohesion questioned.'
    },
    'scs_waters+scs_waters': {
      id: 'south_seas_blockade',
      name: 'South Seas Blockade',
      domain: 'compound',
      description: 'Island seizure, sea lane closure, and autonomous engagement converge. China declares an air defense identification zone over the South China Sea. Global trade routes buckle. India and the EU are forced off the fence.'
    },
    'orbit+orbit': {
      id: 'orbital_denial',
      name: 'Orbital Denial Regime',
      domain: 'compound',
      description: 'Counterspace strikes and PNT denial merge into a sustained debris-and-jamming environment. Low Earth orbit becomes contested terrain; ISR, navigation, and strategic warning degrade for every power simultaneously.'
    },
    'megacity+megacity': {
      id: 'urban_cauldron',
      name: 'Urban Cauldron',
      domain: 'compound',
      description: 'Siege, insurgency, and infrastructure collapse fuse into a single grinding battle for the megacity. There is no clean front and no quick exit; every power committed to the city is drawn deeper into protracted attrition.'
    },
    'global_finance+global_finance': {
      id: 'great_deleveraging',
      name: 'The Great Deleveraging',
      domain: 'compound',
      description: 'Clearing collapse, sovereign default, and reserve currency fragmentation lock into a self-reinforcing spiral. The dollar-based financial architecture is unwinding in real time. No single power can arrest it alone.'
    }
  };

  function applyCrisisMerging(world, log) {
    const eligible = world.crises.filter(c => !c.compoundOf && c.escalationLevel >= 3);
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        const a = eligible[i];
        const b = eligible[j];
        const template = COMPOUND_CRISES[`${a.region}+${b.region}`] || COMPOUND_CRISES[`${b.region}+${a.region}`];
        if (!template) continue;
        if (world.crises.find(c => c.id === template.id)) continue;

        const involved = [...new Set([...a.involved, ...b.involved])];
        const mergedLevel = Math.min(5, Math.max(a.escalationLevel, b.escalationLevel) + 1);
        const location = (a.location && b.location)
          ? { x: Math.round((a.location.x + b.location.x) / 2), y: Math.round((a.location.y + b.location.y) / 2) }
          : (a.location || b.location);

        State.mergeCrises(a.id, b.id, { ...template, involved, escalationLevel: mergedLevel, region: a.region, location });

        log.push({
          order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[Crisis Merge] ${a.name} + ${b.name} → ${template.name} (Level ${mergedLevel})`,
          type: 'systemic_event'
        });
        return;
      }
    }
  }

  function applyCrisisDecay(pendingActions, world, log) {
    // Build set of crisis IDs that saw action this turn
    const activeCrisisIds = new Set();
    for (const action of pendingActions) {
      const crisis = findRelevantCrisis(action, world);
      if (crisis) activeCrisisIds.add(crisis.id);
    }
    // Crises with no relevant actions this turn have a 15% chance to de-escalate
    for (const crisis of world.crises) {
      if (activeCrisisIds.has(crisis.id)) continue;
      if (crisis.escalationLevel < 1) continue;
      if (Math.random() < 0.15) {
        const prev = crisis.escalationLevel;
        State.adjustCrisisEscalation(crisis.id, -1);
        log.push({
          order: 3, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[Crisis Decay] ${crisis.name}: no activity this turn. Tensions ease slightly (${prev} → ${crisis.escalationLevel}).`,
          type: 'crisis_decay'
        });
      }
    }
  }

  function applySystemicThresholds(world, log) {
    const powers = Object.values(world.powers);
    const scale = world.sim?.cascadeScale ?? 1.0;

    // Financial fragmentation: sustained economic warfare collapses clearing networks
    const lowEconCount = powers.filter(p => p.trueState.economic < 40).length;
    const hasPressureMarker = world.activeSystemicEvents.includes('financial_fragmentation_pressure');
    if ((lowEconCount >= 3 || hasPressureMarker) && !world.activeSystemicEvents.includes('financial_fragmentation')) {
      world.activeSystemicEvents.push('financial_fragmentation');
      const delta = Math.round(-15 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'economic', delta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Global clearing network fragmentation triggered. All power economies hit ${delta}.`,
        type: 'systemic_event'
      });
    }

    // Debt spiral: second-wave contagion after clearing fragmentation leaves sovereign debt critically exposed.
    // Persistent marker (no _pressure suffix) — grinds weakened economies each turn until crises cool.
    const hasFragmented = world.activeSystemicEvents.includes('financial_fragmentation');
    const criticalEconCount = powers.filter(p => p.trueState.economic < 35).length;
    const hotFinancialCrisisExists = world.crises.some(c => c.region === 'global_finance' && c.escalationLevel >= 2);
    if (hasFragmented && criticalEconCount >= 2 && hotFinancialCrisisExists && !world.activeSystemicEvents.includes('debt_spiral')) {
      world.activeSystemicEvents.push('debt_spiral');
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Debt spiral seeded: post-fragmentation sovereign stress passes the point of no return. Contagion will recur until financial crises de-escalate.`,
        type: 'systemic_warning'
      });
    }
    if (world.activeSystemicEvents.includes('debt_spiral')) {
      const hotFinancialCrises = world.crises.filter(c => c.region === 'global_finance' && c.escalationLevel >= 2);
      const weakEconCount = powers.filter(p => p.trueState.economic < 45).length;
      if (hotFinancialCrises.length === 0 && weakEconCount < 2) {
        world.activeSystemicEvents = world.activeSystemicEvents.filter(e => e !== 'debt_spiral');
        log.push({
          order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[4th order SYSTEMIC] Debt spiral unwound: coordinated stabilization has broken the contagion cycle.`,
          type: 'systemic_event'
        });
      } else {
        const econDelta = Math.round(-5 * scale);
        const domDelta = Math.round(-3 * scale);
        for (const p of powers.filter(pw => pw.trueState.economic < 55)) {
          State.applyStatDelta(p.id, 'economic', econDelta);
          State.applyStatDelta(p.id, 'domestic', domDelta);
        }
        log.push({
          order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[4th order SYSTEMIC] Debt spiral grinds on: sovereign default contagion pulls over-leveraged economies deeper. Weakened powers economic ${econDelta}, domestic ${domDelta}.`,
          type: 'systemic_event'
        });
      }
    }

    // Domestic fragility cascade: state failures spread
    const collapsingCount = powers.filter(p => p.trueState.domestic < 30).length;
    if (collapsingCount >= 2 && !world.activeSystemicEvents.includes('domestic_fragility_cascade')) {
      world.activeSystemicEvents.push('domestic_fragility_cascade');
      const delta = Math.round(-8 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'domestic', delta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Mass displacement and domestic fragility cascade. Climate migration overwhelming border controls. All powers domestic ${delta}.`,
        type: 'systemic_event'
      });
    }

    // Epistemic cascade: info warfare collapses shared reality
    const lowInfoCount = powers.filter(p => p.trueState.info < 30).length;
    if (lowInfoCount >= 3 && !world.activeSystemicEvents.includes('epistemic_cascade')) {
      world.activeSystemicEvents.push('epistemic_cascade');
      for (const [viewerId, viewer] of Object.entries(world.powers)) {
        for (const [targetId, target] of Object.entries(world.powers)) {
          if (viewerId === targetId) continue;
          const perceived = viewer.perceivedBy?.[targetId];
          if (!perceived) continue;
          const quality = world.intelQuality[viewerId]?.[targetId] ?? 0.5;
          for (const stat of Object.keys(target.trueState)) {
            if (stat === 'nuclear') continue;
            const noise = Math.round((Math.random() * 2 - 1) * (1 - quality) * 15);
            perceived[stat] = Math.max(0, Math.min(100, (perceived[stat] || target.trueState[stat]) + noise));
          }
        }
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Epistemic cascade: information warfare fractures global sensemaking. All perception matrices destabilized.`,
        type: 'systemic_event'
      });
    }

    // Communications blackout: cyber collapse severs C4ISR globally
    const lowCyberCount = powers.filter(p => p.trueState.cyber < 20).length;
    if (lowCyberCount >= 2 && !world.activeSystemicEvents.includes('communications_blackout')) {
      world.activeSystemicEvents.push('communications_blackout');
      const militaryDelta = Math.round(-8 * scale);
      const infoDelta = Math.round(-6 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'military', militaryDelta);
        State.applyStatDelta(p.id, 'info', infoDelta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Communications blackout: C4ISR degraded. All powers military ${militaryDelta}, info ${infoDelta}.`,
        type: 'systemic_event'
      });
    }

    // C4ISR collapse: EMP cascade pressure + multiple powers with degraded cyber
    const hasEmpCascade = world.activeSystemicEvents.includes('emp_cascade_pressure');
    const cyberDegradedCount = powers.filter(p => p.trueState.cyber < 30).length;
    if (hasEmpCascade && cyberDegradedCount >= 2 && !world.activeSystemicEvents.includes('c4isr_collapse')) {
      world.activeSystemicEvents.push('c4isr_collapse');
      const milDelta = Math.round(-12 * scale);
      const infoDelta = Math.round(-8 * scale);
      const spaceDelta = Math.round(-6 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'military', milDelta);
        State.applyStatDelta(p.id, 'info', infoDelta);
        State.applyStatDelta(p.id, 'space', spaceDelta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] C4ISR collapse: cascading EMP effects sever command and control globally. All powers military ${milDelta}, info ${infoDelta}, space ${spaceDelta}.`,
        type: 'systemic_event'
      });
    }

    // Kessler cascade: ASAT debris pressure + multiple powers with degraded space assets
    const hasKesslerPressure = world.activeSystemicEvents.includes('kessler_pressure');
    const spaceDegradedCount = powers.filter(p => p.trueState.space < 30).length;
    if (hasKesslerPressure && spaceDegradedCount >= 2 && !world.activeSystemicEvents.includes('kessler_cascade')) {
      world.activeSystemicEvents.push('kessler_cascade');
      const spaceDelta = Math.round(-12 * scale);
      const milDelta = Math.round(-8 * scale);
      const infoDelta = Math.round(-6 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'space', spaceDelta);
        State.applyStatDelta(p.id, 'military', milDelta);
        State.applyStatDelta(p.id, 'info', infoDelta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Kessler cascade: runaway orbital debris renders low Earth orbit unusable. ISR, PNT, and comms degrade for all. All powers space ${spaceDelta}, military ${milDelta}, info ${infoDelta}.`,
        type: 'systemic_event'
      });
    }

    // Urban quagmire: a seeded siege grinds the urban front each turn until it de-escalates.
    // Unlike the one-shot systemic events above, this is a *persistent* marker (no `_pressure`
    // suffix, so it survives the start-of-resolve sweep) that recurs while an urban crisis stays hot.
    if (world.activeSystemicEvents.includes('urban_quagmire')) {
      const hotUrbanCrises = world.crises.filter(c => c.domain === 'urban' && c.escalationLevel >= 2);
      if (hotUrbanCrises.length === 0) {
        // De-escalation (or a civil evacuation corridor) has cooled the front — the grind ends.
        world.activeSystemicEvents = world.activeSystemicEvents.filter(e => e !== 'urban_quagmire');
        log.push({ order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[4th order SYSTEMIC] Urban quagmire lifts: the contested front has de-escalated. Recurring attrition ends.`,
          type: 'systemic_event' });
      } else {
        const milDelta = Math.round(-4 * scale);
        const domDelta = Math.round(-3 * scale);
        const infoDelta = Math.round(-2 * scale);
        const ground = new Set();
        for (const c of hotUrbanCrises) {
          for (const pid of c.involved) {
            if (pid in world.powers) ground.add(pid);
          }
        }
        for (const pid of ground) {
          State.applyStatDelta(pid, 'military', milDelta);
          State.applyStatDelta(pid, 'domestic', domDelta);
          State.applyStatDelta(pid, 'info', infoDelta);
        }
        log.push({ order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
          text: `[4th order SYSTEMIC] Urban quagmire grinds on: protracted megacity combat attrits the combatants. Engaged powers military ${milDelta}, domestic ${domDelta}, info ${infoDelta}.`,
          type: 'systemic_event' });
      }
    }

    // Urban humanitarian catastrophe: quagmire + multiple fragile states → mass displacement (one-shot)
    const hasQuagmire = world.activeSystemicEvents.includes('urban_quagmire');
    const fragileFromWar = powers.filter(p => p.trueState.domestic < 35).length;
    if (hasQuagmire && fragileFromWar >= 2 && !world.activeSystemicEvents.includes('urban_humanitarian_catastrophe')) {
      world.activeSystemicEvents.push('urban_humanitarian_catastrophe');
      const domDelta = Math.round(-10 * scale);
      const infoDelta = Math.round(-6 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'domestic', domDelta);
        State.applyStatDelta(p.id, 'info', infoDelta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Urban humanitarian catastrophe: mass displacement from the besieged megacity overwhelms the region. All powers domestic ${domDelta}, info ${infoDelta}.`,
        type: 'systemic_event'
      });
    }

    // Pandemic outbreak: bio acceleration marker + multiple fragile states
    const hasBioAcceleration = world.activeSystemicEvents.includes('bio_acceleration_pressure');
    const vulnerablePowers = powers.filter(p => p.trueState.domestic < 40).length;
    if (hasBioAcceleration && vulnerablePowers >= 2 && !world.activeSystemicEvents.includes('pandemic_outbreak')) {
      world.activeSystemicEvents.push('pandemic_outbreak');
      const domDelta = Math.round(-10 * scale);
      const econDelta = Math.round(-8 * scale);
      for (const p of powers) {
        State.applyStatDelta(p.id, 'domestic', domDelta);
        State.applyStatDelta(p.id, 'economic', econDelta);
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Pandemic outbreak: accelerated pathogen spread exploits fragile states. All powers domestic ${domDelta}, economic ${econDelta}.`,
        type: 'systemic_event'
      });
    }

    // Nuclear hair-trigger: critical crisis involving nuclear-armed powers
    const criticalCrises = world.crises.filter(c => c.escalationLevel >= 4);
    const nuclearPowerIds = powers.filter(p => p.trueState.nuclear >= 2).map(p => p.id);
    const touchesNuclearPower = criticalCrises.some(c =>
      c.involved.some(id => nuclearPowerIds.includes(id))
    );
    if (touchesNuclearPower && !world.activeSystemicEvents.includes('nuclear_hair_trigger')) {
      world.activeSystemicEvents.push('nuclear_hair_trigger');
      for (const crisis of criticalCrises) {
        if (crisis.involved.some(id => nuclearPowerIds.includes(id)) && crisis.escalationLevel < 5) {
          State.adjustCrisisEscalation(crisis.id, 1);
        }
      }
      for (let i = 0; i < nuclearPowerIds.length; i++) {
        for (let j = i + 1; j < nuclearPowerIds.length; j++) {
          State.adjustRelationship(nuclearPowerIds[i], nuclearPowerIds[j], -15);
          State.adjustRelationship(nuclearPowerIds[j], nuclearPowerIds[i], -15);
        }
      }
      log.push({
        order: 4, confidence: 'CONFIRMED', actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Nuclear hair-trigger: critical crisis involving nuclear-armed powers. Forces go on high alert. Nuclear power relationships deteriorate.`,
        type: 'systemic_event'
      });
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  function findRelevantCrisis(action, world) {
    const actionDomain = Domains.getById(action.actionId)?.domain;
    const primaryMatch = world.crises.find(c =>
      (c.domain === actionDomain || c.domain === 'compound') &&
      (c.involved.includes(action.actor) || c.involved.includes(action.target))
    );
    if (primaryMatch) return primaryMatch;
    // Fallback: only for targeted actions where both actor and target share a crisis.
    // Untargeted actions (e.g. public_statement) must match on domain or they don't escalate.
    if (!action.target) return null;
    return world.crises.find(c =>
      c.involved.includes(action.actor) && c.involved.includes(action.target)
    ) || null;
  }

  function getAlliesOf(powerId, world) {
    const power = world.powers[powerId];
    return Object.entries(power.relationships)
      .filter(([, v]) => v >= 40)
      .map(([id]) => id);
  }

  function getBystanderPowers(actorId, targetId, world) {
    return Object.keys(world.powers).filter(id =>
      id !== actorId && id !== targetId
    );
  }

  function probToConfidence(prob) {
    if (prob >= 0.7) return 'LIKELY (72%)';
    if (prob >= 0.4) return 'POSSIBLE (40%)';
    return 'SPECULATIVE (20%)';
  }

  return { resolve };
})();
