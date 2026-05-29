<#
  sv-hypotheses.ps1 — targeted hypothesis sweep for sovereignty_void_2026

  Findings under test (from the MING/MAGA seed-42 runs):
    H1  Does doctrine change the outcome, or do all doctrines lose the same way?
    H2  Is the 0->5 boost-phase cascade too fast? (cascade-scale sweep)
    H3  Do RU+DPRK boost_phase_intercept choices drive the terminal jump? (NPC risk knock-down)
    H4  Doctrine comparison as designed (LLM steers player) — the paid run.
    H5  Role-asymmetry 2x2 (who-is-LLM, fixed doctrine): is the backend the driver,
        and does the same model behave differently as adversary vs player?

  Blocks A-C use the FREE heuristic AI backend (no API cost), many seeds for stats.
  Blocks D-E use DeepSeek (costs money) and are OFF unless you pass -IncludeLLM.

  Usage:
    pwsh scripts/sv-hypotheses.ps1                 # free structural tests only
    pwsh scripts/sv-hypotheses.ps1 -IncludeLLM     # also run the paid DeepSeek doctrine A/B
    pwsh scripts/sv-hypotheses.ps1 -IncludeLLM -LLMDryRun   # estimate DeepSeek cost first, no calls
#>

param(
  [switch]$IncludeLLM,
  [switch]$LLMDryRun,
  [int]$Runs = 25,        # runs per heuristic variant (free)
  [int]$LLMRuns = 3,      # runs per doctrine for the paid LLM block
  [int]$Seed = 42,
  [int]$MaxTurns = 8
)

$ErrorActionPreference = 'Stop'
$scn = 'sovereignty_void_2026'
if (-not (Test-Path logs)) { New-Item -ItemType Directory logs | Out-Null }

function Run-BoP {
  param([string]$Label, [string]$Out, [string[]]$Extra)
  Write-Host "`n=== $Label ===" -ForegroundColor Cyan
  node scripts/run-bop.js --scenario $scn --seed $Seed --max-turns $MaxTurns --out $Out @Extra
}

# ---------------------------------------------------------------------------
# Block A (FREE) — H1: doctrine effect under deterministic heuristic AI.
#   If win%/stability barely move across doctrines, the loss is structural,
#   not strategic.
# ---------------------------------------------------------------------------
$doctrines = 'MAGA','TWELVER','EU_FATALISM','MING','JUCHE'
foreach ($d in $doctrines) {
  Run-BoP "A/H1 heuristic — $d" "logs/sv-h1-heur-$($d.ToLower()).json" `
    @('--doctrine', $d, '--runs', $Runs)
}

# ---------------------------------------------------------------------------
# Block B (FREE) — H2: is the boost-phase cascade too fast to be playable?
#   cascade-scale multiplies systemic (3rd/4th-order) event deltas.
#   1.0 = default, 0 = systemic cascade off. Look for the scale where the
#   player survives past turn 1 and win% lifts off the floor.
# ---------------------------------------------------------------------------
foreach ($s in '1.0','0.5','0.25','0') {
  Run-BoP "B/H2 cascade-scale=$s (MING)" "logs/sv-h2-cascade-$($s -replace '\.','p').json" `
    @('--doctrine', 'MING', '--cascade-scale', $s, '--runs', $Runs)
}

# ---------------------------------------------------------------------------
# Block C (FREE) — H3: do RU+DPRK aggression choices drive the terminal jump?
#   Knock down the two powers that played boost_phase_intercept. If the crisis
#   stops going to 5, the kill is NPC-aggression-driven, not inevitable.
# ---------------------------------------------------------------------------
Run-BoP "C/H3 baseline NPC risk (MING)" "logs/sv-h3-npc-default.json" `
  @('--doctrine', 'MING', '--runs', $Runs)
Run-BoP "C/H3 calm DPRK+RU (risk 0.3)" "logs/sv-h3-npc-calm.json" `
  @('--doctrine', 'MING', '--dprk-risk', '0.3', '--ru-risk', '0.3', '--runs', $Runs)

# ---------------------------------------------------------------------------
# Block D (PAID) — H4: doctrine comparison as designed (LLM steers the player).
#   Off by default. Each doctrine gets its own log + prompt log.
# ---------------------------------------------------------------------------
if ($IncludeLLM) {
  if (-not $env:DEEPSEEK_API_KEY -and -not $LLMDryRun) { throw 'DEEPSEEK_API_KEY not set — required for Blocks D-E.' }
  foreach ($d in $doctrines) {
    $args = @('--doctrine', $d, '--ai-backend', 'deepseek', '--thinking', '--ai-powers', 'all',
              '--runs', $LLMRuns, '--log-prompts')
    if ($LLMDryRun) { $args += '--dry-run' }
    Run-BoP "D/H4 deepseek+thinking — $d" "logs/sv-h4-llm-$($d.ToLower()).json" $args
  }

  # -------------------------------------------------------------------------
  # Block E (PAID) — H5: role-asymmetry 2x2 at a FIXED doctrine (MING, seed 42).
  #   CRITICAL: a doctrine sets the PLAYER power (state.js:9 playerId =
  #   doctrine.power). MING => player = CN. So the adversaries are everyone
  #   EXCEPT CN, and the player-only LLM case is CN itself. Get this wrong and
  #   --ai-powers targets the wrong side.
  #   Vary only WHO is the LLM. Case (a) all-heuristic is Block A's MING run.
  #     (b) adversaries-only LLM  → CN(player) heuristic, rest LLM
  #     (c) player-only LLM       → CN(player) LLM, adversaries heuristic
  #     (d) all LLM               → everyone LLM
  #   (b) vs (c) isolates the prompt role-asymmetry; A-vs-D isolates backend.
  # -------------------------------------------------------------------------
  $player = 'CN'                       # MING doctrine player (data/doctrines-data.js)
  $adversaries = 'US,RU,EU,IN,GB,DPRK' # every power EXCEPT the MING player
  $roleCases = @(
    @{ Label = 'E/H5 (b) LLM adversaries only'; Out = 'logs/sv-h5b-adv-only.json';    Powers = $adversaries },
    @{ Label = 'E/H5 (c) LLM player only';      Out = 'logs/sv-h5b-player-only.json'; Powers = $player },
    @{ Label = 'E/H5 (d) LLM all';              Out = 'logs/sv-h5-all-llm.json';      Powers = 'all' }
  )
  foreach ($c in $roleCases) {
    $args = @('--doctrine', 'MING', '--ai-backend', 'deepseek', '--thinking',
              '--ai-powers', $c.Powers, '--runs', $LLMRuns, '--log-prompts')
    if ($LLMDryRun) { $args += '--dry-run' }
    Run-BoP $c.Label $c.Out $args
  }
} else {
  Write-Host "`n(Blocks D-E / DeepSeek skipped — pass -IncludeLLM to run them.)" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# Side-by-side summary of every log this script produced.
# ---------------------------------------------------------------------------
Write-Host "`n================ SUMMARY ================" -ForegroundColor Green
node scripts/sv-summary.mjs (Get-ChildItem logs/sv-h*.json | Sort-Object Name | ForEach-Object FullName)
