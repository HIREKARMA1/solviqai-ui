"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
    BarChart3, Target, ShieldCheck, TrendingUp, TrendingDown, 
    Award, Brain, Users, FileText, Briefcase, Calendar, Filter,
    ClipboardList, MessageCircle, Clock, Activity, Zap, Sparkles,
    CheckCircle, AlertCircle, ArrowUpRight,
    PieChart as PieChartIcon, LineChart as LineChartIcon, BarChart as BarChartIcon
} from 'lucide-react'

// Recharts (SSR-safe)
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const RadarChart = dynamic(() => import('recharts').then(m => m.RadarChart), { ssr: false })
const PolarGrid = dynamic(() => import('recharts').then(m => m.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then(m => m.PolarAngleAxis), { ssr: false })
const PolarRadiusAxis = dynamic(() => import('recharts').then(m => m.PolarRadiusAxis), { ssr: false })
const Radar = dynamic(() => import('recharts').then(m => m.Radar), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const LabelList = dynamic(() => import('recharts').then(m => m.LabelList), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })

// Metric card per Figma: Frame 92973410 / 2087328159 – 284×162, radius 16px, padding 10px, gap 10px; icon 44×44 radius 8px; status pill radius 28px
function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    subtitle, 
    statusTag,
    iconBgClass,
    iconColor,
}: { 
    icon: any
    label: string
    value: string | number
    subtitle?: string
    statusTag?: { label: string; variant: 'need-improvement' | 'developing' | 'good' }
    iconBgClass: string
    iconColor: string
}) {
    return (
        <div 
            className="flex flex-col w-full min-w-0 rounded-[16px] p-2 sm:p-[10px] gap-2 sm:gap-[10px] min-h-0 sm:min-h-[162px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.4)]"
        >
            <div className="flex items-start justify-between gap-2 flex-shrink-0">
                <div 
                    className={`w-11 h-11 rounded-[8px] flex items-center justify-center flex-shrink-0 ${iconBgClass}`}
                >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                </div>
                {statusTag && (
                    <span 
                        className={`
                            inline-flex items-center gap-1 sm:gap-[8px] h-8 sm:h-[33px] px-2 sm:px-3 rounded-[28px] text-[10px] sm:text-xs font-semibold flex-shrink-0 max-w-full truncate
                            ${statusTag.variant === 'need-improvement' 
                                ? 'bg-[#FFE1E2] text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                                : statusTag.variant === 'developing'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}
                        `}
                    >
                        <ArrowUpRight className="w-3 h-3" />
                        {statusTag.label}
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{subtitle}</p>
                )}
            </div>
        </div>
    )
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function StudentAnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [timeline, setTimeline] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState('overview')
    const [filters, setFilters] = useState<{ start_date?: string; end_date?: string; categories: Record<string, boolean> }>({
        start_date: undefined,
        end_date: undefined,
        categories: { assessment: true, interview: true, application: true, resume: true, portfolio: true }
    })
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
            try {
            setLoading(true)
                const params = buildParams()
                const analytics = await apiClient.getStudentAnalyticsWithFilters(params)
                const tl = await apiClient.getStudentTimeline(params)
                setData(analytics)
                setTimeline(tl?.timeline || [])
            } catch (e) {
                console.error('Failed to load analytics', e)
            } finally {
                setLoading(false)
            }
        }

    const buildParams = () => {
        const categories = Object.entries(filters.categories)
            .filter(([_, v]) => v)
            .map(([k]) => k)
            .join(',')
        return {
            start_date: filters.start_date,
            end_date: filters.end_date,
            categories: categories || undefined,
        }
    }

    const handleFilterApply = async () => {
        await loadData()
        setShowFilters(false)
    }

    // Safe fallbacks for first render
    const skills = (data?.skills_assessment?.categories || []).map((s: any) => ({
        category: s.name,
        score: s.score ?? 0,
    }))

    const interviewTrend = (data?.interview_performance?.trend || []).map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: d.score ?? 0,
    }))

    const interviewStageSplit = (data?.interview_performance?.by_stage || []).map((x: any) => ({
        name: x.stage,
        value: x.count ?? 0,
    }))

    const funnel = (data?.applications_funnel || {
        submitted: 0, responses: 0, interviews: 0, offers: 0,
    })
    const funnelData = [
        { name: 'Submitted', value: funnel.submitted, fill: '#3b82f6' },
        { name: 'Responses', value: funnel.responses, fill: '#8b5cf6' },
        { name: 'Interviews', value: funnel.interviews, fill: '#10b981' },
        { name: 'Offers', value: funnel.offers, fill: '#f59e0b' },
    ]

    const resumeCompletion = data?.resume?.completion || 0
    const portfolioStrength = data?.portfolio?.strength || 0
    const overallScore = data?.overall_performance?.average_score || 0
    const readinessIndex = data?.job_readiness?.index || 0
    const topicDistribution = (data?.topic_distribution || []).map((t: any) => ({ name: t.topic, average: t.average }))
    const weeklyActivity = data?.weekly_activity || []
    const assessmentTotal = data?.assessments?.total || 0
    const assessmentCompleted = data?.assessments?.completed || 0
    const completionRate = assessmentTotal > 0 ? Math.round((assessmentCompleted / assessmentTotal) * 100) : 0

    const showAssessment = !!filters.categories.assessment
    const showInterview = !!filters.categories.interview
    const showApplication = !!filters.categories.application
    const showResume = !!filters.categories.resume
    const showPortfolio = !!filters.categories.portfolio

    if (loading) {
    return (
        <DashboardLayout requiredUserType="student">
                <div className="w-full flex items-center justify-center py-24">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout requiredUserType="student">
                <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-6 lg:pt-0 overflow-x-hidden min-w-0">
                {/* Header - Analytics Dashboard (Figma: light + dark mode) */}
                <motion.div 
                    className="relative overflow-hidden rounded-[16px] py-3 px-3 sm:py-4 sm:px-4 flex flex-col min-h-0 sm:min-h-[140px] gap-3 sm:gap-[15px] dark:gap-6 bg-[#F6FBFF] dark:bg-[#1C2938] border border-transparent dark:border dark:border-[#CACACA] shadow-[inset_0_1px_1.5px_0_rgba(0,0,0,0.25)] dark:shadow-none"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 
                                className="text-3xl sm:text-[40px] sm:leading-[40px] font-bold tracking-normal truncate mb-0 bg-gradient-to-r from-[#0068FC] to-[#8D5AFF] dark:from-[#1C6FE6] dark:to-[#8C59FF] bg-clip-text text-transparent"
                                style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
                            >
                                Analytics Dashboard
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
                                Track your performance, skills, and job readiness metrics
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 h-10 min-w-[100px] rounded-[10px] border border-[#B3B3B3] bg-[#ECECF5] hover:bg-[#e0e0ec] dark:border-[#A2A2A2] dark:bg-[#23233A] dark:hover:bg-[#2d2d45] text-gray-900 dark:text-gray-100"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="sm:inline">Filters</span>
                        </Button>
                    </div>
                </motion.div>

                {/* Filters Panel */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="w-5 h-5" />
                                    Filter Analytics
                                </CardTitle>
                                <CardDescription>Customize what data you want to see</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Start Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                value={filters.start_date || ''}
                                                onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value || undefined }))} 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">End Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                value={filters.end_date || ''}
                                                onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value || undefined }))} 
                                            />
                                        </div>
                        </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Categories</label>
                                        <div className="flex flex-wrap gap-3">
                            {Object.keys(filters.categories).map((key) => (
                                                <label key={key} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={filters.categories[key as keyof typeof filters.categories]}
                                                        onChange={e => setFilters(prev => ({ ...prev, categories: { ...prev.categories, [key]: e.target.checked } }))}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium capitalize">{key}</span>
                                </label>
                            ))}
                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={handleFilterApply} className="flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            Apply Filters
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => {
                                                setFilters({
                                                    start_date: undefined,
                                                    end_date: undefined,
                                                    categories: { assessment: true, interview: true, application: true, resume: true, portfolio: true }
                                                })
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Key Metrics Cards – Figma Frame 92973410: horizontal, gap 24px, card 284×162, radius 16px, shadow 0 2px 4px rgba(0,0,0,0.25) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard
                        icon={Target}
                        label="Overall Score"
                        value={`${Math.round(overallScore)}%`}
                        subtitle="Average across assessments"
                        statusTag={{
                            label: overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Need Improvement',
                            variant: overallScore >= 70 ? 'good' : overallScore >= 50 ? 'developing' : 'need-improvement',
                        }}
                        iconBgClass="bg-[#E4EFFF] dark:bg-blue-900/40"
                        iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <StatCard
                        icon={ShieldCheck}
                        label="Job Readiness"
                        value={`${Math.round(readinessIndex)}%`}
                        subtitle="Composite readiness index"
                        statusTag={{
                            label: readinessIndex >= 75 ? 'Excellent' : readinessIndex >= 50 ? 'Good' : 'Developing',
                            variant: readinessIndex >= 75 ? 'good' : readinessIndex >= 50 ? 'developing' : 'developing',
                        }}
                        iconBgClass="bg-[#E0FFDE] dark:bg-green-900/40"
                        iconColor="text-green-600 dark:text-green-400"
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Assessments"
                        value={`${completionRate}%`}
                        subtitle={`${completionRate}% completion rate`}
                        statusTag={completionRate >= 75 ? { label: 'On Track', variant: 'good' } : undefined}
                        iconBgClass="bg-[#EDE9FE] dark:bg-purple-900/40"
                        iconColor="text-[#7F56D9] dark:text-purple-400"
                    />
                    <StatCard
                        icon={Briefcase}
                        label="Applications"
                        value={funnel.submitted ?? 0}
                        subtitle={`${funnel.offers ?? 0} offers received`}
                        statusTag={funnel.offers && funnel.offers > 0 ? { label: 'Success', variant: 'good' } : undefined}
                        iconBgClass="bg-[#FFECD2] dark:bg-orange-900/40"
                        iconColor="text-orange-600 dark:text-orange-400"
                    />
                    </div>

                {/* Tabs – Figma Frame 2087328303: horizontal, h 57px, radius 8px, padding 10px, gap 90px, bg #FDFDFD, border #C0C0C0 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="flex flex-row items-center w-full min-h-[48px] sm:h-[57px] rounded-[8px] border border-[#C0C0C0] dark:border-gray-600 px-2 sm:px-[10px] gap-2 sm:gap-4 md:gap-8 lg:gap-[90px] bg-[#FDFDFD] dark:bg-gray-800 p-0 overflow-x-auto">
                        <TabsTrigger 
                            value="overview"
                            className="flex-1 min-w-0 rounded-md min-h-[40px] sm:h-[calc(57px-16px)] bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-0 flex items-center justify-center gap-2 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
                        >
                            <Activity className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="skills"
                            className="flex-1 min-w-0 rounded-md min-h-[40px] sm:h-[calc(57px-16px)] bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-0 flex items-center justify-center gap-2 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
                        >
                            <Brain className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Skills</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="performance"
                            className="flex-1 min-w-0 rounded-md min-h-[40px] sm:h-[calc(57px-16px)] bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-0 flex items-center justify-center gap-2 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
                        >
                            <TrendingUp className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Performance</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="timeline"
                            className="flex-1 min-w-0 rounded-md min-h-[40px] sm:h-[calc(57px-16px)] bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-0 flex items-center justify-center gap-2 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 border-0 outline-none focus-visible:outline-none focus-visible:ring-0"
                        >
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span className="whitespace-nowrap">Timeline</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Overall Progress Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Target className="w-5 h-5 text-blue-600 shrink-0" />
                                        Overall Performance Score
                                </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Your average score across all assessments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{Math.round(overallScore)}%</span>
                                                <span
                                                    className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold text-white
                                                        ${overallScore >= 70
                                                            ? "bg-[#00C951]"
                                                            : overallScore >= 50
                                                            ? "bg-[#FFB800]"
                                                            : "bg-[#FF2B3A]"
                                                        }`}
                                                >
                                                    {overallScore >= 70 ? "Excellent" : overallScore >= 50 ? "Good" : "Needs Improvement"}
                                                </span>
                                            </div>
                                            <Progress value={overallScore} className="h-3" />
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center divide-x divide-[#C1C1C1]">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assessments</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{assessmentCompleted}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completion</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{completionRate}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Readiness</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{Math.round(readinessIndex)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>

                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                                        Job Readiness Index
                                </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Your average score across all assessments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{Math.round(readinessIndex)}%</span>
                                                <span
                                                    className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold text-white
                                                        ${readinessIndex >= 75
                                                            ? "bg-[#00C951]"
                                                            : readinessIndex >= 50
                                                            ? "bg-[#1E7BFF]"
                                                            : "bg-[#FF6800]"
                                                        }`}
                                                >
                                                    {readinessIndex >= 75 ? "Ready" : readinessIndex >= 50 ? "Almost Ready" : "In Progress"}
                                                </span>
                                            </div>
                                            <Progress value={readinessIndex} className="h-3" />
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center divide-x divide-[#C1C1C1]">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resume</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{resumeCompletion}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Portfolio</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{portfolioStrength}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assessments</p>
                                                    <p className="text-base sm:text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{Math.round(readinessIndex)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>
                    </div>

                        {/* Application Funnel */}
                        {showApplication && funnelData.some(f => f.value > 0) && (
                            <Card className="border border-[#ABABAB] dark:border-gray-700 shadow-md rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-orange-600" />
                                        Application Funnel
                                    </CardTitle>
                                    <CardDescription>Your job application journey from submission to offers</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[220px] sm:h-[320px] lg:h-[418px] w-full max-w-[985px] mx-auto border border-[#A2A2A2] rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelData} barCategoryGap="25%">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                                                <YAxis tick={{ fill: '#6b7280' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '1px'
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={123}>
                                                    {funnelData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                                        {funnelData.map((item, idx) => (
                                            <div key={idx} className="text-center min-w-0">
                                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded shrink-0" style={{ backgroundColor: item.fill }} />
                                                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                                                </div>
                                                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                                                {idx > 0 && funnelData[idx - 1].value > 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {Math.round((item.value / funnelData[idx - 1].value) * 100)}% conversion
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Skills Tab */}
                    <TabsContent value="skills" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {showAssessment && skills.length > 0 && (
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                            <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="w-5 h-5 text-purple-600" />
                                            Skills Assessment
                                        </CardTitle>
                                        <CardDescription>Performance across skill categories</CardDescription>
                            </CardHeader>
                                    <CardContent>
                                        <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skills}>
                                                    <PolarGrid stroke="#e5e7eb" />
                                                    {/* @ts-ignore - PolarAngleAxis type definition mismatch */}
                                                    <PolarAngleAxis 
                                                        dataKey="category"
                                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    />
                                                    <PolarRadiusAxis 
                                                        angle={30} 
                                                        domain={[0, 100]} 
                                                        tick={{ fill: '#6b7280', fontSize: 10 }}
                                                    />
                                                    <Radar 
                                                        name="Score" 
                                                        dataKey="score" 
                                                        stroke="#6366f1" 
                                                        fill="#6366f1" 
                                                        fillOpacity={0.6}
                                                        strokeWidth={2}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px'
                                                        }}
                                                        formatter={(value: any) => (typeof value === 'number' ? `${Math.round(value)}%` : value)}
                                                    />
                                    </RadarChart>
                                </ResponsiveContainer>
                                        </div>
                            </CardContent>
                        </Card>
                        )}

                            {showAssessment && topicDistribution.length > 0 && (
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                            <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChartIcon className="w-5 h-5 text-indigo-600" />
                                            Topic Distribution
                                        </CardTitle>
                                        <CardDescription>Average performance by topic</CardDescription>
                            </CardHeader>
                                    <CardContent>
                                        <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={topicDistribution} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px'
                                                        }}
                                                        formatter={(value: any) => (typeof value === 'number' ? `${Math.round(value)}%` : value)}
                                                    />
                                                    <Bar dataKey="average" fill="#6366f1" radius={[0, 8, 8, 0]} />
                                                </BarChart>
                                </ResponsiveContainer>
                                        </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="space-y-6">
                        {showInterview && interviewTrend.length > 0 && (
                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                            <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LineChartIcon className="w-5 h-5 text-green-600" />
                                        Interview Performance Trend
                                    </CardTitle>
                                    <CardDescription>Your interview scores over time</CardDescription>
                            </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={interviewTrend}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                                                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: any) => (typeof value === 'number' ? `${Math.round(value)}%` : value)}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="score" 
                                                    stroke="#10b981" 
                                                    strokeWidth={3}
                                                    fill="url(#colorScore)"
                                                />
                                            </AreaChart>
                                </ResponsiveContainer>
                                    </div>
                            </CardContent>
                        </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {showInterview && interviewStageSplit.length > 0 && (
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                            <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-600" />
                                            Interview Stages
                                        </CardTitle>
                                        <CardDescription>Breakdown by interview stage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                            const total = interviewStageSplit.reduce((s: number, x: any) => s + (x.value || 0), 0)
                                            const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500']
                                            return (
                                                <div className="space-y-4">
                                                    {interviewStageSplit.map((s: any, idx: number) => {
                                                        const val = s.value || 0
                                                        const pct = total ? Math.round((val / total) * 100) : 0
                                    return (
                                                            <div key={`${s.name}-${idx}`} className="space-y-2">
                                                                <div className="flex items-center justify-between text-sm gap-2">
                                                                    <span className="font-medium text-gray-900 dark:text-white break-words min-w-0 flex-1">{s.name}</span>
                                                                    <span className="text-gray-600 dark:text-gray-400 font-semibold shrink-0">{val}</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        className={`h-2 ${colors[idx % colors.length]} rounded-full`}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${pct}%` }}
                                                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{pct}% of total</p>
                                                </div>
                                                        )
                                                    })}
                                        </div>
                                    )
                                })()}
                            </CardContent>
                        </Card>
                            )}

                            {showAssessment && (
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            Assessment Progress
                                        </CardTitle>
                                        <CardDescription>Completion status and rate</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-gray-900 dark:text-white">Started</span>
                                                    <span className="text-gray-600 dark:text-gray-400 font-semibold">{assessmentTotal}</span>
                                                </div>
                                                <Progress value={assessmentTotal > 0 ? 100 : 0} className="h-3" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-gray-900 dark:text-white">Completed</span>
                                                    <span className="text-gray-600 dark:text-gray-400 font-semibold">{assessmentCompleted}</span>
                                                </div>
                                                <Progress value={completionRate} className="h-3" />
                                            </div>
                                            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 dark:text-white">Completion Rate</span>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                                                </div>
                                                {completionRate < 100 && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {assessmentTotal - assessmentCompleted} assessment{assessmentTotal - assessmentCompleted !== 1 ? 's' : ''} remaining
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="space-y-6">
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                        <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Activity Timeline
                                </CardTitle>
                                <CardDescription>Chronological view of all your activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                const getIcon = (type: string) => {
                                    const t = String(type || '').toLowerCase()
                                        const iconClass = "w-5 h-5"
                                        if (t === 'assessment') return <ClipboardList className={iconClass} />
                                        if (t === 'interview') return <Users className={iconClass} />
                                        if (t === 'resume' || t === 'portfolio') return <FileText className={iconClass} />
                                        if (t === 'application') return <Briefcase className={iconClass} />
                                        return <Clock className={iconClass} />
                                    }

                                    const getColor = (type: string) => {
                                        const t = String(type || '').toLowerCase()
                                        if (t === 'assessment') return 'bg-blue-500'
                                        if (t === 'interview') return 'bg-green-500'
                                        if (t === 'resume' || t === 'portfolio') return 'bg-purple-500'
                                        if (t === 'application') return 'bg-orange-500'
                                        return 'bg-gray-500'
                                }

                                const dayLabel = (iso: string) => {
                                    const d = new Date(iso)
                                    const today = new Date()
                                    const yday = new Date()
                                    yday.setDate(today.getDate() - 1)
                                    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
                                    if (sameDay(d, today)) return 'Today'
                                    if (sameDay(d, yday)) return 'Yesterday'
                                        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                }

                                // Group timeline by calendar day
                                const groups: Record<string, any[]> = {}
                                for (const item of timeline) {
                                    const k = dayLabel(item.date)
                                    if (!groups[k]) groups[k] = []
                                    groups[k].push(item)
                                }
                                const ordered = Object.entries(groups).sort((a, b) => {
                                    const da = new Date(a[1][0]?.date || 0).getTime()
                                    const db = new Date(b[1][0]?.date || 0).getTime()
                                    return db - da
                                })

                                if (!timeline.length) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400 font-medium">No activities found</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start taking assessments or applying to jobs to see your timeline</p>
                                            </div>
                                        )
                                }

                                return (
                                        <div className="space-y-8">
                                        {ordered.map(([label, items], gi) => (
                                                <motion.div 
                                                    key={`grp-${gi}`} 
                                                    className="relative"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: gi * 0.1 }}
                                                >
                                                    <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg inline-block">
                                                        {label}
                                                    </div>
                                                    <div className="relative pl-8 ml-2">
                                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />
                                                    <div className="space-y-4">
                                                        {items.map((t: any, idx: number) => (
                                                                <motion.div 
                                                                    key={`it-${gi}-${idx}`} 
                                                                    className="relative"
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ duration: 0.2, delay: (gi * 0.1) + (idx * 0.05) }}
                                                                >
                                                                    <div className="absolute -left-[18px] top-1">
                                                                        <div className={`w-4 h-4 rounded-full ${getColor(t.type)} border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center`}>
                                                                            {getIcon(t.type)}
                                                                        </div>
                                                                    </div>
                                                                    <Card className="ml-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                                        <CardContent className="p-4">
                                                                <div className="flex items-start justify-between gap-4">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <Badge variant="outline" className="capitalize">
                                                                                            {t.type}
                                                                                        </Badge>
                                                                                        {t.subtype && (
                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                                                                {t.subtype}
                                                                                            </span>
                                                                                        )}
                                                                            </div>
                                                                            {t.score != null && (
                                                                                        <div className="flex items-center gap-2 mt-2">
                                                                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score:</span>
                                                                                            <span className="text-xl font-medium text-[#1E7BFF] dark:text-blue-300">{Math.round(t.score)}%</span>
                                                                                        </div>
                                                                            )}
                                                                        </div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                                                    {new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                                </motion.div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </CardContent>
                    </Card>
                    </TabsContent>
                </Tabs>
                </div>
        </DashboardLayout>
    )
}


