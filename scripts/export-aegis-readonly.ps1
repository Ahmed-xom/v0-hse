[CmdletBinding()]
param(
    [string]$Server = 'localhost\SQLEXPRESS',
    [string]$Database = 'Aegis_XOM',
    [string]$OutputDirectory = "$PWD\Aegis_XOM_Export"
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Convert-Value($Value) {
    if ($Value -is [System.DBNull]) { return $null }
    if ($Value -is [datetime] -or $Value -is [datetimeoffset]) { return $Value.ToString('o') }
    if ($Value -is [guid]) { return $Value.ToString() }
    return $Value
}

function Invoke-ReadOnly([string]$Sql) {
    $command = $connection.CreateCommand()
    $command.CommandText = $Sql
    $command.CommandTimeout = 0
    try {
        $reader = $command.ExecuteReader()
        try {
            $table = New-Object System.Data.DataTable
            $table.Load($reader)
            return $table
        } finally {
            $reader.Dispose()
        }
    } finally {
        $command.Dispose()
    }
}

function Convert-TableToRows([System.Data.DataTable]$Table) {
    $items = [System.Collections.Generic.List[object]]::new()
    foreach ($row in $Table.Rows) {
        $object = [ordered]@{}
        foreach ($column in $Table.Columns) {
            $object[$column.ColumnName] = Convert-Value $row[$column.ColumnName]
        }
        [void]$items.Add([pscustomobject]$object)
    }
    return @($items.ToArray())
}

function Write-Json([string]$Path, $Value) {
    $json = $Value | ConvertTo-Json -Depth 50
    [IO.File]::WriteAllText($Path, $json, (New-Object Text.UTF8Encoding($false)))
}

function Read-Json([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing JSON file: $Path" }
    try { return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json }
    catch { throw "Invalid JSON file '$Path': $($_.Exception.Message)" }
}

function Get-SafeFileName([string]$Schema, [string]$Name) {
    return (($Schema + '__' + $Name) -replace '[^A-Za-z0-9_.-]', '_')
}

function Get-RelativePath([string]$Root, [string]$Path) {
    return $Path.Substring($Root.Length + 1).Replace('\', '/')
}

$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
$parentDirectory = Split-Path -Parent $OutputDirectory
$zipPath = Join-Path $parentDirectory ((Split-Path -Leaf $OutputDirectory) + '.zip')
if (Test-Path -LiteralPath $OutputDirectory) { throw "Output directory already exists; refusing to delete or overwrite: $OutputDirectory" }
if (Test-Path -LiteralPath $zipPath) { throw "ZIP file already exists; refusing to overwrite: $zipPath" }
New-Item -Path $OutputDirectory -ItemType Directory -Force:$false | Out-Null
New-Item -Path (Join-Path $OutputDirectory 'table_data') -ItemType Directory -Force:$false | Out-Null

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = "Server=$Server;Database=$Database;Integrated Security=True;TrustServerCertificate=True;Application Name=AegisReadOnlyExport"

$queries = [ordered]@{
    tables = "SELECT s.name schema_name,t.name table_name,SUM(CASE WHEN p.index_id IN (0,1) THEN p.rows ELSE 0 END) row_count FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id LEFT JOIN sys.partitions p ON p.object_id=t.object_id WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name"
    columns = "SELECT s.name schema_name,t.name table_name,c.column_id column_order,c.name column_name,ty.name data_type,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed,dc.definition default_definition FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.default_constraints dc ON dc.parent_object_id=c.object_id AND dc.parent_column_id=c.column_id WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name,c.column_id"
    primary_keys = "SELECT s.name schema_name,t.name table_name,kc.name constraint_name,c.name column_name,ic.key_ordinal column_order FROM sys.key_constraints kc JOIN sys.tables t ON t.object_id=kc.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.index_columns ic ON ic.object_id=kc.parent_object_id AND ic.index_id=kc.unique_index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE kc.type='PK' ORDER BY s.name,t.name,kc.name,ic.key_ordinal"
    foreign_keys = "SELECT ps.name source_schema,pt.name source_table,pc.name source_column,rs.name target_schema,rt.name target_table,rc.name target_column,fk.name constraint_name FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id JOIN sys.tables pt ON pt.object_id=fk.parent_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id JOIN sys.tables rt ON rt.object_id=fk.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id ORDER BY ps.name,pt.name,fk.name"
    indexes = "SELECT s.name schema_name,t.name table_name,i.name index_name,i.type_desc index_type,i.is_unique,ic.key_ordinal column_order,c.name column_name,ic.is_included_column FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id LEFT JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id LEFT JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.index_id>0 AND t.is_ms_shipped=0 ORDER BY s.name,t.name,i.name,ic.key_ordinal"
}

try {
    $connection.Open()
    $databaseMetadata = Convert-TableToRows (Invoke-ReadOnly "SELECT DB_NAME() database_name, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(100)) sql_server_version, CAST(SERVERPROPERTY('Edition') AS nvarchar(200)) edition")
    Write-Json (Join-Path $OutputDirectory 'database_metadata.json') $databaseMetadata
    Write-Host "Connected read-only to $Server / $Database"

    foreach ($name in $queries.Keys) {
        Write-Host "Exporting metadata: $name"
        Write-Json (Join-Path $OutputDirectory "$name.json") (Convert-TableToRows (Invoke-ReadOnly $queries[$name]))
    }

    $tables = @(Convert-TableToRows (Invoke-ReadOnly $queries.tables))
    if ($tables.Count -eq 0) { throw 'No user tables were returned; refusing to create an incomplete export.' }
    $tables = @($tables | ForEach-Object {
        $table = $_
        $n = [string]$table.table_name
        $classification = if ($n -match 'history|audit|log|trail') { 'HISTORY_AUDIT' } elseif ($n -match 'user|login|password|rights|reset') { 'USER_SECURITY' } elseif ($n -match 'import|temp') { 'IMPORT_TEMPORARY' } elseif ($n -match 'notification|email|search|report|frequency') { 'SYSTEM_LOG' } elseif ($n -match 'type|status|category|severity|priority|department|location') { 'MASTER_DATA' } else { 'BUSINESS_DATA' }
        $table | Add-Member -NotePropertyName classification -NotePropertyValue $classification -Force
        $table
    })
    Write-Json (Join-Path $OutputDirectory 'tables.json') $tables

    $dataFiles = [System.Collections.Generic.List[object]]::new()
    $count = 0
    foreach ($table in $tables) {
        $count++
        $schema = [string]$table.schema_name
        $name = [string]$table.table_name
        $safe = Get-SafeFileName $schema $name
        $file = "table_data\$safe.json"
        $path = Join-Path $OutputDirectory $file
        Write-Host "Exporting table $count of $($tables.Count): $schema.$name"
        $data = @(Convert-TableToRows (Invoke-ReadOnly ("SELECT * FROM " + ('[' + $schema + '].[' + $name + ']'))))
        $expectedRowCount = [int64]$table.row_count
        if ([int64]$data.Count -ne $expectedRowCount) { throw "Row count mismatch for $schema.$name. Metadata=$expectedRowCount, exported=$($data.Count)." }
        Write-Json $path $data
        $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        $columnCount = if ($data.Count -gt 0) { @($data[0].PSObject.Properties).Count } else { @((Read-Json (Join-Path $OutputDirectory 'columns.json') | Where-Object { $_.schema_name -eq $schema -and $_.table_name -eq $name })).Count }
        [void]$dataFiles.Add([pscustomobject]@{ table="$schema.$name"; file=(Get-RelativePath $OutputDirectory $path); row_count=$data.Count; column_count=$columnCount; sha256=$hash; exported_at=(Get-Date).ToUniversalTime().ToString('o') })
    }

    $rowCounts = @($tables | ForEach-Object { [pscustomobject]@{ schema_name=$_.schema_name; table_name=$_.table_name; row_count=[int64]$_.row_count } })
    Write-Json (Join-Path $OutputDirectory 'row_counts.json') $rowCounts
    $manifest = [ordered]@{ format='Aegis_XOM_ReadOnly_Export_v1'; database=$Database; server=$Server; exported_at=(Get-Date).ToUniversalTime().ToString('o'); tables=$tables.Count; populated_tables=@($rowCounts | Where-Object { $_.row_count -gt 0 }).Count; empty_tables=@($rowCounts | Where-Object { $_.row_count -eq 0 }).Count; total_rows=[int64](($rowCounts | Measure-Object row_count -Sum).Sum); data_files=@($dataFiles.ToArray()) }
    Write-Json (Join-Path $OutputDirectory 'manifest.json') $manifest

    $checksums = [ordered]@{}
    Get-ChildItem -LiteralPath $OutputDirectory -Recurse -File | Where-Object { $_.Name -ne 'checksums.json' } | ForEach-Object { $checksums[(Get-RelativePath $OutputDirectory $_.FullName)] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    Write-Json (Join-Path $OutputDirectory 'checksums.json') $checksums

    $required = @('database_metadata.json','tables.json','columns.json','primary_keys.json','foreign_keys.json','indexes.json','row_counts.json','manifest.json','checksums.json')
    foreach ($fileName in $required) { [void](Read-Json (Join-Path $OutputDirectory $fileName)) }
    if (@($tables).Count -ne [int]$manifest.tables) { throw 'Manifest table count does not match tables.json.' }
    if (@($dataFiles).Count -ne [int]$manifest.tables) { throw 'There is not exactly one data file per exported table.' }
    if (@($rowCounts | Where-Object { $_.row_count -lt 0 }).Count -gt 0) { throw 'A negative row count was returned.' }

    Compress-Archive -Path (Join-Path $OutputDirectory '*') -DestinationPath $zipPath -CompressionLevel Optimal
    $zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Host "`nExport completed successfully."
    Write-Host "Tables: $($manifest.tables)"
    Write-Host "Populated tables: $($manifest.populated_tables)"
    Write-Host "Rows: $($manifest.total_rows)"
    Write-Host "ZIP file: $zipPath"
    Write-Host "SHA-256: $zipHash"
} catch {
    Write-Error "EXPORT FAILED: $($_.Exception.Message)"
    exit 1
} finally {
    if ($connection.State -ne [System.Data.ConnectionState]::Closed) { $connection.Close() }
    $connection.Dispose()
}
