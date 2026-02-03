"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Users, UserCheck, BarChart3, UserPlus, Sparkles } from 'lucide-react'

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

    if (loading) {
        return (
            <DashboardLayout requiredUserType="college">
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout requiredUserType="college">
            <div className="space-y-8 max-w-[1250px] mx-auto">
                {/* Welcome Section */}
                <div className="bg-[#DBEAFF]/30 dark:bg-[#2A2C38] border border-[#989898] dark:border-[#5B5B5B] rounded-[16px] p-6 md:p-8 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Welcome, {stats?.college_name || 'College'}
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium ml-11">Quick overview and actions</p>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Total Students Card */}
                    <div className="bg-[#DDEEFF] dark:bg-[#0053A6] rounded-[16px] p-6 h-[126px] flex flex-col justify-between min-w-[308px] shadow-[0px_2px_4px_rgba(0,0,0,0.25)] transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 dark:text-white/80 font-medium mb-1">Total Students</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.total_students || 12}</h3>
                            </div>
                            <div className="w-[44px] h-[44px] flex items-center justify-center bg-[#B8DCFF] dark:bg-white/20 rounded-[16px]">
                                <Users className="h-6 w-6 text-blue-600 dark:text-white" />
                            </div>
                        </div>
                        <p className="text-green-600 dark:text-green-300 text-sm font-medium flex items-center gap-1">
                            {stats?.active_students || 1} active
                        </p>
                    </div>

                    {/* Total Assessments Card */}
                    <div className="bg-[#F8EFFF] dark:bg-[#5B00A2] rounded-[16px] p-6 h-[126px] flex flex-col justify-between min-w-[308px] shadow-[0px_2px_4px_rgba(0,0,0,0.25)] transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-600 dark:text-white/80 font-medium mb-1">Total Assessments</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.total_assessments || 8}</h3>
                            </div>
                            <div className="w-[44px] h-[44px] flex items-center justify-center bg-[#EDD4FF] dark:bg-white/20 rounded-[16px]">
                                <UserCheck className="h-6 w-6 text-purple-600 dark:text-white" />
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-white/60 text-sm font-medium">
                            0 completed
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your students and view insights</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Button
                            onClick={() => router.push('/dashboard/college/students')}
                            variant="outline"
                            className="h-[127px] bg-white hover:bg-gray-50 dark:bg-[#2A2C38] dark:hover:bg-[#323542] border border-[#C5C5C5] dark:border-[#717171] rounded-[16px] flex items-center justify-center gap-3 text-lg font-medium shadow-[0px_2px_4px_rgba(0,0,0,0.25)] hover:shadow-md transition-all group"
                        >
                            <Users className="h-6 w-6 text-gray-600 dark:text-white group-hover:text-blue-600 transition-colors" />
                            <span className="dark:text-white">Manage Students</span>
                        </Button>

                        <Button
                            onClick={() => router.push('/dashboard/college/analytics')}
                            variant="outline"
                            className="h-[127px] bg-white hover:bg-gray-50 dark:bg-[#2A2C38] dark:hover:bg-[#323542] border border-[#C5C5C5] dark:border-[#717171] rounded-[16px] flex items-center justify-center gap-3 text-lg font-medium shadow-[0px_2px_4px_rgba(0,0,0,0.25)] hover:shadow-md transition-all group"
                        >
                            <BarChart3 className="h-6 w-6 text-gray-600 dark:text-white group-hover:text-blue-600 transition-colors" />
                            <span className="dark:text-white">View Analytics</span>
                        </Button>

                        <Button
                            onClick={() => router.push('/dashboard/college/students')}
                            variant="outline"
                            className="h-[127px] bg-white hover:bg-gray-50 dark:bg-[#2A2C38] dark:hover:bg-[#323542] border border-[#C5C5C5] dark:border-[#717171] rounded-[16px] flex items-center justify-center gap-3 text-lg font-medium shadow-[0px_2px_4px_rgba(0,0,0,0.25)] hover:shadow-md transition-all group"
                        >
                            <UserPlus className="h-6 w-6 text-gray-600 dark:text-white group-hover:text-blue-600 transition-colors" />
                            <span className="dark:text-white">Add Student</span>
                        </Button>
                    </div>
                </div>

                {/* Insights Banner */}
                <div className="bg-[#F8EFFF] dark:bg-[#2A2C38] rounded-[8px] p-8 border border-[#BEBEBE] dark:border-[#868686] min-h-[150px] flex items-center transition-colors">
                    <div className="space-y-4 w-full">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-5 w-5 text-gray-900 dark:text-white" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Need Detailed Insights?</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                                View comprehensive analytics including performance metrics, skill analysis, and placement readiness
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/dashboard/college/analytics')}
                            className="bg-gradient-to-r from-[#1E7BFF] to-[#7F56D9] hover:opacity-90 text-white px-6 py-2 rounded-[8px] font-medium transition-all shadow-none border-none"
                        >
                            Go to Analytics Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}






