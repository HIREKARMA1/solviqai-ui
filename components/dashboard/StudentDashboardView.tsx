"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Target,
  TrendingUp,
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Play,
  ArrowRight,
  Brain,
  Flame,
  Mountain,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })

function localDateKeyFromIso(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const slice = iso.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(slice) ? slice : null
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildActivityDateKeys(
  data: { activity_events?: string[]; activity_dates?: string[] },
  fallbackAssessments: Array<{ completed_at?: string; started_at?: string }>,
): string[] {
  if (data.activity_events?.length) {
    return Array.from(
      new Set(data.activity_events.map((iso) => localDateKeyFromIso(iso)).filter((k): k is string => Boolean(k))),
    )
  }
  if (data.activity_dates?.length) {
    return data.activity_dates.map((d) => d.slice(0, 10))
  }
  if (fallbackAssessments.length > 0) {
    return Array.from(
      new Set(
        fallbackAssessments
          .flatMap((x) => [x.completed_at, x.started_at])
          .map((iso) => (iso ? localDateKeyFromIso(String(iso)) : null))
          .filter((k): k is string => Boolean(k)),
      ),
    )
  }
  return []
}

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

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm min-h-[120px] flex flex-col">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto pt-1">{sub}</p>
    </div>
  )
}

export interface StudentDashboardViewProps {
  studentName: string
  stats: any
  analytics: any
  recentActivities: Array<{ id: string; date: string; score?: number; title: string }>
  allAssessments: any[]
}

export function StudentDashboardView({
  studentName,
  stats,
  analytics,
  recentActivities,
  allAssessments,
}: StudentDashboardViewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())

  const activityDates = useMemo(
    () => buildActivityDateKeys(stats || {}, allAssessments),
    [stats, allAssessments],
  )
  const activityDateSet = useMemo(() => new Set(activityDates), [activityDates])

  const trendRaw = analytics?.interview_performance?.trend as any[] | undefined
  const trendData =
    trendRaw && trendRaw.length > 0
      ? trendRaw.map((t: any) => ({ label: t.date || '', score: t.score ?? 0 }))
      : []

  const chartTooltipStyle = {
    backgroundColor: isDark ? 'rgba(28, 41, 56, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? '1px solid #4F5764' : '1px solid #e5e7eb',
    borderRadius: '8px',
    color: isDark ? '#E5E7EB' : '#111827',
  }

  const readinessLinks = [
    {
      href: stats?.next_action ? getNextActionHref(stats.next_action) : '/dashboard/student/jobs',
      label:
        stats?.next_action?.type === 'continue'
          ? 'Continue Simulation'
          : stats?.next_action?.type === 'continue_drive'
            ? 'Continue Drive'
            : 'Start Simulation',
      highlight: true,
    },
    { href: '/dashboard/student/simulations', label: 'Job Prep Simulation', highlight: false },
    { href: '/dashboard/student/career-guidance', label: 'Improve Yourself', highlight: false },
    { href: '/dashboard/student/practice', label: 'Aptitude', highlight: false },
    { href: '/dashboard/student/practice', label: 'Practice', highlight: false },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {studentName} 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Track your progress and continue your placement journey
        </p>
      </div>

      {/* Hero + score gaps */}
      <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${stats?.readiness_gaps?.length ? 'lg:grid-cols-3' : ''}`}>
        {stats?.next_action && (
          <Link
            href={getNextActionHref(stats.next_action)}
            className={`group relative overflow-hidden rounded-2xl border border-[#f58020]/25 bg-gradient-to-br from-[#FFF8F3] via-[#FFECD9] to-[#FFE4CC] dark:from-[#2A1A10] dark:via-[#1C2938] dark:to-[#1a1520] p-5 sm:p-6 shadow-sm transition-shadow hover:shadow-md min-h-[160px] flex ${
              stats?.readiness_gaps?.length ? 'lg:col-span-2' : ''
            }`}
          >
            <div className="flex flex-1 flex-col justify-center min-w-0 z-10 pr-24 sm:pr-32">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#f58020]">
                {stats.next_action.type === 'continue'
                  ? 'Continue Where You Left Off'
                  : stats.next_action.type === 'continue_drive'
                    ? 'Continue Your Placement Drive'
                    : 'Start Your Next Simulation'}
              </p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {stats.next_action.label}
              </p>
              {stats.readiness_index > 0 && (
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Readiness score: {Math.round(stats.readiness_index)}%
                </p>
              )}
              <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-[#f58020] px-4 py-2.5 text-sm font-semibold text-white shadow-md group-hover:bg-[#d66d12] transition-colors">
                {stats.next_action.type === 'continue' || stats.next_action.type === 'continue_drive' ? (
                  <>
                    <Play className="h-4 w-4" />
                    Continue
                  </>
                ) : (
                  <>
                    Start Simulation
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </span>
            </div>
            <div className="absolute right-4 bottom-0 top-0 flex items-end justify-center opacity-90 pointer-events-none">
              <div className="relative h-full w-28 sm:w-36 flex items-end justify-center pb-2">
                <div className="absolute bottom-8 right-2 h-16 w-20 rounded-t-full bg-[#f58020]/20 dark:bg-[#f58020]/30" />
                <Mountain className="h-20 w-20 sm:h-24 sm:w-24 text-[#f58020]/70 dark:text-[#f58020]/50" strokeWidth={1.2} />
              </div>
            </div>
          </Link>
        )}

        {stats?.readiness_gaps?.length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 sm:p-5 shadow-sm flex flex-col">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              What&apos;s pulling your score down
            </p>
            <ul className="space-y-3 flex-1">
              {stats.readiness_gaps.slice(0, 3).map((gap: { area: string; score: number; weight_percent?: number }) => (
                <li key={gap.area} className="flex gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {gap.area}{' '}
                      <span className="text-gray-500 dark:text-gray-400 font-normal">({Math.round(gap.score)}%)</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Below target by {gap.weight_percent ?? 15}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-3 py-2.5">
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                <span className="font-semibold">Tip:</span> Focus on these areas to improve your readiness score.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiTile
          icon={Target}
          label="Assessment Completed"
          value={stats?.assessments_completed ?? 0}
          sub={formatAssessmentsDelta(stats?.stats_deltas)}
          iconBg="bg-blue-100 dark:bg-blue-950/50"
          iconColor="text-[#0068FC] dark:text-[#8EBDFF]"
        />
        <KpiTile
          icon={TrendingUp}
          label="Average Score"
          value={`${stats?.average_score ?? 0}%`}
          sub={formatScoreDelta(stats?.stats_deltas)}
          iconBg="bg-purple-100 dark:bg-purple-950/50"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <KpiTile
          icon={Award}
          label="ATS Score"
          value={`${stats?.ats_score ?? 0}%`}
          sub={formatAtsDelta(stats?.stats_deltas ?? {}, stats?.ats_score ?? 0)}
          iconBg="bg-orange-100 dark:bg-orange-950/50"
          iconColor="text-[#f58020]"
        />
        <KpiTile
          icon={Briefcase}
          label="Job Matches"
          value={stats?.job_recommendations ?? 0}
          sub={formatJobMatchesDelta(stats?.stats_deltas)}
          iconBg="bg-emerald-100 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Activity | Performance | Readiness — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {/* Activity Overview */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Activity Overview</h3>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[5.5rem] text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const y = calendarMonth.getFullYear()
              const m = calendarMonth.getMonth()
              const first = new Date(y, m, 1)
              const start = (first.getDay() + 6) % 7
              const daysInMonth = new Date(y, m + 1, 0).getDate()
              const cells: React.ReactNode[] = []
              const today = new Date()
              const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
              for (let i = 0; i < 42; i++) {
                if (i < start || i >= start + daysInMonth) {
                  cells.push(<div key={`pad-${i}`} className="aspect-square" />)
                } else {
                  const d = i - start + 1
                  const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const active = activityDateSet.has(dateKey)
                  const isToday = dateKey === todayKey
                  cells.push(
                    <div key={d} className="flex items-center justify-center aspect-square p-0.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                          active
                            ? 'bg-[#f58020] text-white'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        } ${isToday && !active ? 'ring-2 ring-[#f58020]/50' : ''}`}
                      >
                        {d}
                      </span>
                    </div>,
                  )
                }
              }
              return cells
            })()}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#f58020]" />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-600" />
              Inactive
            </span>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm flex flex-col min-h-[320px]">
          <div className="mb-2">
            <h3 className="font-bold text-gray-900 dark:text-white">Performance Trend</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your assessment scores over time</p>
          </div>
          <div className="flex-1 min-h-[220px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0068FC" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0068FC" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#6B7280' }} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }} width={32} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${Number(v).toFixed(1)}%`, 'Score']} />
                  <Area type="monotone" dataKey="score" stroke="none" fill="url(#perfTrendFill)" />
                  <Line type="monotone" dataKey="score" stroke="#0068FC" strokeWidth={2.5} dot={{ r: 4, fill: '#0068FC', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No performance data yet
              </div>
            )}
          </div>
        </div>

        {/* Improve Your Readiness */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0068FC]/10 dark:bg-[#0068FC]/20">
              <Brain className="h-5 w-5 text-[#0068FC]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Improve Your Readiness</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Practice & guidance</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {readinessLinks.map((item) => (
              <Link key={item.label} href={item.href} className="block group">
                <div
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.highlight
                      ? 'border-2 border-[#f58020]/40 bg-[#FFF8F3] text-[#f58020] dark:bg-[#2A1A10] dark:border-[#f58020]/50 group-hover:bg-[#f58020] group-hover:text-white'
                      : 'border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-[#243044] text-gray-700 dark:text-gray-200 group-hover:border-[#0068FC]/30 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRightIcon className="h-4 w-4 opacity-50 group-hover:opacity-100 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity — full width bottom */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          <Link
            href="/dashboard/student/assessment/history"
            className="text-sm font-medium text-[#0068FC] hover:underline"
          >
            View All
          </Link>
        </div>
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((a) => {
              const pct = a.score != null ? Math.min(100, Math.max(0, Number(a.score))) : 0
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/student/assessment?id=${a.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-[#243044] px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-[#2A3444] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(a.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:min-w-[200px]">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden min-w-[80px]">
                      <motion.div
                        className="h-full rounded-full bg-[#0068FC]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-10 text-right shrink-0">
                      {pct > 0 ? `${Math.round(pct)}%` : '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[#f58020] shrink-0">
                      <Flame className="h-4 w-4" />
                      <span className="text-xs font-bold">1</span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent activity found.</p>
        )}
      </div>
    </div>
  )
}
