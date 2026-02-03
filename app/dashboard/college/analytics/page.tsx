"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Users, TrendingUp, Award, Target, BookOpen, Activity, Briefcase, GraduationCap, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export default function CollegeAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const data = await apiClient.getCollegeAnalytics()
            setAnalytics(data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout requiredUserType="college">
                <div className="flex justify-center items-center py-12">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    const sm = analytics?.student_metrics || {}
    const am = analytics?.assessment_metrics || {}
    const pm = analytics?.performance_metrics || {}
    const pr = analytics?.placement_readiness || {}
    const jra = analytics?.job_role_analytics || {}
    const ra = analytics?.round_analytics || {}

    return (
        <DashboardLayout requiredUserType="college">
            <div className="space-y-8 max-w-[1400px]">
                {/* Header */}
                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-[32px] font-bold text-[#0F172A] dark:text-white">Analytics Dashboard</h1>
                    <p className="text-gray-500 text-sm dark:text-gray-400">
                        Comprehensive insights and performance metrics from database
                    </p>
                    <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                        Last updated: {analytics?.generated_at ? new Date(analytics.generated_at).toLocaleString() : 'N/A'}
                    </p>
                </div>

                {/* Primary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Students */}
                    <div className="bg-[#DDEEFF] dark:bg-[#0c2a4d] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Total Students</span>
                            <div className="h-8 w-8 bg-blue-200/50 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-700" />
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{sm.total_students || 0}</p>
                            <p className="text-sm text-green-600 font-medium mt-1">
                                {sm.active_students || 0} active
                            </p>
                        </div>
                    </div>

                    {/* Total Assessments */}
                    <div className="bg-[#F8EFFF] dark:bg-[#2e1040] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Total Assessments</span>
                            <div className="h-8 w-8 bg-purple-200/50 rounded-full flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-purple-700" />
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{am.total_assessments || 0}</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                {am.completed_assessments || 0} completed
                            </p>
                        </div>
                    </div>

                    {/* Avg Readiness */}
                    <div className="bg-[#FFEAF5] dark:bg-[#3d0f2b] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Avg Readiness</span>
                            <div className="h-8 w-8 bg-[#FFA8D9]/30 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-pink-700" />
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{am.avg_readiness_index || 0}%</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                Placement readiness
                            </p>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-[#FFFCE3] dark:bg-[#382b0e] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                        <div className="flex justify-between items-start z-10">
                            <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Completion Rate</span>
                            <div className="h-8 w-8 bg-[#FFEF79] rounded-full flex items-center justify-center shadow-sm">
                                <Target className="h-4 w-4 text-yellow-800" />
                            </div>
                        </div>
                        <div className="z-10">
                            <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{am.completion_rate || 0}%</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                Assessment completion
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 px-4 py-2 shadow-sm w-full mx-auto">
                    <div className="mb-4 mt-2">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                            <Award className="h-5 w-5 text-blue-600" /> Performance Metrics
                        </h2>
                        <p className="text-gray-500 text-sm">Average scores across different assessment rounds</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            const rounds = ra.performance_by_round?.length > 0
                                ? ra.performance_by_round
                                : [{ round_type: 'RoundType.APTITUDE', avg_score: 0, count: 0 }]

                            return rounds.map((round: any, idx: number) => {
                                const cleanStyles = [
                                    { bg: 'bg-[#DDEEFF] dark:bg-[#0c2a4d]', text: 'text-[#1E293B] dark:text-white', label: 'text-[#475569] dark:text-gray-400', subtext: 'text-[#16a34a]' },
                                    { bg: 'bg-[#F8EFFF] dark:bg-[#2e1040]', text: 'text-[#1E293B] dark:text-white', label: 'text-[#475569] dark:text-gray-400', subtext: 'text-[#9333ea] dark:text-purple-400' },
                                    { bg: 'bg-[#FFEAF5] dark:bg-[#3d0f2b]', text: 'text-[#1E293B] dark:text-white', label: 'text-[#475569] dark:text-gray-400', subtext: 'text-[#db2777] dark:text-pink-500' },
                                    { bg: 'bg-[#FFFCE3] dark:bg-[#382b0e]', text: 'text-[#1E293B] dark:text-white', label: 'text-[#475569] dark:text-gray-400', subtext: 'text-[#ca8a04] dark:text-yellow-500' }
                                ]

                                const style = cleanStyles[idx % cleanStyles.length]
                                const roundName = round.round_type.replace('RoundType.', '').replace(/_/g, ' ')

                                return (
                                    <div key={round.round_type} className={`${style.bg} w-full md:w-[315px] h-[126px] rounded-[16px] p-[10px] flex flex-col justify-center transition-all hover:scale-[1.01] shrink-0`}>
                                        <div className="px-2">
                                            <p className={`text-xs font-bold tracking-wider uppercase ${style.label} mb-1`}>{roundName}</p>
                                            <p className={`text-4xl font-bold ${style.text} mb-1`}>{round.avg_score || 0}%</p>
                                            <p className={`text-xs font-semibold ${style.subtext}`}>{round.count} assessment{round.count !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </div>


                {/* Placement Readiness */}
                <div>
                    <h2 className="text-xl font-bold text-[#1E293B] dark:text-white mb-4">Placement Readiness</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Placement Ready */}
                        <div className="bg-[#34C06533] dark:bg-[#073322] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                            <div className="flex justify-between items-start z-10">
                                <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Placement Ready</span>
                                <div className="h-8 w-8 bg-green-200/50 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-700" />
                                </div>
                            </div>
                            <div className="z-10">
                                <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{pr.placement_ready_students || 0}</p>
                                <p className="text-sm text-[#1E293B] dark:text-gray-300 font-medium mt-1">
                                    {pr.placement_ready_percentage || 0}% of students
                                </p>
                            </div>
                        </div>

                        {/* Need Improvement */}
                        <div className="bg-[#EE600033] dark:bg-[#3d190b] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                            <div className="flex justify-between items-start z-10">
                                <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Need Improvement</span>
                                <div className="h-8 w-8 bg-orange-200/50 rounded-full flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-orange-700" />
                                </div>
                            </div>
                            <div className="z-10">
                                <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{pr.students_needing_improvement || 0}</p>
                                <p className="text-sm text-[#1E293B] dark:text-gray-300 font-medium mt-1">
                                    Require attention
                                </p>
                            </div>
                        </div>

                        {/* Below Threshold */}
                        <div className="bg-[#005FFD33] dark:bg-[#0c2a4d] rounded-2xl p-5 flex flex-col justify-between h-[150px] relative overflow-hidden shadow-md">
                            <div className="flex justify-between items-start z-10">
                                <span className="text-[#1E293B] dark:text-gray-200 font-medium text-base">Below Threshold</span>
                                <div className="h-8 w-8 bg-blue-200/50 rounded-full flex items-center justify-center">
                                    <XCircle className="h-4 w-4 text-blue-700" />
                                </div>
                            </div>
                            <div className="z-10">
                                <p className="text-4xl font-bold text-[#1E293B] dark:text-white">{pm.students_below_threshold || 0}</p>
                                <p className="text-sm text-[#1E293B] dark:text-gray-300 font-medium mt-1">
                                    Need extra support
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Students by Branch */}
                    {/* Students by Branch */}
                    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                                <GraduationCap className="h-5 w-5" /> Students by Branch/Department
                            </h2>
                            <p className="text-gray-500 text-xs">Distribution across different branches</p>
                        </div>
                        <div className="space-y-3">
                            {(() => {
                                const branches = sm.students_by_branch?.length > 0
                                    ? sm.students_by_branch
                                    : [{ branch: 'N/A', count: 0 }]

                                return branches.map((branch: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center px-4 h-[72px] bg-[#F0F7FF] dark:bg-[#1E293B] border border-[#CCE1FF] dark:border-gray-700 rounded-[8px]">
                                        <span className="font-medium text-base text-[#1E293B] dark:text-white">{branch.branch}</span>
                                        <span className="font-bold text-[#1E293B] dark:text-white">{branch.count}</span>
                                    </div>
                                ))
                            })()}
                        </div>
                    </div>

                    {/* Popular Job Roles */}
                    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                                <Briefcase className="h-5 w-5" /> Most Popular Job Roles
                            </h2>
                            <p className="text-gray-500 text-xs">Top assessed job roles by students</p>
                        </div>
                        <div className="space-y-3">
                            {(() => {
                                const roles = jra.popular_job_roles?.length > 0
                                    ? jra.popular_job_roles
                                    : [{ title: 'N/A', category: 'N/A', count: 0 }]

                                return roles.map((role: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center px-4 h-[72px] bg-[#F0F7FF] dark:bg-[#1E293B] border border-[#CCE1FF] dark:border-gray-700 rounded-[8px]">
                                        <div>
                                            <p className="font-medium text-[#1E293B] dark:text-white text-base">{role.title}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{role.category}</p>
                                        </div>
                                        <span className="font-bold text-[#1E293B] dark:text-white">
                                            {role.count}
                                        </span>
                                    </div>
                                ))
                            })()}
                        </div>
                    </div>
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                    {/* Student Overview */}
                    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                                <Users className="h-5 w-5" /> Student Overview
                            </h2>
                            <p className="text-gray-500 text-xs">Student distribution and status</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-4 py-3 bg-[#F0F7FF] dark:bg-[#1E293B] border border-[#CCE1FF] dark:border-gray-700 rounded-[8px]">
                                <span className="font-medium text-sm text-[#1E293B] dark:text-white">Active Students</span>
                                <span className="font-bold text-[#1E293B] dark:text-white">{sm.active_students || 0}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-[#F0F7FF] dark:bg-[#1E293B] border border-[#CCE1FF] dark:border-gray-700 rounded-[8px]">
                                <span className="font-medium text-sm text-[#1E293B] dark:text-white">Inactive Students</span>
                                <span className="font-bold text-[#1E293B] dark:text-white">{sm.inactive_students || 0}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-[#F0F7FF] dark:bg-[#1E293B] border border-[#CCE1FF] dark:border-gray-700 rounded-[8px]">
                                <span className="font-medium text-sm text-[#1E293B] dark:text-white">Profile Completion</span>
                                <span className="font-bold text-[#1E293B] dark:text-white">{sm.avg_profile_completion || 0}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Assessment Activity */}
                    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                                <Activity className="h-5 w-5" /> Assessment Activity
                            </h2>
                            <p className="text-gray-500 text-xs">Assessment completion metrics</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 h-[calc(100%-60px)]">
                            <div className="p-4 bg-[#F8EFFF] dark:bg-[#2e1040] rounded-[8px] border border-[#E9D5FF] dark:border-gray-700 flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-1 font-medium">Completed</p>
                                <p className="text-3xl font-bold text-[#7C3AED] dark:text-[#a855f7]">{am.completed_assessments || 0}</p>
                            </div>
                            <div className="p-4 bg-[#FFFCE3] dark:bg-[#382b0e] rounded-[8px] border border-[#FEF08A] dark:border-gray-700 flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-1 font-medium">In Progress</p>
                                <p className="text-3xl font-bold text-[#D97706] dark:text-[#f59e0b]">{am.in_progress_assessments || 0}</p>
                            </div>
                            <div className="p-4 bg-[#E0F2FE] dark:bg-[#0c4a6e] rounded-[8px] border border-[#BAE6FD] dark:border-gray-700 flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-1 font-medium">Today</p>
                                <p className="text-3xl font-bold text-[#059669] dark:text-[#10b981]">{am.assessments_today || 0}</p>
                            </div>
                            <div className="p-4 bg-[#EEE4FF] dark:bg-[#312e81] rounded-[8px] border border-[#C7D2FE] dark:border-gray-700 flex flex-col justify-center items-center text-center">
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-1 font-medium">This Month</p>
                                <p className="text-3xl font-bold text-[#6366F1] dark:text-[#818cf8]">{am.assessments_this_month || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                {pm.top_students?.length > 0 && (
                    <div className="bg-white dark:bg-[#0F172A] rounded-[8px] border border-[#C5C5C5] dark:border-gray-800 p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-[#1E293B] dark:text-white">
                                <Award className="h-5 w-5 text-yellow-500" /> Top Performing Students
                            </h2>
                            <p className="text-gray-500 text-xs">Students with highest average scores</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pm.top_students.slice(0, 6).map((student: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950 dark:to-transparent rounded-xl border border-amber-100 dark:border-amber-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center justify-center font-bold text-sm">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.branch}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600">{student.avg_score}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


            </div>
        </DashboardLayout>
    )
}
