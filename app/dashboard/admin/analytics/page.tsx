"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react'

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            // TODO: Implement analytics API endpoint
            // const data = await apiClient.getAdminAnalytics()
            // For now, use dashboard data as placeholder
            const data = await apiClient.getAdminDashboard()
            setAnalytics(data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400">Platform-wide insights and performance metrics</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        {/* Key Metrics */}
                        <div className="grid md:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Total Colleges</CardDescription>
                                    <CardTitle className="text-3xl">{analytics?.total_colleges || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Total Students</CardDescription>
                                    <CardTitle className="text-3xl">{analytics?.total_students || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Active Users</CardDescription>
                                    <CardTitle className="text-3xl">{analytics?.active_users || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Total Assessments</CardDescription>
                                    <CardTitle className="text-3xl">{analytics?.total_assessments || 0}</CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Analytics Placeholder */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Analytics</CardTitle>
                                <CardDescription>Detailed analytics will be developed by AI team</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Advanced analytics coming soon</p>
                                    <p className="text-sm mt-2">This section will include detailed charts, trends, and insights</p>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}

