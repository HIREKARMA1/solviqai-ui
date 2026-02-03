"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
    Activity, AlertTriangle, CheckCircle, Info, 
    Clock, Calendar, Zap, TrendingUp
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UsageData {
    subscription_type: string
    daily_usage: Record<string, number>
    weekly_usage?: Record<string, number>
    reset_dates: {
        daily_counter_reset_date: string | null
        weekly_counter_reset_date: string | null
    }
    limit_status: Record<string, { used: number; limit: number; percentage: number } | any>
    warnings: Array<{
        feature: string
        message: string
        severity: 'error' | 'warning' | 'info'
    }>
}

export function UsageAnalyticsCard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<UsageData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('daily')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiClient.getStudentUsageAnalytics()
            setData(response)
        } catch (err: any) {
            console.error('Error loading usage analytics:', err)
            setError(err.response?.data?.detail || 'Failed to load usage analytics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
                    <Loader size="md" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const formatFeatureName = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/today|this week/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 100) return 'bg-red-500'
        if (percentage >= 80) return 'bg-orange-500'
        if (percentage >= 60) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getWarningIcon = (severity: string) => {
        switch (severity) {
            case 'error':
                return <AlertTriangle className="h-4 w-4" />
            case 'warning':
                return <Info className="h-4 w-4" />
            default:
                return <CheckCircle className="h-4 w-4" />
        }
    }

    const getWarningColor = (severity: string): string => {
        switch (severity) {
            case 'error':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            case 'warning':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        }
    }

    const getTimeUntilReset = (resetDate: string | null): string => {
        if (!resetDate) return 'Unknown'
        
        const reset = new Date(resetDate)
        const now = new Date()
        const diff = reset.getTime() + 24 * 60 * 60 * 1000 - now.getTime() // Add 24 hours to reset date
        
        if (diff <= 0) return 'Resetting soon...'
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    const renderLimitItem = (feature: string, limitData: { used: number; limit: number; percentage: number }) => {
        return (
            <motion.div
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
            >
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatFeatureName(feature)}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {limitData.used} / {limitData.limit}
                    </span>
                </div>
                <div className="relative">
                    <Progress 
                        value={limitData.percentage} 
                        className="h-2"
                    />
                    <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(limitData.percentage)}`}
                        style={{ width: `${Math.min(limitData.percentage, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {limitData.percentage.toFixed(0)}% used
                    {limitData.percentage >= 80 && limitData.percentage < 100 && ' - Approaching limit'}
                    {limitData.percentage >= 100 && ' - Limit reached'}
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Usage Analytics</CardTitle>
                            <CardDescription>Track your feature usage and limits</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Warnings Section */}
                    {data.warnings.length > 0 && (
                        <div className="space-y-2">
                            {data.warnings.map((warning, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={`flex items-start gap-2 p-3 rounded-lg border ${getWarningColor(warning.severity)}`}
                                >
                                    {getWarningIcon(warning.severity)}
                                    <p className="text-sm font-medium flex-1">{warning.message}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* College License - No Limits */}
                    {data.subscription_type === 'college_license' && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <Zap className="h-5 w-5" />
                                <p className="font-semibold">Unlimited Access</p>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                                You have unlimited access to all features with your college license.
                            </p>
                        </div>
                    )}

                    {/* Daily/Weekly Tabs for Free and Premium */}
                    {data.subscription_type !== 'college_license' && (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="daily">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Daily Usage
                                </TabsTrigger>
                                <TabsTrigger value="weekly" disabled={data.subscription_type === 'free'}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Weekly Usage
                                    {data.subscription_type === 'free' && (
                                        <Badge variant="outline" className="ml-2 text-xs">Premium</Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="daily" className="space-y-4 mt-4">
                                {/* Reset Timer */}
                                {data.reset_dates.daily_counter_reset_date && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="text-sm font-medium">Resets in</span>
                                        </div>
                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                            {getTimeUntilReset(data.reset_dates.daily_counter_reset_date)}
                                        </span>
                                    </div>
                                )}

                                {/* Daily Limits */}
                                <div className="space-y-4">
                                    {Object.entries(data.limit_status)
                                        .filter(([key]) => key.includes('today') || key.includes('per_day'))
                                        .filter(([, value]) => typeof value === 'object' && value.used !== undefined)
                                        .map(([feature, limitData]) => renderLimitItem(feature, limitData as any))}
                                </div>
                            </TabsContent>

                            <TabsContent value="weekly" className="space-y-4 mt-4">
                                {/* Reset Timer */}
                                {data.reset_dates.weekly_counter_reset_date && (
                                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-sm font-medium">Resets in</span>
                                        </div>
                                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                                            {getTimeUntilReset(data.reset_dates.weekly_counter_reset_date)}
                                        </span>
                                    </div>
                                )}

                                {/* Weekly Limits */}
                                <div className="space-y-4">
                                    {Object.entries(data.limit_status)
                                        .filter(([key]) => key.includes('week') || key.includes('per_week'))
                                        .filter(([, value]) => typeof value === 'object' && value.used !== undefined)
                                        .map(([feature, limitData]) => renderLimitItem(feature, limitData as any))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {/* Current Usage Summary (for all types) */}
                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            <span className="font-semibold capitalize">{data.subscription_type.replace('_', ' ')}</span> Plan
                            {data.subscription_type === 'free' && ' • Upgrade for more features'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
