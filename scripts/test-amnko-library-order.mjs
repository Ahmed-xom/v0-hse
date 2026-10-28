import fs from 'node:fs'

const manifest = JSON.parse(fs.readFileSync('config/amnko-library-order.json', 'utf8'))
const response = await fetch(`${process.env.AMNKO_BASE_URL || 'http://localhost:3000'}/api/amnko-library`)
if (!response.ok) throw new Error(`Library request failed: HTTP ${response.status}`)
const { documents } = await response.json()
const uuidOrBlobSuffix = /[0-9a-f]{8}-[0-9a-f-]{27,}|__\d+(?=\.[^.]+$)/i
const cleanDisplayNames = documents.every((item) => !item.title || !uuidOrBlobSuffix.test(item.title)) && documents.every((item) => !item.fileName || !uuidOrBlobSuffix.test(item.fileName))
const sourceEntries = manifest.items.filter((item) => item.matchEvidence?.startsWith('Aegis_XOM'))
const ordered = documents.every((item, index) => index === 0 || (documents[index - 1].referenceOrder ?? Number.MAX_SAFE_INTEGER) <= (item.referenceOrder ?? Number.MAX_SAFE_INTEGER))
const tieBreaks = documents.every((item, index) => index === 0 || item.referenceOrder !== documents[index - 1].referenceOrder || (item.sourceId ?? item.rowguid) >= (documents[index - 1].sourceId ?? documents[index - 1].rowguid))
const manifestPathnames = new Set(manifest.items.map((item) => item.blobPathname).filter(Boolean))
const manifestStems = new Set([...manifestPathnames].map((pathname) => pathname.split('/').pop().replace(/\.[^.]+$/, '')))
const noLoss = documents.every((item) => manifestPathnames.has(item.pathname) || manifestStems.has(item.pathname.split('/').pop().replace(/\.[^.]+$/, '')))
const folderRelations = documents.filter((item) => item.parentSourceId).length
if (documents.length !== 348) throw new Error(`Expected 348 documents, received ${documents.length}`)
if (sourceEntries.length !== 80) throw new Error(`Expected 80 restored source entries, received ${sourceEntries.length}`)
if (!ordered || !tieBreaks) throw new Error('Reference order or source-id tie-break is not stable')
if (!noLoss) throw new Error('At least one API document is absent from the manifest')
if (!folderRelations) throw new Error('No parent-child relationships were returned')
if (!cleanDisplayNames) throw new Error('A display title or filename still contains a UUID or storage suffix')
console.log(JSON.stringify({ documents: documents.length, restoredSourceEntries: sourceEntries.length, parentChildDocuments: folderRelations, ordered, stableTieBreak: tieBreaks, noLoss, cleanDisplayNames }))
