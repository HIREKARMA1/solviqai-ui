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
            label: `${getRoundName(round)}: ${formatPercentage(round.percentage, 2)}%`,
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
            <div className="space-y-6 pt-28 sm:pt-36 lg:pt-0 pb-8">
                {/* Header - Matching Assessment Journey Style with Hover Animations */}
                <motion.div 
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 group"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
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
                                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </motion.div>
                                    <motion.h1 
                                        className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text truncate"
                                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        style={{ backgroundSize: '200% 200%' }}
                                    >
                                        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Performance Analysis</span>{' '}
                                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Dashboard</span>
                                    </motion.h1>
                                </div>
                                <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                                    Track your progress, analyze performance, and unlock your potential with AI-powered insights
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Assessment Stats - Matching Assessment Overview Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                    {/* Overall Score */}
                    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <Card className="relative overflow-hidden card-hover min-h-[120px]">
                            <CardContent className="p-4 sm:p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium">Overall Score</p>
                                            <p className="text-2xl sm:text-3xl font-bold">{Math.round(report?.overall_score || 0)}</p>
                            </div>
                                    </div>
                            </div>
                        </CardContent>
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-900/10" />
                    </Card>
                    </motion.div>

                    {/* Readiness Index */}
                    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <Card className="relative overflow-hidden card-hover min-h-[120px]">
                            <CardContent className="p-4 sm:p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium">Readiness Index</p>
                                            <p className="text-2xl sm:text-3xl font-bold">{Math.round(report?.readiness_index || 0)}%</p>
                            </div>
                                    </div>
                                </div>
                        </CardContent>
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-green-200/50 to-green-100/20 dark:from-green-900/30 dark:to-green-800/10" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-green-50 to-green-100/70 dark:from-green-900/20 dark:to-green-900/10" />
                    </Card>
                    </motion.div>

                    {/* Completed Rounds */}
                    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <Card className="relative overflow-hidden card-hover min-h-[120px]">
                            <CardContent className="p-4 sm:p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium">Completed Rounds</p>
                                            <p className="text-2xl sm:text-3xl font-bold">
                                                {report?.rounds?.filter((r: any) => r.status === 'COMPLETED' || r.percentage != null).length || 0}
                                            </p>
                            </div>
                                    </div>
                            </div>
                        </CardContent>
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-900/10" />
                    </Card>
                    </motion.div>

                    {/* Total Duration */}
                    <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <Card className="relative overflow-hidden card-hover min-h-[120px]">
                            <CardContent className="p-4 sm:p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium">Total Duration</p>
                                            <p className="text-2xl sm:text-3xl font-bold">
                                                {report?.rounds?.reduce((total: number, round: any) => {
                                                    // Estimate 30 min per completed round
                                                    const isCompleted = round.status === 'COMPLETED' || round.percentage != null
                                                    return total + (isCompleted ? 30 : 0)
                                                }, 0) || 0} min
                                            </p>
                                        </div>
                                    </div>
                                </div>
                        </CardContent>
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-orange-200/50 to-orange-100/20 dark:from-orange-900/30 dark:to-orange-800/10" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-orange-50 to-orange-100/70 dark:from-orange-900/20 dark:to-orange-900/10" />
                    </Card>
                    </motion.div>
                </div>

                {/* Enhanced Tabs with Better Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-gray-100 dark:bg-gray-800 p-1 sm:p-1.5 rounded-xl w-full sm:w-auto gap-1 sm:gap-1.5">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Analytics</span>
                            </TabsTrigger>
                            <TabsTrigger value="detailed" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Rounds</span>
                            </TabsTrigger>
                            <TabsTrigger value="questions" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Questions</span>
                            </TabsTrigger>
                            <TabsTrigger value="playlist" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Playlist</span>
                            </TabsTrigger>
                            <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md flex items-center justify-center gap-1 sm:gap-2 h-full min-h-[2.5rem] px-2 sm:px-4 py-2 transition-all font-semibold text-xs sm:text-sm">
                                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">AI Insights</span>
                            </TabsTrigger>
                        </TabsList>
                        
                        {/* Filter Toggle Button */}
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="sm:inline">Filters</span>
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
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
                            {/* Radar Chart - Skills Assessment */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-900/20 dark:via-gray-900 dark:to-purple-900/10 shadow-lg hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-purple-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 rounded-t-lg border-b border-purple-200/50 dark:border-purple-700/30 p-4 sm:p-6">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md flex-shrink-0">
                                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            </div>
                                        <span className="truncate">Skills Assessment</span>
                                    </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                                        Multi-dimensional performance analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6">
                                    <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                                        <RadarChart data={prepareRadarData()}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                                            <Radar 
                                                name="Your Score" 
                                                dataKey="score" 
                                                stroke="#8b5cf6" 
                                                fill="#8b5cf6" 
                                                fillOpacity={0.6}
                                                strokeWidth={3}
                                                dot={{ fill: '#8b5cf6', r: 5 }}
                                            />
                                            <Radar 
                                                name="Target" 
                                                dataKey="fullMark" 
                                                stroke="#d1d5db" 
                                                fill="#d1d5db" 
                                                fillOpacity={0.1}
                                                strokeDasharray="5 5"
                                                strokeWidth={2}
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
                                                wrapperStyle={{ paddingTop: '20px' }}
                                                iconType="line"
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            </motion.div>

                            {/* Enhanced Pie Chart - Answer Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-green-900/20 dark:via-gray-900 dark:to-green-900/10 shadow-lg hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/30 to-green-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20 rounded-t-lg border-b border-green-200/50 dark:border-green-700/30 p-4 sm:p-6">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md flex-shrink-0">
                                                <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            </div>
                                        <span className="truncate">Answer Distribution</span>
                                    </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                                        Correct vs. incorrect responses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6">
                                    <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
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
                                                        fill={entry.name === 'Correct' ? '#10b981' : '#f97316'} 
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
                                                wrapperStyle={{ paddingTop: '20px' }}
                                                iconType="circle"
                                                formatter={(value) => {
                                                    if (value === 'Correct') return <span style={{ color: '#10b981', fontWeight: 'bold' }}>Correct</span>
                                                    return <span style={{ color: '#f97316', fontWeight: 'bold' }}>Incorrect</span>
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
                            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-900/20 dark:via-gray-900 dark:to-purple-900/10 shadow-lg hover:scale-[1.02] group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-purple-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                <CardHeader className="relative z-10 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-900/20 rounded-t-lg border-b border-purple-200/50 dark:border-purple-700/30 p-4 sm:p-6">
                                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md flex-shrink-0">
                                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    <span className="truncate">Round-wise Performance Comparison</span>
                                </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                                    Detailed score breakdown by assessment round
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 p-4 sm:p-6">
                                <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
                                    <BarChart data={prepareRadarData()} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="subject" 
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis 
                                            domain={[0, 100]} 
                                            tick={{ fill: '#6b7280' }}
                                            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '20px' }}
                                            iconType="square"
                                        />
                                        <Bar 
                                            dataKey="score" 
                                            fill="#8b5cf6"
                                            radius={[8, 8, 0, 0]}
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {prepareRadarData().map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                            <LabelList 
                                                dataKey="score" 
                                                position="top" 
                                                formatter={(value: any) => `${value}%`}
                                                style={{ fill: '#6b7280', fontSize: '11px', fontWeight: 'bold' }}
                                            />
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
                            <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.02] group">
                                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md flex-shrink-0">
                                            <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                        </div>
                                    <span className="truncate">Performance Trend Analysis</span>
                                </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">Track your progress across rounds</CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 p-4 sm:p-6">
                                <ResponsiveContainer width="100%" height={300} className="sm:h-[450px]">
                                    <ComposedChart data={prepareTimeSeriesData()} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                                        <defs>
                                            <linearGradient id="colorScoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                                                <stop offset="30%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                                <stop offset="70%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.03}/>
                                            </linearGradient>
                                            <linearGradient id="colorCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5}/>
                                                <stop offset="30%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="70%" stopColor="#10b981" stopOpacity={0.12}/>
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="round" 
                                            tick={{ fill: '#6b7280', fontSize: 11 }}
                                            label={{ value: 'Assessment Rounds', position: 'insideBottom', offset: -5, fill: '#6b7280', style: { fontWeight: 'bold' } }}
                                        />
                                        <YAxis 
                                            domain={[0, 100]} 
                                            tick={{ fill: '#6b7280', fontSize: 11 }}
                                            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { fontWeight: 'bold' } }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                            formatter={(value: any, name: string) => [`${value}%`, name]}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '15px' }}
                                            iconType="line"
                                        />
                                        {/* Area under Your Score line */}
                                        <Area 
                                            type="monotone" 
                                            dataKey="score" 
                                            fill="url(#colorScoreGradient)" 
                                            stroke="none"
                                        />
                                        {/* Area under Cumulative line */}
                                        <Area 
                                            type="monotone" 
                                            dataKey="cumulative" 
                                            fill="url(#colorCumulativeGradient)" 
                                            stroke="none"
                                        />
                                        {/* Main Score Line */}
                                        <Line 
                                            type="monotone" 
                                            dataKey="score" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={3}
                                            dot={{ fill: '#8b5cf6', r: 7, strokeWidth: 3, stroke: '#fff' }}
                                            activeDot={{ r: 10, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
                                            name="Your Score"
                                        />
                                        {/* Cumulative Average Line */}
                                        <Line 
                                            type="monotone" 
                                            dataKey="cumulative" 
                                            stroke="#10b981" 
                                            strokeWidth={2.5}
                                            strokeDasharray="5 5"
                                            dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8 }}
                                            name="Cumulative Average"
                                        />
                                        {/* Target Line */}
                                        <Line 
                                            type="monotone" 
                                            dataKey="target" 
                                            stroke="#ef4444" 
                                            strokeWidth={2}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            name="Target (75%)"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
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
                                <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200/30 to-orange-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md flex-shrink-0">
                                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            </div>
                                        <span className="truncate">Performance Funnel</span>
                                    </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">Rounds ranked by score</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6">
                                    <ResponsiveContainer width="100%" height={350} className="sm:h-[480px]">
                                        <FunnelChart>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                                formatter={(value: any, name: string) => [`${value}%`, name]}
                                            />
                                            <Funnel
                                                dataKey="value"
                                                data={preparePerformanceFunnel()}
                                                isAnimationActive
                                                animationDuration={1200}
                                            >
                                                {preparePerformanceFunnel().map((entry: any, index: number) => (
                                                    <Cell 
                                                        key={`funnel-cell-${index}`} 
                                                        fill={entry.fill}
                                                        stroke="#fff"
                                                        strokeWidth={3}
                                                        style={{
                                                            filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.15))',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    />
                                                ))}
                                                <LabelList 
                                                    position="left" 
                                                    fill="#1f2937" 
                                                    stroke="none" 
                                                    dataKey="value"
                                                    formatter={(value: any) => `${value}%`}
                                                    style={{ fontSize: '13px', fontWeight: '700' }}
                                                />
                                                <LabelList 
                                                    position="right" 
                                                    fill="#1f2937" 
                                                    stroke="none" 
                                                    dataKey="name"
                                                    style={{ fontSize: '12px', fontWeight: '600' }}
                                                />
                                            </Funnel>
                                        </FunnelChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            </motion.div>

                            {/* Area Chart - Score Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-teal-200/30 to-teal-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-bold">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md flex-shrink-0">
                                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            </div>
                                        <span className="truncate">Score Distribution</span>
                                    </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">Cumulative performance view</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
                                        <AreaChart data={prepareTimeSeriesData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="round" tick={{ fill: '#6b7280' }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                                            <Tooltip />
                                            <Area 
                                                type="monotone" 
                                                dataKey="score" 
                                                stroke="#14b8a6" 
                                                fill="url(#colorArea)" 
                                                strokeWidth={2}
                                            />
                                            <defs>
                                                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                        </AreaChart>
                                    </ResponsiveContainer>
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
                                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-200/30 to-blue-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 pb-2 sm:pb-3 p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">
                                        Highest Score
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {formatPercentage(Math.max(...(report?.rounds?.map((r: any) => r.percentage) || [0])), 2)}%
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                                        {(() => {
                                            const best = report?.rounds?.reduce((max: any, r: any) => r.percentage > max.percentage ? r : max, { percentage: -1 })
                                            return best ? getRoundName(best) : undefined
                                        })()}
                                    </p>
                                </CardContent>
                            </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/30 to-green-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 pb-2 sm:pb-3 p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
                                        Average Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-3xl font-bold text-green-600">
                                        {formatPercentage(report?.overall_score, 2)}%
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Across {report?.rounds?.length || 0} rounds
                                    </p>
                                </CardContent>
                            </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-purple-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    <CardHeader className="relative z-10 pb-2 sm:pb-3 p-4 sm:p-6">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400">
                                        Consistency Score
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
                                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                                        {(() => {
                                            const scores = report?.rounds?.map((r: any) => r.percentage) || []
                                            const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
                                            const variance = scores.reduce((sum: number, score: number) => 
                                                sum + Math.pow(score - avg, 2), 0) / scores.length
                                            const stdDev = Math.sqrt(variance)
                                            const consistency = Math.max(0, 100 - stdDev * 2)
                                            return formatPercentage(consistency, 2)
                                        })()}%
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        Performance stability
                                    </p>
                                </CardContent>
                            </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* Detailed Analysis Tab - Keep your existing detailed tab */}
                    <TabsContent value="detailed" className="space-y-4 sm:space-y-6">
                        {/* Round Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {report?.rounds?.map((round: any, index: number) => {
                                const roundConfig = roundTypeInfo[round.round_type]
                                const RoundIcon = roundConfig?.icon
                                const gradientColors = roundConfig?.gradient || 'from-gray-400 to-gray-600'
                                return (
                                    <motion.div
                                        key={round.round_number} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <Card 
                                            className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-0 shadow-lg group h-full flex flex-col" 
                                        onClick={() => { 
                                            setSelectedRound(round.round_number)
                                            setActiveTab('round')
                                        }}
                                    >
                                            {/* Multi-color decorative shapes */}
                                            <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${gradientColors} opacity-20 group-hover:opacity-30 blur-3xl transition-all duration-500`} />
                                            <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradientColors} opacity-15 group-hover:opacity-20 blur-2xl transition-all duration-500`} />
                                            <div className={`absolute top-1/2 -right-16 w-16 h-16 rounded-full bg-gradient-to-br ${gradientColors} opacity-10 group-hover:opacity-15 blur-xl transition-all duration-500`} />
                                            
                                            <CardHeader className="relative z-10 pb-3 sm:pb-4 p-4 sm:p-6">
                                                <div className="flex items-start gap-2 sm:gap-3">
                                                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${roundConfig?.gradient} text-white shadow-lg flex-shrink-0`}>
                                                    {RoundIcon && <RoundIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                                                </div>
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-sm sm:text-base truncate">{getRoundName(round)}</CardTitle>
                                                        <CardDescription className="text-xs sm:text-sm">Round {round.round_number}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                            <CardContent className="relative z-10 space-y-2 sm:space-y-3 flex-1 flex flex-col p-4 sm:p-6 pt-0">
                                            <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</span>
                                                <span className={`text-2xl font-bold ${getScoreColor(round.percentage || 0)}`}>
                                                    {formatPercentage(round.percentage, 2)}%
                                                </span>
                                            </div>
                                            <Progress value={parseFloat(formatPercentage(round.percentage, 2))} className="h-2" />
                                                <div className="flex-1 min-h-[3rem] flex items-start">
                                            {round.ai_feedback && (
                                                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded w-full">
                                                    {typeof round.ai_feedback === 'string' ? (
                                                        <p className="line-clamp-2 break-words">{round.ai_feedback}</p>
                                                    ) : round.ai_feedback.strengths && round.ai_feedback.strengths.length > 0 ? (
                                                        <p className="line-clamp-2 flex items-center gap-1 break-words">
                                                                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 flex-shrink-0" />
                                                            <span className="break-words">{round.ai_feedback.strengths[0]}</span>
                                                        </p>
                                                    ) : (
                                                        <p className="line-clamp-2">Evaluation completed</p>
                                                    )}
                                                </div>
                                            )}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full mt-auto text-xs sm:text-sm">
                                                View Details →
                                            </Button>
                                        </CardContent>
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
                                                            <CheckCircle className="h-5 w-5 text-green-600"/> Strengths
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
                                                            <Lightbulb className="h-5 w-5 text-orange-600"/> Areas to Improve
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
                                                        <MessageCircle className="h-5 w-5"/> Conversation Transcript
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

                    {/* Questions Tab - Keep your existing questions tab with filters applied */}
                    <TabsContent value="questions" className="space-y-4 sm:space-y-6">
                        {qaData?.rounds?.map((round: any) => (
                            <Card key={round.round_number} className="border-2 hover:shadow-xl transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-4 sm:p-6">
                                    <CardTitle className="text-base sm:text-lg">
                                        Round {round.round_number} - {round.round_type.replace('_', ' ').toUpperCase()}
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {round.round_type === 'group_discussion' ? (
                                            `Score: ${formatPercentage(round.percentage, 2)}%`
                                        ) : (
                                            `Score: ${formatPercentage(round.percentage, 2)}% (${round.score}/${round.questions?.reduce((sum: number, q: any) => sum + q.max_score, 0) || 0} points) • ${getFilteredQuestions(round.questions).length} questions`
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                                    {round.round_type === 'group_discussion' ? (
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl border-2 border-teal-200">
                                                <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 flex items-center gap-2">
                                                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    Group Discussion Performance
                                                </h4>
                                                {round.ai_feedback && typeof round.ai_feedback === 'object' && round.ai_feedback.criteria_scores && (
                                                    <div className="space-y-4">
                                                        <div className="grid md:grid-cols-3 gap-4">
                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">Communication</div>
                                                                <div className="text-2xl font-bold text-blue-600">
                                                                    {formatPercentage(round.ai_feedback.criteria_scores.communication, 2)}%
                                                                </div>
                                                                <Progress value={parseFloat(formatPercentage(round.ai_feedback.criteria_scores.communication, 2))} className="h-2 mt-2" />
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">Topic Understanding</div>
                                                                <div className="text-2xl font-bold text-purple-600">
                                                                    {formatPercentage(round.ai_feedback.criteria_scores.topic_understanding, 2)}%
                                                                </div>
                                                                <Progress value={parseFloat(formatPercentage(round.ai_feedback.criteria_scores.topic_understanding, 2))} className="h-2 mt-2" />
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">Interaction</div>
                                                                <div className="text-2xl font-bold text-green-600">
                                                                    {formatPercentage(round.ai_feedback.criteria_scores.interaction, 2)}%
                                                                </div>
                                                                <Progress value={parseFloat(formatPercentage(round.ai_feedback.criteria_scores.interaction, 2))} className="h-2 mt-2" />
                                                            </div>
                                                        </div>
                                                        
                                                        {round.ai_feedback.strengths && round.ai_feedback.strengths.length > 0 && (
                                                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                                                <div className="font-semibold text-green-700 dark:text-green-400 mb-2">✓ Strengths</div>
                                                                <ul className="space-y-1 text-sm">
                                                                    {round.ai_feedback.strengths.map((s: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2">
                                                                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                            <span>{s}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        
                                                        {round.ai_feedback.improvements && round.ai_feedback.improvements.length > 0 && (
                                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                                                <div className="font-semibold text-orange-700 dark:text-orange-400 mb-2">💡 Areas to Improve</div>
                                                                <ul className="space-y-1 text-sm">
                                                                    {round.ai_feedback.improvements.map((imp: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2">
                                                                            <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                                                            <span>{imp}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 sm:space-y-4">
                                            {getFilteredQuestions(round.questions).map((q: any, idx: number) => (
                                                <div key={q.id} className="p-3 sm:p-4 border-2 rounded-xl space-y-2 sm:space-y-3 hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                                                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                                                                <Badge variant="outline" className="bg-blue-50 text-xs">Q{idx + 1}</Badge>
                                                                <Badge variant={q.is_correct ? 'default' : 'destructive'} className="text-xs">
                                                                    {q.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                                                </Badge>
                                                                <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                                                    {q.score}/{q.max_score} pts
                                                                </span>
                                                                {q.difficulty && (
                                                                    <Badge 
                                                                        variant="outline"
                                                                        className={`text-xs ${
                                                                            q.difficulty === 'easy' ? 'bg-green-50 text-green-700' :
                                                                            q.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                                                                            'bg-yellow-50 text-yellow-700'
                                                                        }`}
                                                                    >
                                                                        {q.difficulty}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="font-medium mb-2 text-sm sm:text-base break-words">{q.text}</p>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                                                <div>
                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">Your Answer:</span>
                                                                    <p className={`break-words ${q.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {q.student_response || (q.response_audio_url ? '🎤 Voice Response' : '—')}
                                                                    </p>
                                                                </div>
                                                                {q.correct_answer && (
                                                                    <div>
                                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Correct Answer:</span>
                                                                        <p className="text-green-600 break-words">{q.correct_answer}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {q.ai_feedback && (
                                                                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                                                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 break-words">
                                                                        <strong>💡 Feedback:</strong> {typeof q.ai_feedback === 'string' ? q.ai_feedback : JSON.stringify(q.ai_feedback)}
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
                    </TabsContent>

                    {/* AI Insights Tab - Keep your existing insights tab */}
                    <TabsContent value="insights" className="space-y-4 sm:space-y-6">
                        {/* Overall AI Summary */}
                        {report?.ai_feedback && (
                            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200">
                                <CardHeader className="p-4 sm:p-6">
                                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                                        <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
                                        <span className="truncate">AI-Powered Performance Analysis</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base">
                                        Comprehensive insights powered by advanced AI evaluation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                                    {report.ai_feedback.overall_performance && (
                                        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                            <h4 className="font-semibold text-base sm:text-lg mb-2 flex items-center gap-2">
                                                <Target className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                Overall Performance
                                            </h4>
                                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                                                {report.ai_feedback.overall_performance}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {report.ai_feedback.readiness_level && (
                                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
                                            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Readiness Level</div>
                                                <div className="text-lg sm:text-xl font-bold text-blue-600 truncate">
                                                    {report.ai_feedback.readiness_level}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Round-by-Round AI Insights - Keep your existing implementation */}
                        {report?.rounds && report.rounds.length > 0 ?
                            report.rounds.map((round: any) => {
                                const roundConfig = roundTypeInfo[round.round_type]
                                const RoundIcon = roundConfig?.icon
                                const hasAiFeedback = round.ai_feedback && 
                                    (typeof round.ai_feedback === 'object' ? 
                                        (round.ai_feedback.strengths || round.ai_feedback.improvements || round.ai_feedback.criteria_scores || round.ai_feedback.summary) :
                                        round.ai_feedback)
                                
                                if (!hasAiFeedback) return null
                                
                                return (
                                    <Card key={round.round_number} className="overflow-hidden border-2">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${roundConfig?.gradient} text-white shadow-lg flex-shrink-0`}>
                                                    {RoundIcon && <RoundIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg sm:text-xl truncate">
                                                        {getRoundName(round)}
                                                    </CardTitle>
                                                    <CardDescription className="text-sm sm:text-base">
                                                        AI-Generated Feedback & Analysis
                                                    </CardDescription>
                                                </div>
                                                <Badge 
                                                    variant={round.percentage >= 80 ? 'default' : round.percentage >= 60 ? 'secondary' : 'destructive'}
                                                    className="text-sm sm:text-lg px-2 sm:px-3 py-1 flex-shrink-0"
                                                >
                                                    {formatPercentage(round.percentage, 2)}%
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4 p-4 sm:p-6">
                                            {/* Criteria Scores for GD */}
                                            {round.ai_feedback?.criteria_scores && (
                                                <div className="mb-3 sm:mb-4">
                                                    <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                                                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                        Performance Metrics
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                                        {Object.entries(round.ai_feedback.criteria_scores).map(([key, value]: [string, any]) => (
                                                            <div key={key} className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 capitalize mb-1 truncate">
                                                                    {key.replace(/_/g, ' ')}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`text-xl sm:text-2xl font-bold ${
                                                                        value >= 80 ? 'text-green-600' :
                                                                        value >= 60 ? 'text-yellow-600' :
                                                                        'text-red-600'
                                                                    }`}>
                                                                        {formatPercentage(value, 2)}%
                                                                    </div>
                                                                </div>
                                                                <Progress value={parseFloat(formatPercentage(value, 2))} className="h-2 mt-2" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strengths */}
                                            {round.ai_feedback?.strengths && round.ai_feedback.strengths.length > 0 && (
                                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
                                                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                                        <CheckCircle className="h-5 w-5" />
                                                        Strong Areas
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {round.ai_feedback.strengths.map((strength: string, idx: number) => (
                                                            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-green-900/30 rounded">
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm text-gray-800 dark:text-gray-200">{strength}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Improvements */}
                                            {round.ai_feedback?.improvements && round.ai_feedback.improvements.length > 0 && (
                                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200">
                                                    <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                                                        <Lightbulb className="h-5 w-5" />
                                                        Weak Topics & Improvement Areas
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {round.ai_feedback.improvements.map((improvement: string, idx: number) => (
                                                            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-orange-900/30 rounded">
                                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm text-gray-800 dark:text-gray-200">{improvement}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strong/Weak Topics Grid */}
                                            {(round.ai_feedback?.strong_topics?.length > 0 || round.ai_feedback?.weak_topics?.length > 0) && (
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {round.ai_feedback.strong_topics?.length > 0 && (
                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-300">
                                                            <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                                                <Target className="h-4 w-4" />
                                                                Strong Topics
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {round.ai_feedback.strong_topics.map((topic: string, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-700 dark:text-emerald-300">
                                                                        ✓ {topic}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {round.ai_feedback.weak_topics?.length > 0 && (
                                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300">
                                                            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                                                                <AlertCircle className="h-4 w-4" />
                                                                Weak Topics (Need Practice)
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {round.ai_feedback.weak_topics.map((topic: string, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="bg-red-100 dark:bg-red-900/40 border-red-400 text-red-700 dark:text-red-300">
                                                                        ⚠ {topic}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Summary */}
                                            {round.ai_feedback?.summary && (
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300">
                                                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                        <Brain className="h-5 w-5" />
                                                        AI Summary
                                                    </h4>
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                        {round.ai_feedback.summary}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Text-based feedback fallback */}
                                            {typeof round.ai_feedback === 'string' && (
                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                        {round.ai_feedback}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })
                            : null
                        }

                        {/* Overall Strengths & Weaknesses */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {report?.detailed_analysis?.strengths?.length > 0 && (
                                <Card className="border-l-4 border-l-green-500">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-green-600">
                                            <Award className="h-5 w-5" />
                                            Overall Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {report.detailed_analysis.strengths.map((strength: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {report?.detailed_analysis?.weaknesses?.length > 0 && (
                                <Card className="border-l-4 border-l-orange-500">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-orange-600">
                                            <AlertCircle className="h-5 w-5" />
                                            Areas to Improve
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {report.detailed_analysis.weaknesses.map((weakness: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                                    <span>{weakness}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Recommendations */}
                        {report?.detailed_analysis?.recommendations?.length > 0 && (
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5" />
                                        Personalized Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {report.detailed_analysis.recommendations.map((rec: string, index: number) => (
                                            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg">
                                                <p className="flex items-start gap-2">
                                                    <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                    <span>{rec}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Career Advice */}
                        {report?.ai_feedback?.career_advice && (
                            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-indigo-600">
                                        <Briefcase className="h-5 w-5" />
                                        Career Guidance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {report.ai_feedback.career_advice}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
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
