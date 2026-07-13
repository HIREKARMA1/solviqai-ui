"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import {
  User,
  FileText,
  Briefcase,
  ClipboardList,
  Zap,
  Plus,
  X,
  Play,
  Workflow,
} from 'lucide-react'
import { StudentDashboardView } from '@/components/dashboard/StudentDashboardView'
import { StudentBrandPageShell } from '@/components/dashboard/StudentBrandPageShell'

function getNextActionHref(action: {
  type: string
  assessment_id?: string | null
  drive_attempt_id?: string | null
}): string {
  switch (action.type) {
    case 'continue':
      return `/dashboard/student/assessment?id=${action.assessment_id}`
    case 'continue_drive':
      return `/dashboard/student/placement-drives/run?attempt_id=${action.drive_attempt_id}`
    case 'resume':
      return '/dashboard/student/resume'
    case 'start':
    case 'jobs':
    default:
      return '/dashboard/student/jobs'
  }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<
    Array<{ id: string; date: string; score?: number; title: string }>
  >([])
  const [allAssessments, setAllAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const studentName = user?.name || 'there'

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [data, a, assmts] = await Promise.all([
        apiClient.getStudentDashboard(),
        apiClient.getStudentAnalytics(),
        apiClient.getStudentAssessments(0, 8),
      ])
      setStats(data)
      setAnalytics(a)

      const assessments = assmts?.assessments || []
      setAllAssessments(assessments)

      if (assessments.length > 0) {
        const sortedAll = [...assessments].sort(
          (b: any, c: any) => new Date(c.started_at).getTime() - new Date(b.started_at).getTime(),
        )
        setRecentActivities(
          sortedAll.slice(0, 8).map((item: any) => {
            const roleTitle =
              typeof item.job_role === 'object' && item.job_role?.title
                ? item.job_role.title
                : item.job_role || 'Assessment'
            return {
              id: item.assessment_id,
              date: item.completed_at || item.started_at,
              score: item.overall_score,
              title: String(roleTitle).replace(/_/g, ' '),
            }
          }),
        )
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout requiredUserType="student">
      <StudentBrandPageShell contentClassName="pb-24">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size="lg" />
          </div>
        ) : (
          <StudentDashboardView
            studentName={studentName}
            stats={stats}
            analytics={analytics}
            recentActivities={recentActivities}
            allAssessments={allAssessments}
          />
        )}

        {/* Quick Action FAB */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {quickActionOpen && (
            <div className="w-full max-w-[397px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-lg mb-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0068FC]">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Action</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get started with your placement preparation</p>
                </div>
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard/student/simulations"
                  className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <Workflow className="h-5 w-5" />
                  <span>Job Prep Simulation</span>
                </Link>
                <Link
                  href={stats?.next_action ? getNextActionHref(stats.next_action) : '/dashboard/student/jobs'}
                  className="flex items-center gap-3 rounded-lg bg-[#f58020]/10 px-3 py-2.5 font-medium text-[#f58020] transition-colors hover:bg-[#f58020]/20"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <Play className="h-5 w-5" />
                  <span>
                    {stats?.next_action?.type === 'continue'
                      ? 'Continue Simulation'
                      : stats?.next_action?.type === 'continue_drive'
                        ? 'Continue Drive'
                        : 'Start Simulation'}
                  </span>
                </Link>
                <Link
                  href="/dashboard/student/resume"
                  className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>{stats?.resume_uploaded ? 'Update Resume' : 'Upload Resume'}</span>
                </Link>
                <Link
                  href="/dashboard/student/market-jobs"
                  className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <Briefcase className="h-5 w-5 text-teal-600" />
                  <span>Available Jobs in Market</span>
                </Link>
                <Link
                  href="/dashboard/student/assessment"
                  className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  <span>Take Assessment</span>
                </Link>
                <Link
                  href="/dashboard/student/profile"
                  className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <User className="h-5 w-5 text-amber-600" />
                  <span>Update Profile</span>
                </Link>
              </nav>
            </div>
          )}
          <button
            type="button"
            onClick={() => setQuickActionOpen((o) => !o)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f58020] text-white shadow-lg transition hover:bg-[#d66d12] focus:outline-none focus:ring-2 focus:ring-[#f58020] focus:ring-offset-2"
            aria-label={quickActionOpen ? 'Close Quick Action' : 'Open Quick Action'}
          >
            {quickActionOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </button>
        </div>
      </StudentBrandPageShell>
    </DashboardLayout>
  )
}
