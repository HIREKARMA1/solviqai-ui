"use client"

import { useEffect, useState } from 'react'
import { Roboto } from 'next/font/google'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from 'next-themes'
import { User, FileText, Briefcase, ClipboardList, Zap, Target, TrendingUp, Award, Plus, X, ChevronLeft, ChevronRight, Check, Flame, Brain, Clock, Play, ArrowRight, Workflow } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis,
    Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell,
    ComposedChart, Area, LabelList, ReferenceLine
} from 'recharts'

const robotoExtraBold = Roboto({ weight: '700', subsets: ['latin'] })



function formatAssessmentsDelta(deltas: { assessments_this_week?: number } | undefined): string {
    const n = deltas?.assessments_this_week ?? 0
    if (n === 0) return 'No assessments this week'
    return n === 1 ? '+1 this week' : `+${n} this week`
}

function formatScoreDelta(deltas: { score_change_vs_last_month?: number | null } | undefined): string {
    const change = deltas?.score_change_vs_last_month
    if (change == null) return 'Not enough history yet'
    if (change === 0) return 'Unchanged vs last month'
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs last month`
}

function formatAtsDelta(deltas: { ats_change?: number | null }, score: number): string {
    const change = deltas?.ats_change
    if (change != null && change !== 0) {
        return `${change > 0 ? '+' : ''}${change.toFixed(0)}% since last scan`
    }
    if (score >= 80) return 'Strong ATS match'
    if (score >= 60) return 'Room to improve'
    if (score > 0) return 'Upload an updated resume to improve'
    return 'Upload resume for ATS score'
}

function formatJobMatchesDelta(deltas: { new_job_matches?: number } | undefined): string {
    const n = deltas?.new_job_matches ?? 0
    if (n === 0) return 'No new matches this week'
    return n === 1 ? '1 new match this week' : `${n} new matches this week`
}

function getNextActionHref(action: {
    type: string
    assessment_id?: string | null
}): string {
    switch (action.type) {
        case 'continue':
            return `/dashboard/student/assessment?id=${action.assessment_id}`
        case 'resume':
            return '/dashboard/student/resume'
        case 'start':
        case 'jobs':
        default:
            return '/dashboard/student/jobs'
    }
}

function timeAgo(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Just Now'
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 days ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
}

// Stat card – Figma: vertical flow, radius 16px, padding 10px; dark mode uses Figma hex colors
function StatCard({
    icon: Icon,
    label,
    value,
    secondaryText,
    backgroundColor,
    darkBackgroundColor,
    iconBgColor,
    iconColor = 'text-white',
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string | number
    secondaryText?: string
    backgroundColor: string
    darkBackgroundColor?: string
    iconBgColor: string
    iconColor?: string
}) {
    const { theme, resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark' || theme === 'dark'
    const bg = isDark && darkBackgroundColor ? darkBackgroundColor : backgroundColor
    return (
        <div
            className="relative flex min-h-[108px] w-full min-w-0 flex-col rounded-[16px] p-2.5 gap-2.5"
            style={{
                backgroundColor: bg,
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
        >
            <div
                className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] ${iconBgColor}`}
            >
                <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex flex-1 flex-col gap-2.5 pr-10">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">
                    {value}
                </p>
                {secondaryText && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{secondaryText}</p>
                )}
            </div>
        </div>
    )
}

export default function StudentDashboard() {
    const { user } = useAuth()
    const { theme, resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark' || theme === 'dark'
    const [stats, setStats] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [latestReport, setLatestReport] = useState<{ id: string | null, date: string | null }>({ id: null, date: null })
    const [recentReports, setRecentReports] = useState<Array<{ id: string, date: string, score?: number, readiness?: number }>>([])
    const [recentActivities, setRecentActivities] = useState<Array<{ id: string, date: string, score?: number, title: string }>>([])
    const [activityDates, setActivityDates] = useState<string[]>([])
    const [calendarMonth, setCalendarMonth] = useState(() => new Date())
    const [loading, setLoading] = useState(true)
    const [quickActionOpen, setQuickActionOpen] = useState(false)
    const studentName = user?.name || 'there'

    useEffect(() => {
        fetchDashboardData()
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

            const allAssessments = assmts?.assessments || []
            const completed = allAssessments.filter((x: any) => String(x.status).toLowerCase() === 'completed')

            if (data.activity_dates?.length) {
                setActivityDates(data.activity_dates)
            } else if (allAssessments.length > 0) {
                setActivityDates(
                    Array.from(
                        new Set(
                            allAssessments
                                .map((x: any) => (x.completed_at || x.started_at)?.toString().slice(0, 10))
                                .filter(Boolean)
                        )
                    ) as string[]
                )
            }

            if (completed.length > 0) {
                const sortedCompleted = [...completed].sort(
                    (b: any, c: any) =>
                        new Date(c.completed_at || c.started_at).getTime() -
                        new Date(b.completed_at || b.started_at).getTime()
                )
                const latest = sortedCompleted[0]
                setLatestReport({ id: latest.assessment_id, date: latest.completed_at || latest.started_at })
                setRecentReports(
                    sortedCompleted.slice(0, 3).map((assessment: any) => ({
                        id: assessment.assessment_id,
                        date: assessment.completed_at || assessment.started_at,
                        score: assessment.overall_score,
                        readiness: assessment.readiness_index,
                    }))
                )
            }

            if (allAssessments.length > 0) {
                const sortedAll = [...allAssessments].sort(
                    (b: any, c: any) => new Date(c.started_at).getTime() - new Date(b.started_at).getTime()
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
                    })
                )
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }


    // Calculate trend data and growth for Performance Trend chart
    const trendRaw = analytics?.interview_performance?.trend as any[] | undefined
    const trendData = trendRaw && trendRaw.length > 0
        ? trendRaw.map((t: any) => ({
            label: t.date || '',
            score: t.score ?? 0,
        }))
        : []

    let growth = 0
    if (trendData.length >= 2) {
        growth = trendData[trendData.length - 1].score - trendData[0].score
    }

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 pt-1 sm:pt-6 lg:pt-0">
                {/* Header - Figma: 16px radius, 10px padding; dark mode #1A2C58 */}
                <div
                    className="w-full flex flex-col rounded-[16px] p-2.5 gap-2.5 bg-white dark:bg-[#1A2C58] min-h-[92px]"
                    style={{
                        boxShadow: 'inset 0 1px 1.5px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.25)',
                    }}
                >
                    <h1
                        className={`${robotoExtraBold.className} tracking-[0%] text-[#0B2540] dark:text-white`}
                        style={{
                            fontSize: '36px',
                            lineHeight: '40px',
                        }}
                    >
                        Welcome Back, {studentName}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                        Track your progress and continue your placement journey
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        {/* Primary simulation CTA */}
                        {stats?.next_action && (
                            <Link
                                href={getNextActionHref(stats.next_action)}
                                className="group flex w-full items-center justify-between gap-4 rounded-[16px] border border-[#FF541F]/30 bg-gradient-to-r from-[#FFF5F0] to-white p-4 shadow-md transition-all hover:shadow-lg dark:from-[#2A1A14] dark:to-[#1A2C58] dark:border-[#FF541F]/40 sm:p-5"
                            >
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF541F] text-white">
                                        {stats.next_action.type === 'continue' ? (
                                            <Play className="h-6 w-6" />
                                        ) : (
                                            <Target className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF541F]">
                                            {stats.next_action.type === 'continue'
                                                ? 'Continue Where You Left Off'
                                                : 'Start Your Next Simulation'}
                                        </p>
                                        <p className="truncate text-lg font-bold text-gray-900 dark:text-white">
                                            {stats.next_action.label}
                                        </p>
                                        {stats.readiness_index > 0 && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Readiness score: {Math.round(stats.readiness_index)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight className="h-6 w-6 shrink-0 text-[#FF541F] transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}

                        {/* Readiness gaps */}
                        {stats?.readiness_gaps?.length > 0 && (
                            <div className="rounded-[16px] border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                                <p className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    What&apos;s pulling your score down
                                </p>
                                <ul className="space-y-1">
                                    {stats.readiness_gaps.slice(0, 3).map((gap: { area: string; message: string }) => (
                                        <li key={gap.area} className="text-sm text-amber-800 dark:text-amber-100">
                                            • {gap.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Stats Cards – full width, 4 equal columns */}
                        <div className="grid w-full grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                            <StatCard
                                icon={Target}
                                label="Assessment Completed"
                                value={stats?.assessments_completed ?? 0}
                                secondaryText={formatAssessmentsDelta(stats?.stats_deltas)}
                                backgroundColor="#DDEEFF"
                                darkBackgroundColor="#3D97EF"
                                iconBgColor="bg-blue-500"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Average Score"
                                value={`${stats?.average_score ?? 0}%`}
                                secondaryText={formatScoreDelta(stats?.stats_deltas)}
                                backgroundColor="#F8EFFF"
                                darkBackgroundColor="#3B0069"
                                iconBgColor="bg-purple-500"
                            />
                            <StatCard
                                icon={Award}
                                label="ATS Score"
                                value={`${stats?.ats_score ?? 0}%`}
                                secondaryText={formatAtsDelta(stats?.stats_deltas ?? {}, stats?.ats_score ?? 0)}
                                backgroundColor="#FFF0F8"
                                darkBackgroundColor="#A30057"
                                iconBgColor="bg-pink-500"
                            />
                            <StatCard
                                icon={Briefcase}
                                label="Job Matches"
                                value={stats?.job_recommendations ?? 0}
                                secondaryText={formatJobMatchesDelta(stats?.stats_deltas)}
                                backgroundColor="#FFFCE3"
                                darkBackgroundColor="#BEA300"
                                iconBgColor="bg-amber-500"
                            />
                        </div>

                        {/* Two columns: same height so bottoms align */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
                            {/* Left column */}
                            <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:h-full">
                                {/* ACTIVITY – calendar using activityDates; same height as Performance Trend */}
                                <div
                                    className="flex min-h-[480px] flex-1 flex-col rounded-2xl border border-gray-200 dark:border-[#243B6B] bg-white dark:bg-[#0C1B41] p-4 shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] sm:min-h-[540px] lg:min-h-[560px]"
                                >
                                    <div className="flex-shrink-0 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 dark:text-white">ACTIVITY</h3>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
                                                className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                aria-label="Previous month"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="min-w-[7rem] text-center text-sm font-medium">
                                                {calendarMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
                                                className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                aria-label="Next month"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex-shrink-0 grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                                            <div key={d} className="py-1.5">{d}</div>
                                        ))}
                                    </div>
                                    <div
                                        className="mt-2 min-h-0 flex-1 grid h-full grid-cols-7 grid-rows-6 gap-2 overflow-hidden rounded-lg p-2 dark:bg-[#404C64]"
                                        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
                                    >
                                        {(() => {
                                            const y = calendarMonth.getFullYear()
                                            const m = calendarMonth.getMonth()
                                            const first = new Date(y, m, 1)
                                            const start = (first.getDay() + 6) % 7
                                            const daysInMonth = new Date(y, m + 1, 0).getDate()
                                            const totalCells = 42
                                            const cells: React.ReactNode[] = []
                                            const cellBase = 'flex min-h-0 min-w-3 items-center justify-center text-sm rounded-full transition-colors duration-200'
                                            for (let i = 0; i < totalCells; i++) {
                                                if (i < start || i >= start + daysInMonth) {
                                                    cells.push(<div key={`pad-${i}`} className={`${cellBase} opacity-0 pointer-events-none`} />)
                                                } else {
                                                    const d = i - start + 1
                                                    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                                    const active = activityDates.includes(dateKey)
                                                    cells.push(
                                                        <div
                                                            key={d}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`group ${cellBase} cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-800`}
                                                        >
                                                            <span
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-200 ${active ? 'text-[#FF541F] font-semibold' : 'text-gray-700 dark:text-gray-300 group-hover:bg-purple-400 group-hover:text-white'}`}
                                                            >
                                                                {d}
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                            }
                                            return cells
                                        })()}
                                    </div>
                                </div>
                                {/* Active / In active – after calendar: hr at top, then indicators */}
                                <div className="mt-0 flex flex-shrink-0 flex-col gap-3">
                                    <hr className="w-full border-gray-200 dark:border-[#243B6B]" />
                                    <div className="flex items-center gap-6">
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            <span
                                                className="h-6 w-6 flex-shrink-0 rounded-full"
                                                style={{ backgroundColor: '#FF541F' }}
                                                aria-hidden
                                            />
                                            Active
                                        </span>
                                        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            <span
                                                className="h-6 w-6 flex-shrink-0 rounded-full bg-gray-900 dark:bg-gray-300"
                                                aria-hidden
                                            />
                                            In active
                                        </span>
                                    </div>
                                </div>
                                {/* Recent Activity – Figma left side #0C1B41, items #0D1338 */}
                                <div className="rounded-2xl border border-gray-200 dark:border-[#243B6B] bg-white dark:bg-[#1A2C58] p-4 shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] dark:shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-3 font-bold text-gray-900 dark:text-white">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1C7CD5]">
                                                <Clock className="h-5 w-5 text-white" />
                                            </span>
                                            Recent Activity
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF541F]">
                                                <Flame className="h-5 w-5 text-white" />
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {stats?.assessments_completed ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {recentActivities.length > 0 ? (
                                            recentActivities.map((a) => (
                                                <Link
                                                    key={a.id}
                                                    href={`/dashboard/student/assessment?id=${a.id}`}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-blue-50/80 px-3 py-2 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm dark:bg-[#0D1338] dark:hover:bg-[#1A2C58]"
                                                >
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">{timeAgo(a.date)}</p>
                                                    </div>
                                                    {a.score != null && (
                                                        <span className="shrink-0 rounded-full bg-[#1C7CD5] px-3 py-1 text-xs font-semibold text-white">
                                                            {Number(a.score).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </Link>
                                            ))) : (
                                            <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
                                                No recent activity found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:h-full">
                                {/* Performance Trend – flex-1 so column height matches left */}
                                <div
                                    className="flex min-h-[360px] flex-1 flex-col rounded-lg bg-white dark:bg-[#1A2C58] dark:border dark:border-[#243B6B] p-4 shadow-[0_2px_4px_rgba(0,0,0,0.25)] dark:shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)]"
                                >
                                    <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Performance Trend</h3>
                                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-300">Your assessment scores over time</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">{stats?.average_score ?? 0}%</p>
                                            {trendData.length > 1 && (
                                                <p className={`text-sm font-medium ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {growth > 0 ? '+' : ''}{growth.toFixed(0)}% growth
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-h-0 w-full flex-1" style={{ minHeight: '220px' }}>
                                        {trendData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={trendData} margin={{ top: 8, right: 8, bottom: 20, left: 24 }} barCategoryGap="32%">
                                                    <defs>
                                                        <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                                                            <stop offset="0%" stopColor="#1d4ed8" />
                                                            <stop offset="100%" stopColor="#60a5fa" />
                                                        </linearGradient>
                                                    </defs>
                                                    {[0, 20, 40, 60, 80, 100].map((y) => (
                                                        <ReferenceLine key={y} y={y} stroke="#3b82f6" strokeWidth={1} />
                                                    ))}
                                                    <XAxis
                                                        dataKey="label"
                                                        tick={{ fontSize: 14, fill: isDark ? '#ffffff' : '#1e3a5f', fontWeight: 700 }}
                                                        axisLine={{ stroke: '#d1d5db' }}
                                                        tickMargin={10}
                                                    />
                                                    <YAxis
                                                        domain={[0, 110]}
                                                        ticks={[0, 20, 40, 60, 80, 100]}
                                                        tick={{ fontSize: 14, fill: isDark ? '#ffffff' : '#1e3a5f', fontWeight: 700 }}
                                                        axisLine={{ stroke: '#d1d5db' }}
                                                    />
                                                    <Tooltip formatter={(v) => [`${v ?? 0}%`, 'Score']} contentStyle={{ borderRadius: 8 }} />
                                                    <Bar dataKey="score" fill="url(#barGradient)" radius={[10, 10, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                                No performance data available yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick links */}
                                <div className="rounded-lg border border-gray-200 dark:border-[#243B6B] bg-white dark:bg-[#1A2C58] p-4 shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] dark:shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
                                            <Brain className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Improve Your Readiness</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Practice & guidance</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {stats?.next_action && (
                                            <Link href={getNextActionHref(stats.next_action)} className="block">
                                                <div className="w-full rounded-xl border-2 border-[#FF541F]/40 bg-[#FFF5F0] px-4 py-3 text-left text-sm font-semibold text-[#FF541F] transition-all duration-200 hover:bg-[#FF541F] hover:text-white dark:bg-[#2A1A14] dark:hover:bg-[#FF541F]">
                                                    {stats.next_action.type === 'continue' ? 'Continue Simulation' : 'Start Simulation'}
                                                </div>
                                            </Link>
                                        )}
                                        <Link href="/dashboard/student/simulations" className="block">
                                            <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-emerald-50 hover:shadow-md hover:border-emerald-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-700">
                                                Job Prep Simulation
                                            </div>
                                        </Link>
                                        <Link href="/dashboard/student/career-guidance" className="block">
                                            <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-purple-50 hover:shadow-md hover:border-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-purple-900/20 dark:hover:border-purple-700">
                                                Improve Yourself
                                            </div>
                                        </Link>
                                        <Link href="/dashboard/student/practice" className="block">
                                            <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-purple-50 hover:shadow-md hover:border-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-purple-900/20 dark:hover:border-purple-700">
                                                Aptitude
                                            </div>
                                        </Link>
                                        <Link href="/dashboard/student/practice" className="block">
                                            <div className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-purple-50 hover:shadow-md hover:border-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-purple-900/20 dark:hover:border-purple-700">
                                                Practice
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Action FAB – bottom-right, always visible; toggles panel with +/X */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                    {quickActionOpen && (
                        <div
                            className="w-full max-w-[397px] rounded-xl border border-gray-200 dark:border-[#243B6B] bg-white dark:bg-[#1A2C58] p-4 shadow-lg"
                            style={{ marginBottom: '0.5rem' }}
                        >
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
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
                                    className="flex items-center gap-3 rounded-lg bg-[#FF541F]/10 px-3 py-2.5 font-medium text-[#FF541F] transition-colors hover:bg-[#FF541F]/20 dark:bg-[#FF541F]/20"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <Play className="h-5 w-5" />
                                    <span>
                                        {stats?.next_action?.type === 'continue'
                                            ? 'Continue Simulation'
                                            : 'Start Simulation'}
                                    </span>
                                </Link>
                                <Link
                                    href="/dashboard/student/resume"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <span>{stats?.resume_uploaded ? 'Update Resume' : 'Upload Resume'}</span>
                                </Link>
                                <Link
                                    href="/dashboard/student/market-jobs"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    <span>Available Job in market</span>
                                </Link>
                                <Link
                                    href="/dashboard/student/assessment"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <span>Take Assessment</span>
                                </Link>
                                <Link
                                    href="/dashboard/student/assessment/history"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <ClipboardList className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    <span>Assessment History</span>
                                </Link>
                                <Link
                                    href="/dashboard/student/profile"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <span>Update Profile</span>
                                </Link>
                                <Link
                                    href="/dashboard/student/assessment/history"
                                    className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    onClick={() => setQuickActionOpen(false)}
                                >
                                    <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <span>Browse report</span>
                                </Link>
                            </nav>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setQuickActionOpen((o) => !o)}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#FF541F] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                        style={{ backgroundColor: '#FF541F' }}
                        aria-label={quickActionOpen ? 'Close Quick Action' : 'Open Quick Action'}
                    >
                        {quickActionOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    )
}






