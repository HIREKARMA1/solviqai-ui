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
    Sparkles,
    Filter,
    SortAsc,
    SortDesc,
    Grid3x3,
    List,
    X,
    Bookmark,
    BookmarkCheck
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
    const [filteredJobs, setFilteredJobs] = useState<MarketJob[]>([])
    const [loading, setLoading] = useState(false)
    const [keywords, setKeywords] = useState('')
    const [location, setLocation] = useState('India')
    const [maxJobs, setMaxJobs] = useState<number | string>(15)
    const [includeResumeSkills, setIncludeResumeSkills] = useState(false)
    const [selectedSources, setSelectedSources] = useState<string[]>(['linkedin'])
    const [error, setError] = useState<string | null>(null)
    const [keywordsUsed, setKeywordsUsed] = useState<string[]>([])
    const [resumeSkills, setResumeSkills] = useState<string[]>([])
    const [hasResumeSkills, setHasResumeSkills] = useState(false)
    const [loadingSkills, setLoadingSkills] = useState(false)
    
    // New filter states
    const [filterSource, setFilterSource] = useState<string>('all')
    const [filterCompany, setFilterCompany] = useState<string>('')
    const [filterLocation, setFilterLocation] = useState<string>('')
    const [sortBy, setSortBy] = useState<'company' | 'title'>('company')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
    const [showFilters, setShowFilters] = useState(false)

    // Fetch resume skills when checkbox is checked
    useEffect(() => {
        if (includeResumeSkills && !hasResumeSkills && resumeSkills.length === 0) {
            fetchResumeSkills()
        }
    }, [includeResumeSkills])
    
    // Apply filters and sorting when jobs or filter criteria change
    useEffect(() => {
        applyFiltersAndSort()
    }, [jobs, filterSource, filterCompany, filterLocation, sortBy])
    
    const applyFiltersAndSort = () => {
        let filtered = [...jobs]
        
        // Filter by source
        if (filterSource !== 'all') {
            filtered = filtered.filter(job => job.source.toLowerCase() === filterSource.toLowerCase())
        }
        
        // Filter by company
        if (filterCompany) {
            filtered = filtered.filter(job => 
                job.company.toLowerCase().includes(filterCompany.toLowerCase())
            )
        }
        
        // Filter by location
        if (filterLocation) {
            filtered = filtered.filter(job => 
                job.location.toLowerCase().includes(filterLocation.toLowerCase())
            )
        }
        
        // Sort
        switch (sortBy) {
            case 'company':
                filtered.sort((a, b) => a.company.localeCompare(b.company))
                break
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title))
                break
            default:
                break
        }
        
        setFilteredJobs(filtered)
    }
    
    const toggleSaveJob = (jobUrl: string) => {
        setSavedJobs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(jobUrl)) {
                newSet.delete(jobUrl)
                toast.info('Job removed from saved')
            } else {
                newSet.add(jobUrl)
                toast.success('Job saved!')
            }
            return newSet
        })
    }
    
    const clearAllFilters = () => {
        setFilterSource('all')
        setFilterCompany('')
        setFilterLocation('')
        setSortBy('company')
    }
    
    const getUniqueCompanies = () => {
        const companies = new Set(jobs.map(job => job.company))
        return Array.from(companies).sort()
    }
    
    const getUniqueLocations = () => {
        const locations = new Set(jobs.map(job => job.location))
        return Array.from(locations).sort()
    }

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
        // Validate: require keywords or resume skills
        if (!keywords.trim() && !includeResumeSkills) {
            toast.error('Please enter keywords or enable "Include skills from resume" to search')
            return
        }
        
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
    
    const selectAllSources = () => {
        setSelectedSources(['linkedin', 'unstop', 'foundit', 'naukri'])
    }
    
    const deselectAllSources = () => {
        setSelectedSources([])
    }
    
    const getJobStats = () => {
        if (jobs.length === 0) return null
        
        const stats = {
            linkedin: jobs.filter(j => j.source === 'LinkedIn').length,
            unstop: jobs.filter(j => j.source === 'Unstop').length,
            foundit: jobs.filter(j => j.source === 'Foundit').length,
            naukri: jobs.filter(j => j.source === 'Naukri').length,
        }
        
        return stats
    }
    
    const copyJobInfo = (job: MarketJob) => {
        const text = `${job.title}\n${job.company}\n${job.location}\n${job.url}`
        navigator.clipboard.writeText(text)
        toast.success('Job info copied to clipboard!')
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
                            Browse real-time job listings from LinkedIn, Unstop, Foundit, and Naukri based on your skills
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
                            Enter keywords OR enable resume skills to search for jobs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Keywords (comma-separated) *
                                </label>
                                <Input
                                    placeholder="e.g., software engineer, data analyst (Required if resume skills not enabled)"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    disabled={loading}
                                    className={!keywords.trim() && !includeResumeSkills ? 'border-amber-300 dark:border-amber-700' : ''}
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">
                                        Job Platforms
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllSources}
                                            disabled={loading}
                                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-xs text-gray-400">|</span>
                                        <button
                                            type="button"
                                            onClick={deselectAllSources}
                                            disabled={loading}
                                            className="text-xs text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
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
                                    <button
                                        type="button"
                                        onClick={() => toggleSource('foundit')}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            selectedSources.includes('foundit')
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            Foundit
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleSource('naukri')}
                                        disabled={loading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                            selectedSources.includes('naukri')
                                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            Naukri
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
                                    disabled={loading || selectedSources.length === 0 || (!keywords.trim() && !includeResumeSkills)}
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
                        
                        {/* Validation Message */}
                        {!keywords.trim() && !includeResumeSkills && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="h-4 w-4" />
                                <span>Please enter keywords or enable resume skills to start searching</span>
                            </div>
                        )}

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
                                    Include skills extracted from my resume (Alternative to keywords)
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
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {getJobStats()?.linkedin || 0}
                                        </div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">LinkedIn</div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                            {getJobStats()?.unstop || 0}
                                        </div>
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Unstop</div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {getJobStats()?.foundit || 0}
                                        </div>
                                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">Foundit</div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {getJobStats()?.naukri || 0}
                                        </div>
                                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Naukri</div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-800/20 border-teal-200 dark:border-teal-800">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                                            {savedJobs.size}
                                        </div>
                                        <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">Saved</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Results Header with Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold gradient-text">
                                {filteredJobs.length} of {jobs.length} Jobs
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {/* View Toggle */}
                                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded transition-all ${
                                            viewMode === 'grid'
                                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                        title="Grid View"
                                    >
                                        <Grid3x3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                        title="List View"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                {/* Filter Toggle */}
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {(filterSource !== 'all' || filterCompany || filterLocation) && (
                                        <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-teal-500 text-white">
                                            {[filterSource !== 'all', filterCompany, filterLocation].filter(Boolean).length}
                                        </Badge>
                                    )}
                                </Button>
                                
                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="company">Company A-Z</option>
                                    <option value="title">Job Title A-Z</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Filter Panel */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                                    <CardContent className="pt-6">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            {/* Source Filter */}
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Platform
                                                </label>
                                                <select
                                                    value={filterSource}
                                                    onChange={(e) => setFilterSource(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="all">All Platforms</option>
                                                    <option value="linkedin">LinkedIn</option>
                                                    <option value="unstop">Unstop</option>
                                                    <option value="foundit">Foundit</option>
                                                    <option value="naukri">Naukri</option>
                                                </select>
                                            </div>
                                            
                                            {/* Company Filter */}
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Company
                                                </label>
                                                <Input
                                                    placeholder="Filter by company..."
                                                    value={filterCompany}
                                                    onChange={(e) => setFilterCompany(e.target.value)}
                                                    className="h-10"
                                                />
                                            </div>
                                            
                                            {/* Location Filter */}
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Location
                                                </label>
                                                <Input
                                                    placeholder="Filter by location..."
                                                    value={filterLocation}
                                                    onChange={(e) => setFilterLocation(e.target.value)}
                                                    className="h-10"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Active Filters */}
                                        {(filterSource !== 'all' || filterCompany || filterLocation) && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-wrap gap-2">
                                                        {filterSource !== 'all' && (
                                                            <Badge className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                {filterSource}
                                                                <X 
                                                                    className="h-3 w-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100"
                                                                    onClick={() => setFilterSource('all')}
                                                                />
                                                            </Badge>
                                                        )}
                                                        {filterCompany && (
                                                            <Badge className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                                Company: {filterCompany}
                                                                <X 
                                                                    className="h-3 w-3 cursor-pointer hover:text-green-900 dark:hover:text-green-100"
                                                                    onClick={() => setFilterCompany('')}
                                                                />
                                                            </Badge>
                                                        )}
                                                        {filterLocation && (
                                                            <Badge className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                                Location: {filterLocation}
                                                                <X 
                                                                    className="h-3 w-3 cursor-pointer hover:text-purple-900 dark:hover:text-purple-100"
                                                                    onClick={() => setFilterLocation('')}
                                                                />
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={clearAllFilters}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Jobs Grid/List */}
                        {filteredJobs.length > 0 ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                                {filteredJobs.map((job, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={viewMode === 'list' ? 'w-full' : ''}
                                >
                                    <Card className={`h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${
                                        viewMode === 'list' ? 'flex flex-row' : ''
                                    }`}>
                                        <div className="absolute -top-8 -right-8 w-32 h-32 rotate-45 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 group-hover:scale-110 transition-transform" />
                                        
                                        <CardHeader className={`relative z-10 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge 
                                                    className={
                                                        job.source === 'LinkedIn' 
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                            : job.source === 'Unstop'
                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                                            : job.source === 'Foundit'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                                            : job.source === 'Naukri'
                                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                                                    }
                                                >
                                                    {job.source}
                                                </Badge>
                                                
                                                {/* Save Button */}
                                                <button
                                                    onClick={() => toggleSaveJob(job.url)}
                                                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={savedJobs.has(job.url) ? 'Unsave job' : 'Save job'}
                                                >
                                                    {savedJobs.has(job.url) ? (
                                                        <BookmarkCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                                    ) : (
                                                        <Bookmark className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                            <CardTitle className={`text-lg ${viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'}`}>
                                                {job.title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-2">
                                                <Building className="h-4 w-4" />
                                                <span className="font-medium">{job.company}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        
                                        <CardContent className={`space-y-3 relative z-10 ${viewMode === 'list' ? 'flex items-center gap-4 flex-shrink-0' : ''}`}>
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
                                                className={`bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white ${
                                                    viewMode === 'list' ? 'mt-0' : 'w-full mt-4'
                                                }`}
                                                size={viewMode === 'list' ? 'sm' : 'default'}
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View Job
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                            </div>
                        ) : (
                            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                                <CardContent className="py-12">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                            <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-100">
                                                No Jobs Match Your Filters
                                            </h3>
                                            <p className="text-amber-800 dark:text-amber-300 max-w-md">
                                                Try adjusting your filters or clearing them to see more results
                                            </p>
                                            <Button
                                                onClick={clearAllFilters}
                                                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                Clear All Filters
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
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
                                        Ready to Find Jobs?
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                        Enter job keywords or enable resume skills, select platforms, then click "Search Jobs" to discover opportunities
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
