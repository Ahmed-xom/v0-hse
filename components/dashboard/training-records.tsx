'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface TrainingRecord {
  id: string
  employee_name: string
  employee_code: string | null
  course_name: string
  status: string
  result: string
  completed_date: string
}

export function TrainingRecords() {
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrainingRecords() {
      try {
        const response = await fetch('/api/training')
        const data = await response.json()

        if (data.success) {
          setRecords(data.data)
        } else {
          setError(data.error || 'Failed to fetch records')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching records')
      } finally {
        setLoading(false)
      }
    }

    fetchTrainingRecords()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const resultBadgeVariant = (result: string) => {
    switch (result.toUpperCase()) {
      case 'PASSED':
        return 'default'
      case 'FAILED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Records</CardTitle>
        <CardDescription>
          {records.length} employee training record{records.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Employee</th>
                <th className="text-left py-2 px-3 font-medium">Code</th>
                <th className="text-left py-2 px-3 font-medium">Course</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">Result</th>
                <th className="text-left py-2 px-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 text-foreground">{record.employee_name}</td>
                  <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                    {record.employee_code || '-'}
                  </td>
                  <td className="py-2 px-3 text-foreground text-xs">{record.course_name}</td>
                  <td className="py-2 px-3">
                    <Badge variant="outline" className="text-xs">
                      {record.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    <Badge variant={resultBadgeVariant(record.result)} className="text-xs">
                      {record.result}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-sm">
                    {new Date(record.completed_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No training records found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
