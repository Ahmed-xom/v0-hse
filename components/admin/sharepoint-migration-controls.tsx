"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const SHARE_URL = "https://falconinvs-my.sharepoint.com/:u:/g/personal/xom-it-admin_xomoman_com/IQBatEkNAXLOR4XRjJDs8ZK-AUA7g8r24ClOhAhmeCPFyGM?e=RObKeG"

export function SharePointMigrationControls() {
  const [status, setStatus] = useState<string>("")

  async function downloadArchive() {
    setStatus("Requesting Microsoft authorization…")
    const response = await fetch(`/api/admin/legacy-migration/sharepoint-download?url=${encodeURIComponent(SHARE_URL)}`)
    if (response.status === 428) {
      const authorization = await fetch("/api/admin/legacy-migration/sharepoint-authorize")
      const { url } = await authorization.json() as { url?: string }
      if (url) {
        setStatus("Opening Microsoft authorization…")
        if (window.self !== window.top) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
      } else {
        setStatus("Microsoft authorization could not be started.")
      }
      return
    }
    if (!response.ok) {
      setStatus("The archive could not be downloaded. No migration was performed.")
      return
    }
    const blob = await response.blob()
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "XOM_Files.zip"
    link.click()
    URL.revokeObjectURL(link.href)
    setStatus("Archive downloaded locally. Run the Windows dry-run utility before any import.")
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Microsoft Connect</p>
      <h2 className="mt-2 text-xl font-semibold">SharePoint archive access</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Uses the signed-in admin&apos;s Microsoft authorization and keeps the token server-side. This downloads only to your browser; it does not import or write to Neon.</p>
      <Button className="mt-5" onClick={downloadArchive}>Download archive for dry-run</Button>
      {status ? <p className="mt-4 text-sm text-muted-foreground" role="status">{status}</p> : null}
    </section>
  )
}
