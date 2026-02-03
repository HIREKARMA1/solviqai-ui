"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
    Crown, Shield, Building2, Calendar, CheckCircle, 
    AlertCircle, Info, Sparkles, ArrowUpRight
} from 'lucide-react'

interface SubscriptionStatus {
    subscription_type: string
    subscription_expiry: string | null
    days_remaining: number | null
    is_active: boolean
    created_by_admin: boolean
    college_info: {
        id: string
        name: string
        license_type: string | null
        license_expiry: string | null
    } | null
    free_tests_used: number
    limits: {
        daily?: Record<string, number>
        weekly?: Record<string, number>
        note?: string
    }
}

export function SubscriptionStatusCard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<SubscriptionStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiClient.getStudentSubscriptionStatus()
            setData(response)
        } catch (err: any) {
            console.error('Error loading subscription status:', err)
            setError(err.response?.data?.detail || 'Failed to load subscription status')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
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
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const getPlanIcon = () => {
        switch (data.subscription_type) {
            case 'premium':
                return <Crown className="h-5 w-5" />
            case 'college_license':
                return <Building2 className="h-5 w-5" />
            default:
                return <Shield className="h-5 w-5" />
        }
    }

    const getPlanColor = () => {
        switch (data.subscription_type) {
            case 'premium':
                return 'bg-gradient-to-r from-yellow-500 to-amber-600'
            case 'college_license':
                return 'bg-gradient-to-r from-blue-500 to-indigo-600'
            default:
                return 'bg-gradient-to-r from-gray-500 to-slate-600'
        }
    }

    const getPlanBadgeColor = () => {
        switch (data.subscription_type) {
            case 'premium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'college_license':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getPlanLabel = () => {
        switch (data.subscription_type) {
            case 'premium':
                return 'Premium'
            case 'college_license':
                return 'College License'
            default:
                return 'Free'
        }
    }

    const getExpiryStatus = () => {
        if (!data.subscription_expiry || !data.days_remaining) return null

        if (data.days_remaining < 0) {
            return { color: 'text-red-600 dark:text-red-400', icon: AlertCircle, message: 'Expired' }
        } else if (data.days_remaining <= 7) {
            return { color: 'text-red-600 dark:text-red-400', icon: AlertCircle, message: `Expires in ${data.days_remaining} day${data.days_remaining !== 1 ? 's' : ''}` }
        } else if (data.days_remaining <= 30) {
            return { color: 'text-yellow-600 dark:text-yellow-400', icon: Info, message: `Expires in ${data.days_remaining} days` }
        } else {
            return { color: 'text-green-600 dark:text-green-400', icon: CheckCircle, message: `${data.days_remaining} days remaining` }
        }
    }

    const expiryStatus = getExpiryStatus()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden">
                <div className={`h-2 ${getPlanColor()}`} />
                
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getPlanColor()} text-white`}>
                                {getPlanIcon()}
                            </div>
                            <div>
                                <CardTitle className="text-xl">Subscription Status</CardTitle>
                                <CardDescription>Your current plan and benefits</CardDescription>
                            </div>
                        </div>
                        <Badge className={getPlanBadgeColor()}>
                            {getPlanLabel()}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Plan Details */}
                    <div className="grid gap-3">
                        {/* Expiry Info */}
                        {data.subscription_expiry && expiryStatus && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Validity</span>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold ${expiryStatus.color}`}>
                                    <expiryStatus.icon className="h-4 w-4" />
                                    <span>{expiryStatus.message}</span>
                                </div>
                            </div>
                        )}

                        {/* College Info */}
                        {data.college_info && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium">College</span>
                                </div>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    {data.college_info.name}
                                </span>
                            </div>
                        )}

                        {/* Account Source */}
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium">Account Created By</span>
                            </div>
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {data.created_by_admin ? 'College Admin' : 'Self-Registered'}
                            </span>
                        </div>

                        {/* Free Tests Info (for free users) */}
                        {data.subscription_type === 'free' && (
                            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <span className="text-sm font-medium">Free Tests Used</span>
                                </div>
                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                    {data.free_tests_used} / 1
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Plan Limits Summary */}
                    {data.limits.note && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                                ℹ️ {data.limits.note}
                            </p>
                        </div>
                    )}

                    {/* Upgrade CTA for Free Users */}
                    {data.subscription_type === 'free' && (
                        <div className="pt-2">
                            <Button 
                                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                                onClick={() => {
                                    // TODO: Implement upgrade flow
                                    alert('Upgrade flow coming soon!')
                                }}
                            >
                                <Crown className="h-4 w-4 mr-2" />
                                Upgrade to Premium
                                <ArrowUpRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Expiry Warning for Premium */}
                    {data.subscription_type === 'premium' && data.days_remaining && data.days_remaining <= 30 && (
                        <div className="pt-2">
                            <Button 
                                variant="outline"
                                className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                onClick={() => {
                                    // TODO: Implement renewal flow
                                    alert('Renewal flow coming soon!')
                                }}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Renew Subscription
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
