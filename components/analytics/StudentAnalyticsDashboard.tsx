"use client"

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Target,
  ShieldCheck,
  ClipboardList,
  Briefcase,
  Filter,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const RadarChart = dynamic(() => import('recharts').then((m) => m.RadarChart), { ssr: false })
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then((m) => m.PolarAngleAxis), { ssr: false })
const PolarRadiusAxis = dynamic(() => import('recharts').then((m) => m.PolarRadiusAxis), { ssr: false })
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), { ssr: false })
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false })

type StatusVariant = 'need-improvement' | 'developing' | 'good'

function scoreStatus(score: number, good = 70, fair = 50): { label: string; variant: StatusVariant } {
  if (score >= good) return { label: 'On Track', variant: 'good' }
  if (score >= fair) return { label: 'Developing', variant: 'developing' }
  return { label: 'Need Improvement', variant: 'need-improvement' }
}

function formatDateLabel(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Recharts needs 2+ points and a non-zero Y range — single/flat values otherwise render as a dot. */
function buildSparkline(points: { value: number }[], fallback = 0, minPoints = 8): { value: number }[] {
  const source = points.length > 0 ? points : [{ value: fallback }]
  const last = source[source.length - 1]?.value ?? fallback

  if (source.length >= 2) {
    return source
  }

  // One real reading → flat sparkline at that value so a full width line is drawn
  return Array.from({ length: minPoints }, () => ({ value: last }))
}

function sparkYDomain(data: { value: number }[], asPercent = false): [number, number] {
  const maxVal = Math.max(...data.map((d) => d.value), 0)
  if (asPercent) {
    return [0, Math.max(100, maxVal + 10)]
  }
  return [0, Math.max(5, Math.ceil(maxVal * 1.25) || 5)]
}

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle: string
  status?: { label: string; variant: StatusVariant }
  sparkData: { value: number }[]
  sparkColor: string
  isDark: boolean
  sparkAsPercent?: boolean
}

function KpiCard({ icon: Icon, label, value, subtitle, status, sparkData, sparkColor, isDark, sparkAsPercent = false }: KpiCardProps) {
  const statusClasses: Record<StatusVariant, string> = {
    'need-improvement': 'bg-[#FFE1E2] text-red-700 dark:bg-red-950/50 dark:text-red-300',
    developing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm min-h-[148px]">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0FE] dark:bg-blue-950/40">
          <Icon className="h-5 w-5 text-[#0068FC] dark:text-[#8EBDFF]" />
        </div>
        {status && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[status.variant]}`}>
            {status.label}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      <div className="mt-auto pt-3 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData} margin={{ top: 4, right: 6, left: 6, bottom: 2 }}>
            <YAxis hide domain={sparkYDomain(sparkData, sparkAsPercent)} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={sparkColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function FunnelShape({ steps, isDark }: { steps: { label: string; value: number; color: string }[]; isDark: boolean }) {
  const max = Math.max(...steps.map((s) => s.value), 1)
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 w-full max-w-[180px] mx-auto">
      {steps.map((step, i) => {
        const widthPct = 42 + ((step.value / max) * 50)
        return (
          <div
            key={step.label}
            className="relative flex items-center justify-center text-white text-xs font-semibold"
            style={{
              width: `${widthPct}%`,
              height: 36,
              backgroundColor: step.color,
              clipPath: i === steps.length - 1
                ? 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)'
                : 'polygon(5% 0%, 95% 0%, 90% 100%, 10% 100%)',
              opacity: isDark ? 0.92 : 1,
            }}
          >
            <span className="drop-shadow-sm">{step.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export interface StudentAnalyticsDashboardProps {
  data: any
  isDark: boolean
  dateRange: { start?: string; end?: string }
  showFilters: boolean
  onToggleFilters: () => void
  filtersPanel?: React.ReactNode
}

export function StudentAnalyticsDashboard({
  data,
  isDark,
  dateRange,
  showFilters,
  onToggleFilters,
  filtersPanel,
}: StudentAnalyticsDashboardProps) {
  const chartTooltipStyle = {
    backgroundColor: isDark ? 'rgba(28, 41, 56, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? '1px solid #4F5764' : '1px solid #e5e7eb',
    borderRadius: '8px',
    color: isDark ? '#E5E7EB' : '#111827',
  }

  const overallScore = Math.round(data?.overall_performance?.average_score || 0)
  const readinessIndex = Math.round(data?.job_readiness?.index || 0)
  const assessmentTotal = data?.assessments?.total || 0
  const assessmentCompleted = data?.assessments?.completed || 0
  const completionRate = assessmentTotal > 0 ? Math.round((assessmentCompleted / assessmentTotal) * 100) : 0
  const funnel = data?.applications_funnel || { submitted: 0, responses: 0, interviews: 0, offers: 0 }
  const resumeCompletion = Math.round(data?.resume?.completion || 0)
  const portfolioStrength = Math.round(data?.portfolio?.strength || 0)

  const performanceDimensions = useMemo(() => {
    const skillCategories = data?.skills_assessment?.categories || []
    const skillsAvg = skillCategories.length
      ? Math.round(skillCategories.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / skillCategories.length)
      : 0
    const applicationsScore = funnel.submitted > 0
      ? Math.min(100, Math.round((funnel.offers / funnel.submitted) * 100))
      : 0

    return [
      { subject: 'Assessments', score: overallScore },
      { subject: 'Skills', score: skillsAvg },
      { subject: 'Profile', score: resumeCompletion },
      { subject: 'Applications', score: applicationsScore },
      { subject: 'Experience', score: portfolioStrength },
    ]
  }, [data, funnel.offers, funnel.submitted, overallScore, resumeCompletion, portfolioStrength])

  const scoreSparkline = buildSparkline(
    (data?.interview_performance?.trend || []).map((d: any) => ({ value: Math.round(d.score || 0) })),
    overallScore,
  )
  const readinessSparkline = buildSparkline(
    (data?.interview_performance?.trend || []).map((d: any) => ({ value: Math.round(d.score || 0) })),
    readinessIndex,
  )
  const activitySparkline = buildSparkline(
    (data?.weekly_activity || []).slice(-14).map((d: any) => ({ value: d.count || 0 })),
    assessmentCompleted,
  )
  const atsSparkline = buildSparkline(
    (data?.portfolio?.ats_trend || []).map((d: any) => ({ value: d.score || 0 })),
    portfolioStrength,
    6,
  )
  const funnelSparkline = buildSparkline([
    { value: funnel.submitted },
    { value: funnel.responses },
    { value: funnel.interviews },
    { value: funnel.offers },
  ])

  const funnelSteps = [
    { key: 'Submitted', value: funnel.submitted, color: '#0068FC' },
    { key: 'Responses', value: funnel.responses, color: '#f58020' },
    { key: 'Interviews', value: funnel.interviews, color: '#38bdf8' },
    { key: 'Offers', value: funnel.offers, color: '#10b981' },
  ]

  const funnelBarData = funnelSteps.map((s) => ({ name: s.key, value: s.value, fill: s.color }))

  const conversion = (from: number, to: number) => (from > 0 ? Math.round((to / from) * 100) : 0)

  const insights = data?.insights || { strengths: [], weaknesses: [] }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-[#F6FBFF] dark:bg-[#1C2938] px-4 py-4 sm:px-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#0068FC] to-[#8D5AFF] bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your performance, skills, and job readiness metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#2A3444] px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
            <Calendar className="h-4 w-4 text-[#0068FC]" />
            <span>
              {dateRange.start && dateRange.end
                ? `${formatDateLabel(dateRange.start)} – ${formatDateLabel(dateRange.end)}`
                : 'All time'}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="gap-2 rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2A3444]"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </motion.div>

      {showFilters && filtersPanel}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Target}
          label="Overall Score"
          value={`${overallScore}%`}
          subtitle="Average across assessments"
          status={scoreStatus(overallScore)}
          sparkData={scoreSparkline}
          sparkColor="#0068FC"
          isDark={isDark}
          sparkAsPercent
        />
        <KpiCard
          icon={ShieldCheck}
          label="Job Readiness"
          value={`${readinessIndex}%`}
          subtitle="Composite readiness index"
          status={scoreStatus(readinessIndex, 75, 50)}
          sparkData={readinessSparkline}
          sparkColor="#10b981"
          isDark={isDark}
          sparkAsPercent
        />
        <KpiCard
          icon={ClipboardList}
          label="Assessments"
          value={`${completionRate}%`}
          subtitle={`${assessmentCompleted} of ${assessmentTotal} completed`}
          status={scoreStatus(completionRate, 80, 50)}
          sparkData={activitySparkline}
          sparkColor="#7F56D9"
          isDark={isDark}
        />
        <KpiCard
          icon={Briefcase}
          label="Applications"
          value={funnel.submitted}
          subtitle={`${funnel.offers} offers received`}
          status={funnel.offers > 0 ? { label: 'Success', variant: 'good' } : undefined}
          sparkData={funnelSparkline.length > 1 ? funnelSparkline : atsSparkline}
          sparkColor="#f58020"
          isDark={isDark}
        />
      </div>

      {/* Performance + Key metrics — fixed shared height on desktop; no dead space */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm lg:h-[288px]">
          <CardHeader className="py-3 pb-1 flex-shrink-0 space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
              <BarChart3 className="h-5 w-5 text-[#0068FC]" />
              Performance Overview
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-xs sm:text-sm">
              Multi-dimensional view of your career progress
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-4 pb-3 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full min-h-[200px]">
              <div className="h-[200px] lg:h-full lg:min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceDimensions} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={isDark ? '#4B5563' : '#e5e7eb'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#D1D5DB' : '#374151', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#0068FC"
                      fill="#0068FC"
                      fillOpacity={isDark ? 0.35 : 0.25}
                      strokeWidth={2}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2.5 lg:py-1">
                {performanceDimensions.map((dim, idx) => (
                  <div key={dim.subject} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{dim.subject}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{dim.score}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${dim.score}%`,
                          backgroundColor: ['#0068FC', '#7F56D9', '#10b981', '#f58020', '#38bdf8'][idx % 5],
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${dim.score}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm lg:h-[288px]">
          <CardHeader className="py-3 pb-1 flex-shrink-0 space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Key Metrics
            </CardTitle>
            <CardDescription className="dark:text-gray-400 text-xs sm:text-sm">Detailed breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-3 pt-0 space-y-2.5">
            {[
              { label: 'Assessments', value: assessmentTotal, sub: 'Total taken', color: 'text-[#0068FC]' },
              { label: 'Completion Rate', value: `${completionRate}%`, sub: 'Across all assessments', color: 'text-[#7F56D9]' },
              { label: 'Readiness Index', value: `${readinessIndex}%`, sub: scoreStatus(readinessIndex, 75, 50).label, color: 'text-emerald-600' },
              { label: 'Active Applications', value: funnel.submitted, sub: `${funnel.offers} offers received`, color: 'text-[#f58020]' },
              { label: 'Average Score', value: `${overallScore}%`, sub: 'Across all assessments', color: 'text-blue-600' },
              { label: 'Portfolio Strength', value: `${portfolioStrength}%`, sub: 'ATS / profile score', color: 'text-cyan-600' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-[#243044] px-3 py-2.5"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${m.color} dark:text-white`}>{m.value}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Application Funnel — compact 2-column layout */}
      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
            <Briefcase className="h-5 w-5 text-[#f58020]" />
            Application Funnel
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Your job application journey from submission to offers
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col justify-between gap-4 min-h-[240px]">
              <FunnelShape
                steps={funnelSteps.map((s) => ({ label: s.key, value: s.value, color: s.color }))}
                isDark={isDark}
              />
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2">
                {funnelSteps.map((step, idx) => (
                  <div key={step.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{step.key}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{step.value}</span>
                    {idx > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        ({conversion(funnelSteps[idx - 1].value, step.value)}%)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[240px] sm:h-[260px] w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelBarData} barCategoryGap="22%" margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#D1D5DB' : '#374151', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v, 'Count']} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
                    {funnelBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {(insights.strengths?.length > 0 || insights.weaknesses?.length > 0) && (
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938]">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">AI Insights</CardTitle>
              <CardDescription className="dark:text-gray-400">From your latest completed assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-600 mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.strengths.map((s: string) => (
                      <Badge key={s} className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {insights.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-600 mb-2">Growth areas</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.weaknesses.map((w: string) => (
                      <Badge key={w} variant="outline" className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(data?.skills_assessment?.categories?.length > 0) && (
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Skills Assessment
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Performance across skill categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data.skills_assessment.categories || []).map((s: any) => ({
                      category: s.name,
                      score: Math.round(s.score || 0),
                    }))}
                    margin={{ top: 4, right: 4, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis dataKey="category" tick={{ fill: isDark ? '#D1D5DB' : '#374151', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Score']} />
                    <Bar dataKey="score" fill={isDark ? '#7F56D9' : '#0068FC'} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
