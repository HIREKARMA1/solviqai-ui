"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api'
import {
    Home, User, FileText, Briefcase, ClipboardList,
    ArrowLeft, Download, Share2, TrendingUp, Target,
    Brain, Mic, CheckCircle, AlertCircle, Lightbulb,
    Award, BarChart3, PieChart, LineChart, Eye, Users, MessageCircle,
    Filter, ZoomIn, Sparkles, Trophy, Clock, Calendar,
    Activity, TrendingDown, Info, ChevronDown, ChevronUp,
    Star, Zap, ShieldCheck, BookOpen, ArrowUpRight, ArrowDownRight,
    PlayCircle
} from 'lucide-react'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart as RechartsLineChart, Line,
    PieChart as RechartsPieChart, Pie, Cell,
    ResponsiveContainer, AreaChart, Area, ComposedChart,
    Scatter, ScatterChart, ZAxis, Funnel, FunnelChart, LabelList
} from 'recharts'
import toast from 'react-hot-toast'
import PlaylistTab from '@/components/assessment/report/PlaylistTab'
import Playlist from '@/components/assessment/Playlist'

// Map by round_type for correct labeling across tech/non-tech flows
const roundTypeInfo: Record<string, { name: string; icon: any; color: string; gradient: string }> = {
    aptitude: { name: "Aptitude Test", icon: Brain, color: "bg-blue-500", gradient: "from-blue-400 to-blue-600" },
    soft_skills: { name: "Soft Skills", icon: User, color: "bg-green-500", gradient: "from-green-400 to-green-600" },
    group_discussion: { name: "Group Discussion", icon: Users, color: "bg-teal-500", gradient: "from-teal-400 to-teal-600" },
    technical_mcq: { name: "Technical MCQ", icon: ClipboardList, color: "bg-purple-500", gradient: "from-purple-400 to-purple-600" },
    coding: { name: "Coding Challenge", icon: BookOpen, color: "bg-indigo-500", gradient: "from-indigo-400 to-indigo-600" },
    electrical_circuit: { name: "Electrical Circuit Design", icon: Zap, color: "bg-amber-500", gradient: "from-amber-400 to-amber-600" },
    tally_excel_practical: { name: "Tally/Excel Practical", icon: FileText, color: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
    TALLY_EXCEL_PRACTICAL: { name: "Tally/Excel Practical", icon: FileText, color: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600" },
    technical_interview: { name: "Technical Interview", icon: Mic, color: "bg-orange-500", gradient: "from-orange-400 to-orange-600" },
    hr_interview: { name: "HR Interview", icon: Target, color: "bg-pink-500", gradient: "from-pink-400 to-pink-600" }
}

// Fallback names by number (used only when type is unavailable)
const roundNumberNames = new Map<number, string>([
    [1, "Aptitude Test"],
    [2, "Soft Skills"],
    [3, "Group Discussion"],
    [4, "Technical MCQ"],
    [5, "Coding Challenge"],
    [6, "Technical Interview"],
    [7, "HR Interview"],
])

const getRoundName = (round: any) => {
    if (!round) return "Round"
    return roundTypeInfo[round.round_type]?.name || roundNumberNames.get(round.round_number) || `Round ${round.round_number}`
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4']

// Utility function to format percentage values consistently
const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) return '0.00'
    return Number(value).toFixed(decimals)
}

// Custom animated counter component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number, duration?: number }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime: number
        let animationFrame: number

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)

            setCount(Math.floor(progress * value))

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [value, duration])

    return <span>{count}</span>
}

export default function AssessmentReportPage() {
    const [report, setReport] = useState<any>(null)
    const [qaData, setQaData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedRound, setSelectedRound] = useState<number | null>(null)
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('default')
    const [showFilters, setShowFilters] = useState(false)
    const [compareMode, setCompareMode] = useState(false)
    const [expandedInsights, setExpandedInsights] = useState<{ [key: number]: boolean }>({})

    const router = useRouter()
    const searchParams = useSearchParams()
    const assessmentId = searchParams?.get('id')

    useEffect(() => {
        if (!assessmentId) {
            router.push('/dashboard/student/assessment')
            return
        }

        const loadReport = async () => {
            setLoading(true)
            try {
                const data = await apiClient.getAssessmentReportWithQuestions(assessmentId)
                setReport(data)
                setError(null)
            } catch (error: any) {
                // Print the full error object for debugging
                console.error('Error loading report (full object):', error)
                // Defensive: check all possible Axios error shapes
                const status = error?.response?.status || error?.status || error?.code || error?.response?.data?.status;
                const errorMsg = error?.response?.data?.detail || error?.message || error?.toString() || 'Failed to load assessment report';

                // Treat HTTP 400 from the report endpoint as "assessment not completed" as a safe default
                if (status === 400 || status === '400' || String(errorMsg).toLowerCase().includes('not completed')) {
                    setError('incomplete')
                    // Don't toast for expected incomplete state
                    return
                }

                // Fallback: show generic error
                setError(errorMsg)
                toast.error(errorMsg)
            } finally {
                setLoading(false)
            }
        }

        const loadQAData = async () => {
            try {
                const data = await apiClient.getAssessmentQA(assessmentId)
                setQaData(data)
            } catch (error) {
                console.error('Error loading Q&A data:', error)
            }
        }

        loadReport()
        loadQAData()
    }, [assessmentId, router])

    const calculateStats = () => {
        if (!qaData?.rounds) return null

        let totalQuestions = 0
        let correctAnswers = 0
        let totalScore = 0
        let maxScore = 0
        let timeSpent = 0

        qaData.rounds.forEach((round: any) => {
            round.questions?.forEach((q: any) => {
                totalQuestions++
                if (q.is_correct) correctAnswers++
                totalScore += q.score || 0
                maxScore += q.max_score || 0
            })
        })

        return {
            totalQuestions,
            correctAnswers,
            wrongAnswers: totalQuestions - correctAnswers,
            accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions * 100) : 0,
            scorePercentage: maxScore > 0 ? (totalScore / maxScore * 100) : 0,
            timeSpent,
            averageTimePerQuestion: totalQuestions > 0 ? timeSpent / totalQuestions : 0
        }
    }

    // Enhanced radar data with more metrics
    const prepareRadarData = () => {
        if (!report?.rounds) return []

        return report.rounds.map((round: any) => ({
            subject: getRoundName(round),
            score: parseFloat(formatPercentage(round.percentage, 2)),
            benchmark: 75, // Static benchmark for visual reference
            fullMark: 100,
            roundNumber: round.round_number
        }))
    }

    // Prepare time series data
    const prepareTimeSeriesData = () => {
        if (!report?.rounds) return []

        return report.rounds.map((round: any, index: number) => ({
            round: getRoundName(round),
            score: parseFloat(formatPercentage(round.percentage, 2)),
            cumulative: parseFloat(formatPercentage(report.rounds.slice(0, index + 1).reduce((acc: number, r: any) => acc + (r.percentage || 0), 0) / (index + 1), 2)),
            target: 75
        }))
    }

    // Prepare question difficulty breakdown
    const prepareQuestionDistribution = () => {
        const stats = calculateStats()
        if (!stats) return []

        return [
            { name: 'Correct', value: stats.correctAnswers, color: COLORS[0] },
            { name: 'Incorrect', value: stats.wrongAnswers, color: COLORS[1] }
        ]
    }

    // Prepare performance funnel
    const preparePerformanceFunnel = () => {
        if (!report?.rounds) return []

        const sortedRounds = [...report.rounds].sort((a: any, b: any) => b.percentage - a.percentage)
        return sortedRounds.map((round: any) => ({
            value: parseFloat(formatPercentage(round.percentage, 2)),
            name: getRoundName(round),
            label: `${getRoundName(round)}\n${formatPercentage(round.percentage, 2)}%`,
            fill: COLORS[round.round_number % COLORS.length]
        }))
    }

    // Prepare scatter plot data for difficulty vs performance
    const prepareScatterData = () => {
        if (!qaData?.rounds) return []

        return qaData.rounds.flatMap((round: any) =>
            (round.questions || []).map((q: any, idx: number) => ({
                x: idx + 1,
                y: q.score || 0,
                z: q.max_score || 0,
                difficulty: q.difficulty || 'medium',
                correct: q.is_correct
            }))
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPerformanceBadge = (score: number) => {
        if (score >= 90) return { label: 'Outstanding', color: 'bg-gradient-to-r from-yellow-400 to-yellow-600', icon: Trophy }
        if (score >= 80) return { label: 'Excellent', color: 'bg-gradient-to-r from-green-400 to-green-600', icon: Star }
        if (score >= 70) return { label: 'Very Good', color: 'bg-gradient-to-r from-blue-400 to-blue-600', icon: Award }
        if (score >= 60) return { label: 'Good', color: 'bg-gradient-to-r from-purple-400 to-purple-600', icon: CheckCircle }
        return { label: 'Needs Improvement', color: 'bg-gradient-to-r from-orange-400 to-red-600', icon: TrendingDown }
    }

    const toggleInsight = (roundNumber: number) => {
        setExpandedInsights(prev => ({
            ...prev,
            [roundNumber]: !prev[roundNumber]
        }))
    }

    // Filter and sort questions
    const getFilteredQuestions = (questions: any[]) => {
        if (!questions) return []

        let filtered = [...questions]

        // Apply difficulty filter
        if (filterDifficulty !== 'all') {
            filtered = filtered.filter(q => q.difficulty?.toLowerCase() === filterDifficulty)
        }

        // Apply sorting
        switch (sortBy) {
            case 'score-high':
                filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
                break
            case 'score-low':
                filtered.sort((a, b) => (a.score || 0) - (b.score || 0))
                break
            case 'difficulty':
                const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
                filtered.sort((a, b) => (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) - (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2))
                break
        }

        return filtered
    }

    if (loading) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader size="lg" />
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Analyzing Your Performance...</p>
                        <p className="text-sm text-gray-500">Generating insights with AI</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Show incomplete assessment UI
    if (error === 'incomplete') {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="space-y-6 pb-8 max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/student/assessment')}
                        className="group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Assessments
                    </Button>

                    {/* Incomplete Assessment Banner */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-pink-950/20 p-8 shadow-xl">
                        {/* Animated Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 animate-gradient-x"></div>

                        <div className="relative z-10 space-y-6">
                            {/* Header with Icon */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                                        <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-full">
                                            <AlertCircle className="h-8 w-8 text-white animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        Assessment Not Completed
                                    </h2>
                                    <p className="text-lg text-gray-700 dark:text-gray-300">
                                        Your assessment is still in progress. Complete all rounds to view your detailed performance report.
                                    </p>
                                </div>
                            </div>

                            {/* Information Cards */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 dark:border-orange-800/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Why Complete?</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Finish all assessment rounds to unlock your comprehensive performance analytics, strengths, and personalized recommendations.
                                    </p>
                                </div>

                                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 dark:border-orange-800/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">What You'll Get</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Detailed score breakdowns, performance charts, question-by-question analysis, and AI-powered insights to improve your skills.
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    onClick={() => router.push('/dashboard/student/assessment')}
                                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all group"
                                >
                                    <CheckCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                    Continue Your Assessment
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/student/jobs')}
                                    className="border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-950/20"
                                >
                                    View Job Recommendations
                                </Button>
                            </div>

                            {/* Progress Indicator (if available) */}
                            <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    <span className="font-semibold">Tip:</span> Complete your assessment in one sitting for the best experience. You can pause and resume anytime from the assessment page.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Help Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Need Help?
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            Having trouble completing your assessment? Make sure you've answered all questions in each round and submitted your responses.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard/student/assessment')}
                                className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/20"
                            >
                                Go to Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Show generic error UI  
    if (error && error !== 'incomplete') {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="space-y-6 pb-8 max-w-2xl mx-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/student/assessment')}
                        className="group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Assessments
                    </Button>

                    <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Unable to Load Report
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {error}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => {
                                    setError(null)
                                    setLoading(true)
                                    window.location.reload()
                                }}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard/student/assessment')}
                            >
                                Back to Assessments
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const stats = calculateStats()
    const performanceBadge = getPerformanceBadge(report?.overall_score || 0)
    const PerformanceIcon = performanceBadge?.icon || Trophy

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-5 pt-1 sm:pt-6 lg:pt-0 pb-8 dark:bg-[#020817] min-h-screen">
                {/* Banner – Sigma: white bg, 16px radius, 1px #4EA8FD border, 10px padding/gap, increased height */}
                <div className="rounded-[16px] border border-[#4EA8FD] dark:border-[#797979] bg-white dark:bg-[#1C2938] px-[10px] py-[24px] flex flex-col gap-[10px]">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Sparkles className="h-6 w-6 text-[#4EA8FD] dark:text-blue-400 shrink-0" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                            Performance Analysis Dashboard
                        </h1>
                    </div>
                    <p className="text-base leading-6 text-gray-900 dark:text-gray-300 max-w-2xl" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
                        Track your progress, analyze performance, and unlock your potential with AI-powered insights
                    </p>
                </div>

                {/* KPI Cards – Sigma: horizontal, 24px gap, 16px radius, 1px #BEBEBE, 10px px, 20px py, 44x44 icon bg */}
                <div className="flex flex-col sm:flex-row gap-6 flex-wrap">
                    {/* Overall Score – icon bg #B8DCFF */}
                    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1 min-w-0 sm:min-w-[200px]">
                        <div className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] px-[10px] py-[20px] flex flex-col gap-[10px] h-full shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 bg-[#B8DCFF] dark:bg-blue-500/30">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Overall Score</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{Math.round(report?.overall_score || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    {/* Readiness Index – icon bg #EDD4FF */}
                    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1 min-w-0 sm:min-w-[200px]">
                        <div className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] px-[10px] py-[20px] flex flex-col gap-[10px] h-full shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 bg-[#EDD4FF] dark:bg-purple-500/30">
                                    <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Readiness Index</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{Math.round(report?.readiness_index || 0)}%</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    {/* Completed Rounds – icon bg #FFA8D9 */}
                    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1 min-w-0 sm:min-w-[200px]">
                        <div className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] px-[10px] py-[20px] flex flex-col gap-[10px] h-full shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 bg-[#FFA8D9] dark:bg-pink-500/30">
                                    <Activity className="w-5 h-5 text-pink-600 dark:text-pink-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Completed Rounds</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {report?.rounds?.filter((r: any) => r.status === 'COMPLETED' || r.percentage != null).length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    {/* Total Duration – icon bg #FFEF79 */}
                    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1 min-w-0 sm:min-w-[200px]">
                        <div className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] px-[10px] py-[20px] flex flex-col gap-[10px] h-full shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0 bg-[#FFEF79] dark:bg-amber-500/30">
                                    <Target className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Duration</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {report?.rounds?.reduce((total: number, round: any) => {
                                            const isCompleted = round.status === 'COMPLETED' || round.percentage != null
                                            return total + (isCompleted ? 30 : 0)
                                        }, 0) || 0} Mins
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs – Sigma: active blue #1E7BFF, 8px radius, 24px gap, 44px height, no button borders */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-10">
                    <TabsList className="grid grid-cols-3 sm:grid-cols-6 bg-white dark:bg-[#1C2938] border border-[#797979] dark:border-[#797979] p-1.5 sm:p-2 rounded-lg w-full gap-4 sm:gap-6 min-h-[56px] sm:min-h-[71px] h-auto">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Activity className="h-4 w-4 shrink-0 data-[state=active]:text-white" />
                            <span className="whitespace-nowrap">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Activity className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Analytics</span>
                        </TabsTrigger>
                        <TabsTrigger value="detailed" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Rounds</span>
                        </TabsTrigger>
                        <TabsTrigger value="questions" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Questions</span>
                        </TabsTrigger>
                        <TabsTrigger value="playlist" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Playlist</span>
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-[#1E7BFF] data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-2 h-11 sm:h-11 px-3 py-2 transition-all font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 data-[state=inactive]:bg-transparent">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">AI Insights</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Filter Toggle Button - Separate Row Below Tabs with Clear Spacing */}
                    <div className="mt-4 sm:mt-4 mb-12 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {/* <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 w-full sm:w-auto"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="sm:inline">Filters</span>
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button> */}
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <Card className="mb-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Filter by Difficulty</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800"
                                            value={filterDifficulty}
                                            onChange={(e) => setFilterDifficulty(e.target.value)}
                                        >
                                            <option value="all">All Questions</option>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <option value="default">Default Order</option>
                                            <option value="score-high">Score: High to Low</option>
                                            <option value="score-low">Score: Low to High</option>
                                            <option value="difficulty">By Difficulty</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setFilterDifficulty('all')
                                                setSortBy('default')
                                            }}
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Overview Tab with Enhanced Charts - Matching Theme */}
                    <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Radar Chart - Skills Assessment – Sigma: white card, 16px radius, purple clock icon */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 hover:shadow-lg h-full">
                                    <CardHeader className="p-4 sm:p-5 pb-2 border-0">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                            <div className="w-9 h-9 rounded-[16px] flex items-center justify-center shrink-0 bg-[#EDD4FF] dark:bg-purple-500/30">
                                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-300" />
                                            </div>
                                            <span className="truncate">Skills Assessment</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Multi-dimensional performance analysis
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-5 pt-2">
                                        <ResponsiveContainer width="100%" height={350} className="sm:h-[450px]">
                                            <RadarChart data={prepareRadarData()} cx="50%" cy="50%" outerRadius="75%">
                                                <PolarGrid stroke="#e5e7eb" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name="Your Score"
                                                    dataKey="score"
                                                    stroke="#5388D8"
                                                    strokeWidth={2}
                                                    fill="#5388D8"
                                                    fillOpacity={0.3}
                                                    dot={{ fill: '#5388D8', r: 3 }}
                                                />
                                                <Radar
                                                    name="Benchmark"
                                                    dataKey="benchmark"
                                                    stroke="#F4BE37"
                                                    strokeWidth={2}
                                                    fill="#F4BE37"
                                                    fillOpacity={0.3}
                                                    dot={{ fill: '#F4BE37', r: 3 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                                    formatter={(value: any) => `${value}%`}
                                                />
                                                <Legend
                                                    wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                                                    iconType="circle"
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <div className="text-center font-bold text-3xl mt-2 pb-4 text-gray-900 dark:text-white">Your Score</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Answer Distribution – Sigma: white card, 16px radius, purple wave icon */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="rounded-[16px] border border-[#BEBEBE] dark:border-[#797979] bg-white dark:bg-[#1C2938] shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 hover:shadow-lg h-full">
                                    <CardHeader className="p-4 sm:p-5 pb-2 border-0">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                            <div className="w-9 h-9 rounded-[16px] flex items-center justify-center shrink-0 bg-[#EDD4FF] dark:bg-purple-500/30">
                                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-300" />
                                            </div>
                                            <span className="truncate">Answer Distribution</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Correct vs. incorrect responses
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-5 pt-2">
                                        <ResponsiveContainer width="100%" height={350} className="sm:h-[450px]">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={prepareQuestionDistribution()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent, value }: any) => (
                                                        `${value} (${(percent * 100).toFixed(0)}%)`
                                                    )}
                                                    outerRadius={140}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    animationBegin={0}
                                                    animationDuration={800}
                                                >
                                                    {prepareQuestionDistribution().map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.name === 'Correct' ? '#00C951' : '#FF541F'}
                                                            stroke="#fff"
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                                    formatter={(value: any, name: string) => [value, name]}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    formatter={(value) => {
                                                        if (value === 'Correct') return <span style={{ color: '#00C951', fontWeight: 'bold' }}>Correct</span>
                                                        return <span style={{ color: '#FF541F', fontWeight: 'bold' }}>Incorrect</span>
                                                    }}
                                                />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Bar Chart - Round-wise Performance Comparison */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="rounded-[16px] border border-[#ABABAB] dark:border-[#797979] bg-white dark:bg-[#1C2938] shadow-none overflow-hidden transition-all duration-300 hover:shadow-lg">
                                <CardHeader className="p-4 sm:px-6 sm:py-5 pb-2 border-0">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 bg-[#EDD4FF] dark:bg-purple-500/30 mt-1">
                                            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                                Round-wise Performance Comparison
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Detailed score breakdown by assessment round
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:px-6 sm:py-5 pt-4">
                                    <ResponsiveContainer width="100%" height={400} className="sm:h-[450px]">
                                        <BarChart
                                            data={prepareRadarData()}
                                            margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                                            barSize={40}
                                            barGap={-40}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="subject"
                                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                            />
                                            <Bar
                                                dataKey="fullMark"
                                                fill="#E5E7EB"
                                                radius={[4, 4, 0, 0]}
                                                isAnimationActive={false}
                                            />
                                            <Bar
                                                dataKey="score"
                                                radius={[4, 4, 0, 0]}
                                                animationBegin={0}
                                                animationDuration={800}
                                            >
                                                {prepareRadarData().map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* New Analytics Tab with Advanced Visualizations */}
                    <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
                        {/* Performance Trend Line Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="rounded-[8px] border border-[#ABABAB] bg-white dark:bg-[#1C2938] shadow-none overflow-hidden h-full">
                                <CardHeader className="pt-4 pr-2 pb-4 pl-2 border-0">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-[44px] h-[44px] rounded-[8px] flex items-center justify-center shrink-0 bg-[#7F56D9]">
                                            <BarChart3 className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                                Performance Trend Analysis
                                            </CardTitle>
                                            <CardDescription className="text-sm text-gray-500 font-normal">
                                                Track your progress across rounds
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="bg-[#F8FAFC] dark:bg-[#334155] rounded-[24px] p-2 sm:p-4 h-[400px] sm:h-[450px] relative w-full">
                                        <div className="absolute top-6 left-6 z-10 font-bold text-lg text-gray-900 dark:text-white">Performance</div>
                                        <ResponsiveContainer width="90%" height={400}>
                                            <ComposedChart data={prepareTimeSeriesData()} margin={{ top: 50, right: 10, bottom: 10, left: 0 }}>
                                                <XAxis
                                                    dataKey="round"
                                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    ticks={[0, 25, 50, 75, 100]}
                                                />
                                                <Tooltip
                                                    cursor={{ stroke: '#599CD7', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#081225] text-white p-4 rounded-[20px] min-w-[240px] shadow-xl border border-gray-800">
                                                                    <p className="text-sm mb-3 font-medium border-b border-gray-700 pb-2">{label}</p>
                                                                    <div className="space-y-3">
                                                                        {payload.map((entry: any, index: number) => {
                                                                            // Custom mapping for colors and names based on dataKey
                                                                            let color = entry.color;
                                                                            let name = entry.name;
                                                                            if (entry.dataKey === 'cumulative') {
                                                                                color = '#599CD7';
                                                                                name = 'cumulative';
                                                                            } else if (entry.dataKey === 'score') {
                                                                                color = '#FAAE68';
                                                                                name = 'score';
                                                                            } else if (entry.dataKey === 'target') {
                                                                                color = '#A855F7';
                                                                                name = 'Target (75%)';
                                                                            }

                                                                            return (
                                                                                <div key={index} className="flex items-center gap-3 text-sm">
                                                                                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }}></div>
                                                                                    <span className="text-gray-300 capitalize">{name} :</span>
                                                                                    <span className="font-semibold">{entry.value}%</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                {/* Target Line - Hidden but present for tooltip */}
                                                <Line
                                                    type="monotone"
                                                    dataKey="target"
                                                    stroke="transparent"
                                                    strokeWidth={0}
                                                    dot={false}
                                                    activeDot={false}
                                                    name="Target"
                                                />
                                                {/* Cumulative Line (Blue) */}
                                                <Line
                                                    type="monotone"
                                                    dataKey="cumulative"
                                                    stroke="#599CD7"
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 6, fill: '#599CD7', stroke: '#fff', strokeWidth: 2 }}
                                                    name="Cumulative"
                                                />
                                                {/* Score Line (Orange) */}
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#FAAE68"
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 6, fill: '#FAAE68', stroke: '#fff', strokeWidth: 2 }}
                                                    name="Score"
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Performance Funnel */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="rounded-[8px] border border-[#ABABAB] dark:border-[#797979] bg-white dark:bg-[#1C2938] shadow-none overflow-hidden h-full">
                                    <CardHeader className="pt-4 pr-2 pb-4 pl-2 border-0">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-[44px] h-[44px] rounded-[8px] flex items-center justify-center shrink-0 bg-[#7F56D9]">
                                                <Activity className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Answer Distribution
                                                </CardTitle>
                                                <CardDescription className="text-sm text-gray-500 font-normal">
                                                    Correct vs. incorrect responses
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 pr-2 pb-4 pl-2 flex justify-center items-center">
                                        <ResponsiveContainer width="100%" height={350} className="sm:h-[400px]">
                                            <FunnelChart>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#081225',
                                                        border: '1px solid #1f2937',
                                                        borderRadius: '20px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                        padding: '12px 16px',
                                                        color: '#fff'
                                                    }}
                                                    itemStyle={{ color: '#fff' }}
                                                    labelStyle={{ color: '#9CA3AF', marginBottom: '4px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}
                                                    formatter={(value: any, name: string, props: any) => {
                                                        return [
                                                            <span key="value" style={{ color: '#fff', fontWeight: 'bold' }}>{value}%</span>,
                                                            <span key="name" style={{ color: '#D1D5DB' }}>{props.payload.name}</span>
                                                        ]
                                                    }}
                                                />
                                                <Funnel
                                                    dataKey="value"
                                                    data={preparePerformanceFunnel()}
                                                    isAnimationActive
                                                    animationDuration={1200}
                                                >
                                                    {preparePerformanceFunnel().map((entry: any, index: number) => {
                                                        // Define colors based on the design
                                                        const colors = ['#0CAE00', '#FF7A28', '#9359FF', '#FF4D4D', '#FF9900', '#1E7BFF'];
                                                        const color = colors[index % colors.length];
                                                        return (
                                                            <Cell
                                                                key={`funnel-cell-${index}`}
                                                                fill={color}
                                                                stroke="none"
                                                                style={{
                                                                    filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.15))',
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                    <LabelList
                                                        position="center"
                                                        fill="#000"
                                                        stroke="none"
                                                        dataKey="label"
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            textShadow: '0px 1px 2px rgba(255,255,255,0.5)',
                                                            pointerEvents: 'none',
                                                            whiteSpace: 'pre'
                                                        }}
                                                    />
                                                </Funnel>
                                            </FunnelChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Score Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Card className="rounded-[8px] border border-[#ABABAB] dark:border-[#797979] bg-white dark:bg-[#1C2938] shadow-none overflow-hidden h-full">
                                    <CardHeader className="pt-4 pr-2 pb-4 pl-2 border-0">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-[44px] h-[44px] rounded-[8px] flex items-center justify-center shrink-0 bg-[#7F56D9]">
                                                <BarChart3 className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Score Distribution
                                                </CardTitle>
                                                <CardDescription className="text-sm text-gray-500 font-normal">
                                                    Cumulative performance view
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 pr-6 pb-4 pl-6">
                                        <div className="space-y-6">
                                            {preparePerformanceFunnel().map((item: any, index: number) => {
                                                // Create diverse dummy data for the sparkline to make it look interesting
                                                const seed = item.value * (index + 1);
                                                const sparkData = [
                                                    { value: 0 },
                                                    { value: (seed % 40) + 10 },
                                                    { value: (seed % 30) + 40 },
                                                    { value: (seed % 20) + 20 },
                                                    { value: (seed % 50) + 30 },
                                                    { value: 0 }
                                                ];

                                                // Determine color based on score
                                                const isHigh = item.value >= 70;
                                                const isMedium = item.value >= 40 && item.value < 70;

                                                // Colors from the design
                                                // Green for high scores (>= 70%)
                                                // Green for medium scores (>= 40%) - per design image both 60% and 40% are green/teal
                                                // Red for low scores (< 40%)

                                                // Looking at the image:
                                                // 60% is Green/Teal
                                                // 40% is Green/Teal
                                                // 30% is Red
                                                // 50% is Green/Teal
                                                // 70% is Green/Teal
                                                // 20% is Red
                                                // 0% is Red

                                                const color = item.value >= 40 ? '#5DB48A' : '#EF4444';

                                                return (
                                                    <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                        <div className="space-y-1 w-[180px]">
                                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Score</div>
                                                        </div>
                                                        <div className="flex items-center gap-12 flex-1 justify-end">
                                                            {/* Mini Area Chart / Sparkline */}
                                                            <div className="w-[102px] h-[28px]">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <AreaChart data={sparkData}>
                                                                        <defs>
                                                                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                                                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <Area
                                                                            type="monotone"
                                                                            dataKey="value"
                                                                            stroke={color}
                                                                            fill={`url(#gradient-${index})`}
                                                                            strokeWidth={1.5}
                                                                        />
                                                                    </AreaChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                            <div className="font-bold text-gray-900 dark:text-white w-16 text-right text-lg">
                                                                {item.value} %
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Advanced Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card className="rounded-[16px] bg-[#EAF8FF] dark:bg-[#EAF8FF]/10 shadow-none border-0 overflow-hidden h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full gap-2">
                                        <div className="text-[#0085FF] font-medium text-lg">Highest Score</div>
                                        <div className="text-5xl font-semibold text-black dark:text-white">
                                            {formatPercentage(Math.max(...(report?.rounds?.map((r: any) => r.percentage) || [0])), 2)}%
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-300">
                                            {(() => {
                                                const best = report?.rounds?.reduce((max: any, r: any) => r.percentage > max.percentage ? r : max, { percentage: -1 })
                                                return best ? getRoundName(best) : 'No Data'
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Card className="rounded-[16px] bg-[#E4FFF0] dark:bg-[#E4FFF0]/10 shadow-none border-0 overflow-hidden h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full gap-2">
                                        <div className="text-[#0CAE00] font-medium text-lg">Average Performance</div>
                                        <div className="text-5xl font-semibold text-black dark:text-white">
                                            {formatPercentage(report?.overall_score, 2)}%
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-300">
                                            Across {report?.rounds?.length || 0} rounds
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <Card className="rounded-[16px] bg-[#F9F6FF] dark:bg-[#F9F6FF]/10 shadow-none border-0 overflow-hidden h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full gap-2">
                                        <div className="text-[#4F1D91] font-medium text-lg">Consistency Score</div>
                                        <div className="text-5xl font-semibold text-black dark:text-white">
                                            {(() => {
                                                const scores = report?.rounds?.map((r: any) => r.percentage) || []
                                                const avg = scores.reduce((a: number, b: number) => a + b, 0) / (scores.length || 1)
                                                const variance = scores.reduce((sum: number, score: number) =>
                                                    sum + Math.pow(score - avg, 2), 0) / (scores.length || 1)
                                                const stdDev = Math.sqrt(variance)
                                                const consistency = Math.max(0, 100 - stdDev * 2)
                                                return formatPercentage(consistency, 2)
                                            })()}%
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-300">
                                            Performance stability
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* Detailed Analysis Tab - Keep your existing detailed tab */}
                    <TabsContent value="detailed" className="space-y-4 sm:space-y-6">
                        {/* Round Cards */}
                        <div className="flex flex-col gap-4">
                            {report?.rounds?.map((round: any, index: number) => {
                                const roundConfig = roundTypeInfo[round.round_type]
                                const RoundIcon = roundConfig?.icon || Brain
                                const score = parseFloat(formatPercentage(round.percentage, 2))
                                const isSelected = selectedRound === round.round_number

                                // Determine icon colors based on round type or index if needed, 
                                // but for now using a standard blue-ish theme as per screenshot for most, 
                                // or we can use the config colors but styled differently.
                                // The screenshot shows blue icon backgrounds for Aptitude/Soft Skills/etc.

                                return (
                                    <motion.div
                                        key={round.round_number}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Card
                                            className={`
    group cursor-pointer transition-all duration-300
    border rounded-[8px] overflow-hidden
    ${isSelected
                                                    ? 'ring-1 ring-[#1E7BFF] border-[#1E7BFF] bg-gradient-to-r from-[rgba(30,123,255,0.3)] to-[rgba(134,80,255,0.39)]'
                                                    : 'border-[#A3A3A3] bg-gradient-to-r from-[rgba(30,123,255,0.12)] to-[rgba(134,80,255,0.15)] dark:bg-[#1C2938]'
                                                }
    hover:shadow-md
  `}
                                            onClick={() => {
                                                setSelectedRound(round.round_number)
                                                setActiveTab('round')
                                            }}
                                        >
                                            <div className="p-3 space-y-3">
                                                {/* Header Section */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Icon */}
                                                        <div className={`
                                                            w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 
                                                            ${isSelected ? 'bg-[#1E7BFF] text-white' : 'bg-white border border-[#E5E7EB] text-[#1E7BFF]'}
                                                        `}>
                                                            {RoundIcon && <RoundIcon className="h-6 w-6" />}
                                                        </div>

                                                        {/* Title & Subtitle */}
                                                        <div>
                                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                                {getRoundName(round)}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                                Round {round.round_number}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="text-right self-center">
                                                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                                            {formatPercentage(round.percentage, 2)}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-[#1E7BFF] to-[#8650FF]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${score}%` }}
                                                        transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                                    />
                                                </div>

                                                {/* Description/Feedback */}
                                                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                    {typeof round.ai_feedback === 'string' ? (
                                                        round.ai_feedback
                                                    ) : round.ai_feedback?.summary ? (
                                                        round.ai_feedback.summary
                                                    ) : round.ai_feedback?.strengths?.[0] ? (
                                                        `Strengths: ${round.ai_feedback.strengths[0]}`
                                                    ) : "Evaluation completed successfully"}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </TabsContent>

                    {/* Round Details Tab (your existing round tab) */}
                    <TabsContent value="round" className="space-y-4 sm:space-y-6">
                        {selectedRound !== null && qaData?.rounds?.filter((r: any) => r.round_number === selectedRound).map((round: any) => (
                            <Card key={round.round_number} className="overflow-hidden border-0 shadow-md">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6">
                                    <CardTitle className="text-base sm:text-lg">
                                        Round {round.round_number} - {round.round_type.replace('_', ' ').toUpperCase()}
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {round.round_type === 'group_discussion' ? (
                                            `Score: ${formatPercentage(round.percentage, 2)}%`
                                        ) : (
                                            `Score: ${formatPercentage(round.percentage, 2)}% (${round.score}/${round.questions?.reduce((sum: number, q: any) => sum + q.max_score, 0) || 0} points)`
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                                    {/* Special rendering for Group Discussion */}
                                    {round.round_type === 'group_discussion' ? (
                                        <div className="space-y-4 sm:space-y-6">
                                            {/* Score strip */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                                                <div className={`text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600`}>
                                                    {formatPercentage(round.percentage, 2)}%
                                                </div>
                                                <div className="flex-1 h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, round.percentage || 0))}%` }} />
                                                </div>
                                            </div>

                                            {/* Criteria */}
                                            {round.ai_feedback?.criteria_scores && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                                    {[
                                                        { name: 'Communication', value: round.ai_feedback.criteria_scores.communication, color: 'from-sky-500 to-blue-600', emoji: '💬' },
                                                        { name: 'Topic Understanding', value: round.ai_feedback.criteria_scores.topic_understanding, color: 'from-fuchsia-500 to-purple-600', emoji: '🧠' },
                                                        { name: 'Interaction', value: round.ai_feedback.criteria_scores.interaction, color: 'from-emerald-500 to-teal-600', emoji: '🤝' },
                                                    ].map((c) => (
                                                        <div key={c.name} className="rounded-xl sm:rounded-2xl border bg-white/80 dark:bg-gray-900/60 backdrop-blur p-3 sm:p-4 hover:shadow-lg transition-shadow">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold">
                                                                    <span>{c.emoji}</span>
                                                                    <span className="truncate">{c.name}</span>
                                                                </div>
                                                                <div className="text-xl font-bold">{formatPercentage(c.value, 2)}%</div>
                                                            </div>
                                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full bg-gradient-to-r ${c.color} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, c.value || 0))}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Strengths & Improvements */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {round.ai_feedback?.strengths?.length > 0 && (
                                                    <div className="rounded-2xl border bg-green-50 dark:bg-green-900/20 p-4">
                                                        <div className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5 text-green-600" /> Strengths
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {round.ai_feedback.strengths.map((s: string, i: number) => (
                                                                <span key={i} className="px-3 py-1 rounded-full bg-green-500 text-white text-sm border-0">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {round.ai_feedback?.improvements?.length > 0 && (
                                                    <div className="rounded-2xl border bg-orange-50 dark:bg-orange-900/20 p-4">
                                                        <div className="font-semibold text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-2">
                                                            <Lightbulb className="h-5 w-5 text-orange-600" /> Areas to Improve
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {round.ai_feedback.improvements.map((s: string, i: number) => (
                                                                <span key={i} className="px-3 py-1 rounded-full bg-red-500 text-white text-sm border-0">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Conversation */}
                                            {round.conversation?.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <MessageCircle className="h-5 w-5" /> Conversation Transcript
                                                    </div>
                                                    <div className="max-h-[420px] overflow-auto pr-1 space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border">
                                                        {round.conversation.map((turn: any, idx: number) => (
                                                            <div key={idx} className="space-y-3">
                                                                {turn.user && (
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">S</div>
                                                                        <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-2 shadow-sm max-w-[85%] text-sm">
                                                                            {turn.user}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {(turn.agents || []).map((a: any, i: number) => (
                                                                    <div key={i} className="flex items-start gap-3 ml-11">
                                                                        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                                                            {String(a.name || 'AI').charAt(0)}
                                                                        </div>
                                                                        <div className="bg-slate-50 dark:bg-gray-900 border rounded-2xl px-3 py-2 shadow-sm max-w-[80%]">
                                                                            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">{a.name || 'AI'}</div>
                                                                            <div className="text-sm text-slate-800 dark:text-slate-200">{a.text}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                                                        <AlertCircle className="h-5 w-5" />
                                                        <div>
                                                            <div className="font-semibold">No Conversation Data</div>
                                                            <div className="text-sm">This assessment was completed before conversation tracking was implemented.</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getFilteredQuestions(round.questions).map((q: any, idx: number) => (
                                                <div key={q.id} className="p-4 border-2 rounded-xl space-y-3 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">Q{idx + 1}</Badge>
                                                                <Badge variant={q.is_correct ? 'default' : 'destructive'} className="shadow-sm">
                                                                    {q.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                                                </Badge>
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                                    {q.score}/{q.max_score} points
                                                                </span>
                                                                {q.difficulty && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            q.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-300' :
                                                                                q.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-300' :
                                                                                    'bg-yellow-50 text-yellow-700 border-yellow-300'
                                                                        }
                                                                    >
                                                                        {q.difficulty}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="font-medium mb-3 text-lg">{q.text}</p>
                                                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                                                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                                                    <span className="font-semibold text-blue-700 dark:text-blue-300">Your Answer:</span>
                                                                    <p className={`mt-1 ${q.is_correct ? 'text-green-600 font-medium' : 'text-red-600'}`}>
                                                                        {q.student_response || (q.response_audio_url ? '🎤 Voice Response' : '—')}
                                                                    </p>
                                                                </div>
                                                                {q.correct_answer && (
                                                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                                                        <span className="font-semibold text-green-700 dark:text-green-300">Correct Answer:</span>
                                                                        <p className="text-green-600 font-medium mt-1">{q.correct_answer}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {q.ai_feedback && (
                                                                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200">
                                                                    <p className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                                                                        <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                        <span><strong>AI Feedback:</strong> {typeof q.ai_feedback === 'string' ? q.ai_feedback : JSON.stringify(q.ai_feedback)}</span>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="outline" onClick={() => { setSelectedRound(null); setActiveTab('detailed'); }} className="shadow-md">
                            ← Back to All Rounds
                        </Button>
                    </TabsContent>

                    {/* Questions Tab - Redesigned Grid Layout */}
                    <TabsContent value="questions" className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {qaData?.rounds?.map((round: any) => {
                                const roundConfig = roundTypeInfo[round.round_type]
                                const RoundIcon = roundConfig?.icon || Brain
                                
                                // Calculate or extract stats
                                const totalQuestions = round.questions?.length || 0
                                const correctCount = round.questions?.filter((q: any) => q.is_correct).length || 0
                                // Incorrect includes wrong answers (is_correct === false)
                                // Assuming unattempted are also handled or just strictly incorrect here
                                const incorrectCount = totalQuestions - correctCount
                                const scorePercentage = Math.round(round.percentage || 0)
                                const totalPoints = round.questions?.reduce((sum: number, q: any) => sum + (q.max_score || 0), 0) || 0
                                const earnedPoints = round.score || 0

                                return (
                                    <div key={round.round_number} className="bg-white dark:bg-[#1C2938] rounded-[8px] border border-[#A3A3A3] overflow-hidden hover:shadow-lg transition-all duration-300">
                                        {/* Header */}
                                        <div className="p-4 border-b border-[#E5E7EB] dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-[8px] bg-[#1E7BFF] flex items-center justify-center shrink-0">
                                                    <RoundIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                        Round {round.round_number} - {getRoundName(round)}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        ({earnedPoints}/{totalPoints} points)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid Stats */}
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            {/* Over All Questions (Blue) */}
                                            <div className="bg-[#EEF5FF] dark:bg-[#1E7BFF]/10 border border-[#1E7BFF] rounded-[8px] p-3 flex items-center gap-3 h-[88px]">
                                                <div className="w-8 h-8 rounded-full border border-[#1E7BFF] flex items-center justify-center shrink-0">
                                                    <Target className="h-4 w-4 text-[#1E7BFF]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Over All Questions</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                                                </div>
                                            </div>

                                            {/* Correct (Green) */}
                                            <div className="bg-[#EEFDF3] dark:bg-[#0CAE00]/10 border border-[#0CAE00] rounded-[8px] p-3 flex items-center gap-3 h-[88px]">
                                                <div className="w-8 h-8 rounded-full border border-[#0CAE00] flex items-center justify-center shrink-0">
                                                    <CheckCircle className="h-4 w-4 text-[#0CAE00]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Correct</p>
                                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{correctCount}</p>
                                                </div>
                                            </div>

                                            {/* Incorrect (Red) */}
                                            <div className="bg-[#FF4D4D] border border-[#D32F2F] rounded-[8px] p-3 flex items-center gap-3 h-[88px]">
                                                <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center shrink-0">
                                                    <span className="text-white font-bold text-lg leading-none">×</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-white/90">Incorrect</p>
                                                    <p className="text-xl font-bold text-white">
                                                        {incorrectCount < 10 ? `0${incorrectCount}` : incorrectCount}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Score (Purple) */}
                                            <div className="bg-[#F9F6FF] dark:bg-[#8650FF]/10 border border-[#8650FF] rounded-[8px] p-3 flex flex-col items-center justify-center h-[88px]">
                                                <p className="text-xs font-semibold text-[#5D009B] dark:text-[#8650FF] mb-1">Score</p>
                                                <p className="text-3xl font-bold text-[#8650FF]">{scorePercentage}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        {/* Round-by-Round AI Insights */}
                        {report?.rounds && report.rounds.length > 0 ?
                            report.rounds.map((round: any) => {
                                const roundConfig = roundTypeInfo[round.round_type]
                                const RoundIcon = roundConfig?.icon || Brain
                                const hasAiFeedback = round.ai_feedback &&
                                    (typeof round.ai_feedback === 'object' ?
                                        (round.ai_feedback.strengths || round.ai_feedback.improvements || round.ai_feedback.criteria_scores || round.ai_feedback.summary) :
                                        round.ai_feedback)

                                if (!hasAiFeedback) return null

                                const isHighScore = round.percentage >= 60
                                
                                return (
                                    <div key={round.round_number} className="bg-white dark:bg-[#1C2938] rounded-[8px] border border-[#A3A3A3] overflow-hidden">
                                        {/* Header */}
                                        <div className="bg-[#F0F7FF] dark:bg-[#1E7BFF]/10 p-4 border-b border-[#E5E7EB] dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-[8px] bg-[#1E7BFF] flex items-center justify-center shrink-0">
                                                    <RoundIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {getRoundName(round)}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        AI-Generated Feedback & Analysis
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-full text-sm font-bold self-start sm:self-center ${
                                                isHighScore 
                                                    ? 'bg-red-500 text-white' 
                                                    : 'bg-red-500 text-white' // Figma shows red for 14.41%, maybe generic or logic based
                                            }`}>
                                                {formatPercentage(round.percentage, 2)}%
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Row 1: Strong Areas & AI Summary */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {/* Strong Areas List */}
                                                {round.ai_feedback?.strengths && round.ai_feedback.strengths.length > 0 && (
                                                    <div className="bg-[#EEFDF3] dark:bg-[#0CAE00]/10 border border-[#0CAE00] rounded-[8px] p-4">
                                                        <h4 className="flex items-center gap-2 text-[#0CAE00] font-bold mb-3">
                                                            <CheckCircle className="h-5 w-5" />
                                                            Strong Areas
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {round.ai_feedback.strengths.map((strength: string, idx: number) => (
                                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                                                    <span>{strength}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* AI Summary */}
                                                {round.ai_feedback?.summary && (
                                                    <div className="bg-[#EEF5FF] dark:bg-[#1E7BFF]/10 border border-[#1E7BFF] rounded-[8px] p-4">
                                                        <h4 className="flex items-center gap-2 text-[#1E7BFF] font-bold mb-3">
                                                            <Info className="h-5 w-5" />
                                                            AI Summary
                                                        </h4>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                                            {round.ai_feedback.summary}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 2: Weak Topics Full Width */}
                                            {round.ai_feedback?.improvements && round.ai_feedback.improvements.length > 0 && (
                                                <div className="bg-[#FFFBE9] dark:bg-[#FFA500]/10 border border-[#FFA500] rounded-[8px] p-4">
                                                    <h4 className="flex items-center gap-2 text-[#D97706] font-bold mb-3">
                                                        <Lightbulb className="h-5 w-5" />
                                                        Weak Topics & Improvement Areas
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {round.ai_feedback.improvements.map((improvement: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-[#92400E] dark:text-[#FCD34D]">
                                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
                                                                <span>{improvement}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Row 3: Tags Grid */}
                                            {(round.ai_feedback?.strong_topics?.length > 0 || round.ai_feedback?.weak_topics?.length > 0) && (
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {/* Strong Area Tags */}
                                                    {round.ai_feedback.strong_topics?.length > 0 && (
                                                        <div className="bg-[#EEFDF3] dark:bg-[#0CAE00]/10 border border-[#0CAE00] rounded-[8px] p-4">
                                                            <h4 className="flex items-center gap-2 text-[#0CAE00] font-bold mb-3">
                                                                <CheckCircle className="h-5 w-5" />
                                                                Strong Areas
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {round.ai_feedback.strong_topics.map((topic: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#CCFBF1] text-[#0CAE00] text-sm font-medium rounded-full">
                                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                                        {topic}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Weak Topics Tags */}
                                                    {round.ai_feedback.weak_topics?.length > 0 && (
                                                        <div className="bg-[#FFF1F2] dark:bg-red-900/10 border border-red-200 rounded-[8px] p-4">
                                                            <h4 className="flex items-center gap-2 text-[#BE123C] font-bold mb-3">
                                                                <AlertCircle className="h-5 w-5" />
                                                                Weak Topics (Need Practice)
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {round.ai_feedback.weak_topics.map((topic: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] text-sm font-medium rounded-full">
                                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                                        {topic}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                            : 
                            <div className="text-center py-12 text-gray-500">
                                No AI insights available yet. Complete an assessment to see detailed analysis.
                            </div>
                        }
                    </TabsContent>

                    {/* Playlist Tab */}
                    <TabsContent value="playlist" className="space-y-6">
                        <PlaylistTab assessmentId={assessmentId || ''} />
                    </TabsContent>
                </Tabs>

                {/* Next Steps */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
                    <CardHeader>
                        <CardTitle>What's Next?</CardTitle>
                        <CardDescription>Continue your preparation journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Playlist assessmentId={assessmentId ?? ''} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
