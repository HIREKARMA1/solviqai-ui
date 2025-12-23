"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Home, User, FileText, Briefcase, ClipboardList, Zap, Target, TrendingUp, Award, Users, BarChart3, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis,
    Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell,
    ComposedChart, Area, LabelList
} from 'recharts'

// Hover-enabled stat card component
function StatCard({ icon: Icon, label, value, color, bgColor, colorClass }: { icon: any, label: string, value: string | number, color: string, bgColor: string, colorClass: string }) {
    const [isHovered, setIsHovered] = useState(false)

    // Get the gradient colors based on colorClass
    const getGradientColors = () => {
        switch (colorClass) {
            case 'blue': return 'from-blue-200/50 to-blue-100/20 dark:from-blue-900/30 dark:to-blue-800/10'
            case 'purple': return 'from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10'
            case 'pink': return 'from-pink-200/50 to-pink-100/20 dark:from-pink-900/30 dark:to-pink-800/10'
            case 'yellow': return 'from-yellow-200/50 to-yellow-100/20 dark:from-yellow-900/30 dark:to-yellow-800/10'
            default: return 'from-gray-200/50 to-gray-100/20 dark:from-gray-900/30 dark:to-gray-800/10'
        }
    }

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative"
        >
            <Card className="relative overflow-hidden card-hover min-h-[120px] group border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-500">
                {/* Animated Background Gradient */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-primary-50/50 to-secondary-50/50 dark:from-transparent dark:via-primary-900/20 dark:to-secondary-900/20"
                    initial={false}
                    animate={isHovered ? { scale: 1 } : { scale: 0.8 }}
                />

                {/* Sparkle Effects */}
                {isHovered && (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                    x: [0, (Math.random() - 0.5) * 60],
                                    y: [0, (Math.random() - 0.5) * 60],
                                }}
                                transition={{
                                    duration: 1,
                                    delay: i * 0.1,
                                    ease: 'easeOut',
                                }}
                                className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary-400 rounded-full"
                            />
                        ))}
                    </>
                )}

                <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <motion.div
                                animate={isHovered ? { rotate: [0, -10, 10, -10, 0] } : { rotate: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex-shrink-0"
                            >
                                <motion.div
                                    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${bgColor} p-1.5 sm:p-2 rounded-lg shadow-md`}
                                >
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                                </motion.div>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium truncate">{label}</p>
                                <motion.p
                                    animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-2xl sm:text-3xl font-bold"
                                >
                                    {value}
                                </motion.p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Decorative shape with animation */}
                <motion.div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${getGradientColors()}`}
                    animate={isHovered ? { scale: 1.2, rotate: 360 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                />

                {/* Bottom accent line */}
                <motion.div
                    className={`absolute bottom-0 left-0 h-1 rounded-full ${bgColor}`}
                    initial={{ width: '0%' }}
                    animate={isHovered ? { width: '100%' } : { width: '0%' }}
                    transition={{ duration: 0.4 }}
                />

                {/* Corner decoration */}
                <motion.div
                    className={`absolute top-0 right-0 w-20 h-20 opacity-5 ${bgColor}`}
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                    animate={isHovered ? { scale: 1.5, opacity: 0.1 } : { scale: 1, opacity: 0.05 }}
                    transition={{ duration: 0.4 }}
                />
            </Card>
        </motion.div>
    )
}

export default function StudentDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [latestReport, setLatestReport] = useState<{ id: string | null, date: string | null }>({ id: null, date: null })
    const [recentReports, setRecentReports] = useState<Array<{ id: string, date: string, score?: number, readiness?: number }>>([])
    const [loading, setLoading] = useState(true)

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

                // Set latest completed report and last 3 reports
                if (completed.length > 0) {
                    const sorted = completed.sort((b: any, c: any) => new Date(c.completed_at || c.started_at).getTime() - new Date(b.completed_at || b.started_at).getTime())
                    const latest = sorted[0]
                    setLatestReport({ id: latest.assessment_id, date: latest.completed_at || latest.started_at })

                    // Get last 3 reports with scores
                    const last3Reports = sorted.slice(0, 3).map((assessment: any) => ({
                        id: assessment.assessment_id,
                        date: assessment.completed_at || assessment.started_at,
                        score: assessment.overall_score,
                        readiness: assessment.readiness_index
                    }))
                    setRecentReports(last3Reports)
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
                {/* Header - Matching Assessment Overview Style with Hover Animations */}
                <motion.div
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 group min-h-[140px] sm:min-h-[160px] md:min-h-[160px] lg:min-h-[140px]"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Decorative corners */}
                    <motion.div
                        className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 sm:w-56 sm:h-56 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20"
                        animate={{ rotate: [45, 50, 45] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="pointer-events-none absolute -bottom-14 -left-14 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-secondary-100/30 to-accent-100/20 dark:from-secondary-900/20 dark:to-accent-900/10"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-4">
                                    <motion.div
                                        className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 flex-shrink-0"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                                    </motion.div>
                                    <motion.h1
                                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold gradient-text truncate"
                                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        style={{ backgroundSize: '200% 200%' }}
                                    >
                                        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Welcome Back!</span>{' '}
                                        <motion.span
                                            className="inline-block"
                                            animate={{ rotate: [0, 20, -20, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        >
                                            👋
                                        </motion.span>
                                    </motion.h1>
                                </div>
                                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl">
                                    Track your progress and continue your placement journey
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        {/* Stats Cards - With Landing Page Hover Animations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <StatCard
                                icon={Target}
                                label="Assessments Completed"
                                value={stats?.assessments_completed || 0}
                                color="text-blue-600 dark:text-blue-400"
                                bgColor="bg-blue-200 dark:bg-blue-800"
                                colorClass="blue"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Average Score"
                                value={`${stats?.average_score || 0}%`}
                                color="text-purple-600 dark:text-purple-400"
                                bgColor="bg-purple-200 dark:bg-purple-800"
                                colorClass="purple"
                            />
                            <StatCard
                                icon={Award}
                                label="ATS Score"
                                value={`${stats?.ats_score || 0}%`}
                                color="text-pink-600 dark:text-pink-400"
                                bgColor="bg-pink-200 dark:bg-pink-800"
                                colorClass="pink"
                            />
                            <StatCard
                                icon={Users}
                                label="Job Matches"
                                value={stats?.job_recommendations || 0}
                                color="text-yellow-600 dark:text-yellow-400"
                                bgColor="bg-yellow-200 dark:bg-yellow-800"
                                colorClass="yellow"
                            />
                        </div>

                        {/* Two Column Layout: Quick Actions Left, Detailed Analysis Right */}
                        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Quick Actions - Left Side */}
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative overflow-hidden group"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Decorative shapes for Quick Actions */}
                                <div className="absolute -top-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-200/30 to-cyan-200/20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-purple-200/25 to-pink-200/15 blur-2xl group-hover:blur-3xl transition-all duration-500" />

                                <div className="mb-4 sm:mb-6 md:mb-8 relative z-10">
                                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 md:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex-shrink-0">
                                            <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                        </div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text">Quick Actions</h2>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">Get started with your placement preparation</p>
                                </div>

                                <div className="grid gap-3 sm:gap-4 md:gap-5 relative z-10">
                                    <Link href="/dashboard/student/resume" className="group/action">
                                        <motion.div
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border sm:border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-blue-200 dark:bg-blue-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-blue-400 group-hover/action:to-blue-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-blue-900 dark:text-blue-100 group-hover/action:text-blue-700 dark:group-hover/action:text-blue-200 transition-colors flex-1 min-w-0">
                                                {stats?.resume_uploaded ? 'Update Resume' : 'Upload Resume'}
                                            </span>
                                        </motion.div>
                                    </Link>

                                    {/* <Link href="/dashboard/student/jobs" className="group/action">
                                        <motion.div 
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border sm:border-2 border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div 
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-green-200 dark:bg-green-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-green-400 group-hover/action:to-green-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-green-900 dark:text-green-100 group-hover/action:text-green-700 dark:group-hover/action:text-green-200 transition-colors flex-1 min-w-0">
                                                Browse Jobs
                                            </span>
                                        </motion.div>
                                </Link> */}

                                    <Link href="/dashboard/student/market-jobs" className="group/action">
                                        <motion.div
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border sm:border-2 border-teal-200/50 dark:border-teal-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-teal-200 dark:bg-teal-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-teal-400 group-hover/action:to-teal-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-teal-600 dark:text-teal-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-teal-900 dark:text-teal-100 group-hover/action:text-teal-700 dark:group-hover/action:text-teal-200 transition-colors flex-1 min-w-0">
                                                <span className="hidden sm:inline">Available Jobs in Market</span>
                                                <span className="sm:hidden">Market Jobs</span>
                                            </span>
                                        </motion.div>
                                    </Link>

                                    <Link href="/dashboard/student/assessment" className="group/action">
                                        <motion.div
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border sm:border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-purple-200 dark:bg-purple-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-purple-400 group-hover/action:to-purple-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-purple-900 dark:text-purple-100 group-hover/action:text-purple-700 dark:group-hover/action:text-purple-200 transition-colors flex-1 min-w-0">
                                                Take Assessment
                                            </span>
                                        </motion.div>
                                    </Link>

                                    <Link href="/dashboard/student/assessment/history" className="group/action">
                                        <motion.div
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border sm:border-2 border-pink-200/50 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-pink-200 dark:bg-pink-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-pink-400 group-hover/action:to-pink-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-pink-600 dark:text-pink-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-pink-900 dark:text-pink-100 group-hover/action:text-pink-700 dark:group-hover/action:text-pink-200 transition-colors flex-1 min-w-0">
                                                <span className="hidden sm:inline">Assessment History</span>
                                                <span className="sm:hidden">History</span>
                                            </span>
                                        </motion.div>
                                    </Link>

                                    <Link href="/dashboard/student/profile" className="group/action">
                                        <motion.div
                                            className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 p-2.5 sm:p-3 md:p-4 lg:p-5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border sm:border-2 border-orange-200/50 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.02, x: 5 }}
                                        >
                                            <motion.div
                                                className="p-2 sm:p-2.5 md:p-3 lg:p-4 bg-orange-200 dark:bg-orange-800 rounded-lg group-hover/action:bg-gradient-to-br group-hover/action:from-orange-400 group-hover/action:to-orange-500 transition-all duration-300 flex-shrink-0"
                                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-300 group-hover/action:text-white transition-colors" />
                                            </motion.div>
                                            <span className="font-semibold text-sm sm:text-base md:text-lg text-orange-900 dark:text-orange-100 group-hover/action:text-orange-700 dark:group-hover/action:text-orange-200 transition-colors flex-1 min-w-0">
                                                Update Profile
                                            </span>
                                        </motion.div>
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Detailed Analysis - Right Side */}
                            <motion.div
                                className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 relative overflow-hidden group"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Decorative shapes for Detailed Analysis - Behind content */}
                                <div className="absolute -top-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-indigo-300/30 to-purple-300/20 blur-3xl group-hover:blur-[40px] transition-all duration-500 z-0 pointer-events-none" />
                                <div className="absolute -bottom-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-pink-300/25 to-rose-300/15 blur-3xl group-hover:blur-[40px] transition-all duration-500 z-0 pointer-events-none" />
                                <div className="absolute top-1/2 right-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-200/20 to-indigo-200/10 blur-2xl opacity-60 group-hover:opacity-80 transition-all duration-500 z-0 pointer-events-none" />

                                <div className="mb-4 sm:mb-6 relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex-shrink-0">
                                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                        </div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">Detailed Analysis</h2>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        View your latest assessment report with per-question breakdown and AI insights
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
                                    {/* Recent Reports List */}
                                    {recentReports.length > 0 ? (
                                        <div className="space-y-2 sm:space-y-3">
                                            {recentReports.map((report, index) => (
                                                <motion.div
                                                    key={report.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    className="relative z-10"
                                                >
                                                    <Button
                                                        onClick={() => {
                                                            window.location.href = `/dashboard/student/assessment/report?id=${report.id}`
                                                        }}
                                                        className="w-full justify-start p-3 sm:p-4 h-auto bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 border-2 border-indigo-200/50 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 group relative z-10"
                                                        variant="outline"
                                                    >
                                                        <div className="flex items-center gap-2 sm:gap-3 w-full">
                                                            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                                                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-300" />
                                                            </div>
                                                            <div className="flex-1 text-left min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                        Report #{recentReports.length - index}
                                                                    </p>
                                                                    {index === 0 && (
                                                                        <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 flex-shrink-0">
                                                                            Latest
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                    {new Date(report.date).toLocaleString()}
                                                                </p>
                                                                {report.score && (
                                                                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 flex-wrap">
                                                                        <span className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                                            Score: <span className="font-bold">
                                                                                {(() => {
                                                                                    const score = typeof report.score === 'number' ? report.score : parseFloat(String(report.score));
                                                                                    return isNaN(score) ? '0.00' : score.toFixed(2);
                                                                                })()}%
                                                                            </span>
                                                                        </span>
                                                                        {report.readiness && (
                                                                            <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">
                                                                                Readiness: <span className="font-bold">
                                                                                    {(() => {
                                                                                        const readiness = typeof report.readiness === 'number' ? report.readiness : parseFloat(String(report.readiness));
                                                                                        return isNaN(readiness) ? '0.00' : readiness.toFixed(2);
                                                                                    })()}%
                                                                                </span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex-shrink-0" />
                                                        </div>
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            className="p-8 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/80 dark:to-purple-950/80 backdrop-blur-sm border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                                <ClipboardList className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                                            </div>
                                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                                No assessments completed yet
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                                Complete your first assessment to view reports
                                            </p>
                                        </motion.div>
                                    )}

                                    <Link href="/dashboard/student/assessment/history" className="relative z-10">
                                        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                                            <Button
                                                variant="outline"
                                                className="w-full border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-all duration-300 py-3 sm:py-4 text-sm sm:text-base font-semibold relative z-10"
                                            >
                                                Browse All Reports
                                            </Button>
                                        </motion.div>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Resume Status */}
                        {!stats?.resume_uploaded && (
                            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Resume Not Uploaded
                                    </CardTitle>
                                    <CardDescription>
                                        Upload your resume to get ATS score and personalized job recommendations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/dashboard/student/resume">
                                        <Button>Upload Resume Now</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Analytics Section - Redesigned with Assessment Report Styling */}
                        {analytics && analytics.total_assessments > 0 ? (
                            <div className="space-y-6">
                                {/* Performance Trend Analysis */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.01] group">
                                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                        <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700">
                                            <CardTitle className="flex items-center gap-3 text-lg font-bold">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md">
                                                    <TrendingUp className="h-5 w-5 text-white" />
                                                </div>
                                                Performance Trend Analysis
                                            </CardTitle>
                                            <CardDescription className="mt-2">Track your progress across assessments over time</CardDescription>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <ResponsiveContainer width="100%" height={450}>
                                                <ComposedChart data={(analytics.trend || []).map((t: any) => ({ ...t, date: new Date(t.date).toLocaleDateString() }))} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                                                    <defs>
                                                        <linearGradient id="colorOverallGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                                                            <stop offset="30%" stopColor="#6366f1" stopOpacity={0.4} />
                                                            <stop offset="70%" stopColor="#6366f1" stopOpacity={0.15} />
                                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                                                        </linearGradient>
                                                        <linearGradient id="colorReadinessGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                                                            <stop offset="30%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="70%" stopColor="#10b981" stopOpacity={0.12} />
                                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fill: '#6b7280', fontSize: 11 }}
                                                        label={{ value: 'Assessment Date', position: 'insideBottom', offset: -5, fill: '#6b7280', style: { fontWeight: 'bold' } }}
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
                                                        formatter={(value: any, name?: string) => [value, name || '']}
                                                    />
                                                    <Legend
                                                        wrapperStyle={{ paddingTop: '15px' }}
                                                        iconType="line"
                                                    />
                                                    {/* Area under Overall Score line */}
                                                    <Area
                                                        type="monotone"
                                                        dataKey="overall_score"
                                                        fill="url(#colorOverallGradient)"
                                                        stroke="none"
                                                    />
                                                    {/* Area under Readiness line */}
                                                    <Area
                                                        type="monotone"
                                                        dataKey="readiness_index"
                                                        fill="url(#colorReadinessGradient)"
                                                        stroke="none"
                                                    />
                                                    {/* Overall Score Line */}
                                                    <Line
                                                        type="monotone"
                                                        dataKey="overall_score"
                                                        stroke="#6366f1"
                                                        strokeWidth={3}
                                                        dot={{ fill: '#6366f1', r: 7, strokeWidth: 3, stroke: '#fff' }}
                                                        activeDot={{ r: 10, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                                                        name="Overall Score"
                                                    />
                                                    {/* Readiness Index Line */}
                                                    <Line
                                                        type="monotone"
                                                        dataKey="readiness_index"
                                                        stroke="#10b981"
                                                        strokeWidth={2.5}
                                                        strokeDasharray="5 5"
                                                        dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                                        activeDot={{ r: 8 }}
                                                        name="Readiness Index"
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Correct vs Incorrect & Section-wise Performance */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Correct vs Incorrect Pie Chart */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                    >
                                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.02] group">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-200/20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-tr from-green-200/25 to-teal-200/15 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                            <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700">
                                                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                                                        <Award className="h-5 w-5 text-white" />
                                                    </div>
                                                    Correct vs Incorrect
                                                </CardTitle>
                                                <CardDescription className="mt-2">Last assessment rounds breakdown</CardDescription>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <PieChart>
                                                        <defs>
                                                            <linearGradient id="correctGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                                            </linearGradient>
                                                            <linearGradient id="incorrectGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Pie
                                                            dataKey="value"
                                                            data={[
                                                                { name: 'Correct', value: analytics.correct_vs_incorrect?.correct || 0 },
                                                                { name: 'Incorrect', value: analytics.correct_vs_incorrect?.incorrect || 0 },
                                                            ]}
                                                            outerRadius={120}
                                                            innerRadius={60}
                                                            label={({ name, percent, value }: any) => `${value} (${(percent * 100).toFixed(0)}%)`}
                                                            animationBegin={0}
                                                            animationDuration={800}
                                                        >
                                                            <Cell fill="url(#correctGradient)" stroke="#fff" strokeWidth={3} />
                                                            <Cell fill="url(#incorrectGradient)" stroke="#fff" strokeWidth={3} />
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                            }}
                                                            labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                                                            formatter={(value: any, name?: string) => [value, name || '']}
                                                        />
                                                        <Legend
                                                            wrapperStyle={{ paddingTop: '15px' }}
                                                            iconType="circle"
                                                            formatter={(value) => {
                                                                if (value === 'Correct') return <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>✓ Correct</span>
                                                                return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>✗ Incorrect</span>
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Section-wise Performance Bar Chart */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 shadow-lg hover:scale-[1.02] group">
                                            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-indigo-200/20 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-tr from-purple-200/25 to-pink-200/15 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                            <CardHeader className="relative z-10 border-b border-gray-200 dark:border-gray-700">
                                                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                                                        <Target className="h-5 w-5 text-white" />
                                                    </div>
                                                    Section-wise Performance
                                                </CardTitle>
                                                <CardDescription className="mt-2">Percent by round in last assessment</CardDescription>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <ResponsiveContainer width="100%" height={400}>
                                                    <BarChart data={Object.entries(analytics.section_wise || {}).map(([k, v]) => ({ section: k, percentage: v }))} margin={{ top: 20, right: 30, bottom: 5, left: 10 }}>
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                                                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis
                                                            dataKey="section"
                                                            tick={{ fill: '#6b7280', fontSize: 11 }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={60}
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
                                                            formatter={(value: any) => [`${value}%`, 'Performance']}
                                                        />
                                                        <Bar
                                                            dataKey="percentage"
                                                            fill="url(#barGradient)"
                                                            radius={[8, 8, 0, 0]}
                                                            animationBegin={0}
                                                            animationDuration={800}
                                                        >
                                                            <LabelList
                                                                dataKey="percentage"
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
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-300/30 to-purple-300/20 blur-2xl" />
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-tr from-pink-300/25 to-rose-300/15 blur-2xl" />
                                    <CardHeader className="relative z-10 border-b border-indigo-200 dark:border-indigo-700">
                                        <CardTitle className="flex items-center gap-3 text-lg font-bold">
                                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                                                <ClipboardList className="h-5 w-5 text-white" />
                                            </div>
                                            Performance Analytics
                                        </CardTitle>
                                        <CardDescription className="text-indigo-700 dark:text-indigo-300">Detailed analytics will be available after completing assessments</CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="text-center py-12">
                                            <div className="p-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                                <ClipboardList className="h-12 w-12 text-indigo-600 dark:text-indigo-300" />
                                            </div>
                                            <p className="text-lg font-medium text-indigo-900 dark:text-indigo-100">Complete your first assessment to see analytics</p>
                                            <p className="text-sm mt-2 text-indigo-700 dark:text-indigo-300">Track your progress and identify improvement areas</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}






