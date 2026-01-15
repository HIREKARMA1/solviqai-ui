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
    Package,
    Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DishaPackage {
    package_id: string
    assessment_name: string
    mode: string
    status: string
    time_window_start: string
    time_window_end: string
    is_expired?: boolean
    time_remaining_seconds?: number | null
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
    const [generationStatus, setGenerationStatus] = useState<Record<string, any>>({})

    useEffect(() => {
        fetchPackages()
    }, [statusFilter])

    // Poll for generation status on packages that are generating
    useEffect(() => {
        const generatingPackages = packages.filter(p => p.status === 'GENERATING')
        if (generatingPackages.length === 0) return

        const interval = setInterval(async () => {
            for (const pkg of generatingPackages) {
                try {
                    // Try to get detailed generation status first
                    let newStatus: any
                    try {
                        newStatus = await apiClient.getDishaGenerationStatus(pkg.package_id)
                    } catch {
                        // Fallback to regular status if generation-status endpoint fails
                        newStatus = await apiClient.getDishaPackageStatus(pkg.package_id)
                    }

                    setGenerationStatus(prev => ({
                        ...prev,
                        [pkg.package_id]: newStatus
                    }))

                    // If status changed from GENERATING, refresh packages list
                    if (newStatus.status && newStatus.status !== 'GENERATING') {
                        fetchPackages()
                    }
                } catch (error) {
                    console.error(`Error fetching generation status for ${pkg.package_id}:`, error)
                }
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(interval)
    }, [packages])

    const fetchPackages = async () => {
        try {
            setLoading(true)
            const params: any = { limit: 100, include_expired: true } // Include expired packages
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

    const deletePackage = async (packageId: string, packageName: string) => {
        if (!confirm(`Are you sure you want to delete "${packageName}"?\n\nThis will permanently delete the package and all associated data (rounds, questions, attempts). This action cannot be undone.`)) {
            return
        }

        try {
            await apiClient.deleteDishaPackage(packageId)
            toast.success('Package deleted successfully')
            // Refresh the list
            await fetchPackages()
            // Close details if this package was selected
            if (selectedPackage?.package_id === packageId) {
                setSelectedPackage(null)
                setPackageDetails(null)
            }
        } catch (error: any) {
            console.error('Error deleting package:', error)
            toast.error(error?.response?.data?.detail || 'Failed to delete package')
        }
    }

    const formatTimeRemaining = (seconds: number | null | undefined): string => {
        if (!seconds || seconds < 0) return 'Expired'

        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
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
                                            <div className="flex gap-2 flex-wrap">
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
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => fetchPackageQuestions(pkg.package_id)}
                                                        >
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Questions
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => window.location.href = `/dashboard/admin/disha/${pkg.package_id}/exam`}
                                                        >
                                                            Take Exam
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => window.location.href = `/dashboard/admin/disha/${pkg.package_id}/reports`}
                                                        >
                                                            View Reports
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deletePackage(pkg.package_id, pkg.assessment_name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        {pkg.status === 'GENERATING' && generationStatus[pkg.package_id]
                                                            ? (
                                                                <>
                                                                    {generationStatus[pkg.package_id].total_questions || 0} / {generationStatus[pkg.package_id].total_expected_questions || 0}
                                                                    {generationStatus[pkg.package_id].overall_completion_percent !== undefined && (
                                                                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                                                                            ({generationStatus[pkg.package_id].overall_completion_percent.toFixed(0)}%)
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )
                                                            : pkg.questions_count}
                                                    </p>
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
                                        {/* Generation Progress Bar */}
                                        {pkg.status === 'GENERATING' && generationStatus[pkg.package_id] && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                            Generating Questions...
                                                        </span>
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                    </div>

                                                    {/* Overall Progress */}
                                                    {generationStatus[pkg.package_id].total_expected_questions && (
                                                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                                    Overall Progress
                                                                </span>
                                                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                                    {generationStatus[pkg.package_id].total_questions || 0} / {generationStatus[pkg.package_id].total_expected_questions} questions
                                                                    {generationStatus[pkg.package_id].overall_completion_percent !== undefined && (
                                                                        <span className="ml-1">
                                                                            ({generationStatus[pkg.package_id].overall_completion_percent.toFixed(1)}%)
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                                <div
                                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            generationStatus[pkg.package_id].overall_completion_percent || 0,
                                                                            100
                                                                        )}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Per-Round Progress */}
                                                    {generationStatus[pkg.package_id].rounds_progress && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                                Round Progress ({generationStatus[pkg.package_id].rounds_progress.filter((r: any) => r.is_complete).length} / {generationStatus[pkg.package_id].rounds_progress.length} complete)
                                                            </p>
                                                            {generationStatus[pkg.package_id].rounds_progress.map((round: any, idx: number) => {
                                                                // Support both field names for compatibility
                                                                const generated = round.questions_generated ?? round.generated_questions ?? 0
                                                                const expected = round.expected_questions ?? 0

                                                                const progress = round.completion_percent !== undefined
                                                                    ? round.completion_percent
                                                                    : expected > 0
                                                                        ? (generated / expected) * 100
                                                                        : generated > 0 ? 100 : 0
                                                                const isComplete = round.is_complete !== undefined
                                                                    ? round.is_complete
                                                                    : (generated >= expected * 0.9 && expected > 0)  // 90% tolerance

                                                                return (
                                                                    <div key={idx} className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                                                Round {round.round_number}/{generationStatus[pkg.package_id].rounds_progress.length}: {round.round_name || round.round_type}
                                                                            </span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                                    {generated} / {expected}
                                                                                    {round.completion_percent !== undefined && (
                                                                                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                                                                                            ({round.completion_percent.toFixed(1)}%)
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                                {isComplete ? (
                                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                                ) : (
                                                                                    <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                                            <div
                                                                                className={`h-2 rounded-full transition-all duration-300 ${isComplete
                                                                                    ? 'bg-green-600'
                                                                                    : 'bg-blue-600'
                                                                                    }`}
                                                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {pkg.time_window_start && pkg.time_window_end && (
                                            <div className={`mt-4 pt-4 border-t ${pkg.status === 'GENERATING' ? '' : 'mt-4'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            {new Date(pkg.time_window_start).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} -
                                                            {' '}{new Date(pkg.time_window_end).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {pkg.is_expired ? (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Expired
                                                        </Badge>
                                                    ) : pkg.time_remaining_seconds !== null && pkg.time_remaining_seconds !== undefined ? (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatTimeRemaining(pkg.time_remaining_seconds)} remaining
                                                        </Badge>
                                                    ) : null}
                                                </div>
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
                                                {packageDetails.total_questions || 0} / {packageDetails.total_expected_questions ?? (packageDetails.rounds_count * 20) ?? '?'}
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

                                            {/* Overall Progress Summary */}
                                            {(packageDetails.total_expected_questions || packageDetails.overall_completion_percent !== undefined) && (
                                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                            Overall Progress
                                                        </span>
                                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                            {packageDetails.total_questions || 0} / {packageDetails.total_expected_questions || 0} questions
                                                            {packageDetails.overall_completion_percent !== undefined && (
                                                                <span className="ml-1">
                                                                    ({packageDetails.overall_completion_percent.toFixed(1)}%)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                                                        <div
                                                            className={`h-3 rounded-full transition-all ${packageDetails.is_complete
                                                                ? 'bg-green-600'
                                                                : 'bg-blue-600'
                                                                }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    packageDetails.overall_completion_percent || 0,
                                                                    100
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>
                                                    {packageDetails.is_generating && (
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Generating in parallel...
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Per-Round Progress */}
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                    Round Details ({packageDetails.rounds_progress.filter((r: any) => r.is_complete).length} / {packageDetails.rounds_progress.length} complete)
                                                </p>
                                                {packageDetails.rounds_progress.map((round: any) => {
                                                    // Support both field names for compatibility
                                                    const generated = round.questions_generated ?? round.generated_questions ?? 0
                                                    const expected = round.expected_questions ?? 0

                                                    const progress = round.completion_percent !== undefined
                                                        ? round.completion_percent
                                                        : expected > 0
                                                            ? (generated / expected) * 100
                                                            : generated > 0 ? 100 : 0
                                                    const isComplete = round.is_complete !== undefined
                                                        ? round.is_complete
                                                        : (generated >= expected * 0.9 && expected > 0)  // 90% tolerance

                                                    return (
                                                        <div key={round.round_number} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        Round {round.round_number}/{packageDetails.rounds_progress.length}: {round.round_name || round.round_type}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                            {generated} / {expected || '?'}
                                                                            {round.completion_percent !== undefined && (
                                                                                <span className="ml-1 text-blue-600 dark:text-blue-400">
                                                                                    ({round.completion_percent.toFixed(1)}%)
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        {isComplete ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        ) : (
                                                                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                                    <div
                                                                        className={`h-2.5 rounded-full transition-all ${isComplete
                                                                            ? 'bg-green-600'
                                                                            : 'bg-blue-600'
                                                                            }`}
                                                                        style={{
                                                                            width: `${Math.min(progress, 100)}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        {/* Show Preview Questions if any questions exist, regardless of status */}
                                        {packageDetails.total_questions > 0 && (
                                            <Button
                                                onClick={() => fetchPackageQuestions(selectedPackage.package_id)}
                                                variant="default"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Preview Questions ({packageDetails.total_questions})
                                            </Button>
                                        )}
                                        {/* Show Generate/Retry button if generation is incomplete or failed */}
                                        {packageDetails.status !== 'READY' && packageDetails.status !== 'GENERATING' && (
                                            <Button
                                                variant={packageDetails.total_questions > 0 ? "outline" : "default"}
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
                                                        {packageDetails.total_questions > 0 ? 'Retry Generation' : 'Generate Questions'}
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {/* Show status message if generation is incomplete */}
                                        {packageDetails.status === 'CREATED' && packageDetails.total_questions > 0 && (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <AlertCircle className="h-4 w-4" />
                                                Some rounds failed. Click "Retry Generation" to complete.
                                            </p>
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

