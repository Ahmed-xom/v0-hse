"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type ScanReport = { sourceName: string; sourceBytes: number; sourceCounts: Record<string, number>; folders: string[]; detected: Record<string, string[]>; duplicateFiles: Array<{ sha256: string; paths: string[] }>; companyMappingCandidates: string[]; issues: Array<{ code: string; message: string }>; scannedAt: string }
const SHARE_URL = "https://falconinvs-my.sharepoint.com/:u:/g/personal/xom-it-admin_xomoman_com/IQBatEkNAXLOR4XRjJDs8ZK-AUA7g8r24ClOhAhmeCPFyGM?e=RObKeG"

export function SharePointMigrationControls() {
  const [status, setStatus] = useState("Ready for a read-only scan.")
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<ScanReport | null>(null)
  const [busy, setBusy] = useState(false)

  async function scanArchive(file: File) {
    setBusy(true); setReport(null); setProgress(20); setStatus("Uploading archive to the protected scan endpoint…")
    const form = new FormData(); form.append("archive", file)
    const response = await fetch("/api/admin/legacy-migration/scan", { method: "POST", body: form })
    setProgress(80)
    const payload = await response.json() as { report?: ScanReport; error?: string }
    if (!response.ok || !payload.report) { setStatus(payload.error ?? "The archive could not be scanned."); setProgress(0); setBusy(false); return }
    setReport(payload.report); setProgress(100); setStatus("Read-only scan complete. No Neon or production storage data was changed."); setBusy(false)
  }

  async function downloadAndScan() {
    setBusy(true); setProgress(10); setStatus("Requesting the SharePoint archive securely…")
    let response = await fetch(`/api/admin/legacy-migration/sharepoint-download?url=${encodeURIComponent(SHARE_URL)}`)
    if (response.status === 428) {
      const authorization = await fetch("/api/admin/legacy-migration/sharepoint-authorize")
      const { url } = await authorization.json() as { url?: string }
      if (url) { if (window.self !== window.top) window.open(url, "_blank", "noopener,noreferrer"); else window.location.href = url }
      setStatus("Complete Microsoft authorization, then return and choose the upload scan option."); setBusy(false); return
    }
    if (!response.ok) { setStatus("The archive could not be transferred from SharePoint."); setBusy(false); return }
    setProgress(35); setStatus("Archive transferred. Starting protected read-only scan…")
    const file = new File([await response.blob()], "XOM_Files.zip", { type: "application/zip" })
    await scanArchive(file)
  }

  return <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Microsoft Connect · Read-only</p>
    <h2 className="mt-2 text-xl font-semibold">SharePoint archive scan</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Transfer the archive through the signed-in Microsoft account or choose a downloaded ZIP. The server scans it in memory with size, entry-count, decompression, and path-traversal limits. Nothing is imported.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Button onClick={downloadAndScan} disabled={busy}>Connect, transfer, and scan</Button>
      <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">Choose ZIP to scan<input className="sr-only" type="file" accept=".zip,application/zip" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void scanArchive(file) }} /></label>
    </div>
    {busy || progress > 0 ? <div className="mt-5 space-y-2"><Progress value={progress} aria-label="Scan progress" /><p className="text-sm text-muted-foreground" role="status">{status}</p></div> : <p className="mt-4 text-sm text-muted-foreground" role="status">{status}</p>}
    {report ? <div className="mt-6 space-y-5 border-t border-border pt-5"><div><h3 className="font-semibold">Dry-run report: {report.sourceName}</h3><p className="text-sm text-muted-foreground">Scanned {new Date(report.scannedAt).toLocaleString()} · {Math.round(report.sourceBytes / 1024 / 1024 * 10) / 10} MB</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Files" value={report.sourceCounts.files ?? 0} /><Metric label="Folders" value={report.folders.length} /><Metric label="Duplicates" value={report.duplicateFiles.length} /><Metric label="Training" value={report.sourceCounts.trainingCandidates ?? 0} /><Metric label="Database" value={report.detected.databaseExports?.length ?? 0} /><Metric label="Attachments" value={report.sourceCounts.attachments ?? 0} /></div><ReportList title="Company mapping candidates" items={report.companyMappingCandidates} /><ReportList title="Errors and review items" items={report.issues.map((issue) => `${issue.code}: ${issue.message}`)} empty="No scan errors were found; mapping still requires review." /><p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Import approval is a separate step. This scan has not written to Neon, Blob, or any production table.</p></div> : null}
  </section>
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div> }
function ReportList({ title, items, empty }: { title: string; items: string[]; empty?: string }) { return <div><h4 className="text-sm font-semibold">{title}</h4>{items.length ? <ul className="mt-2 max-h-40 overflow-auto rounded-lg border border-border p-3 text-xs text-muted-foreground">{items.map((item) => <li key={item} className="py-1">{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{empty ?? "None detected."}</p>}</div> }
