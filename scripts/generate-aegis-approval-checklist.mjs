import fs from 'node:fs/promises'

const proposal = JSON.parse(await fs.readFile(process.argv[2] ?? 'config/aegis-table-mapping-proposal.json', 'utf8'))
const core = JSON.parse(await fs.readFile(process.argv[3] ?? 'config/aegis-core-mapping-review.json', 'utf8'))
const outputJson = process.argv[4] ?? 'config/aegis-mapping-approval-checklist.json'
const outputMarkdown = process.argv[5] ?? 'config/aegis-mapping-approval-checklist.md'
const coreByMapping = new Map(core.mappings.map((item) => [`${item.source}->${item.destination}`, item]))
const sourceCounts = new Map(proposal.proposedMappings.map((item) => [`${item.sourceSchema}.${item.sourceTable}`, item.sourceRowCount]))
const priorities = new Map([
  ['dbo.tblCompany', 1],
  ['dbo.tblBusinessUnit', 2],
  ['dbo.tblEmployee', 3],
])

const actionFor = (source, destination) => {
  if (priorities.has(source) && destination !== 'public.training') return 'NEEDS_DECISION'
  if (source.includes('Auth') || source.includes('User') || source.includes('Password') || source.includes('Session')) return 'NO_SAFE_DESTINATION'
  if (source === 'dbo.tblEmployee' && destination === 'public.training') return 'NO_SAFE_DESTINATION'
  const coreItem = coreByMapping.get(`${source}->${destination}`)
  if (!coreItem) return 'NO_SAFE_DESTINATION'
  if (coreItem.blockingIssues?.length) return 'NEEDS_DECISION'
  return 'APPROVE_FOR_PILOT_REVIEW'
}

const records = proposal.proposedMappings.map((item) => {
  const source = `${item.sourceSchema}.${item.sourceTable}`
  const destination = `${item.destinationSchema}.${item.destinationTable}`
  const evidence = [
    `${item.confidence} confidence proposal for ${item.businessArea}.`,
    `Source row count is ${item.sourceRowCount}; source PK is ${item.sourcePrimaryKey.join(', ') || 'none'}.`,
    `Destination is an existing application table; no table creation is proposed.`,
  ]
  const coreItem = coreByMapping.get(`${source}->${destination}`)
  if (coreItem?.destinationRowCount !== undefined) evidence.push(`Latest read-only review recorded ${coreItem.destinationRowCount} destination rows.`)
  if (coreItem?.representativeRecordsReviewed?.length) evidence.push(`Representative source records reviewed: ${coreItem.representativeRecordsReviewed.join('; ')}.`)
  return {
    priority: priorities.get(source) ?? null,
    source,
    destination,
    sourceRowCount: sourceCounts.get(source) ?? item.sourceRowCount,
    destinationRowCount: coreItem?.destinationRowCount ?? null,
    evidence,
    requiredColumnConversions: item.destinationColumnMapping ?? [],
    primaryKeyStrategy: item.primaryKeyStrategy,
    foreignKeyDependencies: item.foreignKeyDependencies ?? [],
    duplicateConflictPolicy: item.duplicateConflictPolicy,
    risksToExistingApplicationBehavior: item.dataQualityConcerns ?? [],
    blockingIssues: coreItem?.blockingIssues ?? [],
    recommendedAction: actionFor(source, destination),
    approved: false,
  }
})

const summary = {
  generatedAt: new Date().toISOString(),
  source: proposal.source,
  safety: { approved: false, writesExecuted: false, schemaChanged: false, authChanged: false, betterAuthAccessed: false, deploymentExecuted: false },
  counts: {
    totalMappings: records.length,
    approveForPilotReview: records.filter((item) => item.recommendedAction === 'APPROVE_FOR_PILOT_REVIEW').length,
    needsDecision: records.filter((item) => item.recommendedAction === 'NEEDS_DECISION').length,
    noSafeDestination: records.filter((item) => item.recommendedAction === 'NO_SAFE_DESTINATION').length,
  },
  pilotScope: ['dbo.tblCompany -> public.company (1 row)', 'dbo.tblBusinessUnit -> public.business_unit (7 rows)', 'dbo.tblEmployee -> public.employee (378 rows)'],
  readOnlyValidationCommands: [
    'node scripts/validate-aegis-export.mjs .tmp/Aegis_XOM_Export.zip .tmp/aegis-export-validation.json',
    'node --env-file-if-exists=/vercel/share/.env.project scripts/reconcile-aegis-export.mjs .tmp/Aegis_XOM_Export.zip config/aegis-table-mapping-proposal.json .tmp/aegis-full-reconciliation.json',
    'node --env-file-if-exists=/vercel/share/.env.project scripts/import-aegis-to-neon.mjs --zip .tmp/Aegis_XOM_Export.zip --mapping config/aegis-table-mapping.json --dry-run --batch-size 100 --report .tmp/aegis-pilot-dry-run.json',
    'node --env-file-if-exists=/vercel/share/.env.project scripts/verify-aegis-import.mjs --zip .tmp/Aegis_XOM_Export.zip --report .tmp/aegis-pilot-dry-run.json',
  ],
  businessDecisionsRequired: [
    'Confirm source-to-Neon company identity and whether the singleton source company may be represented by deterministic id aegis:company:8.',
    'Confirm whether BU CId/Client_Id are authoritative company references and how BU_Under_Id hierarchy should be preserved.',
    'Confirm employee status-code dictionary, nullable payroll policy, and whether employee imports may create rows without Better Auth links.',
    'Confirm explicit timezone policy for SQL Server datetime values and treatment of CreatedBy/UpdatedBy audit identities.',
    'Confirm whether unmatched source fields (tax, logo, birth date, department/designation lookups) are quarantined or require a separate staging model.',
  ],
  records,
}

await fs.writeFile(outputJson, JSON.stringify(summary, null, 2) + '\n')
const lines = [
  '# Aegis_XOM to Neon Mapping Approval Checklist',
  '',
  `Generated: ${summary.generatedAt}`, '',
  '## Safety status',
  '',
  '- Mapping file remains unchanged and unapproved.',
  '- No writes, DDL, authentication changes, Better Auth access, or deployment were performed.',
  '',
  '## Recommended limited pilot scope',
  '',
  '- `dbo.tblCompany` → `public.company`: 1 source row.',
  '- `dbo.tblBusinessUnit` → `public.business_unit`: 7 source rows.',
  '- `dbo.tblEmployee` → `public.employee`: 378 source rows.',
  '- Pilot must remain insert-only, quarantine conflicts, preserve existing rows, and never link Better Auth users.',
  '',
  '## Exact read-only validation commands',
  '',
  '```bash',
  ...summary.readOnlyValidationCommands,
  '```',
  '',
  '## Business decisions requiring explicit input',
  '',
  ...summary.businessDecisionsRequired.map((item, index) => `${index + 1}. ${item}`),
  '',
  '## Decision records',
  '',
]
for (const item of records.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))) {
  lines.push(`### ${item.source} → ${item.destination}`)
  lines.push('')
  lines.push(`- Recommended action: **${item.recommendedAction}**`)
  lines.push(`- Source rows: ${item.sourceRowCount}; destination rows: ${item.destinationRowCount ?? 'not recorded in current review artifact'}`)
  lines.push(`- Primary-key strategy: ${item.primaryKeyStrategy}`)
  lines.push(`- Foreign-key dependencies: ${item.foreignKeyDependencies.length ? item.foreignKeyDependencies.join('; ') : 'None declared; verify source references before pilot.'}`)
  lines.push(`- Duplicate/conflict policy: ${item.duplicateConflictPolicy}`)
  lines.push('- Evidence:')
  for (const evidence of item.evidence) lines.push(`  - ${evidence}`)
  lines.push('- Required conversions:')
  for (const conversion of item.requiredColumnConversions) lines.push(`  - ${conversion.source} → ${conversion.target}: ${conversion.conversion}`)
  lines.push('- Risks:')
  for (const risk of item.risksToExistingApplicationBehavior) lines.push(`  - ${risk}`)
  if (item.blockingIssues.length) {
    lines.push('- Blocking issues:')
    for (const issue of item.blockingIssues) lines.push(`  - ${issue}`)
  }
  lines.push('- Approval: `NOT APPROVED`')
  lines.push('')
}
await fs.writeFile(outputMarkdown, lines.join('\n') + '\n')
console.log(JSON.stringify({ outputJson, outputMarkdown, counts: summary.counts }, null, 2))
