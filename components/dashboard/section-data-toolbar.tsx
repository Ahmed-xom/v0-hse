"use client"

import { useRef, useState } from "react"
import { Download, FileSpreadsheet, Upload } from "lucide-react"
import { read, utils, writeFile } from "xlsx"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type SectionDataToolbarProps = {
  section: string
  columns: string[]
  canImport?: boolean
}

export function SectionDataToolbar({ section, columns, canImport = true }: SectionDataToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const downloadTemplate = () => {
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([columns]), section.slice(0, 31))
    writeFile(workbook, `${section.toLowerCase().replace(/\s+/g, "-")}-template.xlsx`)
  }

  const importFile = async (file: File) => {
    setIsImporting(true)
    try {
      const workbook = read(await file.arrayBuffer(), { type: "array" })
      const rows = utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" })
      window.dispatchEvent(new CustomEvent("hse:excel-import", { detail: { section, rows } }))
      toast({ title: `${section} file loaded`, description: `${rows.length} row${rows.length === 1 ? "" : "s"} ready to import.` })
    } catch {
      toast({ title: "Import failed", description: "Please upload a valid .xlsx file.", variant: "destructive" })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canImport && (
        <>
          <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importFile(file) }} />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => inputRef.current?.click()} disabled={isImporting}>
            <Upload className="h-4 w-4" /> {isImporting ? "Importing..." : "Import"}
          </Button>
        </>
      )}
      <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
        <FileSpreadsheet className="h-4 w-4" /> Template
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => window.dispatchEvent(new CustomEvent("hse:excel-export", { detail: { section } }))}>
        <Download className="h-4 w-4" /> Export
      </Button>
    </div>
  )
}
