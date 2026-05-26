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
const PROMPT_VERSION = 'v1.0';

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
          max_tokens: 200,
          temperature: 0.4
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

      const parsed = this._parseResponse(responseText, powerId);
      if (parsed) return [parsed];

      process.stderr.write(`[DeepSeek] ${powerId} t${world.turn}: bad parse, using fallback\n`);
    } catch (err) {
      process.stderr.write(`[DeepSeek] ${powerId} t${world.turn} error: ${err.message} — using fallback\n`);
    }

    return fallbackFn ? fallbackFn(powerId, world) : [];
  }

  _buildPrompt(powerId, pw, world) {
    const crisesList = world.crises
      .filter(c => c.escalationLevel > 0)
      .map(c => `${c.id}(lvl ${c.escalationLevel}, parties:${(c.involved || []).join(',')})`)
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
`You are ${powerId} in Balance of Power 2026, a turn-based geopolitical crisis simulation.
Personality: risk_tolerance=${(pw.riskTolerance||0.5).toFixed(2)}, patience=${(pw.patience||0.5).toFixed(2)}.
Priority domains: ${(pw.priorityDomains||[]).join(', ') || 'military, economic'}.
Goal: advance national interests. Avoid crisis level 5 (nuclear exchange = game over).
If requiresTarget=required, pick one power from: ${otherPowers}.
Respond ONLY with JSON: {"actionId":"<id>","target":"<powerId or null>"}`;

    const userMsg =
`Turn ${world.turn} (${world.year}). AP=${ap}.
Stats: ${JSON.stringify(pw.trueState)}.
Relations: ${rels}.
Crises: ${crisesList}.
Actions:
${actionLines}`;

    return { systemMsg, userMsg };
  }

  _parseResponse(text, powerId) {
    const match = text.match(/\{[^{}]+\}/);
    if (!match) return null;
    try {
      const obj = JSON.parse(match[0]);
      if (!obj.actionId || typeof obj.actionId !== 'string') return null;
      const action = this.actions.find(a => a.id === obj.actionId);
      if (!action) return null;
      return {
        actor: powerId,
        actionId: obj.actionId,
        target: obj.target && obj.target !== 'null' ? obj.target : null,
        flavor: `[LLM] ${powerId} selects ${action.name}.`
      };
    } catch {
      return null;
    }
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
