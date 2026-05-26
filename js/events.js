const Events = (() => {
  let eventTable = null;

  function init(data) {
    eventTable = data;
  }

  function drawEvents(world) {
    if (!eventTable) return [];
    const triggered = [];

    for (const event of eventTable.events) {
      if (Math.random() > event.probability) continue;
      if (!conditionsMet(event, world)) continue;
      triggered.push(event);
      applyEvent(event, world);
    }

    return triggered;
  }

  function conditionsMet(event, world) {
    if (!event.conditions || event.conditions.length === 0) return true;
    for (const cond of event.conditions) {
      if (cond.minTurn !== undefined && (world.turn ?? 0) < cond.minTurn) return false;

      if (cond.crisisMinCount !== undefined) {
        const minEsc = cond.minEscalation ?? 1;
        const count = world.crises.filter(c => c.escalationLevel >= minEsc).length;
        if (count < cond.crisisMinCount) return false;
      }

      if (cond.crisis) {
        const crisis = world.crises.find(c => c.id === cond.crisis);
        if (!crisis) return false;
        if (cond.minEscalation && crisis.escalationLevel < cond.minEscalation) return false;
      }

      if (cond.power && cond.stat && cond.maxValue !== undefined) {
        const powers = Object.values(world.powers);
        if (cond.power === 'any') {
          if (!powers.some(p => p.trueState[cond.stat] <= cond.maxValue)) return false;
        } else {
          const power = world.powers[cond.power];
          if (!power) return false;
          if (power.trueState[cond.stat] > cond.maxValue) return false;
        }
      }

      if (cond.power && cond.stat && cond.minValue !== undefined) {
        const power = world.powers[cond.power];
        if (!power) return false;
        if (power.trueState[cond.stat] < cond.minValue) return false;
      }
    }
    return true;
  }

  function applyEvent(event, world) {
    const powers = Object.values(world.powers);
    let targets = [];

    for (const t of (event.effects.targets || [])) {
      if (t === 'all') {
        targets = [...powers];
      } else if (t === 'random_1') {
        targets.push(powers[Math.floor(Math.random() * powers.length)]);
      } else if (t === 'random_2') {
        const shuffled = [...powers].sort(() => Math.random() - 0.5);
        targets.push(...shuffled.slice(0, 2));
      } else {
        const p = world.powers[t];
        if (p) targets.push(p);
      }
    }

    if (event.effects.statDeltas) {
      for (const target of targets) {
        for (const [stat, delta] of Object.entries(event.effects.statDeltas)) {
          State.applyStatDelta(target.id, stat, delta);
        }
      }
    }

    if (event.effects.perceptionDelta) {
      const pd = event.effects.perceptionDelta;
      for (const target of targets) {
        const perceived = target.perceivedBy?.[pd.source];
        if (perceived && perceived[pd.stat] !== undefined) {
          State.updatePerception(target.id, pd.source, pd.stat,
            Math.max(0, Math.min(100, perceived[pd.stat] + pd.delta))
          );
        }
      }
    }

    State.addLog({
      type: 'event',
      text: `[EVENT] ${event.name}: ${event.description}`,
      subtext: event.advisorText
    });

    if (event.cascadeRisk && Math.random() < 0.3) {
      State.addLog({
        type: 'warning',
        text: `[ADVISOR] Our models flag cascade risk: ${event.cascadeRisk}.`
      });
    }
  }

  return { init, drawEvents };
})();
