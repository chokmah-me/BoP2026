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
const PROMPT_VERSION = 'v1.2';

// Pricing per 1M tokens (deepseek-chat / deepseek-v4-flash, non-thinking)
const PRICE_INPUT = 0.14;
const PRICE_OUTPUT = 0.28;
// deepseek-reasoner (thinking mode)
const PRICE_INPUT_THINK = 0.55;
const PRICE_OUTPUT_THINK = 2.19;

class DeepSeekBackend {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
    this.model = options.model || 'deepseek-chat';
    this.logPrompts = options.logPrompts || false;
    this.logFile = options.logFile || null;
    this.actions = options.actions || [];
    this._inputTokens = 0;
    this._outputTokens = 0;
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
    let responseText = null;

    try {
      const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg }
          ],
          max_tokens: 300,
          temperature: 0.6
        })
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
      }

      const data = await resp.json();
      responseText = data.choices[0]?.message?.content || '';

      const usage = data.usage || {};
      this._inputTokens += usage.prompt_tokens || 0;
      this._outputTokens += usage.completion_tokens || 0;

      if (this.logPrompts && this.logFile) {
        const entry = JSON.stringify({
          promptVersion: PROMPT_VERSION,
          powerId, turn: world.turn, model: this.model,
          systemMsg, userMsg, response: responseText, usage
        }) + '\n';
        fs.appendFileSync(this.logFile, entry);
      }

      const validTargets = new Set(Object.keys(world.powers).filter(id => id !== powerId));
      const parsed = this._parseResponse(responseText, powerId, pw, validTargets);
      if (parsed.length > 0) return parsed;

      process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: bad parse, using fallback\n`);
    } catch (err) {
      process.stderr.write(`[DeepSeek] ${powerId} t${world.turn} error: ${err.message} — using fallback\n`);
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
    const affordable = this.actions.filter(a => (a.cost || 1) <= ap);
    const actionLines = affordable
      .map(a => `${a.id}|${a.name}|cost:${a.cost}|target:${a.requiresTarget ? 'required' : 'none'}`)
      .join('\n');

    const otherPowers = Object.keys(world.powers).filter(id => id !== powerId).join(', ');

    const systemMsg =
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

    return { systemMsg, userMsg };
  }

  _parseResponse(text, powerId, pw, validTargets) {
    const ap = pw ? (pw.actionPointsRemaining ?? pw.actionPoints ?? 3) : 3;
    // Accept either an array or a single object
    const arrMatch = text.match(/\[[\s\S]*?\]/);
    const objMatch = text.match(/\{[^{}]+\}/);
    let items = [];
    if (arrMatch) {
      try { items = JSON.parse(arrMatch[0]); } catch { /* fall through */ }
    }
    if (!Array.isArray(items) || items.length === 0) {
      if (objMatch) {
        try { const o = JSON.parse(objMatch[0]); if (o.actionId) items = [o]; } catch { /* ignore */ }
      }
    }
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
    const isThinking = this.model === 'deepseek-reasoner';
    const priceIn = isThinking ? PRICE_INPUT_THINK : PRICE_INPUT;
    const priceOut = isThinking ? PRICE_OUTPUT_THINK : PRICE_OUTPUT;
    const cost = (this._inputTokens / 1e6) * priceIn + (this._outputTokens / 1e6) * priceOut;
    return {
      promptVersion: PROMPT_VERSION,
      model: this.model,
      inputTokens: this._inputTokens,
      outputTokens: this._outputTokens,
      estimatedCostUSD: parseFloat(cost.toFixed(5))
    };
  }
}

module.exports = DeepSeekBackend;
