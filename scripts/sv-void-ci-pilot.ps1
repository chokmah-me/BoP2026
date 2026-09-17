<#
  sv-void-ci-pilot.ps1 — tighter void-rate CIs (pilot)

  Workplan item 6 follow-up: multiple seed-bases + second player power under
  the corrected symmetric AOM prompt (PROMPT_VERSION v1.4).

  Design (pilot):
    doctrines/players : MING (player=CN), MAGA (player=US)
    seed bases        : 0, 100  (run i uses seed+i)
    n per cell        : 12 (same as prior LLM cells)
    backend           : deepseek-chat (default; pass -Thinking for reasoner)
    framing           : symmetric AOM (default since v2.6.0)
    ai-powers         : all

  Usage:
    pwsh scripts/sv-void-ci-pilot.ps1 -DryRun     # cost estimate only
    pwsh scripts/sv-void-ci-pilot.ps1             # paid 4-cell pilot
    pwsh scripts/sv-void-ci-pilot.ps1 -Thinking   # prior-study model ($$)

  Outputs: logs/sv-ci-pilot-{doctrine}-s{seed}.json (+ -prompts.jsonl)
  Summary: node scripts/sv-void-ci-summary.mjs logs/sv-ci-pilot-*.json
#>

param(
  [switch]$DryRun,
  [switch]$Thinking,
  [int]$LLMRuns = 12,
  [int]$MaxTurns = 8
)

$ErrorActionPreference = 'Stop'
if (-not $env:DEEPSEEK_API_KEY -and -not $DryRun) {
  throw 'DEEPSEEK_API_KEY not set — required for the CI pilot.'
}
if (-not (Test-Path logs)) { New-Item -ItemType Directory logs | Out-Null }

$scn = 'sovereignty_void_2026'
# Doctrine sets player: MING→CN, MAGA→US (second player power).
$cells = @(
  @{ Doctrine = 'MING'; Seed = 0 },
  @{ Doctrine = 'MING'; Seed = 100 },
  @{ Doctrine = 'MAGA'; Seed = 0 },
  @{ Doctrine = 'MAGA'; Seed = 100 }
)

$modelNote = if ($Thinking) { 'deepseek-reasoner (--thinking)' } else { 'deepseek-chat' }
Write-Host "SV void-rate CI pilot — 4 cells x n=$LLMRuns ($modelNote, symmetric AOM, maxTurns=$MaxTurns)" -ForegroundColor Cyan
Write-Host "Cells: MING/MAGA x seeds 0,100  (player = doctrine power)" -ForegroundColor DarkGray

$outs = @()
foreach ($c in $cells) {
  $tag = "sv-ci-pilot-$($c.Doctrine.ToLower())-s$($c.Seed)"
  $out = "logs/$tag.json"
  $outs += $out
  $label = "$($c.Doctrine) seed=$($c.Seed) player=doctrine"
  Write-Host "`n=== $label ===" -ForegroundColor Cyan
  $args = @(
    'scripts/run-bop.js',
    '--scenario', $scn,
    '--doctrine', $c.Doctrine,
    '--seed', $c.Seed,
    '--runs', $LLMRuns,
    '--max-turns', $MaxTurns,
    '--ai-backend', 'deepseek',
    '--ai-powers', 'all',
    '--log-prompts',
    '--out', $out
  )
  if ($Thinking) { $args += '--thinking' }
  if ($DryRun) { $args += '--dry-run' }
  node @args
  if ($LASTEXITCODE -ne 0) { throw "run-bop failed for $label (exit $LASTEXITCODE)" }
}

if (-not $DryRun) {
  Write-Host "`n================ CI SUMMARY ================" -ForegroundColor Green
  node scripts/sv-void-ci-summary.mjs @outs
} else {
  Write-Host "`nDry-run only — multiply the per-cell estimate by 4 for the full pilot." -ForegroundColor Yellow
}
