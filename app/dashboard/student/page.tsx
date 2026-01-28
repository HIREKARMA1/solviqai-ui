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
import { Home, User, FileText, Briefcase, ClipboardList, Zap, Target, TrendingUp, Award, Users, BarChart3, Plus, X, ChevronLeft, ChevronRight, Calendar, Check, Flame, Brain, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis,
    Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell,
    ComposedChart, Area, LabelList, ReferenceLine
} from 'recharts'

const robotoExtraBold = Roboto({ weight: '700', subsets: ['latin'] })

// ─── Demo data for UI development: used when real data is empty. Replace with backend data later. ───
const DEMO_ACTIVITY_DATES = ['2025-12-02', '2025-12-05', '2025-12-10', '2025-12-13', '2025-12-16', '2025-12-19', '2025-12-20', '2025-12-24']
function getDemoRecentActivities(): Array<{ id: string; date: string; score?: number; title: string }> {
    const now = new Date()
    return [
        { id: 'demo-1', date: now.toISOString(), title: 'Technical Assessment- Javascript' },
        { id: 'demo-2', date: new Date(now.getTime() - 86400000).toISOString(), score: 92, title: 'Technical Assessment- Javascript' },
        { id: 'demo-3', date: new Date(now.getTime() - 2 * 86400000).toISOString(), score: 92, title: 'System Design Interview Prepare' },
        { id: 'demo-4', date: new Date(now.getTime() - 3 * 86400000).toISOString(), score: 92, title: 'Technical Assessment- Javascript' },
    ]
}
const DEMO_RECENT_ACTIVITIES = getDemoRecentActivities()
const DEMO_STREAKS = 10
const DEMO_PERFORMANCE_TREND = [
    { date: '2025-01-01', month: 'Jan', score: 80 },
    { date: '2025-02-01', month: 'Feb', score: 55 },
    { date: '2025-03-01', month: 'Mar', score: 60 },
    { date: '2025-04-01', month: 'Apr', score: 73 },
    { date: '2025-05-01', month: 'May', score: 105 },
    { date: '2025-06-01', month: 'Jun', score: 20 },
    { date: '2025-07-01', month: 'Jul', score: 48 },
    { date: '2025-08-01', month: 'Aug', score: 40 },
    { date: '2025-09-01', month: 'Sep', score: 47 },
    { date: '2025-10-01', month: 'Oct', score: 62 },
    { date: '2025-11-01', month: 'Nov', score: 100 },
]

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
            const data = await apiClient.getStudentDashboard()
            const a = await apiClient.getStudentAnalytics()
            setAnalytics(a)

            // Fetch recent assessments and calculate real stats
            try {
                const assmts = await apiClient.getStudentAssessments(0, 100) // Get more to calculate accurate stats
                const allAssessments = assmts?.assessments || []
                const completed = allAssessments.filter((x: any) => String(x.status).toLowerCase() === 'completed')

                // Calculate real statistics from actual data
                const assessmentsCompleted = completed.length
                console.log('📊 Dashboard Stats Calculation:', {
                    totalAssessments: allAssessments.length,
                    completedAssessments: assessmentsCompleted
                })

                // Calculate average score from completed assessments
                let totalScore = 0
                let scoreCount = 0
                completed.forEach((assessment: any) => {
                    if (assessment.overall_score && assessment.overall_score > 0) {
                        totalScore += assessment.overall_score
                        scoreCount++
                    }
                })
                const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
                console.log('📈 Average Score:', averageScore, 'from', scoreCount, 'assessments')

                // Calculate average readiness index
                let totalReadiness = 0
                let readinessCount = 0
                completed.forEach((assessment: any) => {
                    if (assessment.readiness_index && assessment.readiness_index > 0) {
                        totalReadiness += assessment.readiness_index
                        readinessCount++
                    }
                })
                const readinessIndex = readinessCount > 0 ? Math.round(totalReadiness / readinessCount) : 0

                // Get ATS score from student data (if resume uploaded)
                const atsScore = data.ats_score || 0

                // Count job recommendations (mock for now - would need actual endpoint)
                const jobRecommendations = data.job_recommendations || 0

                // Update stats with real values
                const calculatedStats = {
                    ...data,
                    assessments_completed: assessmentsCompleted,
                    average_score: averageScore,
                    ats_score: atsScore,
                    job_recommendations: jobRecommendations,
                    readiness_index: readinessIndex
                }

                console.log('✅ Final Dashboard Stats:', calculatedStats)
                setStats(calculatedStats)

                // Set latest completed report, last 3 reports, recent activities, and activity dates
                if (completed.length > 0) {
                    const sorted = [...completed].sort((b: any, c: any) => new Date(c.completed_at || c.started_at).getTime() - new Date(b.completed_at || b.started_at).getTime())
                    const latest = sorted[0]
                    setLatestReport({ id: latest.assessment_id, date: latest.completed_at || latest.started_at })

                    const last3Reports = sorted.slice(0, 3).map((assessment: any) => ({
                        id: assessment.assessment_id,
                        date: assessment.completed_at || assessment.started_at,
                        score: assessment.overall_score,
                        readiness: assessment.readiness_index
                    }))
                    setRecentReports(last3Reports)

                    setRecentActivities(sorted.slice(0, 8).map((a: any) => ({
                        id: a.assessment_id,
                        date: a.completed_at || a.started_at,
                        score: a.overall_score,
                        title: (a.job_role || a.assessment_type || 'Assessment').replace(/_/g, ' ')
                    })))
                    setActivityDates(Array.from(new Set(sorted.map((a: any) => (a.completed_at || a.started_at)?.toString().slice(0, 10)))).filter(Boolean) as string[])
                }
            } catch (err) {
                console.error('Error calculating stats:', err)
                // Fallback to backend data if calculation fails
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
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
                        {/* Stats Cards – full width, 4 equal columns */}
                        <div className="grid w-full grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                            <StatCard
                                icon={Target}
                                label="Assessment Completed"
                                value={stats?.assessments_completed ?? 0}
                                secondaryText="+3 this week"
                                backgroundColor="#DDEEFF"
                                darkBackgroundColor="#3D97EF"
                                iconBgColor="bg-blue-500"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Average Score"
                                value={`${stats?.average_score ?? 0}%`}
                                secondaryText="+3% from last month"
                                backgroundColor="#F8EFFF"
                                darkBackgroundColor="#3B0069"
                                iconBgColor="bg-purple-500"
                            />
                            <StatCard
                                icon={Award}
                                label="ATS Score"
                                value={`${stats?.ats_score ?? 0}%`}
                                secondaryText="Good match rate"
                                backgroundColor="#FFF0F8"
                                darkBackgroundColor="#A30057"
                                iconBgColor="bg-pink-500"
                            />
                            <StatCard
                                icon={Briefcase}
                                label="Job Matches"
                                value={stats?.job_recommendations ?? 0}
                                secondaryText="5 new matches"
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
                                                    const active = (activityDates.length ? activityDates : DEMO_ACTIVITY_DATES).includes(dateKey)
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
                                                {stats?.assessments_completed ?? DEMO_STREAKS}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {(recentActivities.length ? recentActivities : DEMO_RECENT_ACTIVITIES).map((a) => (
                                            <div
                                                key={a.id}
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
                                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                                        {Number(a.score).toFixed(0)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
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
                                            <p className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">{stats?.average_score ?? 85}%</p>
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">+20% growth</p>
                                        </div>
                                    </div>
                                    <div className="min-h-0 w-full flex-1" style={{ minHeight: '220px' }}>
                                        {(() => {
                                            const trendRaw = analytics?.trend as any[] | undefined
                                            const trendData =
                                                trendRaw && trendRaw.length > 0
                                                    ? trendRaw.map((t: any) => ({
                                                        label: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
                                                        score: t.overall_score ?? t.score ?? 0,
                                                    }))
                                                    : DEMO_PERFORMANCE_TREND.map((d) => ({ label: d.month, score: d.score }))
                                            return (
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
                                                        <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: 8 }} />
                                                        <Bar dataKey="score" fill="url(#barGradient)" radius={[10, 10, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Check your Self – Figma #1A2C58, radius 8px */}
                                <div className="rounded-lg border border-gray-200 dark:border-[#243B6B] bg-white dark:bg-[#1A2C58] p-4 shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] dark:shadow-[0_8.27px_33.07px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
                                            <Brain className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Check your Self</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Aptitude Test</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
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






