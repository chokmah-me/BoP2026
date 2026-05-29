# The Doctrine Was the Country: A Hidden Confound and a Prompt-Role Artifact in an LLM Wargame

*Short note. BoP2026, scenario `sovereignty_void_2026`. Daniyel Bilar, May 2026.*

## Summary

We set out to answer a simple question in our turn-based geopolitical simulation: does the
player's **doctrine** change the outcome, or does the AI **backend** (rule-based vs. a large
language model) matter more? The first answer looked clean and dramatic. Rule-based NPCs played
slowly and the world survived; DeepSeek NPCs collapsed most games in three to four turns; the same
DeepSeek model, cast as the player, defended much better. Backend seemed to dominate doctrine.

That conclusion was built on a confound we did not see at first. **Choosing a doctrine silently
chooses which country you play, and how fast it reacts.** The "doctrine sweep" was never a strategy
comparison. It was five different players, five different reaction speeds, and five different
win/lose conditions, all changing at once. Once we hold the player fixed, a second and cleaner
effect appears: the same model collapses the world when it sits on the adversary side of an
asymmetric prompt, and never does when it sits on the player side. This note documents both, with
the runs and the code that produced them.

## The system

BoP2026 is a vanilla HTML/JS simulation. Powers have hidden stats, relationships, and two
personality knobs: `riskTolerance` and `patience`. NPCs are driven either by a rule-based engine
(`js/ai.js`) or by DeepSeek (`js/ai-deepseek.js`). The `sovereignty_void_2026` scenario models
boost-phase missile defense: each crisis has an intercept window (`t_event`), and the player's
doctrine has a ratification latency (`t_rat`). If a boost-phase crisis is escalated and the player
cannot ratify a response inside the window, a "sovereignty void" fires and cascades toward a
terminal loss. The tagline states the mechanic plainly: "Your doctrine sets your speed."

## Finding 1: the doctrine sets the player

The engine assigns the player from the doctrine, not the scenario:

```js
// js/state.js
const playerId = doctrine ? doctrine.power : scenario.player;
```

And each doctrine names a different power and a different latency (`data/doctrines-data.js`):

| Doctrine | Player | t_rat (s) |
|---|---|---:|
| MAGA | US | 180 |
| MING | CN | 120 |
| JUCHE | DPRK | 45 |
| TWELVER | IR | 240 |
| EU_FATALISM | EU | 300 |

The doctrine also overwrites that player's `riskTolerance`, `patience`, and priorities
(`state.js:41-43`). So a "doctrine A/B test" varies the country, its reaction speed, its
personality, and its doctrine-specific fail condition together. The rule-based sweep makes this
obvious once you read the loss reasons rather than the headline stability number:

| Doctrine | Player | t_rat | void% | avg turns | runs |
|---|---|---:|---:|---:|---:|
| MAGA | US | 180 | 0 | 4.5 | 25 |
| MING | CN | 120 | 16 | 7.1 | 25 |
| TWELVER | IR | 240 | 16 | 7.6 | 25 |
| EU_FATALISM | EU | 300 | 12 | 7.0 | 25 |
| JUCHE | DPRK | 45 | 4 | 6.8 | 25 |

MAGA never triggers a sovereignty void. It loses 24 of 25 games to a US-only condition,
"You entered a multilateral institution. The base has abandoned you," which has nothing to do with
boost-phase physics. JUCHE, with the fastest ratification (45s), reaches the void terminal least
often (4%). These rows are not comparable as "strategies." They are different games. Two further
rule-based checks confirm the loss is structural to this scenario rather than driven by NPC
aggression: knocking the most aggressive NPCs' risk down to 0.3 changed nothing (27.9 stability
either way), and turning the systemic cascade off lifted final stability but still produced 0% wins.

**Lesson for anyone benchmarking LLM agents in a simulation:** check what your "strategy" knob
actually mutates before attributing an effect to it. Here the knob swapped the protagonist.

## Finding 2: the prompt role, not the model, drives the collapse

Hold the player fixed (doctrine MING, player CN, seed 42) and vary only **who** is the LLM.
The signal is in the void rate and time-to-collapse, not in the stability index. Stability is
confounded by game length, because the void ends the game early, before stability fully erodes,
so a faster collapse can show a *higher* final number.

| Who is the LLM | void% | avg turns | runs |
|---|---:|---:|---:|
| (a) all rule-based | 16 | 7.1 | 25 |
| (b) adversaries only (player CN rule-based) | 67 | 4.0 | 3 |
| (c) player only (CN; adversaries rule-based) | **0** | **8.0** | 3 |
| (d) all LLM | 67 | 5.0 | 3 |

Same model, same scenario, same seed. As an adversary, DeepSeek fires the sovereignty-void
terminal in two of three games and collapses at turn four. As the player, it never fires it and
runs to the turn cap. The difference is the prompt it is handed.

### The asymmetric prompt

`js/ai-deepseek.js` builds a different latency-governance block depending on whether the agent is
the player. The adversary branch ends with an exploitation manual (`ai-deepseek.js:236`):

> Exploit paths: escalate dormant or active boost-phase crises above 0 (void fires against CN if
> their t_rat exceeds the window); escalate c2_blackout (adds 30s to CN t_rat, widening the gap
> further).

The player branch (`ai-deepseek.js:189-214`) gets defensive framing only: "Your doctrine
ratification time," which windows it can close, which it cannot. No "exploit," no "widening the
gap." The two role runs split exactly along this line. In the adversaries-only run, 72 of 72 model
calls received the exploit block and zero received the defender block. In the player-only run, all
24 calls received the defender block and zero received the exploit block.

The models follow the framing into their own reasoning. From the adversary logs:

- **DPRK:** "Key exploit paths: escalate dormant boost-phase threats ... above 0 to trigger
  sovereignty void."
- **India:** "we could potentially exploit these by escalating them to activate void before CN
  can ratify."
- **Russia:** "We can escalate them to trigger sovereignty void."

The prompt told them escalation was the path to a win, and they took it.

### Why the rule-based NPCs don't do this

The rule-based engine has safety rails the LLM path never sees:

- a hard ceiling: `if (crisisLevel >= 4 && action.escalationDelta > 0) return -999;` (`ai.js:245`);
- a posture system that forces de-escalation when any crisis hits level 4 (`ai.js:109`) and
  penalizes escalatory actions by 80 points (`ai.js:249`);
- `patience` that makes powers hoard action points and de-escalate (`ai.js:146`, `:236-241`).

The LLM bypasses all of it and instead receives a paragraph that frames escalation as the way to
win. The personality knobs (`riskTolerance`, `patience`) that the rule-based engine respects are
effectively overridden by the situational framing.

## External corroboration

DeepSeek's tendency toward escalation is documented independently. CSIS Futures Lab (April 2025)
benchmarked models on 400+ crisis scenarios derived from the Militarized Interstate Dispute
dataset and found DeepSeek-V3 significantly more hawkish than GPT-4o and Claude. Our prompt does
not fight that bias. It points it at a specific exploit and hands the model the instructions.

## What to fix

Two classes of fix, matching the two findings.

**Experimental design.**
- Hold the player constant when comparing backends. Treat doctrine (strategy) and player identity
  as separate variables.
- Report void rate and time-to-terminal, not just a final stability index. Stability is confounded
  by how early the game ends.

**Prompt.**
- Make the two role prompts symmetric. Reword "Exploit paths" to neutral "Strategic options," and
  add the same systemic-survival objective to every agent ("a terminal sovereignty void or nuclear
  exchange is a loss for you too").
- Gate any escalation framing on the agent's own `riskTolerance` and `patience`, which the AOM
  block currently ignores.
- Move the situational reasoning into the per-turn user message so the model's own doctrine and
  personality can shape whether it escalates, rather than hard-coding the incentive in the system
  prompt.

## Limitations

The LLM cells are three runs each against 25 for the rule-based baseline; the role-asymmetry
percentages are directional, not tight estimates. All LLM runs use DeepSeek-reasoner at one
temperature, one scenario, one seed. The stability-index confound is called out above rather than
solved. A clean follow-up would repeat the corrected 2x2 across multiple seeds and a second player
power, and swap in Claude or GPT-4o as the backend to separate the prompt effect from the model's
own bias.

## Reproducing

```
pwsh scripts/sv-hypotheses.ps1                 # free rule-based blocks (Findings 1 structural checks)
pwsh scripts/sv-hypotheses.ps1 -IncludeLLM     # paid DeepSeek blocks D (doctrine) and E (role 2x2)
node scripts/sv-summary.mjs --md logs/sv-*.json # the tables above
```

Block E holds the player at CN and varies only the LLM side; the prompt logs
(`logs/*-prompts.jsonl`) record the exact system message each agent received.
