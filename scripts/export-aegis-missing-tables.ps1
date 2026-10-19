[CmdletBinding()]
param(
  [string]$Server = 'localhost\SQLEXPRESS',
  [string]$Database = 'Aegis_XOM',
  [string]$ExistingExport = 'C:\HSE\Aegis_XOM_Export1',
  [string]$OutputDirectory = 'C:\HSE\Aegis_XOM_Missing_Export'
)
$ErrorActionPreference='Stop'; Set-StrictMode -Version Latest
$required = @(
 'tblCompany','tblBusinessUnit','tblEmployee','tblEmployeeDepartment','tblDepartment',
 'tblLibrary','tblLibraryHierarchy','tblLibraryAccess','tblAttachments','tblAttachment',
 'tblCourses','tblCourse','tblTraining','tblTrainingRecord','tblTrainingCertificate',
 'tblTrainingCert','tblEmployeeTraining','tblTrainingProvider','tblCertificates',
 'tblImportFileHistory','tblMonthlySheet','tblInvestigation_Has_Papers','tblPTWDocument'
)
$secretPattern='password|passwd|secret|token|salt|hash|private.?key|access.?key|connection.?string'
function Q([string]$v){ '[' + ($v -replace ']','']]') + ']' }
function L([string]$v){ "'" + ($v -replace "'","''") + "'" }
function Json($p,$v){ $v | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $p -Encoding utf8 }
function Rows($sql){ $cmd=$cn.CreateCommand();$cmd.CommandText=$sql;$cmd.CommandTimeout=0;$r=$cmd.ExecuteReader();try{$t=New-Object Data.DataTable;$t.Load($r);return @($t.Rows|%{ $o=[ordered]@{};foreach($c in $t.Columns){$x=$_.Item($c);if($x -is [DBNull]){$x=$null};$o[$c.ColumnName]=$x};[pscustomobject]$o })}finally{$r.Dispose();$cmd.Dispose()} }
function Safe([string]$s){$s -replace '[^A-Za-z0-9_.-]','_'}
$existing=@(); $tablesFile=Join-Path $ExistingExport 'tables.json'; if(Test-Path $tablesFile){$existing=@(Get-Content $tablesFile -Raw|ConvertFrom-Json|%{"$($_.schema_name).$($_.table_name)"})}
if(Test-Path $OutputDirectory){throw "Refusing to overwrite $OutputDirectory"}; New-Item $OutputDirectory -ItemType Directory|Out-Null; New-Item (Join-Path $OutputDirectory 'table_data') -ItemType Directory|Out-Null
$cn=[Data.SqlClient.SqlConnection]::new("Server=$Server;Database=$Database;Integrated Security=True;TrustServerCertificate=True;Application Name=AegisMissingExport");$cn.Open()
try {
 $catalog=@(Rows "SELECT s.name schema_name,t.name table_name FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 AND t.name IN ('$($required -join "','")') ORDER BY s.name,t.name")
 $selected=@($catalog|?{"$($_.schema_name).$($_.table_name)" -notin $existing})
 $meta=[ordered]@{database=$Database;server=$Server;generated_at=(Get-Date).ToUniversalTime().ToString('o');required_tables=$required;existing_export=$ExistingExport;selected_tables=@($selected|%{"$($_.schema_name).$($_.table_name)"});excluded_existing=@($catalog|?{"$($_.schema_name).$($_.table_name)" -in $existing}|%{"$($_.schema_name).$($_.table_name)"})}
 Json (Join-Path $OutputDirectory 'selection.json') $meta
 $all=@();$cols=@();$pks=@();$fks=@(Rows "SELECT ps.name source_schema,pt.name source_table,pc.name source_column,rs.name target_schema,rt.name target_table,rc.name target_column,fk.name constraint_name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id JOIN sys.tables pt ON pt.object_id=fk.parent_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id JOIN sys.tables rt ON rt.object_id=fk.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id WHERE ps.name='dbo' AND pt.name IN ('$($selected.table_name -join "','")')")
 foreach($t in $selected){$s=$t.schema_name;$n=$t.table_name;$id="$s.$n";$all+= $t
  $c=@(Rows "SELECT c.column_id column_order,c.name column_name,ty.name data_type,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE s.name=$(L $s) AND t.name=$(L $n) ORDER BY c.column_id")
  $safeCols=@($c|?{$_.column_name -notmatch $secretPattern}); foreach($x in $safeCols){$x|Add-Member table $id -Force;$cols+=$x}
  $pk=@(Rows "SELECT kc.name constraint_name,c.name column_name,ic.key_ordinal column_order FROM sys.key_constraints kc JOIN sys.tables t ON t.object_id=kc.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.index_columns ic ON ic.object_id=kc.parent_object_id AND ic.index_id=kc.unique_index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE kc.type='PK' AND s.name=$(Q $s) AND t.name=$(Q $n)");$pks+=$pk|%{$x=$_;$x|Add-Member table $id -Force;$x}
  $rows=@(Rows "SELECT $((@($safeCols)|%{Q $_.column_name}) -join ',') FROM $(Q $s).$(Q $n)");$file="table_data\$(Safe $s)__$(Safe $n).json";Json (Join-Path $OutputDirectory $file) $rows
 }
 Json (Join-Path $OutputDirectory 'tables.json') $all;Json (Join-Path $OutputDirectory 'columns.json') $cols;Json (Join-Path $OutputDirectory 'primary_keys.json') $pks;Json (Join-Path $OutputDirectory 'foreign_keys.json') $fks
 $manifest=[ordered]@{format='Aegis_XOM_Missing_ReadOnly_v1';database=$Database;server=$Server;generated_at=$meta.generated_at;tables=$selected.Count;data_files=@(Get-ChildItem (Join-Path $OutputDirectory 'table_data') -File|%{[ordered]@{file=$_.Name;bytes=$_.Length;sha256=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}})};Json (Join-Path $OutputDirectory 'manifest.json') $manifest
 $checks=[ordered]@{};Get-ChildItem $OutputDirectory -Recurse -File|?{$_.Name-ne'checksums.json'}|%{$checks[$_.FullName.Substring($OutputDirectory.Length+1).Replace('\','/')]=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()};Json (Join-Path $OutputDirectory 'checksums.json') $checks
 Write-Host "Exported $($selected.Count) missing tables to $OutputDirectory"
} finally {$cn.Close();$cn.Dispose()}
