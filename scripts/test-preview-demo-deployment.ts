import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { promisify } from "node:util"
import { DEMO_PAGE_PATHS } from "../lib/preview-demo"
import { demoSections } from "../lib/preview-demo-data"

const exec = promisify(execFile)

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory() ? routeFiles(filename) : filename.endsWith("/route.ts") ? [filename] : []
  })
}

async function main() {
  const deployment = new URL(process.argv[2])
  assert.equal(deployment.protocol, "https:")
  assert.ok(deployment.hostname.endsWith(".vercel.app"))
  const results: { path: string; method: string; status: number; check: string }[] = []

  async function request(route: string, method = "GET", extraHeaders: string[] = []) {
    const { stdout } = await exec("vercel", ["curl", route, "--deployment", deployment.origin, "--", "--silent", "--show-error", "--include", "--max-time", "30", "-X", method, ...extraHeaders.flatMap(header => ["-H", header])], { timeout: 45000, maxBuffer: 4 * 1024 * 1024 })
    const status = Number(stdout.match(/HTTP\/[\d.]+\s+(\d+)/)?.[1])
    assert.match(stdout, /x-amnko-preview-demo: read-only/i, `Demo boundary missing: ${method} ${route}`)
    assert.match(stdout, /cache-control:[^\r\n]*no-store/i, `No-store missing: ${route}`)
    assert.doesNotMatch(stdout, /set-cookie:\s*(?:__Secure-)?better-auth/i, "App must not establish an auth session")
    return { status, text: stdout }
  }

  // Abort before probing any data route unless the immutable deployment serves the isolated gallery.
  const home = await request("/")
  assert.equal(home.status, 200)
  assert.ok(home.text.includes('data-preview-demo="true"'))
  for (const section of demoSections) assert.ok(home.text.includes(`id="${section.id}"`), `Missing section: ${section.id}`)
  assert.ok(home.text.includes('id="kpi-cards"'))
  results.push({ path: "/", method: "GET", status: 200, check: "All 15 section anchors rendered with DEMO DATA; no app session" })

  async function batch<T>(items: T[], operation: (item: T) => Promise<void>) {
    let next = 0
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < items.length) await operation(items[next++])
    }))
  }

  await batch(DEMO_PAGE_PATHS.filter(route => route !== "/"), async route => {
    const response = await request(route)
    assert.equal(response.status, 200, route)
    assert.ok(response.text.includes('data-preview-demo="true"'), route)
    assert.ok(response.text.includes("DEMO DATA"), route)
    assert.ok(response.text.includes("Read-only"), route)
    assert.doesNotMatch(response.text, /<form\b/i, `Live form mounted: ${route}`)
    results.push({ path: route, method: "GET", status: response.status, check: "Static DEMO DATA gallery; no application login" })
  })

  const appRoot = path.join(process.cwd(), "app")
  const apiRoutes = routeFiles(path.join(appRoot, "api")).map(filename => filename.slice(appRoot.length).replace(/\/route.ts$/, "").replace(/\[.*?\]/g, "test-id"))
  await batch(apiRoutes, async route => {
    const read = await request(route)
    assert.equal(read.status, 403, `GET ${route}`)
    assert.ok(read.text.includes("PREVIEW_DEMO_READ_ONLY"))
    results.push({ path: route, method: "GET", status: read.status, check: "Live read denied before handler" })
    const write = await request(route, "POST")
    assert.equal(write.status, 403, `POST ${route}`)
    assert.ok(write.text.includes("PREVIEW_DEMO_READ_ONLY"))
    results.push({ path: route, method: "POST", status: write.status, check: "Write denied before handler" })
  })

  for (const route of ["/", "/profile", "/settings"]) {
    const action = await request(route, "POST", ["Next-Action: demo-boundary-test"])
    assert.equal(action.status, 403)
    assert.ok(action.text.includes("PREVIEW_DEMO_READ_ONLY"))
    results.push({ path: route, method: "POST", status: action.status, check: "Server Action request denied at boundary; action not invoked" })
  }
  for (const method of ["PUT", "PATCH", "DELETE"]) {
    const response = await request("/api/training", method)
    assert.equal(response.status, 403)
    results.push({ path: "/api/training", method, status: response.status, check: "Mutation method denied" })
  }
  const headerProbe = await request("/api/amnko-library", "GET", ["x-middleware-subrequest: proxy"])
  assert.equal(headerProbe.status, 403)
  results.push({ path: "/api/amnko-library", method: "GET", status: headerProbe.status, check: "Client-supplied middleware header does not bypass boundary" })

  const report = {
    deployment: deployment.origin,
    testedAt: new Date().toISOString(),
    applicationSession: "None; Vercel CLI handles platform Deployment Protection only",
    pageCount: DEMO_PAGE_PATHS.length,
    sectionCount: demoSections.length + 1,
    apiRouteCount: apiRoutes.length,
    requestCount: results.length,
    productionVerification: "Local policy/proxy tests only; no requests sent to Production",
    browserVerification: "Blocked by Vercel Deployment Protection SSO; no visual/interactivity pass claimed",
    limitations: "Gallery substitutes, not live modules. All live data and operational tools remain blocked. POST boundary probes do not invoke action functions.",
    results,
  }
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ deployment: report.deployment, pages: report.pageCount, sections: report.sectionCount, apiRoutes: report.apiRouteCount, requests: report.requestCount, result: "PASS" }, null, 2))
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
