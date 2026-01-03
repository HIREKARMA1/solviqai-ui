"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import {
    FileText,
    Search,
    Eye,
    RefreshCw,
    Calendar,
    Clock,
    Users,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    Package
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DishaPackage {
    package_id: string
    assessment_name: string
    mode: string
    status: string
    time_window_start: string
    time_window_end: string
    rounds_count: number
    questions_count: number
    attempts_count: number
    created_at: string
    updated_at: string
}

export default function AdminDishaPage() {
    const [packages, setPackages] = useState<DishaPackage[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [selectedPackage, setSelectedPackage] = useState<DishaPackage | null>(null)
    const [packageDetails, setPackageDetails] = useState<any>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [showQuestions, setShowQuestions] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState(false)

    useEffect(() => {
        fetchPackages()
    }, [statusFilter])

    const fetchPackages = async () => {
        try {
            setLoading(true)
            const params: any = { limit: 100 }
            if (statusFilter) {
                params.status = statusFilter
            }
            const data = await apiClient.getAllDishaPackages(params)
            setPackages(data.packages || [])
        } catch (error: any) {
            console.error('Error fetching packages:', error)
            toast.error('Failed to load Disha packages')
        } finally {
            setLoading(false)
        }
    }

    const refreshPackages = async () => {
        try {
            setRefreshing(true)
            await fetchPackages()
            toast.success('Packages refreshed')
        } catch (error) {
            toast.error('Failed to refresh packages')
        } finally {
            setRefreshing(false)
        }
    }

    const fetchPackageDetails = async (packageId: string) => {
        try {
            setLoadingDetails(true)
            const status = await apiClient.getDishaPackageStatus(packageId)
            setPackageDetails(status)
            setSelectedPackage(packages.find(p => p.package_id === packageId) || null)

            // Auto-refresh if generating
            if (status.status === 'GENERATING') {
                setAutoRefresh(true)
            } else {
                setAutoRefresh(false)
            }
        } catch (error: any) {
            console.error('Error fetching package details:', error)
            toast.error('Failed to load package details')
        } finally {
            setLoadingDetails(false)
        }
    }

    const triggerQuestionGeneration = async (packageId: string) => {
        try {
            setGenerating(true)
            await apiClient.triggerDishaQuestionGeneration(packageId)
            toast.success('Question generation started')
            setAutoRefresh(true)
            // Refresh details after a short delay
            setTimeout(() => {
                fetchPackageDetails(packageId)
            }, 1000)
        } catch (error: any) {
            console.error('Error triggering generation:', error)
            toast.error(error.response?.data?.detail || 'Failed to trigger question generation')
        } finally {
            setGenerating(false)
        }
    }

    // Auto-refresh when generating
    useEffect(() => {
        if (autoRefresh && selectedPackage && packageDetails?.status === 'GENERATING') {
            const interval = setInterval(() => {
                fetchPackageDetails(selectedPackage.package_id)
            }, 3000) // Refresh every 3 seconds

            return () => clearInterval(interval)
        }
    }, [autoRefresh, selectedPackage, packageDetails?.status])

    const fetchPackageQuestions = async (packageId: string) => {
        try {
            setLoadingDetails(true)
            const questions = await apiClient.getDishaPackageQuestions(packageId)
            setPackageDetails(questions)
            setShowQuestions(true)
        } catch (error: any) {
            console.error('Error fetching questions:', error)
            toast.error('Failed to load questions')
        } finally {
            setLoadingDetails(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
            CREATED: { label: 'Created', variant: 'outline', icon: Package },
            GENERATING: { label: 'Generating', variant: 'secondary', icon: Loader2 },
            READY: { label: 'Ready', variant: 'default', icon: CheckCircle2 },
            PUBLISHED: { label: 'Published', variant: 'default', icon: CheckCircle2 },
            ACTIVE: { label: 'Active', variant: 'default', icon: CheckCircle2 },
            CLOSED: { label: 'Closed', variant: 'destructive', icon: XCircle },
        }

        const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: AlertCircle }
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const getModeBadge = (mode: string) => {
        return (
            <Badge variant={mode === 'HIRING' ? 'default' : 'secondary'}>
                {mode}
            </Badge>
        )
    }

    const filteredPackages = packages.filter(pkg =>
        pkg.assessment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.package_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout requiredUserType="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Disha Assessments</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage and monitor Disha assessment packages
                        </p>
                    </div>
                    <Button
                        onClick={refreshPackages}
                        disabled={refreshing}
                        variant="outline"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name or package ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="CREATED">Created</option>
                                    <option value="GENERATING">Generating</option>
                                    <option value="READY">Ready</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Packages List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredPackages.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No packages found
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredPackages.map((pkg) => (
                                <Card key={pkg.package_id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <CardTitle className="text-xl">{pkg.assessment_name}</CardTitle>
                                                    {getStatusBadge(pkg.status)}
                                                    {getModeBadge(pkg.mode)}
                                                </div>
                                                <CardDescription className="mt-1">
                                                    Package ID: <code className="text-xs">{pkg.package_id}</code>
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        fetchPackageDetails(pkg.package_id)
                                                        setShowQuestions(false)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Details
                                                </Button>
                                                {pkg.status === 'READY' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => fetchPackageQuestions(pkg.package_id)}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Questions
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">{pkg.rounds_count}</p>
                                                    <p className="text-xs text-gray-500">Rounds</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">{pkg.questions_count}</p>
                                                    <p className="text-xs text-gray-500">Questions</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">{pkg.attempts_count}</p>
                                                    <p className="text-xs text-gray-500">Attempts</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Created</p>
                                                </div>
                                            </div>
                                        </div>
                                        {pkg.time_window_start && pkg.time_window_end && (
                                            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {new Date(pkg.time_window_start).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} -
                                                    {' '}{new Date(pkg.time_window_end).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Package Details Modal */}
                {selectedPackage && packageDetails && (
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Package Details</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedPackage(null)
                                        setPackageDetails(null)
                                        setShowQuestions(false)
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingDetails ? (
                                <div className="flex justify-center py-8">
                                    <Loader />
                                </div>
                            ) : showQuestions ? (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Questions Preview</h3>
                                    {packageDetails.rounds?.map((round: any) => (
                                        <Card key={round.round_id} className="bg-gray-50 dark:bg-gray-900">
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    Round {round.round_number}: {round.round_name || round.round_type}
                                                </CardTitle>
                                                <CardDescription>
                                                    {round.questions_count} questions • {round.duration_minutes} minutes
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {round.questions?.map((q: any, idx: number) => (
                                                        <div key={q.question_id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className="text-sm font-medium text-gray-500">
                                                                    Q{idx + 1} ({q.points} pts)
                                                                </span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {q.question_type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm">{q.question_text}</p>
                                                            {q.options && (
                                                                <div className="mt-2 space-y-1">
                                                                    {q.options.map((opt: string, optIdx: number) => (
                                                                        <div key={optIdx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Status</p>
                                            <p className="mt-1">{getStatusBadge(packageDetails.status)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Mode</p>
                                            <p className="mt-1">{getModeBadge(packageDetails.mode)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Rounds</p>
                                            <p className="mt-1 text-lg font-semibold">{packageDetails.rounds_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Questions Generated</p>
                                            <p className="mt-1 text-lg font-semibold">
                                                {packageDetails.total_questions || 0} / {packageDetails.rounds_count * 20 || '?'}
                                            </p>
                                            {packageDetails.status === 'GENERATING' && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>Generating...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {packageDetails.time_window_start && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm font-medium text-gray-500 mb-2">Time Window</p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {new Date(packageDetails.time_window_start).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} -
                                                    {' '}{new Date(packageDetails.time_window_end).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Question Generation Progress */}
                                    {packageDetails.rounds_progress && packageDetails.rounds_progress.length > 0 && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm font-medium text-gray-500 mb-3">Generation Progress</p>
                                            <div className="space-y-2">
                                                {packageDetails.rounds_progress.map((round: any) => (
                                                    <div key={round.round_number} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">
                                                                Round {round.round_number}: {round.round_name || round.round_type}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                                        style={{
                                                                            width: `${round.expected_questions > 0
                                                                                ? (round.questions_generated / round.expected_questions) * 100
                                                                                : round.questions_generated > 0 ? 100 : 0}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {round.questions_generated} / {round.expected_questions || '?'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {round.questions_generated > 0 ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        {packageDetails.status !== 'READY' && packageDetails.status !== 'GENERATING' && (
                                            <Button
                                                variant="default"
                                                onClick={() => triggerQuestionGeneration(selectedPackage.package_id)}
                                                disabled={generating}
                                            >
                                                {generating ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Starting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Generate Questions
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {packageDetails.status === 'READY' && (
                                            <Button
                                                onClick={() => fetchPackageQuestions(selectedPackage.package_id)}
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Preview Questions
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}

