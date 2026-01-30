"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { Progress } from '@/components/ui/progress'
import { apiClient } from '@/lib/api'
import { 
    ClipboardList, Award, Calendar, Sparkles, Trophy,
    Brain, Target, ArrowRight, Clock, CheckCircle, Filter
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AssessmentHistoryPage() {
    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState<any>({ total: 0, assessments: [] })
    const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all')
    const router = useRouter()

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const data = await apiClient.getStudentAssessments(0, 50)
            setHistory(data)
        } catch (error) {
            console.error('Error loading assessment history:', error)
            toast.error('Failed to load assessment history')
        } finally {
            setLoading(false)
        }
    }

    const getBadgeVariant = (value: number) => {
        if (value >= 80) return 'default'
        if (value >= 60) return 'secondary'
        return 'destructive'
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    const getPerformanceLabel = (score: number) => {
        if (score >= 80) return { label: 'Excellent', icon: Trophy, color: 'bg-green-500', badgeVariant: 'success' as const }
        if (score >= 60) return { label: 'Good', icon: Target, color: 'bg-amber-500', badgeVariant: 'warning' as const }
        return { label: 'Need Improvement', icon: Brain, color: 'bg-red-500', badgeVariant: 'destructive' as const }
    }

    // Calculate statistics (normalize status)
    const stats = {
        total: history.total,
        completed: history.assessments.filter((a: any) => (a.status || '').toLowerCase() === 'completed').length,
        inProgress: history.assessments.filter((a: any) => (a.status || '').toLowerCase() === 'in_progress').length,
        avgScore: history.assessments.length > 0 
            ? (history.assessments.reduce((sum: number, a: any) => sum + (a.overall_score || 0), 0) / history.assessments.length).toFixed(1)
            : 0,
        bestScore: history.assessments.length > 0
            ? Math.max(...history.assessments.map((a: any) => a.overall_score || 0)).toFixed(1)
            : 0
    }

    // Calculate Assessment Overview style stats (aggregate across all assessments)
    const assessmentStats = {
        overallScore: history.assessments.length > 0
            ? Math.round(history.assessments.reduce((sum: number, a: any) => sum + (a.overall_score || 0), 0) / history.assessments.length)
            : 0,
        readinessIndex: history.assessments.length > 0
            ? Math.round(history.assessments.reduce((sum: number, a: any) => sum + (a.readiness_index || 0), 0) / history.assessments.length)
            : 0,
        completedRounds: history.assessments.reduce((total: number, a: any) => {
            return total + (a.rounds?.filter((r: any) => r.status === 'COMPLETED' || r.percentage != null).length || 0)
        }, 0),
        totalDuration: history.assessments.reduce((total: number, a: any) => {
            // Estimate duration: assume 30 min per completed round
            const completedRounds = a.rounds?.filter((r: any) => r.status === 'COMPLETED' || r.percentage != null).length || 0
            return total + (completedRounds * 30)
        }, 0)
    }

    // Filter assessments
    const filteredAssessments = history.assessments.filter((a: any) => {
        if (filter === 'all') return true
        const status = String(a.status || '').toLowerCase()
        const filterLower = filter.toLowerCase()
        return status === filterLower || status.replace('_', '') === filterLower.replace('_', '')
    })

    return (
        <DashboardLayout requiredUserType="student">
            <div className="space-y-5">
                {/* Assessment Journey banner - light blue, gradient title per design */}
                <div 
                    className="relative overflow-hidden rounded-2xl px-6 py-5 text-gray-900 dark:text-gray-100 border border-[#E5E7EB] dark:border-[#2D3E50] shadow-[inset_0_1px_1.5px_0_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] bg-[#F6FBFF] dark:bg-[#1C2938]"
                >
                    <style>{`
                        .assessment-journey-title {
                            font-weight: 700;
                            font-size: 2.5rem;
                            line-height: 2.5rem;
                            background: linear-gradient(90deg, #0068FC 0%, #8D5AFF 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        }
                        .dark .assessment-journey-title { background: linear-gradient(90deg, #60a5fa 0%, #c4b5fd 100%); -webkit-text-fill-color: transparent; background-clip: text; }
                    `}</style>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-[#0068FC] dark:text-blue-300 shrink-0" />
                            <h1 className="assessment-journey-title">Assessment Journey</h1>
                        </div>
                        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl">
                            Track your progress, analyze performance, and unlock your potential with AI-powered insights.
                        </p>
                    </div>
                </div>

                {/* Stats section – Sigma design: 299×102px, 16px radius, 10px padding, #FFFFFF, horizontal flow, 8px gap, icon colors #0068FC, #00C951, #7F56D9, #FF6800 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Overall Score', value: `${assessmentStats.overallScore}%`, Icon: Target, iconClass: 'text-[#0068FC] dark:text-blue-300' },
                        { label: 'Readiness Index', value: `${assessmentStats.readinessIndex}%`, Icon: Award, iconClass: 'text-[#00C951] dark:text-green-400' },
                        { label: 'Completed Rounds', value: `${assessmentStats.completedRounds}`, Icon: CheckCircle, iconClass: 'text-[#7F56D9] dark:text-purple-300' },
                        { label: 'Total Duration', value: `${assessmentStats.totalDuration} min`, Icon: Clock, iconClass: 'text-[#FF6800] dark:text-orange-300' },
                    ].map(({ label, value, Icon, iconClass }) => (
                        <motion.div
                            key={label}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="min-h-[102px] w-full min-w-0 rounded-[16px] bg-[#FFFFFF] dark:bg-[#1C2938] p-[10px] flex flex-row items-center gap-2 border border-gray-200/80 dark:border-[#2D3E50] shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_6px_0_rgba(0,0,0,0.4)]"
                        >
                            <div className={`w-[39px] h-[39px] shrink-0 flex items-center justify-center ${iconClass}`} aria-hidden>
                                <Icon className="w-[39px] h-[39px]" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex flex-col gap-2.5">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filter section – Sigma design: horizontal, 71px height, 8px radius, 1px #797979 border, 24px gap; buttons 44px height, 8px radius, 10px padding; selected gradient #1E7BFF → #7F56D9 */}
                <div className="flex flex-wrap items-center gap-4 min-h-[71px] rounded-lg border border-[#797979] dark:border-[#2D3E50] px-4 py-3 bg-white dark:bg-[#1C2938]">
                    <div className="flex items-center gap-2.5 h-11 shrink-0">
                        <Filter className="h-5 w-5 text-gray-600 dark:text-blue-300" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {(['all', 'completed', 'in_progress'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`
                                    h-11 min-w-[77px] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
                                    ${filter === f
                                        ? 'bg-gradient-to-r from-[#1E7BFF] to-[#7F56D9] text-white border-0 shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-[#9E9E9E] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                {f === 'all' && `All (${history.total})`}
                                {f === 'completed' && `Completed (${stats.completed})`}
                                {f === 'in_progress' && `In Progress (${stats.inProgress})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assessment Cards */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : filteredAssessments.length === 0 ? (
                    <Card className="border-2 border-dashed dark:border-[#2D3E50] dark:bg-[#1C2938]">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-[#243447] rounded-full flex items-center justify-center mb-4">
                                <ClipboardList className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {filter === 'all' ? 'No Assessments Yet' : `No ${filter.replace('_', ' ')} assessments`}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-300 mb-6">
                                {filter === 'all' 
                                    ? 'Start your first AI-powered assessment to unlock personalized insights'
                                    : 'Try changing the filter or start a new assessment'}
                            </p>
                            <Link href="/dashboard/student/assessment">
                                <Button size="lg">
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Start Your Journey
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredAssessments.map((assessment: any) => {
                            const performance = getPerformanceLabel(assessment.overall_score || 0)
                            const journeyPct = Math.round(((assessment.rounds?.filter((r: any) => r.percentage != null).length || 0) / Math.max((assessment.rounds?.length || 1), 1)) * 100)
                            const rounds = assessment.rounds || []
                            
                            return (
                                <div
                                    key={assessment.assessment_id}
                                    className="group rounded-lg border border-[#C2C2C2] dark:border-[#2D3E50] bg-white dark:bg-[#1C2938] p-[10px] flex flex-col gap-[10px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4)] w-full min-w-0"
                                >
                                    {/* Header: title, status tag, brain icon, date */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-[24px] leading-6 font-semibold text-[#000000] dark:text-white">
                                                    {assessment.job_role?.title || 'Assessment'}
                                                </h3>
                                                <span
                                                    className="inline-flex items-center justify-center h-[33px] min-w-[80px] max-w-[171px] rounded-[28px] px-4 bg-[#FF2B3A] text-white text-sm font-medium shrink-0"
                                                    aria-label={performance.label}
                                                >
                                                    {performance.label}
                                                </span>
                                            </div>
                                            <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                {assessment.completed_at || assessment.started_at
                                                    ? new Date(assessment.completed_at || assessment.started_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'Date unavailable'}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-[#243447] shrink-0">
                                            <Brain className="h-5 w-5 text-[#1E7BFF] dark:text-blue-400" />
                                        </div>
                                    </div>

                                    {/* Stats: three boxes per Figma – 187×102, 16px radius, 10px padding/gap, #E6F2FF / #E3FEEE / #FAF1FF, shadow */}
                                    <div className="flex flex-wrap gap-[11px]">
                                        <div className="w-full min-[400px]:max-w-[187px] min-h-[102px] rounded-[16px] bg-[#E6F2FF] dark:bg-[#243447] p-[10px] flex flex-col gap-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.3)]">
                                            <Target className="h-5 w-5 text-[#0068FC] dark:text-blue-300 shrink-0" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</p>
                                            <p className={`text-xl font-bold leading-none ${getScoreColor(assessment.overall_score || 0)}`}>
                                                {(assessment.overall_score ?? 0).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="w-full min-[400px]:max-w-[187px] min-h-[102px] rounded-[16px] bg-[#E3FEEE] dark:bg-[#243447] p-[10px] flex flex-col gap-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.25)] dark:shadow-[0_2px_4px_0_rgba(0,0,0,0.3)]">
                                            <Award className="h-5 w-5 text-[#00C951] dark:text-green-400 shrink-0" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Readiness</p>
                                            <p className={`text-xl font-bold leading-none ${getScoreColor(assessment.readiness_index || 0)}`}>
                                                {(assessment.readiness_index ?? 0).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="w-full min-[400px]:max-w-[187px] min-h-[102px] rounded-[16px] bg-[#FAF1FF] dark:bg-purple-900/20 p-[10px] flex flex-col gap-2.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.25)]">
                                            <CheckCircle className="h-5 w-5 text-[#7F56D9] dark:text-purple-300 shrink-0" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Rounds</p>
                                            <p className="text-xl font-bold leading-none text-purple-700 dark:text-purple-200">
                                                {rounds.filter((r: any) => r.percentage != null).length}/{rounds.length || 1}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Assessment Journey: label, bar (#0053AB fill, 10px height, 12px radius), round tags */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assessment Journey</span>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{journeyPct}%</span>
                                        </div>
                                        <div className="h-[10px] w-full rounded-[12px] bg-[#C1C1C1] dark:bg-[#243447] overflow-hidden">
                                            <div
                                                className="h-full rounded-[12px] bg-[#0053AB] dark:bg-blue-500 transition-all duration-300"
                                                style={{ width: `${journeyPct}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {rounds.length ? rounds.map((round: any) => {
                                                const pct = round.percentage ?? 0
                                                const isLow = pct < 40 && pct > 0
                                                const segmentBg = pct >= 80 ? 'bg-green-500 dark:bg-green-400' : pct >= 60 ? 'bg-blue-500 dark:bg-blue-400' : isLow ? 'bg-orange-500 dark:bg-orange-400' : pct > 0 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-gray-400 dark:bg-gray-500'
                                                return (
                                                    <span
                                                        key={round.round_number}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white ${segmentBg}`}
                                                    >
                                                        R{round.round_number}: {pct.toFixed(0)}%
                                                    </span>
                                                )
                                            }) : (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">No rounds yet</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions: View Report #1E7BFF 32px height 8px radius 4px 13px padding; Continue outline */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/dashboard/student/assessment/report?id=${assessment.assessment_id}`)}
                                            className="flex-1 min-w-0 h-8 rounded-lg bg-[#1E7BFF] hover:bg-[#1565e0] dark:bg-blue-400 dark:hover:bg-blue-300 text-white font-medium text-sm inline-flex items-center justify-center gap-2.5 py-1 px-[13px] transition-colors"
                                        >
                                            View Report
                                            <ArrowRight className="h-4 w-4 shrink-0" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/dashboard/student/assessment?id=${assessment.assessment_id}`)}
                                            className="h-8 rounded-lg border border-[#9E9E9E] dark:border-[#2D3E50] bg-white dark:bg-[#243447] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2D3E50] font-medium text-sm px-4 transition-colors"
                                        >
                                            {String(assessment.status).toLowerCase() === 'completed' ? 'Review' : 'Continue'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
