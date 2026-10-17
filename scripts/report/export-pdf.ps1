param([string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$ErrorActionPreference = 'Stop'
$reportRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$documentPath = Join-Path $reportRoot 'submission\SpendWise_AI_CA3_Report.docx'
$pdfPath = Join-Path $reportRoot 'submission\SpendWise_AI_CA3_Report.pdf'
$reportWord = New-Object -ComObject Word.Application
$reportWord.Visible = $false
$reportWord.DisplayAlerts = 0
try {
    $reportDocument = $reportWord.Documents.Open($documentPath, $false, $true)
    try {
        $reportDocument.Fields.Update() | Out-Null
        $reportDocument.Repaginate()
        $reportDocument.ExportAsFixedFormat($pdfPath, 17)
        Write-Output ('PDF pages: ' + $reportDocument.ComputeStatistics(2))
    } finally {
        $reportDocument.Close(0)
        [Runtime.InteropServices.Marshal]::FinalReleaseComObject($reportDocument) | Out-Null
    }
} finally {
    $reportWord.Quit()
    [Runtime.InteropServices.Marshal]::FinalReleaseComObject($reportWord) | Out-Null
}
