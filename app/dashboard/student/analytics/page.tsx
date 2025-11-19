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
    CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
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

// Stat Card Component with hover effects
function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    subtitle, 
    trend, 
    trendValue,
    color, 
    bgColor 
}: { 
    icon: any
    label: string
    value: string | number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    color: string
    bgColor: string
}) {
    const [isHovered, setIsHovered] = useState(false)
    
    return (
        <motion.div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -4, scale: 1.02 }} 
            transition={{ duration: 0.2 }}
            className="relative"
        >
            <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300">
                {/* Animated Background Gradient */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-primary-50/30 to-secondary-50/20 dark:from-transparent dark:via-primary-900/10 dark:to-secondary-900/10"
                    initial={false}
                    animate={isHovered ? { scale: 1 } : { scale: 0.9 }}
                />
                
                <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-xl ${bgColor} shadow-md flex-shrink-0`}>
                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                        </div>
                        {trend && trend !== 'neutral' && (
                            <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                                trend === 'up' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                <span className="whitespace-nowrap">{trendValue}</span>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
                        <motion.p 
                            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1"
                        >
                            {value}
                        </motion.p>
                        {subtitle && (
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{subtitle}</p>
                        )}
                    </div>
                </CardContent>
                
                {/* Bottom accent line */}
                <motion.div
                    className={`absolute bottom-0 left-0 h-1 rounded-full ${bgColor.replace('bg-', 'bg-gradient-to-r from-').replace('-200', '-500')}`}
                    initial={{ width: '0%' }}
                    animate={isHovered ? { width: '100%' } : { width: '0%' }}
                    transition={{ duration: 0.3 }}
                />
            </Card>
        </motion.div>
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
                <div className="space-y-6 pt-1 sm:pt-6 lg:pt-0">
                {/* Header - Matching Dashboard Style */}
                <motion.div 
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Decorative corners */}
                    <motion.div 
                        className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20"
                        animate={{ rotate: [45, 50, 45] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                        className="pointer-events-none absolute -bottom-14 -left-14 w-64 h-64 rounded-full bg-gradient-to-tr from-secondary-100/30 to-accent-100/20 dark:from-secondary-900/20 dark:to-accent-900/10"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                    <motion.div 
                                        className="p-1.5 sm:p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 flex-shrink-0"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    >
                                        <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </motion.div>
                                    <motion.h1 
                                        className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text truncate"
                                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        style={{ backgroundSize: '200% 200%' }}
                                    >
                                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Analytics Dashboard</span>
                                    </motion.h1>
                                </div>
                                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                                    Track your performance, skills, and job readiness metrics
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowFilters(!showFilters)}
                                variant="outline"
                                className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
                            >
                                <Filter className="w-4 h-4" />
                                <span className="sm:inline">Filters</span>
                            </Button>
                        </div>
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

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Target}
                        label="Overall Score"
                        value={`${Math.round(overallScore)}%`}
                        subtitle="Average across assessments"
                        trend={overallScore > 70 ? 'up' : overallScore > 50 ? 'neutral' : 'down'}
                        trendValue={overallScore > 70 ? 'Good' : overallScore > 50 ? 'Fair' : 'Needs Improvement'}
                        color="text-blue-600 dark:text-blue-400"
                        bgColor="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatCard
                        icon={ShieldCheck}
                        label="Job Readiness"
                        value={`${Math.round(readinessIndex)}%`}
                        subtitle="Composite readiness index"
                        trend={readinessIndex > 75 ? 'up' : readinessIndex > 50 ? 'neutral' : 'down'}
                        trendValue={readinessIndex > 75 ? 'Excellent' : readinessIndex > 50 ? 'Good' : 'Developing'}
                        color="text-green-600 dark:text-green-400"
                        bgColor="bg-green-100 dark:bg-green-900/30"
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Assessments"
                        value={`${assessmentCompleted}/${assessmentTotal}`}
                        subtitle={`${completionRate}% completion rate`}
                        trend={completionRate > 75 ? 'up' : 'neutral'}
                        trendValue={completionRate > 75 ? 'Active' : 'On Track'}
                        color="text-purple-600 dark:text-purple-400"
                        bgColor="bg-purple-100 dark:bg-purple-900/30"
                    />
                    <StatCard
                        icon={Briefcase}
                        label="Applications"
                        value={funnel.submitted || 0}
                        subtitle={`${funnel.offers || 0} offers received`}
                        trend={funnel.offers > 0 ? 'up' : 'neutral'}
                        trendValue={funnel.offers > 0 ? 'Success!' : 'Keep Going'}
                        color="text-orange-600 dark:text-orange-400"
                        bgColor="bg-orange-100 dark:bg-orange-900/30"
                    />
                    </div>

                {/* Tabs for different views */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-white dark:bg-gray-800 p-1 sm:p-1.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-auto gap-1 sm:gap-1.5">
                        <TabsTrigger 
                            value="overview"
                            className="rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                        >
                            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                            <span className="whitespace-nowrap relative z-10">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="skills"
                            className="rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                        >
                            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                            <span className="whitespace-nowrap relative z-10">Skills</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="performance"
                            className="rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                        >
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                            <span className="whitespace-nowrap relative z-10">Performance</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="timeline"
                            className="rounded-lg bg-transparent data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border-0 flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400 data-[state=inactive]:!bg-transparent data-[state=inactive]:hover:bg-gray-100 dark:data-[state=inactive]:hover:bg-gray-700 w-full border-0 outline-none focus-visible:outline-none focus-visible:ring-0 relative"
                        >
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                            <span className="whitespace-nowrap relative z-10">Timeline</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Overall Progress Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-blue-600" />
                                        Overall Performance Score
                                </CardTitle>
                                    <CardDescription>Your average score across all assessments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(overallScore)}%</span>
                                                <Badge className={overallScore >= 70 ? "bg-green-500" : overallScore >= 50 ? "bg-yellow-500" : "bg-red-500"}>
                                                    {overallScore >= 70 ? "Excellent" : overallScore >= 50 ? "Good" : "Needs Improvement"}
                                                </Badge>
                                            </div>
                                            <Progress value={overallScore} className="h-3" />
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assessments</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{assessmentCompleted}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completion</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{completionRate}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Readiness</p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(readinessIndex)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>

                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        Job Readiness Index
                                </CardTitle>
                                    <CardDescription>Comprehensive readiness assessment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(readinessIndex)}%</span>
                                                <Badge className={readinessIndex >= 75 ? "bg-green-500" : readinessIndex >= 50 ? "bg-blue-500" : "bg-orange-500"}>
                                                    {readinessIndex >= 75 ? "Ready" : readinessIndex >= 50 ? "Almost Ready" : "In Progress"}
                                                </Badge>
                                            </div>
                                            <Progress value={readinessIndex} className="h-3" />
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Resume</span>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={resumeCompletion} className="w-24 h-2" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">{resumeCompletion}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio</span>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={portfolioStrength} className="w-24 h-2" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">{portfolioStrength}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Assessments</span>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={completionRate} className="w-24 h-2" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">{completionRate}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>
                    </div>

                        {/* Application Funnel */}
                        {showApplication && funnelData.some(f => f.value > 0) && (
                            <Card className="border border-gray-200 dark:border-gray-700 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-orange-600" />
                                        Application Funnel
                                    </CardTitle>
                                    <CardDescription>Your job application journey from submission to offers</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={funnelData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                                                <YAxis tick={{ fill: '#6b7280' }} />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {funnelData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        {funnelData.map((item, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.fill }} />
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.name}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
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
                                                                                            <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(t.score)}%</span>
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
