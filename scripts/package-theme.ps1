$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $projectRoot 'komari-theme.json'
$distPath = Join-Path $projectRoot 'dist'
if (-not (Test-Path (Join-Path $distPath 'index.html'))) { throw '请先运行 npm run build' }
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$releasePath = Join-Path $projectRoot 'release'
New-Item -ItemType Directory -Path $releasePath -Force | Out-Null
$zipPath = Join-Path $releasePath "komari-theme-minecraft-v$($manifest.version).zip"
Compress-Archive -LiteralPath $manifestPath, $distPath -DestinationPath $zipPath -Force
Write-Output $zipPath
