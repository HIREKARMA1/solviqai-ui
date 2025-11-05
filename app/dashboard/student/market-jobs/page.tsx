"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { 
    Search, 
    Briefcase, 
    MapPin, 
    Calendar, 
    ExternalLink,
    RefreshCw,
    Building,
    AlertCircle,
    Sparkles
} from 'lucide-react'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { motion } from 'framer-motion'

interface MarketJob {
    title: string
    company: string
    location: string
    url: string
    posted_date: string
    source: string
    keyword: string
}

export default function MarketJobsPage() {
    const [jobs, setJobs] = useState<MarketJob[]>([])
    const [loading, setLoading] = useState(false)
    const [keywords, setKeywords] = useState('')
    const [location, setLocation] = useState('India')
    const [maxJobs, setMaxJobs] = useState<number | string>(15)
    const [includeResumeSkills, setIncludeResumeSkills] = useState(false)
    const [selectedSources, setSelectedSources] = useState<string[]>(['linkedin']) // NEW
    const [error, setError] = useState<string | null>(null)
    const [keywordsUsed, setKeywordsUsed] = useState<string[]>([])
    const [resumeSkills, setResumeSkills] = useState<string[]>([])
    const [hasResumeSkills, setHasResumeSkills] = useState(false)
    const [loadingSkills, setLoadingSkills] = useState(false)

    // Fetch resume skills when checkbox is checked
    useEffect(() => {
        if (includeResumeSkills && !hasResumeSkills && resumeSkills.length === 0) {
            fetchResumeSkills()
        }
    }, [includeResumeSkills])

    const fetchResumeSkills = async () => {
        setLoadingSkills(true)
        try {
            const data = await apiClient.getResumeSkills()
            if (data.has_resume_skills) {
                setResumeSkills(data.all_skills || [])
                setHasResumeSkills(true)
            } else {
                setHasResumeSkills(false)
                toast.info('No resume skills found. Please upload and analyze your resume first.')
            }
        } catch (err) {
            console.error('Error fetching resume skills:', err)
            toast.error('Failed to fetch resume skills')
        } finally {
            setLoadingSkills(false)
        }
    }

    const fetchMarketJobs = async () => {
        setLoading(true)
        setError(null)

        try {
            const sourcesStr = selectedSources.join(',')
            const platformNames = selectedSources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' and ')
            toast.info(`Fetching live jobs from ${platformNames}... This may take 10-60 seconds`)
            
            const jobCount = typeof maxJobs === 'string' ? parseInt(maxJobs) || 15 : maxJobs
            
            const data = await apiClient.getMarketJobs(
                keywords || undefined,
                location,
                jobCount,
                includeResumeSkills,
                sourcesStr
            )
            
            setJobs(data.jobs || [])
            setKeywordsUsed(data.keywords_used || [])
            
            toast.success(`Found ${data.total_jobs} jobs from ${platformNames}!`)
        } catch (err) {
            console.error('Error fetching market jobs:', err)
            const axiosError = err as AxiosError<{ detail: string }>
            const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'Failed to fetch market jobs'
            
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }
    
    const toggleSource = (source: string) => {
        setSelectedSources(prev => 
            prev.includes(source) 
                ? prev.filter(s => s !== source)
                : [...prev, source]
        )
    }

    return (
        <DashboardLayout requiredUserType="student">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 gradient-bg">
                    <AnimatedBackground variant="default" />
                </div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 mt-20 space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-teal-200/30 to-cyan-200/20 blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold">
                                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                    Available Jobs in Market
                                </span>
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Browse real-time job listings from LinkedIn and Unstop based on your skills
                        </p>
                    </div>
                </motion.div>

                {/* Search Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Jobs
                        </CardTitle>
                        <CardDescription>
                            Enter keywords to search (leave empty to use your profile skills)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Keywords (comma-separated)
                                </label>
                                <Input
                                    placeholder="e.g., software engineer, data analyst"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Location
                                </label>
                                <Input
                                    placeholder="e.g., India, Bangalore"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Job Source Selection */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Job Platforms
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleSource('linkedin')}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            selectedSources.includes('linkedin')
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            LinkedIn
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleSource('unstop')}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            selectedSources.includes('unstop')
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            Unstop
                                        </div>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Select one or more platforms to search
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-2 block">
                                        Max Jobs Per Platform (1-15)
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={maxJobs}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            if (value === '') {
                                                setMaxJobs('')
                                            } else {
                                                const num = parseInt(value)
                                                if (!isNaN(num)) {
                                                    setMaxJobs(Math.min(15, Math.max(1, num)))
                                                }
                                            }
                                        }}
                                        onBlur={() => {
                                            if (maxJobs === '' || maxJobs === 0) {
                                                setMaxJobs(15)
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    onClick={fetchMarketJobs}
                                    disabled={loading || selectedSources.length === 0}
                                    size="lg"
                                    className="mt-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                                >
                                {loading ? (
                                    <>
                                        <Loader size="sm" className="mr-2" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search Jobs
                                    </>
                                )}
                            </Button>
                        </div>

                            {/* Checkbox for including resume skills */}
                            <div className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800">
                                <input
                                    type="checkbox"
                                    id="includeResumeSkills"
                                    checked={includeResumeSkills}
                                    onChange={(e) => setIncludeResumeSkills(e.target.checked)}
                                    disabled={loading}
                                    className="w-4 h-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                                />
                                <label 
                                    htmlFor="includeResumeSkills" 
                                    className="text-sm font-medium cursor-pointer select-none"
                                >
                                    Include skills extracted from my resume
                                </label>
                            </div>

                            {/* Display resume skills when checkbox is checked */}
                            {includeResumeSkills && (
                                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    {loadingSkills ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Loader size="sm" />
                                            <span>Loading resume skills...</span>
                                        </div>
                                    ) : hasResumeSkills && resumeSkills.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Top 5 skills from your resume:
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {resumeSkills.slice(0, 5).map((skill, idx) => (
                                                    <Badge 
                                                        key={idx} 
                                                        className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                These skills will be added to your search keywords
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>No resume skills found. Upload and analyze your resume first.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {keywordsUsed.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Searching for:</span>
                                {keywordsUsed.map((keyword, idx) => (
                                    <Badge 
                                        key={idx} 
                                        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                                    >
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Error Message */}
                {error && (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <p className="text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {jobs.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold gradient-text">
                            {jobs.length} Jobs Found
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
                                        <div className="absolute -top-8 -right-8 w-32 h-32 rotate-45 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 group-hover:scale-110 transition-transform" />
                                        
                                        <CardHeader className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge 
                                                    className={
                                                        job.source === 'LinkedIn' 
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                                    }
                                                >
                                                    {job.source}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg line-clamp-2">
                                                {job.title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-2">
                                                <Building className="h-4 w-4" />
                                                <span className="font-medium">{job.company}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        
                                        <CardContent className="space-y-3 relative z-10">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <MapPin className="h-4 w-4" />
                                                {job.location}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4" />
                                                {job.posted_date}
                                            </div>

                                            <Button
                                                onClick={() => window.open(job.url, '_blank')}
                                                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white mt-4"
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View on {job.source}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && jobs.length === 0 && !error && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30">
                                    <Briefcase className="h-12 w-12 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        No Jobs Yet
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                        Click "Search Jobs" to find available positions in the market based on your skills or custom keywords
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
