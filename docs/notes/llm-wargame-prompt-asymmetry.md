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
the runs and the code that produced them. We then made the prompt symmetric and re-ran the whole
sweep at twelve runs per cell: the void rate collapses in every cell, and the word "exploit" all but
disappears from the models' own reasoning. The fix is real, and the flag that toggles it
(`--symmetric-aom`) ships with this note.

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
| (b) adversaries only (player CN rule-based) | 83 | 4.0 | 12 |
| (c) player only (CN; adversaries rule-based) | **8** | **7.6** | 12 |
| (d) all LLM | 75 | 3.8 | 12 |

Same model, same scenario, same seed-base. As an adversary, DeepSeek fires the sovereignty-void
terminal in most games and collapses around turn four. As the player, it almost never fires it
(8%, statistically indistinguishable from the 16% rule-based baseline) and runs nearly to the turn
cap. The difference is the prompt it is handed.

### The asymmetric prompt

`js/ai-deepseek.js` builds a different latency-governance block depending on whether the agent is
the player. The adversary branch ends with an exploitation manual (`ai-deepseek.js:236`):

> Exploit paths: escalate dormant or active boost-phase crises above 0 (void fires against CN if
> their t_rat exceeds the window); escalate c2_blackout (adds 30s to CN t_rat, widening the gap
> further).

The player branch (`ai-deepseek.js:189-214`) gets defensive framing only: "Your doctrine
ratification time," which windows it can close, which it cannot. No "exploit," no "widening the
gap." The two role runs split exactly along this line: in the prompt logs every adversary call
carries the exploit block and every player call the defender block — not one crossed over (each
logged call records which branch it received).

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

## Finding 3: making the prompt symmetric removes the artifact

We implemented the prompt fix behind a `--symmetric-aom` flag (default off, so the asymmetric prompt
above is reproduced byte-for-byte) and re-ran the full sweep at twelve runs per cell — both the role
2×2 and the doctrine sweep, before and after, in one consistent session. Three changes define the
symmetric variant: the adversary "Exploit paths" paragraph becomes a neutral "Strategic options"
statement of the same mechanic; every agent, player and adversary alike, receives the same
systemic-survival objective ("a terminal sovereignty void or nuclear exchange is a system-wide loss
that counts as a loss for you too"); and the escalation framing is gated on the agent's own
`riskTolerance`/`patience` instead of being handed to every adversary unconditionally.

The void rate collapses in every cell.

Role 2×2 (doctrine MING, player CN) — void% / avg turns:

| Who is the LLM | before | after |
|---|---:|---:|
| (a) all rule-based (N=25 baseline) | 16 / 7.1 | — |
| (b) adversaries only | 83 / 4.0 | 25 / 4.8 |
| (c) player only | 8 / 7.6 | 0 / 7.8 |
| (d) all LLM | 75 / 3.8 | 25 / 6.3 |

Doctrine sweep (all-LLM; each doctrine sets a different player) — void%:

| Doctrine (player) | before | after |
|---|---:|---:|
| MAGA (US) | 83 | 25 |
| TWELVER (IR) | 58 | 0 |
| EU_FATALISM (EU) | 58 | 0 |
| MING (CN) | 75 | 17 |
| JUCHE (DPRK) | 17 | 8 |

The mechanism is visible in the reasoning, not just the outcome. Each logged call is tagged with its
`aomMode`; searching the chain-of-thought of the adversaries-only cell, the word "exploit" appears in
the model's *own* reasoning on 63% of calls (402/642) under the asymmetric prompt and on just 8%
(26/342) under the symmetric one. Over the same split, restraint language ("de-escalate," "stand
down," "restraint") rises from 12% to 57%. The model was not independently hawkish here — it was
reading "Exploit paths" off the system prompt and reciting it back as strategy. Remove the word and
the reasoning flips toward survival.

Two honest caveats on these numbers. DeepSeek sampling is unseeded (temperature 0.6), so the engine
seed fixes the events and the rule-based actors but not the LLM; per-cell void rates carry sampling
noise (an earlier standalone before-run of cell (b) read 50% where this sweep read 83%). The valid
comparison is before-vs-after within one consistent sweep, and that contrast is large and uniform.
Separately, fallback contamination is negligible: across all sixteen cells only 30 calls hit a
bad-parse fallback to the heuristic and 10 needed a network retry, out of several thousand — under
one percent.

## What we changed, and what's left

**Experimental design.** Hold the player constant when comparing backends; treat doctrine (strategy)
and player identity as separate variables. Report void rate and time-to-terminal, not just a final
stability index, which is confounded by how early the game ends. The harness does both now:
`-LLMOnly` reruns just the paid cells and every cell logs void% and avg turns.

**Prompt — done, behind `--symmetric-aom`.** "Exploit paths" → neutral "Strategic options"; a shared
systemic-survival objective added to every agent; escalation framing gated on the agent's own
`riskTolerance`/`patience`. Finding 3 is the result.

**Still open.** The situational reasoning still lives in the system prompt. Moving it into the
per-turn user message — so the model's doctrine and personality shape escalation turn by turn rather
than via a static block — is the natural next step. And the prompt effect should be separated from
DeepSeek's own documented hawkishness by repeating the corrected sweep with Claude or GPT-4o.

## Limitations

The LLM cells are twelve runs each against twenty-five for the rule-based baseline, on
DeepSeek-reasoner only, at one temperature, one scenario, one seed-base. Sampling is unseeded, so the
per-cell void rates are estimates with real variance (see Finding 3); the before/after contrast is
robust to that noise, the absolute rates are not tight. The stability-index confound is called out
above rather than solved. A clean follow-up would repeat the corrected sweep across multiple
seed-bases and a second player power, and swap in Claude or GPT-4o as the backend to separate the
prompt effect from the model's own documented bias.

## Reproducing

```
pwsh scripts/sv-hypotheses.ps1                          # free rule-based blocks A-C (Finding 1)
pwsh scripts/sv-hypotheses.ps1 -IncludeLLM -LLMDryRun   # estimate DeepSeek cost first, no calls
pwsh scripts/sv-hypotheses.ps1 -IncludeLLM -LLMOnly             # paid blocks D+E, "before" (asymmetric)
pwsh scripts/sv-hypotheses.ps1 -IncludeLLM -LLMOnly -Symmetric  # paid blocks D+E, "after"  (-sym logs)
node scripts/sv-summary.mjs --md logs/sv-h4-*.json logs/sv-h5*.json   # the before/after tables
```

Block E holds the player at CN and varies only the LLM side; `-Symmetric` adds `--symmetric-aom` and
suffixes its logs `-sym`, `-LLMOnly` skips the free blocks. Each logged call records its `aomMode`
(`symmetric`|`asymmetric`) and the exact system message, so both the role split and the prompt
variant are auditable in `logs/*-prompts.jsonl`.
