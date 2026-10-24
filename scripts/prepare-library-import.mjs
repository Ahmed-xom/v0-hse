#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import JSZip from 'jszip'

const archive = process.argv[2] ?? '.tmp/Aegis_XOM_Export.zip'
const output = process.argv[3] ?? 'reports/amnko-library-import-plan.json'
const bytes = fs.readFileSync(archive)
const zip = await JSZip.loadAsync(bytes)
const readJson = async (name) => JSON.parse(await zip.file(name).async('string'))
const library = await readJson('table_data\\dbo__tblLibrary.json')
const hierarchy = await readJson('table_data\\dbo__tblLibraryHierarchy.json')
const access = await readJson('table_data\\dbo__tblLibraryAccess.json')

const active = library.filter((row) => !row.Is_Deleted)
const deleted = library.filter((row) => Boolean(row.Is_Deleted))
const sourceFiles = active.filter((row) => row.FilePath || row.AttachmentPath || row.BlobPath || row.FileUrl)
const missingContent = active.filter((row) => !(row.FilePath || row.AttachmentPath || row.BlobPath || row.FileUrl))
const key = (row) => String(row.LibraryId ?? row.Id ?? row.ID ?? '')
const parentKey = (row) => String(row.LibraryParentId ?? row.ParentId ?? row.ParentLibraryId ?? '')
const folders = hierarchy.filter((row) => row.IsFolder === true || row.LibraryType === 'Folder' || !row.FileExt)
const plan = {
  mode: 'READ_ONLY_PREPARATION',
  sourceArchive: path.normalize(archive),
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  counts: { library: library.length, active: active.length, deleted: deleted.length, hierarchy: hierarchy.length, access: access.length, sourceFiles: sourceFiles.length, missingContent: missingContent.length, candidateFolders: folders.length },
  mapping: { folderSourceKey: 'LibraryId', folderParentKey: 'LibraryParentId/ParentId (must be verified)', documentSourceKey: 'LibraryId', documentFolderKey: 'LibraryParentId/ParentId (must be verified)', deletedPolicy: 'exclude from default display; retain in migration ledger', aclPolicy: 'audit-only until AccessType/AccessValue semantics are approved' },
  rows: active.map((row) => ({ sourceId: key(row), parentId: parentKey(row), deleted: false, fileName: row.FileName ?? row.LibraryName ?? null, fileSource: row.FilePath ?? row.AttachmentPath ?? row.BlobPath ?? row.FileUrl ?? null, status: row.FilePath || row.AttachmentPath || row.BlobPath || row.FileUrl ? 'CONTENT_SOURCE_PRESENT_NEEDS_VERIFICATION' : 'MISSING_CONTENT' })),
  safety: ['No database connection is made by this preparation script.', 'No Blob operation is made.', 'Execution is intentionally not implemented.', 'No ACL is widened.', 'Target IDs are not generated here.'],
}
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(plan, null, 2) + '\n')
console.log(JSON.stringify(plan.counts))
