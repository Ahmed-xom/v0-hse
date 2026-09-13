"use client"

import { useEffect, useState } from "react"
import { Database, FileArchive, RefreshCw } from "lucide-react"
import { getStorageUsage, type StorageUsage } from "@/app/actions/get-storage-usage"

export function StorageUsage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  async function refresh() {
    setIsLoading(true)
    setError(false)
    try {
      setUsage(await getStorageUsage())
    } catch (cause) {
      console.error("[v0] Storage usage failed", cause)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <section aria-labelledby="storage-usage-title" className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Platform health</p>
          <h2 id="storage-usage-title" className="mt-1 text-lg font-semibold">Storage usage</h2>
          <p className="mt-1 text-sm text-muted-foreground">Current database and file storage footprint</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60" aria-label="Refresh storage usage">
          <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-5 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">Storage usage is temporarily unavailable.</p>
      ) : isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : usage ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Database className="size-4 text-primary" /> Database</div>
            <p className="mt-2 text-2xl font-semibold">{usage.databaseLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">Live PostgreSQL database size</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileArchive className="size-4 text-primary" /> Files</div>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(usage.blobBytes)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{usage.blobCount.toLocaleString()} stored files</p>
          </div>
        </div>
      ) : null}

      {usage && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Stored records</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            {Object.entries(usage.recordCounts).map(([label, count]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-xs capitalize text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
