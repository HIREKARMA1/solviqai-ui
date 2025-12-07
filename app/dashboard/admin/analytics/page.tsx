"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { 
  Users, 
  Building2, 
  FileText, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Award,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  MetricCard, 
  BarChartCard, 
  PieChartCard,
  DataTableCard
} from '@/components/analytics'
import toast from 'react-hot-toast'
import { config } from '@/lib/config'

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [dateRange, setDateRange] = useState('30') // days
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
    const [studentAssessments, setStudentAssessments] = useState<Record<string, any>>({})
    const [loadingAssessments, setLoadingAssessments] = useState<string | null>(null)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [loadingReport, setLoadingReport] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [dateRange])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - parseInt(dateRange))
            
            const data = await apiClient.getAdminAnalytics(
                startDate.toISOString(),
                endDate.toISOString()
            )
            console.log('Analytics Data Received:', data)
            console.log('Student Performance:', data?.student_performance)
            console.log('Readiness Distribution:', data?.student_performance?.readiness_distribution)
            console.log('Round-wise Performance:', data?.student_performance?.round_wise_performance)
            console.log('Leaderboards:', data?.leaderboards)
            console.log('Top Students by Score:', data?.leaderboards?.top_students?.by_score)
            setAnalytics(data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleStudentExpansion = async (studentId: string) => {
        if (expandedStudent === studentId) {
            setExpandedStudent(null)
        } else {
            setExpandedStudent(studentId)
            
            // Load assessments if not already loaded
            if (!studentAssessments[studentId]) {
                setLoadingAssessments(studentId)
                try {
                    const data = await apiClient.getStudentAssessmentsAdmin(studentId)
                    setStudentAssessments(prev => ({
                        ...prev,
                        [studentId]: data.assessments || []
                    }))
                } catch (error: any) {
                    console.error('Error loading assessments:', error)
                    toast.error('Failed to load student assessments')
                } finally {
                    setLoadingAssessments(null)
                }
            }
        }
    }

    const handleViewReport = async (studentId: string, assessmentId: string) => {
        setLoadingReport(true)
        setShowReportModal(true)
        try {
            const data = await apiClient.getStudentAssessmentReportAdmin(studentId, assessmentId, true)
            setSelectedReport(data)
        } catch (error: any) {
            console.error('Error loading report:', error)
            toast.error('Failed to load assessment report')
            setShowReportModal(false)
        } finally {
            setLoadingReport(false)
        }
    }

    const handleExport = async (format: string) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                alert('Please login to export data')
                return
            }

            const API_BASE_URL = config.api.baseUrl.replace(/\/+$/, '')
            
            if (format === 'json') {
                // For JSON, fetch and download as file
                const response = await fetch(`${API_BASE_URL}/api/v1/admin/analytics/export?format=json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                
                if (!response.ok) {
                    throw new Error(`Export failed: ${response.statusText}`)
                }
                
                const data = await response.json()
                const dataStr = JSON.stringify(data, null, 2)
                const dataBlob = new Blob([dataStr], { type: 'application/json' })
                const url = window.URL.createObjectURL(dataBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
                
            } else if (format === 'csv') {
                // For CSV, make direct request to get the file
                const response = await fetch(`${API_BASE_URL}/api/v1/admin/analytics/export?format=csv`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                
                if (!response.ok) {
                    throw new Error(`Export failed: ${response.statusText}`)
                }
                
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }
            
            console.log(`✅ Successfully exported analytics as ${format.toUpperCase()}`)
            
        } catch (error) {
            console.error('Export failed:', error)
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    if (loading) {
        return (
            <DashboardLayout requiredUserType="admin">
                <div className="flex justify-center items-center min-h-screen">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    const platformOverview = analytics?.platform_overview || {}
    const userEngagement = analytics?.user_engagement || {}
    const studentPerformance = analytics?.student_performance || {}
    const collegeAnalytics = analytics?.college_analytics || {}
    const jobApplications = analytics?.job_applications || {}
    const assessmentInsights = analytics?.assessment_insights || {}
    const leaderboards = analytics?.leaderboards || {}
    const alerts = analytics?.alerts || {}

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
                        <p className="text-muted-foreground">Comprehensive platform insights and performance metrics</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Date Range Selector */}
                        <div className="flex gap-2">
                            <Button 
                                variant={dateRange === '7' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDateRange('7')}
                            >
                                7 Days
                            </Button>
                            <Button 
                                variant={dateRange === '30' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDateRange('30')}
                            >
                                30 Days
                            </Button>
                            <Button 
                                variant={dateRange === '90' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDateRange('90')}
                            >
                                90 Days
                            </Button>
                            <Button 
                                variant={dateRange === '365' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => setDateRange('365')}
                            >
                                1 Year
                            </Button>
                        </div>
                        
                        {/* Export Buttons */}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                                <Download className="h-4 w-4 mr-2" />
                                Export JSON
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Analytics Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="colleges">Colleges</TabsTrigger>
                        <TabsTrigger value="assessments">Assessments</TabsTrigger>
                        <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Platform Overview Metrics */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${(platformOverview.total_metrics?.job_applications || 0) > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                            <MetricCard
                                title="Total Students"
                                value={platformOverview.total_metrics?.students || 0}
                                icon={<Users className="h-5 w-5" />}
                                trend={{ value: 5.2, label: "vs last month" }}
                                description="Registered students"
                            />
                            <MetricCard
                                title="Total Colleges"
                                value={platformOverview.total_metrics?.colleges || 0}
                                icon={<Building2 className="h-5 w-5" />}
                                trend={{ value: 2.1, label: "vs last month" }}
                                description="Partner institutions"
                            />
                            <MetricCard
                                title="Total Assessments"
                                value={platformOverview.total_metrics?.assessments || 0}
                                icon={<FileText className="h-5 w-5" />}
                                trend={{ value: -1.5, label: "vs last month" }}
                                description="Completed assessments"
                            />
                            {(platformOverview.total_metrics?.job_applications || 0) > 0 && (
                                <MetricCard
                                    title="Job Applications"
                                    value={platformOverview.total_metrics?.job_applications || 0}
                                    icon={<Briefcase className="h-5 w-5" />}
                                    trend={{ value: 8.3, label: "vs last month" }}
                                    description="Total applications"
                                />
                            )}
                        </div>

                        {/* User Engagement Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard
                                title="Daily Active Users"
                                value={userEngagement.activity_metrics?.dau || 0}
                                icon={<Activity className="h-5 w-5" />}
                                trend={{ value: 3.2, label: "vs yesterday" }}
                                description="Users active today"
                            />
                            <MetricCard
                                title="Weekly Active Users"
                                value={userEngagement.activity_metrics?.wau || 0}
                                icon={<TrendingUp className="h-5 w-5" />}
                                trend={{ value: 1.8, label: "vs last week" }}
                                description="Users active this week"
                            />
                            <MetricCard
                                title="Monthly Active Users"
                                value={userEngagement.activity_metrics?.mau || 0}
                                icon={<Users className="h-5 w-5" />}
                                trend={{ value: 4.5, label: "vs last month" }}
                                description="Users active this month"
                            />
                        </div>

                        {/* Platform Health Alerts */}
                        {alerts && alerts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                        System Alerts
                                    </CardTitle>
                                    <CardDescription>Important issues requiring attention</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {alerts.map((alert: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                                <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                                                    {alert.severity}
                                                </Badge>
                                                <span className="flex-1">{alert.message}</span>
                                                <span className="text-sm text-muted-foreground">{alert.timestamp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Students Tab */}
                    <TabsContent value="students" className="space-y-6">
                        {/* Academic Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MetricCard
                                title="Average Overall Score"
                                value={`${studentPerformance.academic_performance?.avg_overall_score || 0}%`}
                                icon={<Award className="h-5 w-5" />}
                                trend={{ value: 2.3, label: "vs last month" }}
                                description="Platform average"
                            />
                            <MetricCard
                                title="Average Readiness Index"
                                value={`${studentPerformance.academic_performance?.avg_readiness_index || 0}%`}
                                icon={<TrendingUp className="h-5 w-5" />}
                                trend={{ value: 1.8, label: "vs last month" }}
                                description="Job readiness score"
                            />
                        </div>

                        {/* Placement Readiness Distribution */}
                        <PieChartCard
                            title="Placement Readiness Distribution"
                            description="Students by readiness level"
                            data={[
                                { name: 'Not Ready (0-40%)', value: studentPerformance.readiness_distribution?.not_ready?.count || 0 },
                                { name: 'Developing (40-60%)', value: studentPerformance.readiness_distribution?.developing?.count || 0 },
                                { name: 'Ready (60-80%)', value: studentPerformance.readiness_distribution?.ready?.count || 0 },
                                { name: 'Highly Ready (80-100%)', value: studentPerformance.readiness_distribution?.highly_ready?.count || 0 }
                            ]}
                            dataKey="value"
                            nameKey="name"
                            colors={['#ef4444', '#f59e0b', '#10b981', '#8b5cf6']}
                        />

                        {/* Round-wise Performance */}
                        <BarChartCard
                            title="Round-wise Performance"
                            description="Average scores by assessment round"
                            data={[
                                { round: 'Aptitude', score: studentPerformance.round_wise_performance?.aptitude || 0 },
                                { round: 'Soft Skills', score: studentPerformance.round_wise_performance?.soft_skills || 0 },
                                { round: 'Technical MCQ', score: studentPerformance.round_wise_performance?.technical_mcq || 0 },
                                { round: 'Tech Interview', score: studentPerformance.round_wise_performance?.technical_interview || 0 },
                                { round: 'HR Interview', score: studentPerformance.round_wise_performance?.hr_interview || 0 }
                            ]}
                            dataKey="score"
                            xAxisKey="round"
                        />

                        {/* Top Students Leaderboard with Reports */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performers by Score</CardTitle>
                                <CardDescription>Top students with highest scores - Click to view reports</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {leaderboards.top_students?.by_score && leaderboards.top_students.by_score.length > 0 ? (
                                    <div className="space-y-2">
                                        {leaderboards.top_students.by_score.map((student: any, index: number) => (
                                            <div key={student.id || index} className="border rounded-lg overflow-hidden">
                                                {/* Student Header */}
                                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{student.name}</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                                                            {student.college && (
                                                                <Badge variant="outline" className="text-xs mt-1">
                                                                    <Building2 className="h-3 w-3 mr-1" />
                                                                    {student.college}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-primary">
                                                                {student.score ? `${student.score}%` : '0%'}
                                                            </div>
                                                            {student.readiness && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    Readiness: {student.readiness}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => toggleStudentExpansion(student.id)}
                                                        className="ml-4"
                                                    >
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        Reports
                                                        {expandedStudent === student.id ? (
                                                            <ChevronUp className="h-4 w-4 ml-1" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 ml-1" />
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Expanded Assessments Section */}
                                                {expandedStudent === student.id && (
                                                    <div className="border-t bg-gray-50 dark:bg-gray-900 p-4">
                                                        {loadingAssessments === student.id ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader size="sm" />
                                                            </div>
                                                        ) : studentAssessments[student.id]?.length > 0 ? (
                                                            <div className="space-y-3">
                                                                <h5 className="font-medium text-sm">Assessment History</h5>
                                                                {studentAssessments[student.id].map((assessment: any) => (
                                                                    <div
                                                                        key={assessment.id}
                                                                        className="bg-white dark:bg-gray-800 p-3 rounded border"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium text-sm">
                                                                                    {assessment.job_role.title}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                    {assessment.job_role.category}
                                                                                </p>
                                                                                <div className="flex gap-3 mt-2">
                                                                                    <Badge variant={assessment.status === 'COMPLETED' ? 'success' : 'secondary'} className="text-xs">
                                                                                        {assessment.status}
                                                                                    </Badge>
                                                                                    {assessment.overall_score !== null && (
                                                                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                                            Score: {assessment.overall_score?.toFixed(1)}%
                                                                                        </span>
                                                                                    )}
                                                                                    {assessment.readiness_index !== null && (
                                                                                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                                                            Readiness: {assessment.readiness_index?.toFixed(1)}%
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {assessment.completed_at 
                                                                                        ? `Completed: ${new Date(assessment.completed_at).toLocaleDateString()}`
                                                                                        : `Started: ${new Date(assessment.created_at).toLocaleDateString()}`
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                            {assessment.status === 'COMPLETED' && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleViewReport(student.id, assessment.id)}
                                                                                    className="ml-3"
                                                                                >
                                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                                    View Report
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                                <p>No assessments found for this student</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No student data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Colleges Tab */}
                    <TabsContent value="colleges" className="space-y-6">
                        {/* College Enrollment Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MetricCard
                                title="Total Colleges Enrolled"
                                value={collegeAnalytics.college_performance?.all_colleges?.length || 0}
                                icon={<Building2 className="h-5 w-5" />}
                                description="Registered colleges"
                            />
                            <MetricCard
                                title="Total Students"
                                value={collegeAnalytics.capacity_metrics?.total_enrolled || 0}
                                icon={<Users className="h-5 w-5" />}
                                description="All enrolled students"
                            />
                        </div>

                        {/* All Colleges with Student Counts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>All Colleges - Student Enrollment</CardTitle>
                                <CardDescription>
                                    Complete list of {collegeAnalytics.college_performance?.all_colleges?.length || 0} enrolled colleges 
                                    with individual student counts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {collegeAnalytics.college_performance?.all_colleges && collegeAnalytics.college_performance.all_colleges.length > 0 ? (
                                    <div className="space-y-2">
                                        {collegeAnalytics.college_performance.all_colleges.map((college: any, index: number) => (
                                            <div 
                                                key={college.id || index} 
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-base">{college.name}</h4>
                                                        <div className="flex gap-4 mt-1">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Capacity: {college.capacity}
                                                            </span>
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                Utilization: {college.utilization}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                            {college.student_count || college.total_students || 0}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Students</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                            {college.assessments_count || 0}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Assessments</div>
                                                    </div>
                                                    {college.avg_score !== undefined && college.avg_score > 0 && (
                                                        <div className="text-center">
                                                            <Badge variant={
                                                                college.avg_score >= 75 ? 'success' : 
                                                                college.avg_score >= 60 ? 'default' : 
                                                                'secondary'
                                                            }>
                                                                {college.avg_score}% avg
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No Colleges Enrolled</p>
                                        <p className="text-sm mt-2">Colleges will appear here once they are registered</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Performing Colleges */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Colleges</CardTitle>
                                <CardDescription>Colleges ranked by average student performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {collegeAnalytics.college_performance?.top_performing && collegeAnalytics.college_performance.top_performing.length > 0 ? (
                                    <div className="space-y-2">
                                        {collegeAnalytics.college_performance.top_performing.slice(0, 5).map((college: any, index: number) => (
                                            <div key={college.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-bold text-sm">
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium">{college.name}</h5>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {college.total_students} students • {college.assessments_count} assessments
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="success" className="text-lg px-4 py-1">
                                                    {college.avg_score}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No performance data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Most Active Colleges */}
                        <BarChartCard
                            title="Most Active Colleges"
                            description="Colleges by assessment activity"
                            data={collegeAnalytics.college_performance?.most_active?.slice(0, 10) || []}
                            dataKey="assessments_count"
                            xAxisKey="name"
                        />
                    </TabsContent>

                    {/* Assessments Tab */}
                    <TabsContent value="assessments" className="space-y-6">
                        {/* Assessment Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard
                                title="Total Assessments"
                                value={assessmentInsights.distribution?.total || 0}
                                icon={<FileText className="h-5 w-5" />}
                                description="All assessments"
                            />
                            <MetricCard
                                title="Completed Rate"
                                value={`${assessmentInsights.distribution?.completed_percentage || 0}%`}
                                icon={<Award className="h-5 w-5" />}
                                description="Assessment completion"
                            />
                            <MetricCard
                                title="Average Duration"
                                value={`${assessmentInsights.timing?.avg_duration || 0} min`}
                                icon={<Activity className="h-5 w-5" />}
                                description="Time per assessment"
                            />
                        </div>

                        {/* Assessment Distribution */}
                        <PieChartCard
                            title="Assessment Status Distribution"
                            description="Breakdown by completion status"
                            data={[
                                { name: 'Completed', value: assessmentInsights.distribution?.completed || 0 },
                                { name: 'In Progress', value: assessmentInsights.distribution?.in_progress || 0 },
                                { name: 'Not Started', value: assessmentInsights.distribution?.not_started || 0 }
                            ]}
                            dataKey="value"
                            nameKey="name"
                            colors={['#10b981', '#f59e0b', '#ef4444']}
                        />

                        {/* Popular Job Roles */}
                        <BarChartCard
                            title="Popular Job Roles"
                            description="Most assessed job positions"
                            data={assessmentInsights.job_roles?.popular || []}
                            dataKey="count"
                            xAxisKey="name"
                        />
                    </TabsContent>

                    {/* Jobs Tab */}
                    <TabsContent value="jobs" className="space-y-6">
                        {(jobApplications.application_metrics?.total || 0) > 0 ? (
                            <>
                                {/* Job Application Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <MetricCard
                                        title="Total Applications"
                                        value={jobApplications.application_metrics?.total || 0}
                                        icon={<Briefcase className="h-5 w-5" />}
                                        description="All job applications"
                                    />
                                    <MetricCard
                                        title="Success Rate"
                                        value={`${jobApplications.application_metrics?.success_rate || 0}%`}
                                        icon={<Award className="h-5 w-5" />}
                                        trend={{ value: 3.2, label: "vs last month" }}
                                        description="Successful applications"
                                    />
                                    <MetricCard
                                        title="Avg Applications/Student"
                                        value={jobApplications.application_metrics?.avg_per_student || 0}
                                        icon={<TrendingUp className="h-5 w-5" />}
                                        description="Applications per student"
                                    />
                                    <MetricCard
                                        title="Active Applications"
                                        value={jobApplications.application_metrics?.by_status?.PENDING || 0}
                                        icon={<Activity className="h-5 w-5" />}
                                        description="Currently active"
                                    />
                                </div>

                                {/* Applications by Platform */}
                                {jobApplications.application_metrics?.by_platform && Object.keys(jobApplications.application_metrics.by_platform).length > 0 && (
                                    <PieChartCard
                                        title="Applications by Platform"
                                        description="Distribution across job platforms"
                                        data={Object.entries(jobApplications.application_metrics.by_platform).map(([platform, count]) => ({
                                            platform,
                                            count
                                        }))}
                                        dataKey="count"
                                        nameKey="platform"
                                        colors={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']}
                                    />
                                )}

                                {/* Application Trends */}
                                {jobApplications.trends?.top_job_titles && jobApplications.trends.top_job_titles.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Top Job Titles</CardTitle>
                                            <CardDescription>Most applied job positions</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {jobApplications.trends.top_job_titles.slice(0, 10).map((job: any, index: number) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-sm">{job.title}</span>
                                                        <Badge variant="secondary">{job.count}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Job Applications Yet</h3>
                                    <p className="text-muted-foreground text-center max-w-md">
                                        Job application data will appear here once students start applying to jobs through the platform.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Student Assessment Report</CardTitle>
                                        {selectedReport?.student_info && (
                                            <CardDescription>
                                                {selectedReport.student_info.name} ({selectedReport.student_info.email})
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowReportModal(false)
                                            setSelectedReport(null)
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingReport ? (
                                    <div className="flex justify-center py-12">
                                        <Loader size="lg" />
                                    </div>
                                ) : selectedReport ? (
                                    <div className="space-y-6">
                                        {/* Student Info */}
                                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                            <h3 className="font-semibold mb-2">Student Information</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Name:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.email}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Degree:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.degree}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Branch:</span>{' '}
                                                    <span className="font-medium">{selectedReport.student_info.branch}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Job Role */}
                                        <div>
                                            <h3 className="font-semibold mb-2">Job Role</h3>
                                            <Badge variant="outline" className="text-sm">
                                                {selectedReport.job_role.title} - {selectedReport.job_role.category}
                                            </Badge>
                                        </div>

                                        {/* Overall Performance */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">Overall Score</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                        {selectedReport.overall_score?.toFixed(1) || 0}%
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">Readiness Index</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                        {selectedReport.readiness_index?.toFixed(1) || 0}%
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Round Performance */}
                                        <div>
                                            <h3 className="font-semibold mb-3">Round-wise Performance</h3>
                                            <div className="space-y-2">
                                                {selectedReport.rounds?.map((round: any, index: number) => (
                                                    <div key={index} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm">
                                                                Round {round.round_number}: {round.round_type}
                                                            </span>
                                                            <Badge variant={round.percentage >= 70 ? 'success' : round.percentage >= 50 ? 'default' : 'secondary'}>
                                                                {round.percentage?.toFixed(1)}%
                                                            </Badge>
                                                        </div>
                                                        {round.ai_feedback && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                {typeof round.ai_feedback === 'string' 
                                                                    ? round.ai_feedback 
                                                                    : JSON.stringify(round.ai_feedback)}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Feedback */}
                                        {selectedReport.ai_feedback && (
                                            <div>
                                                <h3 className="font-semibold mb-2">AI Analysis</h3>
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
                                                    {typeof selectedReport.ai_feedback === 'string' ? (
                                                        <p className="whitespace-pre-wrap">{selectedReport.ai_feedback}</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {selectedReport.ai_feedback.overall_performance && (
                                                                <div>
                                                                    <p className="font-medium mb-1">Overall Performance:</p>
                                                                    <p>{selectedReport.ai_feedback.overall_performance}</p>
                                                                </div>
                                                            )}
                                                            {selectedReport.ai_feedback.readiness_level && (
                                                                <div>
                                                                    <p className="font-medium mb-1">Readiness Level:</p>
                                                                    <p>{selectedReport.ai_feedback.readiness_level}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detailed Analysis */}
                                        {selectedReport.detailed_analysis && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {selectedReport.detailed_analysis.strengths && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-green-600 dark:text-green-400">Strengths</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.strengths}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                {selectedReport.detailed_analysis.weaknesses && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-orange-600 dark:text-orange-400">Areas for Improvement</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.weaknesses}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                {selectedReport.detailed_analysis.recommendations && (
                                                    <Card>
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm text-blue-600 dark:text-blue-400">Recommendations</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                                                {selectedReport.detailed_analysis.recommendations}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        )}

                                        {/* Completion Date */}
                                        {selectedReport.completed_at && (
                                            <p className="text-sm text-gray-500 text-center">
                                                Completed on {new Date(selectedReport.completed_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>No report data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
