/*
  AMNKO HSE parent crosswalk evidence export.
  READ ONLY: metadata inspection and SELECT statements only.
  Execute against the authorized legacy Aegis_XOM database.
  No legacy ID is treated as a Neon ID.
*/

SET NOCOUNT ON;

-- 1. Metadata, PK columns, Rowguid and identity flags in one result set.
SELECT
    s.name AS schema_name,
    t.name AS table_name,
    c.column_id,
    c.name AS column_name,
    ty.name AS data_type,
    c.max_length,
    c.is_nullable,
    c.is_identity,
    c.is_rowguidcol,
    CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END AS is_primary_key,
    pk.key_ordinal
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
OUTER APPLY (
    SELECT ic.column_id, ic.key_ordinal
    FROM sys.indexes i
    JOIN sys.index_columns ic
      ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    WHERE i.object_id = t.object_id AND i.is_primary_key = 1
      AND ic.column_id = c.column_id
) AS pk
WHERE t.name IN
    (N'tblAttachments', N'tblHSEINCMaster', N'tblHSEINCMaster2', N'tblJM')
ORDER BY t.name, c.column_id;

-- 2. Distinct ParentGroups and source counts. Unknown groups remain unresolved.
SELECT
    ParentGroup,
    COUNT_BIG(*) AS AttachmentRowCount,
    SUM(CASE WHEN LOWER(LTRIM(RTRIM(CONVERT(nvarchar(20), Is_Deleted)))) IN
        (N'1', N'true', N'yes') THEN 1 ELSE 0 END) AS DeletedAttachmentRowCount,
    CASE
        WHEN ParentGroup IN (N'HSEINCMaster', N'HSEINCMaster2', N'JM')
            THEN N'CANDIDATE_ONLY__VERIFY_WITH_METADATA_AND_ROWS'
        ELSE N'UNRESOLVED_PARENT_TABLE'
    END AS ResolutionStatus
FROM dbo.tblAttachments
GROUP BY ParentGroup
ORDER BY ParentGroup;

-- 3. Source attachment evidence; preserve ParentId and Is_Deleted.
SELECT
    AttachmentId, ParentGroup, ParentId, AttachmentName, AttachmentPath,
    SrNo, Is_Deleted, Rowguid
FROM dbo.tblAttachments
ORDER BY ParentGroup, ParentId, AttachmentId;

-- 4-6. Complete candidate parent rows. Do not infer ParentGroup mappings.
SELECT * FROM dbo.tblHSEINCMaster;
SELECT * FROM dbo.tblHSEINCMaster2;
SELECT * FROM dbo.tblJM;
