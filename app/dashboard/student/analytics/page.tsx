"use client"

import { useEffect, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Filter } from 'lucide-react'
import { StudentAnalyticsDashboard } from '@/components/analytics/StudentAnalyticsDashboard'
import { StudentBrandPageShell } from '@/components/dashboard/StudentBrandPageShell'

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export default function StudentAnalyticsPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const defaults = defaultDateRange()
  const [filters, setFilters] = useState<{
    start_date?: string
    end_date?: string
    categories: Record<string, boolean>
  }>({
    start_date: defaults.start_date,
    end_date: defaults.end_date,
    categories: { assessment: true, interview: true, application: true, resume: true, portfolio: true },
  })

  const buildParams = useCallback(() => {
    const categories = Object.entries(filters.categories)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')
    return {
      start_date: filters.start_date,
      end_date: filters.end_date,
      categories: categories || undefined,
    }
  }, [filters])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const params = buildParams()
      const analytics = await apiClient.getStudentAnalyticsWithFilters(params)
      setData(analytics)
    } catch (e) {
      console.error('Failed to load analytics', e)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    void loadData()
  }, [])

  const handleFilterApply = async () => {
    await loadData()
    setShowFilters(false)
  }

  const filtersPanel = (
    <Card className="border border-gray-200 dark:border-gray-700 dark:bg-[#1C2938]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Filter className="w-5 h-5" />
          Filter Analytics
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Customize date range and data categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-gray-300">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2A3444] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.start_date || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value || undefined }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block dark:text-gray-300">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2A3444] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.end_date || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value || undefined }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block dark:text-gray-300">Categories</label>
            <div className="flex flex-wrap gap-3">
              {Object.keys(filters.categories).map((key) => (
                <label
                  key={key}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A3444] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories[key as keyof typeof filters.categories]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        categories: { ...prev.categories, [key]: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium capitalize dark:text-gray-200">{key}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => void handleFilterApply()} className="gap-2 bg-[#0068FC] hover:bg-[#0056d6]">
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const d = defaultDateRange()
                setFilters({
                  start_date: d.start_date,
                  end_date: d.end_date,
                  categories: { assessment: true, interview: true, application: true, resume: true, portfolio: true },
                })
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <StudentBrandPageShell>
          <div className="w-full flex items-center justify-center py-24">
            <Loader size="lg" />
          </div>
        </StudentBrandPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredUserType="student">
      <StudentBrandPageShell contentClassName="pb-6">
        <StudentAnalyticsDashboard
          data={data}
          isDark={isDark}
          dateRange={{ start: filters.start_date, end: filters.end_date }}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
          filtersPanel={filtersPanel}
        />
      </StudentBrandPageShell>
    </DashboardLayout>
  )
}
