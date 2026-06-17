$files = Get-ChildItem 'e:\automation\n8n-workflows\WF-*.json' | Sort-Object Name
$workflows = @()
foreach ($f in $files) {
  $wf = Get-Content $f.FullName -Raw | ConvertFrom-Json
  $workflows += $wf
}
$combined = [ordered]@{ workflows = $workflows }
$json = $combined | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText('e:\automation\n8n-workflows\BILLFLOW_ALL_22_WORKFLOWS.json', $json, [System.Text.Encoding]::UTF8)
Write-Host "Combined file created with $($workflows.Count) workflows"
