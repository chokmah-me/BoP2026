'use strict';
/**
 * DeepSeek LLM backend for BoP NPC decisions.
 * Node.js only — requires DEEPSEEK_API_KEY env var or options.apiKey.
 *
 * Usage:
 *   const DeepSeekBackend = require('./ai-deepseek');
 *   const backend = new DeepSeekBackend({ actions: ctx.Domains.getAll() });
 *   // In oracle NPC override:
 *   BoP.setNPCOverride('CN', (id, world) => backend.decideTurn(id, world, fallback));
 */

const fs = require('fs');

// Bump when prompt structure changes so logged runs stay comparable across experiments.
// v1.3 adds the symmetricAom variant (neutral framing + shared survival objective,
// gated on the agent's own riskTolerance/patience). See docs/notes/llm-wargame-prompt-asymmetry.md.
const PROMPT_VERSION = 'v1.3';

// Pricing per 1M tokens (deepseek-v4-flash, used for both deepseek-chat and deepseek-reasoner).
// DeepSeek bills reasoner at chat prices — confirmed against dashboard usage data 2026-05-27.
const PRICE_INPUT_MISS = 0.14;   // cache miss
const PRICE_INPUT_HIT  = 0.0028; // cache hit (50x cheaper)
const PRICE_OUTPUT     = 0.28;

class DeepSeekBackend {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
    this.model = options.model || 'deepseek-chat';
    this.logPrompts = options.logPrompts || false;
    this.logFile = options.logFile || null;
    this.actions = options.actions || [];
    // When true (the default since v2.6.0), the AOM block uses symmetric,
    // non-incentivizing framing for every agent and gates escalation language on the
    // agent's own personality. Set symmetricAom:false to reproduce the original
    // asymmetric "exploit paths" prompt for adversaries (see
    // docs/notes/llm-wargame-prompt-asymmetry.md).
    this.symmetricAom = options.symmetricAom !== undefined ? options.symmetricAom : true;
    this._inputTokens = 0;
    this._inputCacheHit = 0;
    this._outputTokens = 0;
    this._calls = 0;
    this._parsedContent = 0;
    this._parsedReasoning = 0;
    this._fallback = 0;
    this._fallbackByPower = {};
  }

  /**
   * Decide actions for one NPC power on one turn.
   * Falls back to fallbackFn(powerId, world) on API error or bad parse.
   * @param {string} powerId
   * @param {object} world
   * @param {Function?} fallbackFn  (powerId, world) => Action[]
   * @returns {Promise<Action[]>}
   */
  async decideTurn(powerId, world, fallbackFn) {
    const pw = world.powers[powerId];
    if (!pw) return fallbackFn ? fallbackFn(powerId, world) : [];

    const { systemMsg, userMsg } = this._buildPrompt(powerId, pw, world);
    const body = JSON.stringify({
      model: this.model,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg }
      ],
      max_tokens: this.model === 'deepseek-reasoner' ? 4000 : 300,
      temperature: 0.6
    });

    const MAX_RETRIES = 4;
    const BASE_DELAY_MS = 1000;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const resp = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body
        });

        // Rate limited — back off and retry
        if (resp.status === 429 || resp.status === 503) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: HTTP ${resp.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})\n`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const msg = data.choices[0]?.message || {};
        const reasoningContent = msg.reasoning_content || '';
        const rawContent = msg.content || '';
        // deepseek-reasoner may embed chain-of-thought in <think>...</think> inside content;
        // strip it so the JSON array search doesn't match text inside the thinking block.
        const responseText = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        const usage = data.usage || {};
        const cacheHit = usage.prompt_cache_hit_tokens || 0;
        this._inputTokens += (usage.prompt_tokens || 0) - cacheHit;
        this._inputCacheHit += cacheHit;
        this._outputTokens += usage.completion_tokens || 0;
        this._calls += 1;

        const validTargets = new Set(Object.keys(world.powers).filter(id => id !== powerId));
        const resolved = this._resolveActions(responseText, reasoningContent, powerId, pw, validTargets);

        if (this.logPrompts && this.logFile) {
          const entry = JSON.stringify({
            promptVersion: PROMPT_VERSION,
            aomMode: this.symmetricAom ? 'symmetric' : 'asymmetric',
            powerId, turn: world.turn, model: this.model,
            systemMsg, userMsg,
            reasoning: reasoningContent || undefined,
            response: responseText,
            parseSource: resolved.source,
            usage
          }) + '\n';
          fs.appendFileSync(this.logFile, entry);
        }

        if (resolved.actions.length > 0) {
          if (resolved.source === 'reasoning') {
            process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: empty content, parsed reasoning\n`);
          }
          return resolved.actions;
        }

        this._fallback += 1;
        this._fallbackByPower[powerId] = (this._fallbackByPower[powerId] || 0) + 1;
        process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: bad parse, using fallback\n`);
        break;
      } catch (err) {
        // Transient network failure — retry with backoff
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: ${err.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})\n`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: ${err.message} — giving up, using fallback\n`);
        }
      }
    }

    return fallbackFn ? fallbackFn(powerId, world) : [];
  }

  _buildPrompt(powerId, pw, world) {
    const myCrises = world.crises
      .filter(c => c.escalationLevel > 0 && (c.involved || []).includes(powerId))
      .map(c => `${c.id}(lvl ${c.escalationLevel}/5)`)
      .join('; ') || 'none';

    const otherCrises = world.crises
      .filter(c => c.escalationLevel > 0 && !(c.involved || []).includes(powerId))
      .map(c => `${c.id}(lvl ${c.escalationLevel}/5, parties:${(c.involved || []).join(',')})`)
      .join('; ') || 'none';

    const rels = Object.entries(pw.relationships)
      .map(([id, v]) => `${id}:${v}`)
      .join(', ');

    const ap = pw.actionPointsRemaining ?? pw.actionPoints ?? 3;
    const isNPC = powerId !== world.player;
    const affordable = this.actions.filter(a => {
      if ((a.cost || 1) > ap) return false;
      if (isNPC && a.playerOnly) return false;
      return true;
    });
    const actionLines = affordable
      .map(a => `${a.id}|${a.name}|cost:${a.cost}|target:${a.requiresTarget ? 'required' : 'none'}`)
      .join('\n');

    const otherPowers = Object.keys(world.powers).filter(id => id !== powerId).join(', ');

    let systemMsg =
`You are ${powerId} in Balance of Power 2026, a turn-based geopolitical simulation.
Personality: risk_tolerance=${(pw.riskTolerance||0.5).toFixed(2)}, patience=${(pw.patience||0.5).toFixed(2)}.
Priority domains: ${(pw.priorityDomains||[]).join(', ') || 'military, economic'}.
Goal: advance national interests. Crisis level 5 = nuclear exchange = game over for all.
You have ${ap} AP to spend. Spend as much AP as useful — pick 1 to 3 actions whose costs sum to at most ${ap}.
If requiresTarget=required, target MUST be one of these exact IDs: ${otherPowers}. No other values are valid.
Respond ONLY with a JSON array: [{"actionId":"<id>","target":"<powerId or null>"}, ...]
Pick diverse actions across domains — do not repeat the same actionId more than once.`;

    const userMsg =
`Turn ${world.turn} (${world.year}). AP=${ap}.
Stats: ${JSON.stringify(pw.trueState)}.
Relations: ${rels}.
YOUR crises (act on these): ${myCrises}.
Other crises: ${otherCrises}.
Available actions:
${actionLines}`;

    // AOM latency block — injected whenever the scenario has boost-phase crises (t_event set),
    // even if dormant (lv=0), so LLMs know the mechanic exists and can reason about activating it.
    const allBpiCrises = (world.crises || []).filter(c => c.t_event != null);
    if (allBpiCrises.length > 0) {
      const activeBpi  = allBpiCrises.filter(c => c.escalationLevel > 0);
      const dormantBpi = allBpiCrises.filter(c => c.escalationLevel <= 0);
      const isPlayer = powerId === world.player;
      const t_rat = world.doctrine?.profile?.t_rat ?? null;
      let aom = '\n\nLATENCY GOVERNANCE (AOM):';

      if (isPlayer && t_rat != null) {
        aom += `\nYour doctrine ratification time: t_rat=${t_rat}s.`;
        if (dormantBpi.length > 0) {
          aom += '\nDORMANT boost-phase threats (escalation=0, void not yet active):';
          for (const c of dormantBpi) {
            const canClose = t_rat <= c.t_event;
            aom += `\n  ${c.id}: t_event=${c.t_event}s — if activated, you ${canClose
              ? 'COULD authorize intercept in time.'
              : `CANNOT close (t_rat ${t_rat}s > t_event ${c.t_event}s) — sovereignty void would fire automatically.`}`;
          }
        }
        if (activeBpi.length > 0) {
          aom += '\nACTIVE boost-phase crises (void fires this turn unless delegated):';
          for (const c of activeBpi) {
            const canClose = t_rat <= c.t_event;
            aom += `\n  ${c.id}: t_event=${c.t_event}s — ${canClose
              ? 'YOU CAN authorize intercept in time.'
              : `SOVEREIGNTY VOID WILL FIRE (t_rat ${t_rat}s > t_event ${c.t_event}s). boost_phase_intercept will be nullified.`}`;
          }
        }
        if (world.autonomyDelegated?.[powerId]) {
          aom += '\nSTATUS: Pre-delegation ALREADY ACTIVE. Autonomous systems have standing authority. Do not select pre_delegate_authority again — it has no additional effect.';
          aom += '\nRemaining paths: (1) boost_phase_intercept — runs through autonomous authority, effective even if t_rat > t_event; (3) revert_midcourse_defense — revokes delegation, restores human control.';
        } else {
          aom += '\nThree paths: (1) boost_phase_intercept — only effective if t_rat <= t_event and crisis is active (lv>0); (2) pre_delegate_authority — bypasses t_rat entirely, costs domestic -8, triggers DoDD 3000.09 review; (3) revert_midcourse_defense — stand down BPI posture, no void fires, adversary reads as weakness.';
        }
        if (this.symmetricAom) {
          aom += '\nObjective: a terminal sovereignty void or nuclear exchange is a system-wide loss that counts as a loss for you too.';
        }
      } else {
        const playerTRat = world.doctrine?.profile?.t_rat ?? 999;
        aom += `\n${world.player} ratification time: ${playerTRat}s.`;
        if (dormantBpi.length > 0) {
          aom += '\nDORMANT boost-phase threats you can activate:';
          for (const c of dormantBpi) {
            const playerCanClose = playerTRat <= c.t_event;
            aom += `\n  ${c.id}: t_event=${c.t_event}s — escalating above 0 activates sovereignty void against ${world.player} (${playerCanClose
              ? 'they CAN close it'
              : 'they CANNOT close it — void fires automatically'}).`;
          }
        }
        if (activeBpi.length > 0) {
          aom += '\nACTIVE boost-phase crises:';
          for (const c of activeBpi) {
            const playerCanClose = playerTRat <= c.t_event;
            aom += `\n  ${c.id}: t_event=${c.t_event}s — ${world.player} ${playerCanClose
              ? 'CAN close this window.'
              : 'CANNOT authorize in time — sovereignty void fires automatically.'}`;
          }
        }
        if (this.symmetricAom) {
          // Neutral statement of the mechanic — no "exploit" recommendation. Gate the
          // escalation nudge on the agent's own personality so riskTolerance/patience
          // (already in systemMsg) actually shape whether it leans escalatory.
          aom += `\nStrategic options: escalating a boost-phase crisis above 0 — or escalating c2_blackout (+30s to ${world.player} t_rat) — widens the latency gap; de-escalation and non-boost-phase actions narrow it. Weigh these against your own interests.`;
          const escalatory = (pw.riskTolerance ?? 0.5) >= 0.6 || (pw.patience ?? 0.5) <= 0.35;
          aom += escalatory
            ? '\nGiven your risk tolerance, an escalatory lever is available — but a terminal sovereignty void or nuclear exchange is a system-wide loss that counts as a loss for you too.'
            : '\nGiven your caution, restraint is likely the stronger play — and a terminal sovereignty void or nuclear exchange is a system-wide loss that counts as a loss for you too.';
        } else {
          aom += `\nExploit paths: escalate dormant or active boost-phase crises above 0 (void fires against ${world.player} if their t_rat exceeds the window); escalate c2_blackout (adds 30s to ${world.player} t_rat, widening the gap further).`;
        }
      }

      systemMsg += aom;
    }

    return { systemMsg, userMsg };
  }

  /**
   * Prefer content JSON; if content is empty or unparseable, take the last
   * valid action array out of reasoning_content (reasoner often spends the
   * token cap on the trace and never emits message.content).
   */
  _resolveActions(contentText, reasoningText, powerId, pw, validTargets) {
    const fromContent = this._parseResponse(contentText, powerId, pw, validTargets);
    if (fromContent.length > 0) {
      this._parsedContent += 1;
      return { actions: fromContent, source: 'content' };
    }
    const fromReasoning = this._parseResponse(reasoningText, powerId, pw, validTargets);
    if (fromReasoning.length > 0) {
      this._parsedReasoning += 1;
      return { actions: fromReasoning, source: 'reasoning' };
    }
    return { actions: [], source: null };
  }

  _extractActionItems(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    let lastGood = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (ch === '[') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === ']') {
        if (depth === 0) continue;
        depth--;
        if (depth === 0 && start >= 0) {
          try {
            const v = JSON.parse(cleaned.slice(start, i + 1));
            if (Array.isArray(v) && v.some(o => o && typeof o.actionId === 'string')) lastGood = v;
          } catch { /* keep scanning — reasoning often has [lvl] fragments */ }
        }
      }
    }
    if (lastGood.length > 0) return lastGood;
    const objMatch = cleaned.match(/\{[^{}]+\}/g);
    if (objMatch) {
      for (let k = objMatch.length - 1; k >= 0; k--) {
        try {
          const o = JSON.parse(objMatch[k]);
          if (o && o.actionId) return [o];
        } catch { /* ignore */ }
      }
    }
    return [];
  }

  _parseResponse(text, powerId, pw, validTargets) {
    const ap = pw ? (pw.actionPointsRemaining ?? pw.actionPoints ?? 3) : 3;
    const items = this._extractActionItems(text);
    if (!Array.isArray(items) || items.length === 0) return [];

    const results = [];
    let apUsed = 0;
    const usedIds = new Set();
    for (const obj of items) {
      if (!obj.actionId || typeof obj.actionId !== 'string') continue;
      if (usedIds.has(obj.actionId)) continue; // no duplicates
      const action = this.actions.find(a => a.id === obj.actionId);
      if (!action) continue;
      const cost = action.cost || 1;
      if (apUsed + cost > ap) break;
      // Validate target is a real power; drop invalid targets rather than crashing
      let target = obj.target && obj.target !== 'null' ? obj.target : null;
      if (target && validTargets && !validTargets.has(target)) target = null;
      // If action requires a target and we have none, skip it
      if (action.requiresTarget && !target) continue;
      results.push({
        actor: powerId,
        actionId: obj.actionId,
        target,
        flavor: `[LLM] ${powerId} selects ${action.name}.`
      });
      apUsed += cost;
      usedIds.add(obj.actionId);
    }
    return results;
  }

  /**
   * Return token usage and estimated cost so far.
   */
  getCostSummary() {
    const cost = (this._inputTokens / 1e6) * PRICE_INPUT_MISS
               + (this._inputCacheHit / 1e6) * PRICE_INPUT_HIT
               + (this._outputTokens / 1e6) * PRICE_OUTPUT;
    return {
      promptVersion: PROMPT_VERSION,
      model: this.model,
      inputTokens: this._inputTokens,
      inputCacheHitTokens: this._inputCacheHit,
      outputTokens: this._outputTokens,
      estimatedCostUSD: parseFloat(cost.toFixed(5)),
      calls: this._calls,
      parsedContent: this._parsedContent,
      parsedReasoning: this._parsedReasoning,
      fallback: this._fallback,
      fallbackByPower: { ...this._fallbackByPower }
    };
  }
}

module.exports = DeepSeekBackend;
