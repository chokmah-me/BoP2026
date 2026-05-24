const Cascades = (() => {

  function resolve(pendingActions, world) {
    const log = [];

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
        log.push({
          order: 1,
          confidence: 'CONFIRMED',
          actor: action.actor,
          text: `[${crisis.name}] Escalation: ${prev} → ${crisis.escalationLevel}`,
          type: 'escalation'
        });
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
  }

  function apply2ndOrder(action, world, log) {
    const def = Domains.getById(action.actionId);
    if (!def || !def.effects2nd) return;

    const actor = State.getPower(action.actor);
    const target = action.target ? State.getPower(action.target) : null;

    for (const effect of def.effects2nd) {
      if (Math.random() > effect.prob) continue;

      const confidence = probToConfidence(effect.prob);

      if (effect.effect.self) {
        for (const [stat, delta] of Object.entries(effect.effect.self)) {
          State.applyStatDelta(action.actor, stat, delta);
        }
        log.push({
          order: 2,
          confidence,
          actor: action.actor,
          text: `[2nd order] ${effect.label}`,
          type: 'cascade'
        });
      }

      if (effect.effect.target && target) {
        for (const [stat, delta] of Object.entries(effect.effect.target)) {
          State.applyStatDelta(action.target, stat, delta);
        }
        log.push({
          order: 2,
          confidence,
          actor: action.actor,
          text: `[2nd order] ${effect.label}`,
          type: 'cascade'
        });
      }

      if (effect.effect.crisis_escalation !== undefined) {
        const crisis = findRelevantCrisis(action, world);
        if (crisis) {
          State.adjustCrisisEscalation(crisis.id, effect.effect.crisis_escalation);
          log.push({
            order: 2,
            confidence,
            actor: action.actor,
            text: `[2nd order] ${effect.label} → ${crisis.name} escalation shifted`,
            type: 'escalation'
          });
        }
      }

      if (effect.effect.relationship_target && target) {
        State.adjustRelationship(action.actor, action.target, effect.effect.relationship_target);
        log.push({
          order: 2,
          confidence,
          actor: action.actor,
          text: `[2nd order] ${effect.label}`,
          type: 'relationship'
        });
      }

      if (effect.effect.ally_relationships) {
        const allies = getAlliesOf(action.actor, world);
        for (const ally of allies) {
          State.adjustRelationship(action.actor, ally, effect.effect.ally_relationships);
        }
        if (allies.length > 0) {
          log.push({
            order: 2,
            confidence,
            actor: action.actor,
            text: `[2nd order] ${effect.label}`,
            type: 'relationship'
          });
        }
      }

      if (effect.effect.adversary_relationship && target) {
        State.adjustRelationship(action.target, action.actor, effect.effect.adversary_relationship);
      }

      if (effect.effect.adversary_cyber && target) {
        State.applyStatDelta(action.target, 'cyber', effect.effect.adversary_cyber);
        log.push({
          order: 2, confidence, actor: action.actor,
          text: `[2nd order] ${effect.label}`, type: 'cascade'
        });
      }

      if (effect.effect.third_party_hostility) {
        const bystanders = getBystanderPowers(action.actor, action.target, world);
        for (const b of bystanders) {
          State.adjustRelationship(b, action.actor, -effect.effect.third_party_hostility);
        }
        if (bystanders.length > 0) {
          log.push({
            order: 2,
            confidence,
            actor: action.actor,
            text: `[2nd order] ${effect.label}: regional powers grow wary`,
            type: 'relationship'
          });
        }
      }
    }
  }

  function apply3rdOrder(actions, world, log) {
    // Sanctions stacking check
    const sanctionsCount = actions.filter(a => a.actionId === 'sanctions' || a.actionId === 'financial_pressure').length;
    if (sanctionsCount >= 2) {
      log.push({
        order: 3,
        confidence: 'POSSIBLE (40%)',
        actor: 'SYSTEM',
        text: `[3rd order] Multiple simultaneous sanctions — financial clearing network stress building. Fragmentation risk elevated.`,
        type: 'systemic_warning'
      });
    }

    // Multi-cyber probe check
    const cyberProbes = actions.filter(a => a.actionId === 'cyber_infrastructure_probe').length;
    if (cyberProbes >= 2) {
      log.push({
        order: 3,
        confidence: 'POSSIBLE (40%)',
        actor: 'SYSTEM',
        text: `[3rd order] Simultaneous cyber probes across multiple actors — internet balkanization pressure rising.`,
        type: 'systemic_warning'
      });
    }

    // Third-party entanglement: if two powers both target the same third
    const targetCounts = {};
    for (const action of actions) {
      if (action.target) {
        targetCounts[action.target] = (targetCounts[action.target] || 0) + 1;
      }
    }
    for (const [targetId, count] of Object.entries(targetCounts)) {
      if (count >= 2) {
        const target = State.getPower(targetId);
        const bystanders = getBystanderPowers(null, targetId, world);
        for (const b of bystanders) {
          State.adjustRelationship(b, targetId, 8);
          State.applyStatDelta(b, 'domestic', -3);
        }
        if (bystanders.length > 0) {
          log.push({
            order: 3,
            confidence: 'LIKELY (65%)',
            actor: 'SYSTEM',
            text: `[3rd order] ${target.name} targeted by multiple powers simultaneously — neutral actors drawn in, domestic pressure rises.`,
            type: 'entanglement'
          });
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

  function applySystemicThresholds(world, log) {
    const powers = Object.values(world.powers);

    // Financial fragmentation threshold
    const sanctionedCount = world.crises.filter(c => c.domain === 'economic' && c.escalationLevel >= 3).length;
    if (sanctionedCount >= 3 && !world.activeSystemicEvents.includes('financial_fragmentation')) {
      world.activeSystemicEvents.push('financial_fragmentation');
      for (const p of powers) {
        State.applyStatDelta(p.id, 'economic', -15);
      }
      log.push({
        order: 4,
        confidence: 'CONFIRMED',
        actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Global clearing network fragmentation triggered. All power economies hit -15.`,
        type: 'systemic_event'
      });
    }

    // Domestic fragility cascade
    const collapsingCount = powers.filter(p => p.trueState.domestic < 30).length;
    if (collapsingCount >= 2 && !world.activeSystemicEvents.includes('domestic_fragility_cascade')) {
      world.activeSystemicEvents.push('domestic_fragility_cascade');
      for (const p of powers) {
        State.applyStatDelta(p.id, 'domestic', -8);
      }
      log.push({
        order: 4,
        confidence: 'CONFIRMED',
        actor: 'SYSTEM',
        text: `[4th order SYSTEMIC] Mass displacement and domestic fragility cascade. Climate migration overwhelming border controls. All powers domestic -8.`,
        type: 'systemic_event'
      });
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  function findRelevantCrisis(action, world) {
    const actionDomain = Domains.getById(action.actionId)?.domain;
    return world.crises.find(c =>
      (c.domain === actionDomain || c.domain === 'compound') &&
      (c.involved.includes(action.actor) || c.involved.includes(action.target))
    ) || world.crises.find(c =>
      c.involved.includes(action.actor) || c.involved.includes(action.target)
    ) || world.crises[0];
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
