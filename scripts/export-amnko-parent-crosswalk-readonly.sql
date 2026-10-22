/*
  AMNKO HSE parent crosswalk evidence export.
  READ ONLY: metadata inspection and SELECT statements only.
  Execute against the authorized legacy Aegis_XOM database.
  No legacy ID is treated as a Neon ID.
*/

SET NOCOUNT ON;

-- 1. ParentGroup values required by the local attachment export.
SELECT
    ParentGroup,
    COUNT_BIG(*) AS AttachmentRowCount,
    SUM(CASE WHEN LOWER(LTRIM(RTRIM(CONVERT(nvarchar(20), Is_Deleted)))) IN
        (N'1', N'true', N'yes') THEN 1 ELSE 0 END) AS DeletedAttachmentRowCount
FROM dbo.tblAttachments
GROUP BY ParentGroup
ORDER BY ParentGroup;

-- 2. Source attachment evidence. Preserve this result when validating
-- ParentGroup + ParentId and deleted-source handling.
SELECT
    AttachmentId,
    ParentGroup,
    ParentId,
    AttachmentName,
    AttachmentPath,
    SrNo,
    Is_Deleted,
    Rowguid
FROM dbo.tblAttachments
ORDER BY ParentGroup, ParentId, AttachmentId;

-- 3. Metadata for candidate parent tables and attachment relationships.
SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.column_id,
    c.name AS column_name,
    ty.name AS data_type,
    c.max_length,
    c.is_nullable,
    c.is_identity,
    c.is_rowguidcol
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE t.name IN
    (N'tblAttachments', N'tblHSEINCMaster', N'tblHSEINCMaster2', N'tblJM')
ORDER BY t.name, c.column_id;

-- 4. Primary-key metadata for the candidate tables.
SELECT
    s.name AS schema_name,
    t.name AS table_name,
    kc.name AS primary_key_name,
    ic.key_ordinal,
    c.name AS column_name
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.key_constraints kc
  ON kc.parent_object_id = t.object_id
 AND kc.type = 'PK'
JOIN sys.index_columns ic
  ON ic.object_id = kc.parent_object_id
 AND ic.index_id = kc.unique_index_id
JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE t.name IN
    (N'tblAttachments', N'tblHSEINCMaster', N'tblHSEINCMaster2', N'tblJM')
ORDER BY t.name, ic.key_ordinal;

-- 5. Complete rows for schema-supported candidate parents.
-- No assumptions are made about which ParentGroup maps to which table.
SELECT * FROM dbo.tblHSEINCMaster;
SELECT * FROM dbo.tblHSEINCMaster2;
SELECT * FROM dbo.tblJM;

-- 6. Explicit unresolved notice for ParentGroups without schema proof.
SELECT
    ParentGroup,
    CAST(N'UNRESOLVED_PARENT_TABLE' AS nvarchar(64)) AS ResolutionStatus,
    CAST(NULL AS nvarchar(256)) AS ProposedParentTable,
    CAST(NULL AS nvarchar(256)) AS ProposedParentKey
FROM dbo.tblAttachments
WHERE ParentGroup NOT IN (N'HSEINCMaster', N'HSEINCMaster2', N'JM')
GROUP BY ParentGroup
ORDER BY ParentGroup;
