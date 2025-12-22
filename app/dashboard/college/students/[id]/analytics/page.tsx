"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { ArrowLeft, TrendingUp, TrendingDown, Award, Target, BookOpen, Briefcase, Activity, AlertCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentAnalytics() {
    const params = useParams()
    const router = useRouter()
    const studentId = params?.id as string
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (studentId) {
            fetchAnalytics()
        }
    }, [studentId])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const data = await apiClient.getCollegeStudentAnalytics(studentId)
            setAnalytics(data)
        } catch (error: any) {
            console.error('Error fetching student analytics:', error)
            toast.error(error.response?.data?.detail || 'Failed to load student analytics')
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

    if (!analytics) {
        return (
            <DashboardLayout requiredUserType="college">
                <div className="text-center py-12">
                    <p className="text-gray-600">Student analytics not found</p>
                    <Button onClick={() => router.back()} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const student = analytics.student_info || {}
    const summary = analytics.assessment_summary || {}
    const performance = analytics.performance_by_round || {}
    const academic = analytics.academic_info || {}
    const skills = analytics.skill_analysis || {}

    return (
        <DashboardLayout requiredUserType="college">
            <div className="space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <User className="h-8 w-8" />
                                {student.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {student.email} • {student.branch}
                            </p>
                        </div>
                    </div>
                    <Badge className={
                        student.status === 'ACTIVE' ? 'bg-green-500' :
                        student.status === 'INACTIVE' ? 'bg-gray-500' : 'bg-red-500'
                    }>
                        {student.status}
                    </Badge>
                </div>

                {/* Student Overview Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                            <CardDescription>Profile Completion</CardDescription>
                            <CardTitle className="text-3xl">{student.profile_completion}%</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-3">
                            <CardDescription>Total Assessments</CardDescription>
                            <CardTitle className="text-3xl">{summary.total_assessments || 0}</CardTitle>
                            <p className="text-xs text-green-600">{summary.completed || 0} completed</p>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                            <CardDescription>Avg Overall Score</CardDescription>
                            <CardTitle className="text-3xl">{summary.avg_overall_score || 0}%</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-3">
                            <CardDescription>Readiness Index</CardDescription>
                            <CardTitle className="text-3xl">{summary.avg_readiness_index || 0}%</CardTitle>
                            <div className="flex items-center gap-1 text-xs">
                                {summary.improvement_trend > 0 ? (
                                    <>
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-green-600">+{summary.improvement_trend}%</span>
                                    </>
                                ) : summary.improvement_trend < 0 ? (
                                    <>
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                        <span className="text-red-600">{summary.improvement_trend}%</span>
                                    </>
                                ) : (
                                    <span className="text-gray-600">No change</span>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Performance by Round */}
                {performance?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" /> Performance by Assessment Round
                            </CardTitle>
                            <CardDescription>Detailed scores across different assessment types</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-4 gap-4">
                                {performance.map((roundData: any, idx: number) => {
                                    const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'cyan', 'indigo', 'teal', 'rose', 'amber']
                                    const color = colors[idx % colors.length]
                                    
                                    return (
                                        <div key={roundData.round_type} className={`p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-950 dark:to-${color}-900 rounded-lg`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {roundData.round_name}
                                            </p>
                                            <p className={`text-2xl font-bold text-${color}-600`}>
                                                {roundData.avg_score}%
                                            </p>
                                            <div className="text-xs text-gray-600 mt-2 space-y-1">
                                                <p>Attempts: {roundData.attempts}</p>
                                                <p>Best: {roundData.best_score}%</p>
                                                <p>Latest: {roundData.latest_score}%</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Job Roles Attempted */}
                {analytics.job_roles_attempted?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5" /> Job Roles Attempted
                            </CardTitle>
                            <CardDescription>Assessment history by job role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.job_roles_attempted.map((role: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">{role.title}</p>
                                            <p className="text-xs text-gray-600">{role.category} • {new Date(role.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">{role.score}%</p>
                                            <Badge className={
                                                role.status === 'COMPLETED' ? 'bg-green-500' :
                                                role.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }>
                                                {role.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assessment Timeline */}
                {analytics.assessment_timeline?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" /> Recent Assessment Timeline
                            </CardTitle>
                            <CardDescription>Last 10 assessments chronologically</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analytics.assessment_timeline.map((assessment: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 border-l-4 border-l-blue-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">{assessment.job_role}</p>
                                            <p className="text-xs text-gray-600">{new Date(assessment.date).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">Score: <span className="font-bold text-green-600">{assessment.overall_score}%</span></p>
                                            <p className="text-xs text-gray-600">Readiness: {assessment.readiness_index}%</p>
                                        </div>
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
