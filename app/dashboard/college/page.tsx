"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Users, UserCheck, BarChart3, UserPlus, FileSpreadsheet } from 'lucide-react'

export default function CollegeDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const data = await apiClient.getCollegeDashboard()
            setStats(data)
        } catch (error) {
            console.error('Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout requiredUserType="college">
            <div className="space-y-6">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {stats?.college_name || 'College'}</h1>
                    <p className="text-gray-600 dark:text-gray-400">Quick overview and actions</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <>
                        {/* Quick Stats - Simple Overview */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Total Students
                                    </CardDescription>
                                    <CardTitle className="text-4xl">{stats?.total_students || 0}</CardTitle>
                                </CardHeader>
                            </Card>

                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" /> Active Students
                                    </CardDescription>
                                    <CardTitle className="text-4xl">{stats?.active_students || 0}</CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Manage your students and view insights</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <Button 
                                        onClick={() => router.push('/dashboard/college/students')}
                                        className="h-24 flex flex-col items-center justify-center gap-2"
                                        variant="outline"
                                    >
                                        <Users className="h-8 w-8" />
                                        <span>Manage Students</span>
                                    </Button>
                                    
                                    <Button 
                                        onClick={() => router.push('/dashboard/college/analytics')}
                                        className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                                    >
                                        <BarChart3 className="h-8 w-8" />
                                        <span>View Analytics</span>
                                    </Button>

                                    <Button 
                                        onClick={() => router.push('/dashboard/college/students')}
                                        className="h-24 flex flex-col items-center justify-center gap-2"
                                        variant="outline"
                                    >
                                        <UserPlus className="h-8 w-8" />
                                        <span>Add Student</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info Card */}
                        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Need Detailed Insights?
                                </CardTitle>
                                <CardDescription>
                                    View comprehensive analytics including performance metrics, skill analysis, and placement readiness
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    onClick={() => router.push('/dashboard/college/analytics')}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    Go to Analytics Dashboard
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}






