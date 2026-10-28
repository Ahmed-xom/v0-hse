import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"
import { DEMO_PAGE_PATHS, isPreviewDemoMode, previewDemoRequestPolicy } from "../lib/preview-demo"
import { demoPageTitles, demoSectionsForPage } from "../lib/preview-demo-data"
import { proxy } from "../proxy"

async function main() {
const root = process.cwd()
function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory() ? filesIn(filename) : [filename]
  })
}

const apiRoutes = filesIn(path.join(root, "app/api")).filter(file => file.endsWith("/route.ts")).map(file => {
  return file.slice(path.join(root, "app").length).replace(/\/route.ts$/, "").replace(/\[.*?\]/g, "test-id")
})
const actionFiles = filesIn(path.join(root, "app/actions")).filter(file => file.endsWith(".ts"))
const existingPages = filesIn(path.join(root, "app")).filter(file => file.endsWith("/page.tsx")).map(file => file.slice(path.join(root, "app").length).replace(/\/page.tsx$/, "") || "/")

for (const environment of ["production", "development", "", "Preview"]) {
  assert.equal(isPreviewDemoMode(environment, true), false)
  for (const pathname of [...apiRoutes, ...DEMO_PAGE_PATHS]) {
    assert.equal(previewDemoRequestPolicy(pathname, "POST", true, environment), "pass")
  }
}
assert.equal(isPreviewDemoMode("preview", false), false)
assert.equal(isPreviewDemoMode("preview", true), true)
for (const pathname of existingPages) {
  assert.ok(pathname === "/preview-demo" || (DEMO_PAGE_PATHS as readonly string[]).includes(pathname), `Missing page isolation: ${pathname}`)
}

const previousEnvironment = process.env.VERCEL_ENV
const previousFlag = process.env.PREVIEW_DEMO_MODE
let blockedRequests = 0
try {
  process.env.VERCEL_ENV = "preview"
  for (const pathname of apiRoutes) {
    for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const response = proxy(new NextRequest(`https://demo.example.invalid${pathname}`, { method }))
      assert.equal(response.status, 403, `${method} ${pathname}`)
      assert.equal(response.headers.get("x-middleware-next"), null)
      assert.equal(response.headers.get("x-middleware-rewrite"), null)
      assert.match(response.headers.get("cache-control") || "", /no-store/)
      assert.equal(JSON.parse(await response.text()).code, "PREVIEW_DEMO_READ_ONLY")
      blockedRequests++
    }
  }
  for (const pathname of [...DEMO_PAGE_PATHS, "/preview-demo"]) {
    const response = proxy(new NextRequest(`https://demo.example.invalid${pathname}?email=discard-me`))
    if (pathname !== "/preview-demo") {
      const rewrite = new URL(response.headers.get("x-middleware-rewrite")!)
      assert.equal(rewrite.pathname, "/preview-demo")
      assert.equal(rewrite.searchParams.get("view"), pathname)
      assert.equal(rewrite.searchParams.has("email"), false)
      assert.ok(demoPageTitles[pathname])
    }
  }
} finally {
  if (previousEnvironment === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = previousEnvironment
}

try {
  process.env.VERCEL_ENV = "preview"
  for (const pathname of DEMO_PAGE_PATHS) {
    assert.ok(demoPageTitles[pathname])
    const action = proxy(new NextRequest(`https://demo.example.invalid${pathname}`, { method: "POST", headers: { "Next-Action": "nonexistent-test-action" } }))
    assert.equal(action.status, 403)
    assert.equal(proxy(new NextRequest(`https://demo.example.invalid${pathname}`, { headers: { "Next-Action": "nonexistent-test-action" } })).status, 403)
    for (const section of demoSectionsForPage(pathname)) {
      for (const row of section.rows) assert.ok(row.some(cell => /demo|sample/i.test(cell)))
    }
  }
  for (const filename of actionFiles) {
    const action = proxy(new NextRequest("https://demo.example.invalid/", { method: "POST", headers: { "Next-Action": path.basename(filename) } }))
    assert.equal(action.status, 403)
  }
  assert.equal(proxy(new NextRequest("https://demo.example.invalid/private-unknown")).status, 404)
  assert.equal(proxy(new NextRequest("https://demo.example.invalid/.well-known/workflow/v1/step")).status, 403)
  assert.equal(proxy(new NextRequest("https://demo.example.invalid/_next/data/build/api/amnko-library.json")).status, 403)
  assert.equal(proxy(new NextRequest("https://demo.example.invalid/_next/static/chunk.js")).headers.get("x-middleware-next"), "1")
  process.env.VERCEL_ENV = "production"
  process.env.PREVIEW_DEMO_MODE = "true"
  const { default: PreviewDemoPage } = await import("../app/preview-demo/page")
  await assert.rejects(
    PreviewDemoPage({ searchParams: Promise.resolve({ view: "/" }) }),
    (error: unknown) => error instanceof Error && error.message.includes("404"),
    "Demo page must return notFound in production even with PREVIEW_DEMO_MODE=true",
  )
  for (const pathname of ["/", "/preview-demo", ...apiRoutes]) {
    const response = proxy(new NextRequest(`https://demo.example.invalid${pathname}`, { method: "POST", headers: { "Next-Action": "test" } }))
    assert.equal(response.headers.get("x-middleware-next"), "1")
    assert.equal(response.headers.get("x-amnko-preview-demo"), null)
  }
} finally {
  if (previousEnvironment === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = previousEnvironment
  if (previousFlag === undefined) delete process.env.PREVIEW_DEMO_MODE
  else process.env.PREVIEW_DEMO_MODE = previousFlag
}

for (const view of ["/", "/admin/amnko-library", "/admin/amnko-attachments"]) {
  const library = demoSectionsForPage(view).find(section => section.id === "document-library")
  assert.ok(library)
  assert.deepEqual(library.rows, [], "No approved demo files: never invent an inventory")
  assert.match(library.description, /Document inventory unavailable in safe demo mode/)
}
const workspaceSource = readFileSync(path.join(root, "components/preview-demo/demo-workspace.tsx"), "utf8")
assert.match(workspaceSource, /section.id === "document-library"[\s\S]*?<DemoDocumentLibrary/)
assert.doesNotMatch(workspaceSource, />Add record<|>Edit \/ delete</)
const librarySource = readFileSync(path.join(root, "components/preview-demo/demo-document-library.tsx"), "utf8")
assert.match(librarySource, /data-inventory-status="unavailable"/)
assert.match(librarySource, /Total documents: Unknown/)
assert.match(librarySource, /Verified, authorized demo files shown: 0/)
assert.match(librarySource, /Document inventory unavailable in safe demo mode/)
assert.doesNotMatch(librarySource, /href=|onClick=|DEMO-DOC-|Sample safety handbook|Sample induction checklist/)
assert.doesNotMatch(librarySource, /(?:blob_pathname|file_url|READ_WRITE_TOKEN|orderManifest)/)

for (const filename of ["lib/preview-demo.ts", "lib/preview-demo-data.ts", ...filesIn(path.join(root, "components/preview-demo")).map(file => path.relative(root, file)), "app/preview-demo/page.tsx", "proxy.ts"]) {
  const source = readFileSync(path.join(root, filename), "utf8")
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:app\/actions|lib\/db|auth-context|auth-client|lib\/auth["']|@vercel\/blob)/)
  assert.doesNotMatch(source, /\bfetch\s*\(|\buseSWR\s*\(|\buseEffect\s*\(/)
}
console.log(`PASS: ${DEMO_PAGE_PATHS.length} page paths isolated; ${apiRoutes.length} API routes / ${blockedRequests} requests denied before handlers; ${actionFiles.length} action modules blocked at POST boundary; production unchanged even with PREVIEW_DEMO_MODE=true; no data-access imports or fetches in demo files.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
