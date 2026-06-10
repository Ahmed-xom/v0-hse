"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Search, DownloadIcon, Loader } from "lucide-react"

interface TableMetadata {
  name: string
  rowCount: number
  columnCount: number
}

interface TableData {
  columns: string[]
  rows: Record<string, any>[]
}

export function ExcelDataViewer() {
  const [tables, setTables] = useState<TableMetadata[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoadingTables, setIsLoadingTables] = useState(true)

  // Fetch list of Excel tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("/api/admin/excel-tables")
        if (response.ok) {
          const data = await response.json()
          setTables(data.tables)
          if (data.tables.length > 0) {
            setSelectedTable(data.tables[0].name)
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch tables:", error)
      } finally {
        setIsLoadingTables(false)
      }
    }

    fetchTables()
  }, [])

  // Fetch table data when selection changes
  useEffect(() => {
    if (!selectedTable) return

    const fetchTableData = async () => {
      setLoading(true)
      setSearchQuery("")
      try {
        const response = await fetch(`/api/admin/excel-data?table=${encodeURIComponent(selectedTable)}`)
        if (response.ok) {
          const data = await response.json()
          setTableData(data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch table data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTableData()
  }, [selectedTable])

  const filteredRows = tableData?.rows.filter((row) => {
    if (!searchQuery) return true
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  }) || []

  if (isLoadingTables) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Excel Data Viewer</CardTitle>
          <CardDescription>View and manage imported Excel sheet data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Excel Data Viewer</CardTitle>
          <CardDescription>View and manage imported Excel sheet data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No Excel data found. Please import Excel sheets first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excel Data Viewer</CardTitle>
        <CardDescription>
          {tables.length} Excel sheets available with {tables.reduce((sum, t) => sum + t.rowCount, 0)} total records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Sheet</label>
          <div className="flex items-center gap-2">
            <select
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {tables.map((table) => (
                <option key={table.name} value={table.name}>
                  {table.name} ({table.rowCount} rows)
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : tableData && tableData.rows.length > 0 ? (
          <>
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {filteredRows.length} of {tableData.rows.length} rows
              </span>
            </div>

            {/* Data Table */}
            <ScrollArea className="w-full border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableData.columns.map((col) => (
                      <TableHead key={col} className="min-w-[150px]">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 50).map((row, idx) => (
                    <TableRow key={idx}>
                      {tableData.columns.map((col) => (
                        <TableCell key={`${idx}-${col}`} className="text-sm">
                          {String(row[col] || "-").substring(0, 50)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {filteredRows.length > 50 && (
              <p className="text-xs text-muted-foreground">
                Showing 50 of {filteredRows.length} matching rows
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data found in this sheet
          </div>
        )}
      </CardContent>
    </Card>
  )
}
