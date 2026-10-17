$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) {
    throw 'Create .env from .env.example and configure the private webhook secret before starting.'
}
if (-not (Test-Path -LiteralPath 'node_modules')) {
    & npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}
& docker compose up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'SpendWise services could not start. Check Docker Desktop, .env, and the existing named volumes.' }
& npm.cmd run dev
