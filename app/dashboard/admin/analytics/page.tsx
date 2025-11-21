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
  Filter
} from 'lucide-react'
import { 
  MetricCard, 
  BarChartCard, 
  PieChartCard,
  DataTableCard
} from '@/components/analytics'

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [dateRange, setDateRange] = useState('30') // days

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

    const handleExport = async (format: string) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                alert('Please login to export data')
                return
            }

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
            
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

                        {/* Top Students Leaderboard */}
                        <DataTableCard
                            title="Top Performers by Score"
                            description="Top 10 students with highest scores"
                            data={leaderboards.top_students?.by_score || []}
                            columns={[
                                { key: 'name', label: 'Student Name' },
                                { key: 'email', label: 'Email' },
                                { key: 'college', label: 'College' },
                                { 
                                    key: 'score', 
                                    label: 'Score',
                                    render: (value: any) => value ? `${value}%` : '0%'
                                }
                            ]}
                        />
                    </TabsContent>

                    {/* Colleges Tab */}
                    <TabsContent value="colleges" className="space-y-6">
                        {/* College Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard
                                title="Total Capacity"
                                value={collegeAnalytics.capacity_metrics?.total_capacity || 0}
                                icon={<Building2 className="h-5 w-5" />}
                                description="Combined college capacity"
                            />
                            <MetricCard
                                title="Total Enrolled"
                                value={collegeAnalytics.capacity_metrics?.total_enrolled || 0}
                                icon={<Users className="h-5 w-5" />}
                                description="Students enrolled"
                            />
                            <MetricCard
                                title="Utilization Rate"
                                value={`${collegeAnalytics.capacity_metrics?.overall_utilization || 0}%`}
                                icon={<TrendingUp className="h-5 w-5" />}
                                description="Capacity utilization"
                            />
                        </div>

                        {/* Top Performing Colleges */}
                        <DataTableCard
                            title="Top Performing Colleges"
                            description="Colleges ranked by average student performance"
                            data={collegeAnalytics.college_performance?.top_performing || []}
                            columns={[
                                { key: 'name', label: 'College Name' },
                                { key: 'avg_score', label: 'Avg Score' },
                                { key: 'total_students', label: 'Students' },
                                { key: 'assessments_count', label: 'Assessments' }
                            ]}
                        />

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
            </div>
        </DashboardLayout>
    )
}
