'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { analyticsApi } from '@/lib/api/analytics'
import { useWorkspaces } from '@/lib/hooks/useWorkspaces'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsOverview } from './StatsOverview'
import { FieldCharts } from './FieldCharts'
import { ResponseTable } from './ResponseTable'

interface ResultsDashboardProps {
  formId: string
}

export function ResultsDashboard({ formId }: ResultsDashboardProps) {
  const { data: workspaces } = useWorkspaces()
  const workspaceId = workspaces?.[0]?.id

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics', formId],
    queryFn: () => analyticsApi.getStats(workspaceId!, formId),
    enabled: !!workspaceId,
  })

  const { data: responsesData, isLoading: loadingResponses } = useQuery({
    queryKey: ['responses', formId],
    queryFn: () => analyticsApi.listResponses(workspaceId!, formId),
    enabled: !!workspaceId,
  })

  const exportUrl = workspaceId ? analyticsApi.exportCsvUrl(workspaceId, formId) : '#'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Results</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/builder/${formId}`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            Edit form
          </Link>
          <a
            href={exportUrl}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Export CSV
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Overview stats */}
        {loadingAnalytics ? (
          <div className="text-sm text-muted-foreground">Loading analytics...</div>
        ) : analytics ? (
          <StatsOverview stats={analytics.overview} />
        ) : null}

        <div className="mt-8">
          <Tabs defaultValue="questions">
            <TabsList>
              <TabsTrigger value="questions">By question</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="mt-6">
              {analytics?.fields && analytics.fields.length > 0 ? (
                <FieldCharts fields={analytics.fields} />
              ) : (
                <Empty message="No responses yet" />
              )}
            </TabsContent>

            <TabsContent value="responses" className="mt-6">
              {loadingResponses ? (
                <div className="text-sm text-muted-foreground">Loading responses...</div>
              ) : responsesData?.data && responsesData.data.length > 0 ? (
                <ResponseTable
                  responses={responsesData.data}
                  total={responsesData.total}
                />
              ) : (
                <Empty message="No responses yet" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed p-12 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
