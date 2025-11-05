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
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader size="lg" />
                    <p className="text-gray-600 dark:text-gray-400">
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
            <div className="relative z-10 mt-20 space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">Job Recommendations</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            AI-powered job suggestions based on your resume analysis
                        </p>
                    </div>

                {/* Active Assessment Banner */}
                {activeAssessment && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 p-[2px]">
                        <div className="relative rounded-xl bg-white dark:bg-gray-900 p-6">
                            <div className="grid md:grid-cols-[auto,1fr,auto] items-center gap-5">
                                {/* icon */}
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                {/* text */}
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Complete Your Active Assessment First!</h3>
                                        <Badge className="badge-primary border-0">Action Required</Badge>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        You have an incomplete assessment for <span className="font-semibold text-primary-600 dark:text-primary-400">{activeAssessment.job_role?.title}</span>. Please complete it before starting a new assessment.
                                    </p>
                                </div>
                                {/* cta */}
                                <div className="w-full md:w-auto">
                                    <Button 
                                        onClick={() => router.push(`/dashboard/student/assessment?id=${activeAssessment.assessment_id}`)}
                                        className="w-full md:w-auto bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl"
                                        size="lg"
                                    >
                                        <ClipboardList className="mr-2 h-5 w-5" />
                                        Go to Active Assessment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State - No Resume */}
                {!hasResume && error && (
                    <Card className="border-yellow-200 dark:border-yellow-800">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Upload className="h-16 w-16 text-yellow-600 dark:text-yellow-500" />
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Resume Uploaded</h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                        Upload your resume to get personalized job recommendations powered by AI.
                                    </p>
                                </div>
                                <Link href="/dashboard/student/resume">
                                    <Button size="lg">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Resume
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error State - Other Errors */}
                {hasResume && error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success State - Recommendations */}
                {recommendations && (
                    <>
                        {/* Cached Message */}
                        {isCached && (
                            <div className="flex items-start gap-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-900/20 p-4">
                                <div className="mt-0.5 text-primary-600"><AlertCircle className="h-5 w-5" /></div>
                                <div className="text-sm text-primary-900 dark:text-primary-300">
                                    These job recommendations were generated from your current resume
                                    {generatedAt && ` on ${new Date(generatedAt).toLocaleString()}`}.
                                    Upload a new resume to get updated recommendations.
                                </div>
                            </div>
                        )}
                        
                        {/* Profile Summary Card */}
                        <Card className="border-primary-200 dark:border-primary-800 overflow-hidden">
                            <div className="relative">
                                <div className="absolute -top-8 -right-8 w-40 h-40 rotate-45 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary-600" />
                                        Your Profile Summary
                                    </CardTitle>
                                </CardHeader>
                            </div>
                            <CardContent className="space-y-6">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {recommendations.overall_profile_summary}
                                </p>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Primary Career Tracks
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {recommendations.primary_career_tracks && Array.isArray(recommendations.primary_career_tracks) ? recommendations.primary_career_tracks.map((track, idx) => (
                                                <Badge key={idx} variant="default" className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                                    {typeof track === 'string' ? track : JSON.stringify(track)}
                                                </Badge>
                                            )) : <span className="text-sm text-gray-500">No career tracks available</span>}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <Award className="h-4 w-4" />
                                            Job Market Readiness
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-500">
                                                {recommendations.overall_job_market_readiness}
                                            </div>
                                            <Badge className="badge-secondary">AI Profile Score</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Recommendations Grid */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold gradient-text">Top {recommendations.recommendations?.length || 0} Job Matches</h2>

                            {recommendations.recommendations && Array.isArray(recommendations.recommendations) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {recommendations.recommendations.map((job) => (
                                        <Card key={job.rank} className="relative overflow-hidden rounded-2xl card-hover p-0">
                                            {/* Accent corner */}
                                            <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rotate-45 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20" />

                                            <CardHeader className="pt-8">
                                                {/* Number badge */}
                                                <div className="flex justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold shadow-md">{job.rank}</div>
                                                </div>
                                                <div className="text-center mt-3">
                                                    <CardTitle className="text-xl">{job.job_title}</CardTitle>
                                                    <CardDescription className="mt-1 inline-flex items-center gap-2">
                                                        <Building className="h-4 w-4" />
                                                        {job.industry} • {job.career_level}
                                                    </CardDescription>
                                                </div>
                                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-lg font-bold text-sm md:text-base bg-white/70 dark:bg-gray-900/40 backdrop-blur border ${getMatchScoreColor(job.match_score)}`}>
                                                    {job.match_score}%
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* Match Reasons */}
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        Why You're a Good Fit
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {job.match_reasons && Array.isArray(job.match_reasons) ? job.match_reasons.map((reason, idx) => (
                                                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                                <span className="text-green-600 mt-0.5">✓</span>
                                                                <span>{typeof reason === 'string' ? reason : JSON.stringify(reason)}</span>
                                                            </li>
                                                        )) : <li className="text-sm text-gray-500">No match reasons available</li>}
                                                    </ul>
                                                </div>

                                                {/* Skills */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-500">
                                                            Your Matching Skills
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {job.key_skills_matched && Array.isArray(job.key_skills_matched) ? job.key_skills_matched.map((skill, idx) => (
                                                                <Badge key={idx} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                    {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                                                </Badge>
                                                            )) : <span className="text-sm text-gray-500">No skills matched</span>}
                                                        </div>
                                                    </div>

                                                    {job.skills_gap && job.skills_gap.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold mb-2 text-red-700 dark:text-red-500">
                                                                Skills to Develop
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.skills_gap && Array.isArray(job.skills_gap) ? job.skills_gap.map((skill, idx) => (
                                                                    <Badge key={idx} variant="outline" className="border-red-300 text-red-800 dark:border-red-700 dark:text-red-400">
                                                                        {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                                                    </Badge>
                                                                )) : <span className="text-sm text-gray-500">No skills gap</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bottom Info */}
                                                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.typical_salary_range}</span>
                                                    </div>
                                                    <Badge className={getGrowthPotentialColor(job.growth_potential)}>
                                                        <TrendingUp className="h-3 w-3 mr-1" />
                                                        {job.growth_potential} Growth
                                                    </Badge>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Top Hirers:</span>
                                                        {job.top_companies_hiring && Array.isArray(job.top_companies_hiring) ? job.top_companies_hiring.slice(0, 3).map((company, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {typeof company === 'string' ? company : JSON.stringify(company)}
                                                            </Badge>
                                                        )) : <span className="text-sm text-gray-500 dark:text-gray-400">No companies listed</span>}
                                                    </div>
                                                </div>

                                                {/* Start Assessment Button */}
                                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                                                    <Button 
                                                        className="w-full bg-primary-500 hover:bg-primary-600 text-white" 
                                                        size="lg"
                                                        onClick={() => handleStartAssessment(job.job_role_id, job.job_title, job.rank)}
                                                        disabled={startingAssessment === job.rank || !!activeAssessment}
                                                    >
                                                        {startingAssessment === job.rank ? (
                                                            <>
                                                                <Loader size="sm" className="mr-2" />
                                                                Starting Assessment...
                                                            </>
                                                        ) : activeAssessment ? (
                                                            <>
                                                                <AlertCircle className="mr-2 h-5 w-5" />
                                                                Complete Active Assessment First
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="mr-2 h-5 w-5" />
                                                                Start Assessment for this Role
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">No job recommendations available</p>
                                </div>
                            )}
                        </div>

                        {/* Skill Development Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Recommended Skills to Develop
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.skill_development_recommendations.map((skill, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-sm">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Certification Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Recommended Certifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.certification_recommendations.map((cert, idx) => (
                                        <Badge key={idx} variant="outline" className="text-sm">
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
