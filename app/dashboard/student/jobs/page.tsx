"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { 
    Home, 
    User, 
    FileText, 
    Briefcase, 
    ClipboardList,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Building,
    DollarSign,
    Target,
    Award,
    Sparkles,
    Upload,
    PlayCircle,
    Zap,
    BarChart3
} from 'lucide-react'
import { AxiosError } from 'axios'
import Link from 'next/link'
import { toast } from 'sonner'
import { AnimatedBackground } from '@/components/ui/animated-background'

const sidebarItems = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Profile', href: '/dashboard/student/profile', icon: User },
    { name: 'Resume', href: '/dashboard/student/resume', icon: FileText },
    { name: 'Job Recommendations', href: '/dashboard/student/jobs', icon: Briefcase },
    { name: 'Auto Job Apply', href: '/dashboard/student/auto-apply', icon: Zap },
    { name: 'Analytics', href: '/dashboard/student/analytics', icon: BarChart3 },
]

interface JobRecommendation {
    rank: number
    job_title: string
    job_role_id?: string
    match_score: number
    industry: string
    career_level: string
    key_skills_matched: string[]
    key_skills_required: string[]
    skills_gap: string[]
    match_reasons: string[]
    growth_potential: string
    typical_salary_range: string
    top_companies_hiring: string[]
}

interface JobRecommendationsData {
    overall_profile_summary: string
    primary_career_tracks: string[]
    recommendations: JobRecommendation[]
    skill_development_recommendations: string[]
    certification_recommendations: string[]
    overall_job_market_readiness: string
}

export default function JobRecommendationsPage() {
    const router = useRouter()
    const [recommendations, setRecommendations] = useState<JobRecommendationsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasResume, setHasResume] = useState(false)
    const [isCached, setIsCached] = useState(false)
    const [generatedAt, setGeneratedAt] = useState<string | null>(null)
    const [startingAssessment, setStartingAssessment] = useState<number | null>(null)
    const [activeAssessment, setActiveAssessment] = useState<any>(null)

    useEffect(() => {
        fetchJobRecommendations()
        checkActiveAssessment()
    }, [])

    const checkActiveAssessment = async () => {
        try {
            const data = await apiClient.getStudentAssessments(0, 5)
            const active = data.assessments?.find((a: any) => {
                const status = String(a.status || '').toLowerCase()
                return status === 'not_started' || status === 'in_progress'
            })
            setActiveAssessment(active || null)
        } catch (err) {
            console.error('Failed to check active assessment:', err)
        }
    }

    const handleStartAssessment = async (jobRoleId: string | undefined, jobTitle: string, jobRank: number) => {
        setStartingAssessment(jobRank)
        try {
            toast.info('Starting assessment for ' + jobTitle + '...')
            if (!jobRoleId) {
                throw new Error('Missing job role id for this recommendation')
            }
            const data = await apiClient.startAssessment(jobRoleId)
            
            // Check if this is a resumed assessment
            if (data.resumed) {
                toast.success('Resuming your active assessment...')
            } else {
                toast.success('Assessment started!')
            }
            
            router.push(`/dashboard/student/assessment?id=${data.assessment_id}`)
        } catch (err) {
            console.error('Failed to start assessment:', err)
            toast.error('Failed to start assessment. Please try again.')
        } finally {
            setStartingAssessment(null)
        }
    }

    const fetchJobRecommendations = async () => {
        setLoading(true)
        setError(null)

        try {
            console.log('🔍 Checking resume status...')
            // First check if resume exists
            const resumeStatus = await apiClient.getResumeStatus()
            console.log('📄 Resume status:', resumeStatus)
            console.log('📄 Resume status type:', typeof resumeStatus)
            console.log('📄 Resume status keys:', Object.keys(resumeStatus || {}))
            console.log('📄 has_resume value:', resumeStatus?.has_resume)
            console.log('📄 resume_uploaded value:', resumeStatus?.resume_uploaded)
            
            // ✅ FIX: Check resume_uploaded field (which verifies file exists) instead of just has_resume
            if (!resumeStatus || !resumeStatus.resume_uploaded) {
                console.log('❌ No resume found or file does not exist on disk')
                console.log('  resumeStatus exists:', !!resumeStatus)
                console.log('  has_resume:', resumeStatus?.has_resume)
                console.log('  resume_uploaded:', resumeStatus?.resume_uploaded)
                setHasResume(false)
                setError('No resume uploaded. Please upload your resume first to get personalized job recommendations.')
                return
            }

            console.log('✅ Resume found and verified, getting job recommendations...')
            // If resume exists, get job recommendations
            const data = await apiClient.getJobRecommendations()
            console.log('💼 Job recommendations:', data)
            console.log('💼 Job recommendations type:', typeof data)
            console.log('💼 Job recommendations keys:', Object.keys(data || {}))
            
            // Check if recommendations were cached
            if (data.model === 'cached' || data.message?.includes('cache')) {
                setIsCached(true)
                setGeneratedAt(data.generated_at || null)
            }
            
            setRecommendations(data)
            setHasResume(true)
        } catch (err) {
            console.error('❌ Error in fetchJobRecommendations:', err)
            const axiosError = err as AxiosError<{ detail: string }>
            const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'Failed to get job recommendations'
            
            console.error('Error details:', {
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                data: axiosError.response?.data,
                message: axiosError.message
            })
            
            if (axiosError.response?.status === 400) {
                setHasResume(false)
                setError('No resume uploaded. Please upload your resume first to get personalized job recommendations.')
            } else if (axiosError.response?.status === 401) {
                setError('Your session has expired. Please log out and log back in.')
            } else {
                setError(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    const getMatchScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30'
        if (score >= 70) return 'text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900/30'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
        return 'text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-gray-900/30'
    }

    const getGrowthPotentialColor = (potential: string) => {
        if (potential === 'High') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        if (potential === 'Medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }

    if (loading) {
        return (
            <DashboardLayout requiredUserType="student">
                <div className="flex flex-col items-center justify-center py-12 px-4 space-y-3 sm:space-y-4">
                    <Loader size="lg" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
                        Analyzing your resume and generating personalized job recommendations...
                    </p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout requiredUserType="student">
            {/* Background with same style as home page */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 gradient-bg">
                    <AnimatedBackground variant="default" />
                </div>
            </div>
            
            {/* Content with margin-top */}
            <div className="relative z-10 mt-20 sm:mt-28 md:mt-36 lg:mt-20 space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6 lg:px-8">
                    {/* Header */}
                    <div className="px-1 sm:px-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">Job Recommendations</h1>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                            AI-powered job suggestions based on your resume analysis
                        </p>
                    </div>

                {/* Active Assessment Banner */}
                {activeAssessment && (
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-[2px] mx-1 sm:mx-0">
                        <div className="relative rounded-lg sm:rounded-xl bg-white dark:bg-gray-900 p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col md:grid md:grid-cols-[auto,1fr,auto] items-start md:items-center gap-3 sm:gap-4 md:gap-5">
                                {/* icon */}
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg flex-shrink-0 self-start md:self-center">
                                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                {/* text */}
                                <div className="min-w-0 flex-1 w-full md:w-auto">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white break-words">Complete Your Active Assessment First!</h3>
                                        <Badge className="badge-primary border-0 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Action Required</Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 break-words">
                                        You have an incomplete assessment for <span className="font-semibold text-primary-600 dark:text-primary-400">{activeAssessment.job_role?.title}</span>. Please complete it before starting a new assessment.
                                    </p>
                                </div>
                                {/* cta */}
                                <div className="w-full md:w-auto flex-shrink-0 self-stretch md:self-center">
                                    <Button 
                                        onClick={() => router.push(`/dashboard/student/assessment?id=${activeAssessment.assessment_id}`)}
                                        className="w-full md:w-auto bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base h-10 sm:h-11 md:h-12"
                                        size="lg"
                                    >
                                        <ClipboardList className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                        <span className="hidden sm:inline">Go to Active Assessment</span>
                                        <span className="sm:hidden">Go to Assessment</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State - No Resume */}
                {!hasResume && error && (
                    <Card className="border-yellow-200 dark:border-yellow-800 mx-1 sm:mx-0">
                        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                <Upload className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-yellow-600 dark:text-yellow-500" />
                                <div className="space-y-1 sm:space-y-2">
                                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">No Resume Uploaded</h3>
                                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-md px-2 break-words">
                                        Upload your resume to get personalized job recommendations powered by AI.
                                    </p>
                                </div>
                                <Link href="/dashboard/student/resume" className="w-full sm:w-auto max-w-xs sm:max-w-none">
                                    <Button size="lg" className="w-full sm:w-auto text-xs sm:text-sm md:text-base h-10 sm:h-11 md:h-12">
                                        <Upload className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        Upload Resume
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State - Other Errors */}
                {hasResume && error && (
                    <Alert variant="destructive" className="text-xs sm:text-sm mx-1 sm:mx-0">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm break-words">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success State - Recommendations */}
                {recommendations && (
                    <>
                        {/* Cached Message */}
                        {isCached && (
                            <div className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/20 p-3 sm:p-4 mx-1 sm:mx-0">
                                <div className="mt-0.5 text-primary-600 flex-shrink-0"><AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" /></div>
                                <div className="text-xs sm:text-sm md:text-base text-primary-900 dark:text-primary-300 break-words">
                                    These job recommendations were generated from your current resume
                                    {generatedAt && ` on ${new Date(generatedAt).toLocaleString()}`}.
                                    Upload a new resume to get updated recommendations.
                                </div>
                            </div>
                        )}
                        
                        {/* Profile Summary Card */}
                        <Card className="border-primary-200 dark:border-primary-800 overflow-hidden mx-1 sm:mx-0">
                            <div className="relative">
                                <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rotate-45 bg-gradient-to-br from-primary-50/30 to-secondary-50/20 dark:from-primary-900/10 dark:to-secondary-900/10 opacity-30" />
                                <CardHeader className="p-3 sm:p-4 md:p-6 relative z-10">
                                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
                                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary-600 flex-shrink-0" />
                                        Your Profile Summary
                                    </CardTitle>
                                </CardHeader>
                            </div>
                            <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 relative z-10">
                                <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                                    {recommendations.overall_profile_summary}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                    <div>
                                        <h4 className="text-xs sm:text-sm md:text-base font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                            <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                            Primary Career Tracks
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {recommendations.primary_career_tracks && Array.isArray(recommendations.primary_career_tracks) ? recommendations.primary_career_tracks.map((track, idx) => (
                                                <Badge key={idx} variant="default" className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                                    {typeof track === 'string' ? track : JSON.stringify(track)}
                                                </Badge>
                                            )) : <span className="text-xs sm:text-sm text-gray-500">No career tracks available</span>}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <h4 className="text-xs sm:text-sm md:text-base font-semibold mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                            <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                            Job Market Readiness
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-500">
                                                {recommendations.overall_job_market_readiness}
                                            </div>
                                            <Badge className="badge-secondary text-[10px] sm:text-xs md:text-sm">AI Profile Score</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Recommendations Grid */}
                        <div className="space-y-3 sm:space-y-4 md:space-y-5">
                            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold gradient-text px-1 sm:px-0">Top {recommendations.recommendations?.length || 0} Job Matches</h2>

                            {recommendations.recommendations && Array.isArray(recommendations.recommendations) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 items-stretch">
                                    {recommendations.recommendations.map((job) => (
                                        <Card key={job.rank} className="relative rounded-xl sm:rounded-2xl card-hover p-0 flex flex-col h-full border border-gray-200 dark:border-gray-700 overflow-hidden mx-1 sm:mx-0">
                                            {/* Accent corner */}
                                            <div className="pointer-events-none absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rotate-45 bg-gradient-to-br from-primary-50/30 to-secondary-50/20 dark:from-primary-900/10 dark:to-secondary-900/10 opacity-30" style={{ zIndex: 0 }} />

                                            <CardHeader className="pt-3 sm:pt-4 md:pt-6 lg:pt-8 p-3 sm:p-4 md:p-6 relative z-10">
                                                {/* Number badge */}
                                                <div className="flex justify-center">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold shadow-md text-xs sm:text-sm md:text-base">{job.rank}</div>
                                                </div>
                                                <div className="text-center mt-2 sm:mt-3">
                                                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl line-clamp-2 break-words px-1">{job.job_title}</CardTitle>
                                                    <CardDescription className="mt-1 inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm flex-wrap justify-center px-1">
                                                        <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                                                        <span className="truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">{job.industry}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline">{job.career_level}</span>
                                                    </CardDescription>
                                                </div>
                                                <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs md:text-sm lg:text-base bg-white/70 dark:bg-gray-900/40 backdrop-blur border ${getMatchScoreColor(job.match_score)}`}>
                                                    {job.match_score}%
                                                </div>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col p-3 sm:p-4 md:p-5 lg:p-6 relative z-10">
                                                <div className="space-y-2.5 sm:space-y-3 md:space-y-4 flex-1">
                                                    {/* Match Reasons */}
                                                    <div>
                                                        <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-1.5 md:mb-2 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                                            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
                                                            Why You're a Good Fit
                                                        </h4>
                                                        <ul className="space-y-0.5 sm:space-y-1">
                                                            {job.match_reasons && Array.isArray(job.match_reasons) ? job.match_reasons.map((reason, idx) => (
                                                                <li key={idx} className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1 sm:gap-1.5 md:gap-2">
                                                                    <span className="text-green-600 mt-0.5 flex-shrink-0 text-xs sm:text-sm">✓</span>
                                                                    <span className="break-words leading-relaxed">{typeof reason === 'string' ? reason : JSON.stringify(reason)}</span>
                                                                </li>
                                                            )) : <li className="text-[10px] sm:text-xs md:text-sm text-gray-500">No match reasons available</li>}
                                                        </ul>
                                                    </div>

                                                    {/* Skills */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                                                        <div>
                                                            <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-1.5 md:mb-2 text-green-700 dark:text-green-500">
                                                                Your Matching Skills
                                                            </h4>
                                                            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                                                                {job.key_skills_matched && Array.isArray(job.key_skills_matched) ? job.key_skills_matched.map((skill, idx) => (
                                                                    <Badge key={idx} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[140px] sm:max-w-[180px] md:max-w-none">
                                                                        {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                                                    </Badge>
                                                                )) : <span className="text-[10px] sm:text-xs md:text-sm text-gray-500">No skills matched</span>}
                                                            </div>
                                                        </div>

                                                        {job.skills_gap && job.skills_gap.length > 0 && (
                                                            <div>
                                                                <h4 className="text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-1.5 md:mb-2 text-red-700 dark:text-red-500">
                                                                    Skills to Develop
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
                                                                    {job.skills_gap && Array.isArray(job.skills_gap) ? job.skills_gap.map((skill, idx) => (
                                                                        <Badge key={idx} variant="outline" className="border-red-300 text-red-800 dark:border-red-700 dark:text-red-400 text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[140px] sm:max-w-[180px] md:max-w-none">
                                                                            {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                                                        </Badge>
                                                                    )) : <span className="text-[10px] sm:text-xs md:text-sm text-gray-500">No skills gap</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Info */}
                                                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 w-full sm:w-auto">
                                                            <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{job.typical_salary_range}</span>
                                                        </div>
                                                        <Badge className={`${getGrowthPotentialColor(job.growth_potential)} text-[9px] sm:text-[10px] md:text-xs`}>
                                                            <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 mr-0.5 sm:mr-1" />
                                                            {job.growth_potential} Growth
                                                        </Badge>
                                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 w-full sm:w-auto sm:ml-auto">
                                                            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Top Hirers:</span>
                                                            {job.top_companies_hiring && Array.isArray(job.top_companies_hiring) ? job.top_companies_hiring.slice(0, 3).map((company, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[120px] sm:max-w-[150px] md:max-w-none">
                                                                    {typeof company === 'string' ? company : JSON.stringify(company)}
                                                                </Badge>
                                                            )) : <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400">No companies listed</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Start Assessment Button */}
                                                <div className="pt-2.5 sm:pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                                                    <Button 
                                                        className="w-full bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 lg:h-12" 
                                                        size="lg"
                                                        onClick={() => handleStartAssessment(job.job_role_id, job.job_title, job.rank)}
                                                        disabled={startingAssessment === job.rank || !!activeAssessment}
                                                    >
                                                        {startingAssessment === job.rank ? (
                                                            <>
                                                                <Loader size="sm" className="mr-1 sm:mr-1.5 md:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                                                                <span className="hidden sm:inline">Starting Assessment...</span>
                                                                <span className="sm:hidden">Starting...</span>
                                                            </>
                                                        ) : activeAssessment ? (
                                                            <>
                                                                <AlertCircle className="mr-1 sm:mr-1.5 md:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                                                <span className="hidden sm:inline">Complete Active Assessment First</span>
                                                                <span className="sm:hidden">Complete Active First</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="mr-1 sm:mr-1.5 md:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                                                <span className="hidden sm:inline">Start Assessment for this Role</span>
                                                                <span className="sm:hidden">Start Assessment</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 sm:py-8 px-4">
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No job recommendations available</p>
                                </div>
                            )}
                        </div>

                        {/* Skill Development Recommendations */}
                        <Card className="mx-1 sm:mx-0">
                            <CardHeader className="p-3 sm:p-4 md:p-6">
                                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
                                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                                    Recommended Skills to Develop
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {recommendations.skill_development_recommendations.map((skill, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certification Recommendations */}
                        <Card className="mx-1 sm:mx-0">
                            <CardHeader className="p-3 sm:p-4 md:p-6">
                                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
                                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
                                    Recommended Certifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {recommendations.certification_recommendations.map((cert, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                            {cert}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
