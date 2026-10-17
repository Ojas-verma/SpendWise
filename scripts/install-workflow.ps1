param([switch]$IncludeTestWorkflow)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
function Run-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "A setup step failed: $Program" }
}
Run-Checked 'node' @('scripts/build-workflow.mjs')
if ($IncludeTestWorkflow) { Run-Checked 'node' @('scripts/build-workflow.mjs','--test') }
Run-Checked 'docker' @('compose','up','-d','mongodb','--wait')
Run-Checked 'docker' @('compose','up','-d','n8n')
Run-Checked 'node' @('scripts/prepare-credentials.mjs')
try {
    Run-Checked 'docker' @('cp','.local/credential-import.json','spendwise-n8n:/tmp/spendwise-credential-import.json')
    Run-Checked 'docker' @('exec','spendwise-n8n','n8n','import:credentials','--input=/tmp/spendwise-credential-import.json')
} finally {
    & docker exec -u 0 spendwise-n8n node -e "require('fs').rmSync('/tmp/spendwise-credential-import.json',{force:true})"
    Remove-Item -LiteralPath '.local/credential-import.json' -ErrorAction SilentlyContinue
}
Run-Checked 'docker' @('cp','n8n/spendwise.workflow.json','spendwise-n8n:/tmp/spendwise.workflow.json')
Run-Checked 'docker' @('exec','spendwise-n8n','n8n','import:workflow','--input=/tmp/spendwise.workflow.json')
Run-Checked 'docker' @('exec','spendwise-n8n','n8n','publish:workflow','--id=SpendWiseLocalV1')
if ($IncludeTestWorkflow) {
    Run-Checked 'docker' @('cp','.local/spendwise-e2e.workflow.json','spendwise-n8n:/tmp/spendwise-e2e.workflow.json')
    Run-Checked 'docker' @('exec','spendwise-n8n','n8n','import:workflow','--input=/tmp/spendwise-e2e.workflow.json')
    Run-Checked 'docker' @('exec','spendwise-n8n','n8n','publish:workflow','--id=SpendWiseMongoE2E')
}
Run-Checked 'docker' @('compose','restart','n8n')
Write-Output 'SpendWise MongoDB workflow installed. Existing n8n owner account, volume, and Google credential were preserved.'
