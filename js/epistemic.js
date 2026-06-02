const Epistemic = (() => {

  function update(world) {
    State.decayIntelQuality();   // intel goes stale before this turn's perceptions settle
    State.driftPerceptions();
    checkForLeaks(world);
  }

  function checkForLeaks(world) {
    // small chance each turn that a perception gets snapped toward truth (intel breakthrough)
    for (const viewerId of Object.keys(world.powers)) {
      for (const targetId of Object.keys(world.powers)) {
        if (viewerId === targetId) continue;
        const quality = world.intelQuality[viewerId]?.[targetId] ?? 0.5;
        if (Math.random() < quality * 0.08) {
          // intel breakthrough: snap one random stat to truth
          const target = world.powers[targetId];
          const stats = Object.keys(target.trueState).filter(s => s !== 'nuclear');
          const stat = stats[Math.floor(Math.random() * stats.length)];
          State.updatePerception(viewerId, targetId, stat, target.trueState[stat]);
        }
      }
    }
  }

  function applyDisinformation(actorId, targetId, stat, falseValue, world) {
    // actor plants false data into target's perception of a third party
    // or corrupts actor's own perceived stats for a target's view
    State.updatePerception(targetId, actorId, stat, falseValue);
    State.addLog({
      type: 'epistemic',
      text: `[COVERT] Disinformation planted: ${world.powers[targetId].name} now perceives ${world.powers[actorId].name}'s ${stat} as ${falseValue}.`
    });
  }

  function revealIntel(revealerId, targetId, stat, world) {
    // snap a stat to truth for the player
    const target = world.powers[targetId];
    const trueVal = target.trueState[stat];
    State.updatePerception(world.player, targetId, stat, trueVal);
    State.addLog({
      type: 'epistemic',
      text: `[INTEL] Declassified: ${target.name}'s true ${stat} is ${trueVal}.`
    });
  }

  function getPerceivedValue(viewerId, targetId, stat, world) {
    if (world.autonomyMasks?.[targetId]?.includes(stat)) return null;
    const perceived = world.powers[viewerId]?.perceivedBy?.[targetId];
    if (!perceived) return world.powers[targetId]?.trueState[stat];
    return perceived[stat] ?? world.powers[targetId]?.trueState[stat];
  }

  function applyRiceMask(powerId, statDomains, world) {
    if (!world.autonomyMasks) world.autonomyMasks = {};
    const existing = world.autonomyMasks[powerId] || [];
    world.autonomyMasks[powerId] = [...new Set([...existing, ...statDomains])];
  }

  // Lift a power's Rice mask, restoring normal perception of its stats.
  // Used by revert_midcourse_defense to undo a prior pre-delegation.
  function clearRiceMask(powerId, world) {
    if (world.autonomyMasks) delete world.autonomyMasks[powerId];
  }

  function getUncertaintyBand(viewerId, targetId, world) {
    const quality = world.intelQuality[viewerId]?.[targetId] ?? 0.5;
    return Math.round((1 - quality) * 20);
  }

  return { update, applyDisinformation, revealIntel, getPerceivedValue, getUncertaintyBand, applyRiceMask, clearRiceMask };
})();
