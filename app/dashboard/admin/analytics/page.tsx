"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import {
  Users,
  Building2,
  FileText,
  Briefcase,
  TrendingUp,
  Activity,
  Award,
  AlertCircle,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  MetricCard,
  BarChartCard,
  PieChartCard
} from '@/components/analytics'
import toast from 'react-hot-toast'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [studentAssessments, setStudentAssessments] = useState<Record<string, any>>({})
  const [loadingAssessments, setLoadingAssessments] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      const data = await apiClient.getAdminAnalytics(
        startDate.toISOString(),
        endDate.toISOString()
      )
      setAnalytics(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex justify-center items-center min-h-screen">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  const platformOverview = analytics?.platform_overview || {}

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="colleges">Colleges</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Students"
                value={platformOverview.total_metrics?.students || 0}
                icon={<Users className="h-5 w-5" />}
              />
              <MetricCard
                title="Total Colleges"
                value={platformOverview.total_metrics?.colleges || 0}
                icon={<Building2 className="h-5 w-5" />}
              />
              <MetricCard
                title="Total Assessments"
                value={platformOverview.total_metrics?.assessments || 0}
                icon={<FileText className="h-5 w-5" />}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
