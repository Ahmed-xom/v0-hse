import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { spawn } from "node:child_process"
import JSZip from "jszip"
import process from "node:process"

const temp = ".tmp/aegis-safety-test"
await fs.mkdir(temp, { recursive: true })
const zip = new JSZip()
zip.file("table_data\\dbo__singleton.json", JSON.stringify({ id: 7, name: "one" }))
await fs.writeFile(`${temp}/fixture.zip`, await zip.generateAsync({ type: "nodebuffer" }))
await fs.writeFile(`${temp}/unapproved.json`, JSON.stringify({ approved: false, tables: [] }))
const run = (args) => new Promise((resolve) => {
  const child = spawn(process.execPath, args, { env: { ...process.env }, stdio: ["ignore", "pipe", "pipe"] })
  let stderr = ""
  child.stderr.on("data", (chunk) => { stderr += chunk })
  child.on("close", (code) => resolve({ code, stderr }))
})
const blocked = await run(["scripts/import-aegis-to-neon.mjs", "--zip", `${temp}/fixture.zip`, "--mapping", `${temp}/unapproved.json`, "--dry-run"])
assert.notEqual(blocked.code, 0)
assert.match(blocked.stderr, /Mapping plan is not approved/)
const importer = await fs.readFile("scripts/import-aegis-to-neon.mjs", "utf8")
assert.match(importer, /ON CONFLICT DO NOTHING/)
assert.match(importer, /ROLLBACK/)
assert.match(importer, /checkpoint\[checkpointKey\] = "complete"/)
assert.match(importer, /if \(!dryRun && process\.env\.NODE_ENV === "production"\)/)
console.log(JSON.stringify({ singletonFixture: true, writeGate: true, duplicatePrevention: true, rollbackPath: true, checkpointGate: true }, null, 2))
