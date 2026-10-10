import fs from "node:fs/promises"

const [mappingPath = "config/aegis-table-mapping-proposal.json", outputPath = ".tmp/aegis-dependency-quarantine-report.json"] = process.argv.slice(2)
const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"))
const records = mapping.proposedMappings ?? mapping.tables ?? []
const bySource = new Map(records.map((item) => [`${item.sourceSchema}.${item.sourceTable}`, item]))
const dependencies = []
const quarantine = []
for (const item of records) {
  const source = `${item.sourceSchema}.${item.sourceTable}`
  const foreignKeys = item.foreignKeys ?? item.sourceForeignKeys ?? []
  for (const foreignKey of foreignKeys) {
    const referenced = foreignKey.referenced_table ?? foreignKey.foreign_table ?? foreignKey.targetTable
    if (!referenced) continue
    dependencies.push({ source, referenced, column: foreignKey.column_name ?? foreignKey.column ?? null, status: bySource.has(referenced) ? "MAPPED_DEPENDENCY" : "UNRESOLVED_SOURCE_DEPENDENCY" })
  }
  const action = item.approved === true && item.status === "APPROVED" ? "PILOT_CANDIDATE" : "QUARANTINE_UNTIL_APPROVED"
  quarantine.push({ source, destination: item.targetSchema && item.targetTable ? `${item.targetSchema}.${item.targetTable}` : null, action, reasons: item.requiredDecisions ?? item.blockers ?? ["mapping approval required"] })
}
const indegree = new Map(records.map((item) => [`${item.sourceSchema}.${item.sourceTable}`, 0]))
for (const dependency of dependencies) if (indegree.has(dependency.source) && indegree.has(dependency.referenced)) indegree.set(dependency.source, indegree.get(dependency.source) + 1)
const order = []
while (indegree.size) {
  const ready = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([name]) => name).sort()
  if (!ready.length) { order.push({ cycle: [...indegree.keys()] }); break }
  for (const name of ready) { order.push(name); indegree.delete(name) }
  for (const dependency of dependencies) if (ready.includes(dependency.referenced) && indegree.has(dependency.source)) indegree.set(dependency.source, indegree.get(dependency.source) - 1)
}
const report = { generatedAt: new Date().toISOString(), readOnly: true, mappingApproved: Boolean(mapping.approved), dependencyCount: dependencies.length, dependencies, suggestedOrder: order, quarantine, safety: { writesExecuted: false, schemaChanged: false, authAccessed: false } }
await fs.mkdir(new URL(".", `file://${process.cwd()}/${outputPath}`).pathname, { recursive: true }).catch(() => undefined)
await fs.writeFile(outputPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ outputPath, dependencyCount: dependencies.length, quarantineCount: quarantine.length, mappingApproved: report.mappingApproved }, null, 2))
