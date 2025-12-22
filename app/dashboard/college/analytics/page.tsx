"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Users, TrendingUp, Award, Target, BookOpen, Briefcase, Activity, AlertCircle } from 'lucide-react'

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
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Comprehensive insights and performance metrics from database
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(analytics?.generated_at).toLocaleString()}
                    </p>
                </div>

                {/* Primary Metrics */}
                <div className="grid md:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Total Students
                            </CardDescription>
                            <CardTitle className="text-3xl">{sm.total_students || 0}</CardTitle>
                            <p className="text-xs text-green-600">{sm.active_students || 0} active</p>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" /> Total Assessments
                            </CardDescription>
                            <CardTitle className="text-3xl">{am.total_assessments || 0}</CardTitle>
                            <p className="text-xs text-blue-600">{am.completed_assessments || 0} completed</p>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Avg Readiness
                            </CardDescription>
                            <CardTitle className="text-3xl">{am.avg_readiness_index || 0}%</CardTitle>
                            <p className="text-xs text-gray-600">Placement readiness</p>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <Target className="h-4 w-4" /> Completion Rate
                            </CardDescription>
                            <CardTitle className="text-3xl">{am.completion_rate || 0}%</CardTitle>
                            <p className="text-xs text-gray-600">Assessment completion</p>
                        </CardHeader>
                    </Card>
                </div>

                {/* Student Overview & Assessment Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" /> Student Overview
                            </CardTitle>
                            <CardDescription>Student distribution and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                <span className="font-medium">Active Students</span>
                                <span className="font-bold text-green-600">{sm.active_students || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="font-medium">Inactive Students</span>
                                <span className="font-bold text-gray-600">{sm.inactive_students || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <span className="font-medium">Profile Completion</span>
                                <span className="font-bold text-blue-600">{sm.avg_profile_completion || 0}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" /> Assessment Activity
                            </CardTitle>
                            <CardDescription>Assessment completion metrics</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                <span className="font-medium">Completed</span>
                                <span className="font-bold text-purple-600">{am.completed_assessments || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                <span className="font-medium">In Progress</span>
                                <span className="font-bold text-yellow-600">{am.in_progress_assessments || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                                <span className="font-medium">Today</span>
                                <span className="font-bold text-cyan-600">{am.assessments_today || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                                <span className="font-medium">This Month</span>
                                <span className="font-bold text-indigo-600">{am.assessments_this_month || 0}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics - Dynamic Round Types */}
                {ra.performance_by_round?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" /> Performance Metrics
                            </CardTitle>
                            <CardDescription>Average scores across different assessment rounds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-4 gap-4">
                                {ra.performance_by_round.map((round: any, idx: number) => {
                                    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'cyan', 'indigo', 'teal', 'rose', 'amber']
                                    const color = colors[idx % colors.length]
                                    const roundName = round.round_type.replace('RoundType.', '').replace(/_/g, ' ')
                                    
                                    return (
                                        <div key={round.round_type} className={`p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950 dark:to-${color}-900 rounded-lg`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{roundName}</p>
                                            <p className={`text-2xl font-bold text-${color}-600`}>{round.avg_score || 0}%</p>
                                            <p className="text-xs text-gray-500 mt-1">{round.count} assessment{round.count !== 1 ? 's' : ''}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Placement Readiness */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Placement Ready</CardTitle>
                            <CardDescription>Readiness Index ≥ 70%</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-green-600">{pr.placement_ready_students || 0}</p>
                            <p className="text-sm text-gray-600 mt-2">{pr.placement_ready_percentage || 0}% of students</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Need Improvement</CardTitle>
                            <CardDescription>Readiness Index &lt; 50%</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-orange-600">{pr.students_needing_improvement || 0}</p>
                            <p className="text-sm text-gray-600 mt-2">Require attention</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Below Threshold</CardTitle>
                            <CardDescription>Score &lt; 50%</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-red-600">{pm.students_below_threshold || 0}</p>
                            <p className="text-sm text-gray-600 mt-2">Need extra support</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Students by Branch */}
                {sm.students_by_branch?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Students by Branch/Department</CardTitle>
                            <CardDescription>Distribution across different branches</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-3">
                                {sm.students_by_branch.map((branch: any, idx: number) => (
                                    <div key={idx} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="font-medium">{branch.branch}</span>
                                        <span className="font-bold text-blue-600">{branch.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top Performers */}
                {pm.top_students?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" /> Top Performing Students
                            </CardTitle>
                            <CardDescription>Students with highest average scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {pm.top_students.slice(0, 10).map((student: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-950 rounded-lg">
                                        <div>
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-xs text-gray-600">{student.branch} • {student.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">{student.avg_score}%</p>
                                            <p className="text-xs text-gray-500">#{idx + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Popular Job Roles */}
                {jra.popular_job_roles?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" /> Most Popular Job Roles
                            </CardTitle>
                            <CardDescription>Top assessed job roles by students</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                {jra.popular_job_roles.map((role: any, idx: number) => (
                                    <div key={idx} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">{role.title}</p>
                                            <p className="text-xs text-gray-600">{role.category}</p>
                                        </div>
                                        <span className="font-bold text-purple-600">{role.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Department-wise Readiness */}
                {pr.dept_readiness?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Department-wise Placement Readiness</CardTitle>
                            <CardDescription>Average readiness index by branch</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-3">
                                {pr.dept_readiness.map((dept: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950 rounded-lg">
                                        <p className="font-medium">{dept.branch}</p>
                                        <p className="text-2xl font-bold text-blue-600">{dept.avg_readiness}%</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}

