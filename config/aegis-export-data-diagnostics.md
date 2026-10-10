# Aegis_XOM Export Data Diagnostics

Generated from commit `3db2ce8` on `v0/fix-data-migration-access`.

## Safety status

- ZIP inspection: read-only.
- Neon inspection: read-only.
- `--write` import: not run.
- Neon schema/auth: unchanged.
- Mappings: remain `approved: false`.
- Original ZIP: not modified.

## Exact company ZIP entry

The exact entry is:

```text
table_data\\dbo__tblCompany.json
```

The manifest refers to it with normalized forward slashes:

```text
table_data/dbo__tblCompany.json
```

The exporter generates this name with:

```powershell
$safe = Get-SafeFileName $schema $name
$file = "table_data\$safe.json"
```

and `Get-SafeFileName` returns `<schema>__<table>` after replacing unsafe characters. Therefore the entry is correctly matched to `dbo.tblCompany`; it is not a filename collision or wrong-table match.

## Exact company payload diagnosis

The entry is:

- Present in the ZIP.
- CRC-readable.
- 452 bytes.
- Valid JSON.
- A single JSON object, not a JSON array.
- Not truncated: it ends with a complete `}`.
- Not an empty array.
- Consistent with `dbo.tblCompany` having one row.

The object contains:

```json
{
  "Cmp_Id": "8",
  "Cmp_Short_Name": "XOM",
  "Cmp_Code": "XOM",
  "Cmp_Name": "XOM",
  "TANNo": "",
  "VATNo": "",
  "Cmp_Logo_File": "",
  "Cmp_Logo": null,
  "Book_Op_Date": "2024-07-12T14:33:30.0500000",
  "CreatedBy": "1",
  "CreatedAt": "2024-07-12T14:33:30.4670000",
  "UpdatedBy": "2",
  "UpdatedAt": "2025-06-10T14:21:49.4730000",
  "Rowguid": "25edc39b-70f6-4169-a403-b836d48050b4"
}
```

The metadata agrees:

- `tables.json`: `dbo.tblCompany.row_count = 1`
- `row_counts.json`: `dbo.tblCompany.row_count = 1`
- manifest entry: `dbo.tblCompany`, same file, `row_count` is present but incorrectly represented as `null` by the PowerShell `ConvertTo-Json` serialization of a scalar property.

The export script itself wrote the payload through `ConvertTo-Json`. PowerShell emits a single object for one-row input and an array for multi-row input. This is the exact cause of the previous dry-run result reporting no readable company rows: the parser treated a singleton object as `{ rows: [], data: [] }` instead of wrapping the object as one row.

## Parser fix and validation

The read-only dry-run parser now accepts all three safe shapes:

- JSON array → rows as-is.
- `{ rows: [...] }` or `{ data: [...] }` → nested array.
- Any other non-null JSON object → one-row array.

The original ZIP was not changed. The parser was validated against the original archive and produced:

```text
Mappings: 3
Blocked: 1
Review required: 2
Source rows observed: 386
Eligible rows: 0
Quarantined rows: 386
Writes executed: false
Schema changed: false
Auth changed: false
```

The company mapping now correctly observes one source row and one candidate row, but it remains quarantined. This fix does not weaken any safety rule.

## Safe source-only re-export command

A full export is not required to recover this one missing/parsing-sensitive payload. Use a new output directory on Windows; do not overwrite the original export or ZIP.

Run in Windows PowerShell on the SQL Server host:

```powershell
Set-ExecutionPolicy -Scope Process Bypass

$server = 'localhost\SQLEXPRESS'
$database = 'Aegis_XOM'
$output = 'C:\HSE\Aegis_XOM_Company_Reexport'
$zip = 'C:\HSE\Aegis_XOM_Company_Reexport.zip'

if (Test-Path -LiteralPath $output) { throw "Refusing to overwrite $output" }
if (Test-Path -LiteralPath $zip) { throw "Refusing to overwrite $zip" }
New-Item -ItemType Directory -Path $output | Out-Null

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = "Server=$server;Database=$database;Integrated Security=True;TrustServerCertificate=True;Application Name=AegisCompanyReadOnlyReexport"
$connection.Open()
try {
  $command = $connection.CreateCommand()
  $command.CommandTimeout = 0
  $command.CommandText = @'
SELECT *
FROM [dbo].[tblCompany];
'@
  $reader = $command.ExecuteReader()
  try {
    $table = New-Object System.Data.DataTable
    $table.Load($reader)
  } finally {
    $reader.Dispose()
    $command.Dispose()
  }

  $rows = [System.Collections.Generic.List[object]]::new()
  foreach ($row in $table.Rows) {
    $object = [ordered]@{}
    foreach ($column in $table.Columns) {
      $value = $row[$column.ColumnName]
      if ($value -is [System.DBNull]) { $value = $null }
      elseif ($value -is [datetime] -or $value -is [datetimeoffset]) { $value = $value.ToString('o') }
      elseif ($value -is [guid]) { $value = $value.ToString() }
      $object[$column.ColumnName] = $value
    }
    [void]$rows.Add([pscustomobject]$object)
  }

  if ($rows.Count -ne 1) { throw "Expected exactly 1 company row; received $($rows.Count)" }
  $json = @($rows.ToArray()) | ConvertTo-Json -Depth 50
  [IO.File]::WriteAllText((Join-Path $output 'dbo__tblCompany.json'), $json, (New-Object Text.UTF8Encoding($false)))
  [IO.File]::WriteAllText((Join-Path $output 'query.sql'), $command.CommandText, (New-Object Text.UTF8Encoding($false)))
  Get-FileHash (Join-Path $output 'dbo__tblCompany.json') -Algorithm SHA256 | Format-List
} finally {
  if ($connection.State -ne [System.Data.ConnectionState]::Closed) { $connection.Close() }
  $connection.Dispose()
}

Compress-Archive -Path (Join-Path $output '*') -DestinationPath $zip -CompressionLevel Optimal
Get-FileHash $zip -Algorithm SHA256 | Format-List
```

This uses Windows Authentication and one SELECT-only query. It writes to a new directory and forces the result to be an array, avoiding the singleton-object ambiguity. It does not alter the original ZIP.

## Business-unit company references

The seven exported business-unit rows have these source references:

| `BU_Id` | `BU_Name` | `CId` | `Client_Id` | `BU_Under_Id` |
|---:|---|---|---|---|
| 1 | XOM Oman | `null` | `null` | `null` |
| 2 | XOM LLC HO | `null` | `null` | 1 |
| 3 | XOM Drilling System | `null` | `null` | 1 |
| 4 | XOM Directional Drilling | `null` | `null` | 3 |
| 5 | XOM MWD | `null` | `null` | 3 |
| 6 | XOM LWD | `null` | `null` | 3 |
| 7 | XOM Drilling Fluids | `null` | `null` | 3 |

Exact unresolved company references: **all seven rows have `CId = null` and `Client_Id = null`**. No business-unit row contains a source company ID that can be verified against `tblCompany.Cmp_Id = 8`. The non-null `BU_Under_Id` values are parent business-unit references, not company references, and are internally present in the seven-row export (`1` and `3`). They do not resolve the missing company relationship.

## Employee quarantine review

The employee rules remain unchanged. The 378 source rows remain quarantined because:

- `Emp_Payroll_No` is nullable in source but `public.employee.payroll_no` is `NOT NULL`.
- `Emp_Status` is numeric and no approved code dictionary exists.
- `Is_Deleted` conflicts with the unresolved status precedence policy.
- `BU_Id` requires an approved business-unit mapping while the destination stores `businessUnit` as text rather than a verified foreign key.
- `Emp_Desig_Id` requires designation lookup resolution.
- `Emp_Dept_Id` requires department lookup resolution.
- Existing destination rows and unique `payroll_no`/`email` constraints require duplicate and ambiguity checks.
- Source `CreatedBy`, `UpdatedBy`, and `DeletedBy` cannot be linked to Better Auth under the current boundary.
- Name-only similarity is evidence for review, never an automatic match.

No employee row is eligible until these decisions are approved. No auth users, memberships, sessions, or roles are queried or linked.

## Next read-only validation command

After placing the separate re-export ZIP at `.tmp/Aegis_XOM_Company_Reexport.zip`, validate only the copy:

```bash
node --env-file-if-exists=/vercel/share/.env.project \
  scripts/dry-run-aegis-core-mapping.mjs \
  .tmp/Aegis_XOM_Company_Reexport.zip \
  config/aegis-core-mapping-review.json \
  .tmp/aegis-company-reexport-dry-run.json
```

The expected safe result for the company row is `sourceRows: 1`, `candidateRows: 1`, `eligibleRows: 0`, and `quarantinedRows: 1`. The other two mappings require their original complete export entries unless the dry-run tool is extended to accept a partial archive.

## Final conclusion

The company data is present and valid. The exact issue was a parser shape mismatch: PowerShell emitted a singleton JSON object for the one-row table, while the original dry-run parser only accepted arrays or nested `rows`/`data` arrays. A source-only re-export is **not required to recover the company record**; it is optional if an array-normalized copy is desired for package consistency. The parser fix was validated against the original ZIP. The company record is still correctly quarantined pending mapping approval, company conflict policy, and explicit handling of blocked/audit fields.

No Neon write, DDL, authentication change, import, or deployment was performed.
