[CmdletBinding()]
param([string]$PackageDirectory='C:\HSE\Aegis_XOM_Missing_Export',[string]$ReportPath='')
$ErrorActionPreference='Stop';Set-StrictMode -Version Latest
if(-not(Test-Path $PackageDirectory)){throw "Package not found: $PackageDirectory"};if(-not $ReportPath){$ReportPath=Join-Path $PackageDirectory 'validation-report.json'}
function ReadJ($n){$p=Join-Path $PackageDirectory $n;if(-not(Test-Path $p)){throw "Missing $n"};Get-Content $p -Raw|ConvertFrom-Json}
function N($v){([string]$v).Trim().ToLowerInvariant()}
$errors=[Collections.Generic.List[string]]::new();$warnings=[Collections.Generic.List[string]]::new();$manifest=ReadJ 'manifest.json';$tables=@(ReadJ 'tables.json');$cols=@(ReadJ 'columns.json');$pks=@(ReadJ 'primary_keys.json');$fks=@(ReadJ 'foreign_keys.json')
$files=@(Get-ChildItem (Join-Path $PackageDirectory 'table_data') -File -Filter '*.json');$tableKeys=@($tables|%{"$(N $_.schema_name).$(N $_.table_name)"});$known=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase);$tableKeys|%{[void]$known.Add($_)}
foreach($f in $files){$expected=$f.Name -replace '\.json$','';$key=$expected -replace '__','.';$raw=Get-Content $f.FullName -Raw;$hash=(Get-FileHash $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant();try{$rows=@($raw|ConvertFrom-Json);if($rows.Count -eq 1 -and $null -eq $rows[0]){$rows=@()}}catch{$errors.Add("Invalid JSON $($f.Name): $($_.Exception.Message)");continue};$pk=@($pks|?{$_.table -eq $key});if($pk.Count -gt 0){$seen=@{};foreach($r in $rows){$k=(@($pk|sort column_order|%{[string]$r.($_.column_name)}) -join '|');if($seen.ContainsKey($k)){$errors.Add("Duplicate primary key $key = $k")};$seen[$k]=$true}}
 foreach($r in $rows){foreach($p in $r.PSObject.Properties){if($p.Name -match 'password|secret|token|private.?key|connection.?string'){$errors.Add("Sensitive column present in $($f.Name): $($p.Name)")};if($p.Name -match 'path|file|document|attachment|certificate|image|scan|url' -and $p.Value -is [string] -and $p.Value -match '^[A-Za-z]:\\|^\\\\|^https?://'){$warnings.Add("Binary/reference value in $($f.Name): $($p.Name)=$($p.Value)")}}}
}
foreach($t in $tables){$safe=("$($t.schema_name)__$($t.table_name)" -replace '[^A-Za-z0-9_.-]','_')+'.json';if(-not(Test-Path (Join-Path $PackageDirectory "table_data\$safe"))){$errors.Add("Missing data file for $($t.schema_name).$($t.table_name)")}}
foreach($fk in $fks){$target="$(N $fk.target_schema).$(N $fk.target_table)";if(-not $known.Contains($target)){$warnings.Add("FK target not in package: $target")}}
$report=[ordered]@{generated_at=(Get-Date).ToUniversalTime().ToString('o');package=$PackageDirectory;manifest=$manifest;counts=[ordered]@{tables=$tables.Count;data_files=$files.Count;columns=$cols.Count;primary_keys=$pks.Count;foreign_keys=$fks.Count};errors=@($errors);warnings=@($warnings);valid=($errors.Count -eq 0)}
$report|ConvertTo-Json -Depth 50|Set-Content $ReportPath -Encoding utf8
$report|ConvertTo-Json -Depth 8
if($errors.Count -gt 0){exit 1}
