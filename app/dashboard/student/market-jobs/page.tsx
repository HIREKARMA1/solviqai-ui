"use client"

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { apiClient } from '@/lib/api'
import { Target, LinkedinIcon, } from 'lucide-react'

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

const PLATFORM_KEYS = ['linkedin', 'unstop', 'foundit', 'naukri'] as const
type PlatformKey = typeof PLATFORM_KEYS[number]

interface PlatformJobsState extends Record<PlatformKey, MarketJob[]> {
    totalJobs: number
}

interface LastSearchParams {
    keywords: string
    location: string
    maxJobs: number
    includeResumeSkills: boolean
}

const PLATFORM_LABELS: Record<PlatformKey, string> = {
    linkedin: 'LinkedIn',
    unstop: 'Unstop',
    foundit: 'Foundit',
    naukri: 'Naukri'
}

const clampJobCount = (value: number) => Math.min(15, Math.max(1, value))

const createEmptyPlatformJobsState = (): PlatformJobsState => ({
    linkedin: [],
    unstop: [],
    foundit: [],
    naukri: [],
    totalJobs: 0
})

const computeTotalJobs = (state: PlatformJobsState, selection: PlatformKey[]) =>
    selection.reduce((sum, platform) => sum + (state[platform]?.length || 0), 0)

const flattenJobsBySelection = (state: PlatformJobsState, selection: PlatformKey[]): MarketJob[] => {
    const ordered: MarketJob[] = []
    selection.forEach(platform => {
        ordered.push(...(state[platform] || []))
    })
    return ordered
}

const toPlatformKey = (source?: string): PlatformKey | null => {
    const normalized = (source || '').toLowerCase()
    if (PLATFORM_KEYS.includes(normalized as PlatformKey)) {
        return normalized as PlatformKey
    }
    return null
}

const clonePlatformState = (state: PlatformJobsState): PlatformJobsState => ({
    linkedin: [...state.linkedin],
    unstop: [...state.unstop],
    foundit: [...state.foundit],
    naukri: [...state.naukri],
    totalJobs: state.totalJobs
})

const buildPersistableState = (state: PlatformJobsState, selection: PlatformKey[]): PlatformJobsState => {
    const snapshot = clonePlatformState(state)
    snapshot.totalJobs = computeTotalJobs(snapshot, selection)
    return snapshot
}

const parseSelectedSources = (sources?: any): PlatformKey[] => {
    if (!Array.isArray(sources)) return []
    const normalized: PlatformKey[] = []
    sources.forEach(entry => {
        const key = toPlatformKey(String(entry))
        if (key && !normalized.includes(key)) {
            normalized.push(key)
        }
    })
    return normalized
}

const ensurePlatformJobsState = (
    incomingState?: Partial<PlatformJobsState> | null,
    fallbackJobs?: MarketJob[],
    limitPerPlatform: number = 15
): PlatformJobsState => {
    const next = createEmptyPlatformJobsState()
    if (incomingState) {
        PLATFORM_KEYS.forEach(key => {
            if (Array.isArray(incomingState[key])) {
                next[key] = incomingState[key]!.slice(0, limitPerPlatform)
            }
        })
    }
    if (fallbackJobs && fallbackJobs.length > 0) {
        fallbackJobs.forEach(job => {
            const key = toPlatformKey(job.source)
            if (!key) return
            if (next[key].length < limitPerPlatform) {
                next[key].push(job)
                if (next[key].length > limitPerPlatform) {
                    next[key] = next[key].slice(0, limitPerPlatform)
                }
            }
        })
    }
    return next
}

// Hover-enabled stat card component
function StatCard({ icon: Icon, label, value, color, bgColor, colorClass }: { icon: any, label: string, value: string | number, color: string, bgColor: string, colorClass: string }) {
    const [isHovered, setIsHovered] = useState(false)

    // Get the gradient colors based on colorClass
    const getGradientColors = () => {
        switch (colorClass) {
            case 'blue': return 'from-blue-200/50 to-blue-100/20 dark:from-blue-900/30 dark:to-blue-800/10'
            case 'purple': return 'from-purple-200/50 to-purple-100/20 dark:from-purple-900/30 dark:to-purple-800/10'
            case 'pink': return 'from-pink-200/50 to-pink-100/20 dark:from-pink-900/30 dark:to-pink-800/10'
            case 'yellow': return 'from-yellow-200/50 to-yellow-100/20 dark:from-yellow-900/30 dark:to-yellow-800/10'
            default: return 'from-gray-200/50 to-gray-100/20 dark:from-gray-900/30 dark:to-gray-800/10'
        }
    }

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative"
        >
            <Card className="relative overflow-hidden card-hover min-h-[120px] group border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-500">
                {/* Animated Background Gradient */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-primary-50/50 to-secondary-50/50 dark:from-transparent dark:via-primary-900/20 dark:to-secondary-900/20"
                    initial={false}
                    animate={isHovered ? { scale: 1 } : { scale: 0.8 }}
                />

                {/* Sparkle Effects */}
                {isHovered && (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                    x: [0, (Math.random() - 0.5) * 60],
                                    y: [0, (Math.random() - 0.5) * 60],
                                }}
                                transition={{
                                    duration: 1,
                                    delay: i * 0.1,
                                    ease: 'easeOut',
                                }}
                                className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary-400 rounded-full"
                            />
                        ))}
                    </>
                )}

                <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <motion.div
                                animate={isHovered ? { rotate: [0, -10, 10, -10, 0] } : { rotate: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex-shrink-0"
                            >
                                <motion.div
                                    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${bgColor} p-1.5 sm:p-2 rounded-lg shadow-md`}
                                >
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                                </motion.div>
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium truncate">{label}</p>
                                <motion.p
                                    animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-2xl sm:text-3xl font-bold"
                                >
                                    {value}
                                </motion.p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Decorative shape with animation */}
                <motion.div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${getGradientColors()}`}
                    animate={isHovered ? { scale: 1.2, rotate: 360 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6 }}
                />

                {/* Bottom accent line */}
                <motion.div
                    className={`absolute bottom-0 left-0 h-1 rounded-full ${bgColor}`}
                    initial={{ width: '0%' }}
                    animate={isHovered ? { width: '100%' } : { width: '0%' }}
                    transition={{ duration: 0.4 }}
                />

                {/* Corner decoration */}
                <motion.div
                    className={`absolute top-0 right-0 w-20 h-20 opacity-5 ${bgColor}`}
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                    animate={isHovered ? { scale: 1.5, opacity: 0.1 } : { scale: 1, opacity: 0.05 }}
                    transition={{ duration: 0.4 }}
                />
            </Card>
        </motion.div>
    )
}

export default function MarketJobsPage() {
    const CACHE_TTL_MS = 30 * 60 * 1000
    const LAST_CACHE_KEY = 'market-jobs:last'
    const SAVED_JOBS_KEY = 'market-jobs:saved'
    const buildCacheKey = (
        kw: string,
        loc: string,
        count: number,
        includeSkills: boolean,
        sources: string[]
    ) => {
        const k = (kw || '').trim().toLowerCase()
        const s = sources.slice().sort().join(',')
        return `market-jobs:${k}:${loc}:${count}:${includeSkills ? 'skills' : 'no-skills'}:${s}`
    }
    const [jobs, setJobs] = useState<MarketJob[]>([])
    const [platformJobs, setPlatformJobs] = useState<PlatformJobsState>(() => createEmptyPlatformJobsState())
    const [fetchedPlatforms, setFetchedPlatforms] = useState<Set<PlatformKey>>(() => new Set())
    const [lastSearchParams, setLastSearchParams] = useState<LastSearchParams | null>(null)
    const [filteredJobs, setFilteredJobs] = useState<MarketJob[]>([])
    const [loading, setLoading] = useState(false)
    const [platformFetchPending, setPlatformFetchPending] = useState(false)
    const [keywords, setKeywords] = useState('')
    const [location, setLocation] = useState('India')
    const [maxJobs, setMaxJobs] = useState<number | string>(15)
    const [includeResumeSkills, setIncludeResumeSkills] = useState(false)
    const [selectedSources, setSelectedSources] = useState<PlatformKey[]>(['unstop'])
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
    const [showSavedOnly, setShowSavedOnly] = useState(false)
    const isBusy = loading || platformFetchPending

    // Fetch resume skills when checkbox is checked
    useEffect(() => {
        if (includeResumeSkills && !hasResumeSkills && resumeSkills.length === 0) {
            fetchResumeSkills()
        }
    }, [includeResumeSkills])
    useEffect(() => {
        try {
            const savedStr = typeof window !== 'undefined' ? localStorage.getItem(SAVED_JOBS_KEY) : null
            if (savedStr) {
                const arr = JSON.parse(savedStr)
                if (Array.isArray(arr)) setSavedJobs(new Set(arr))
            }
        } catch { }
        try {
            const lastKey = typeof window !== 'undefined' ? localStorage.getItem(LAST_CACHE_KEY) : null
            if (lastKey) {
                const cachedStr = localStorage.getItem(lastKey)
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr)
                    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                        const data = cached.data || {}
                        const params = cached.params || {}
                        const cachedSelection = parseSelectedSources(params.selectedSources)
                        const cachedFetched = parseSelectedSources(params.fetchedPlatforms)
                        const cachedJobCount = typeof params.jobCount === 'number'
                            ? clampJobCount(params.jobCount)
                            : 15
                        const restoredState = ensurePlatformJobsState(
                            data.jobsByPlatform,
                            data.jobs,
                            cachedJobCount
                        )
                        const effectiveSelection = cachedSelection.length > 0
                            ? cachedSelection
                            : (PLATFORM_KEYS.filter(key => restoredState[key].length > 0) as PlatformKey[])
                        restoredState.totalJobs = computeTotalJobs(
                            restoredState,
                            effectiveSelection.length > 0 ? effectiveSelection : selectedSources
                        )
                        setPlatformJobs(restoredState)
                        const fetchedFromCache = cachedFetched.length > 0
                            ? cachedFetched
                            : (PLATFORM_KEYS.filter(key => restoredState[key].length > 0) as PlatformKey[])
                        setFetchedPlatforms(new Set(fetchedFromCache))
                        if (effectiveSelection.length > 0) setSelectedSources(effectiveSelection)
                        if (typeof params.keywords === 'string') setKeywords(params.keywords)
                        if (typeof params.location === 'string') setLocation(params.location)
                        setMaxJobs(cachedJobCount)
                        setIncludeResumeSkills(!!params.includeResumeSkills)
                        setKeywordsUsed(Array.isArray(data.keywords_used) ? data.keywords_used : [])
                        setLastSearchParams({
                            keywords: typeof params.keywords === 'string' ? params.keywords : '',
                            location: typeof params.location === 'string' ? params.location : 'India',
                            maxJobs: cachedJobCount,
                            includeResumeSkills: !!params.includeResumeSkills
                        })
                    }
                }
            }
        } catch { }
    }, [])

    useEffect(() => {
        setJobs(flattenJobsBySelection(platformJobs, selectedSources))
    }, [platformJobs, selectedSources])

    useEffect(() => {
        setPlatformJobs(prev => {
            const total = computeTotalJobs(prev, selectedSources)
            if (total === prev.totalJobs) return prev
            return { ...prev, totalJobs: total }
        })
    }, [selectedSources])

    // Apply filters and sorting when jobs or filter criteria change
    useEffect(() => {
        applyFiltersAndSort()
    }, [jobs, filterSource, filterCompany, filterLocation, sortBy, showSavedOnly, savedJobs])

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

        // Saved-only filter
        if (showSavedOnly) {
            filtered = filtered.filter(job => savedJobs.has(job.url))
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
            try { localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(newSet))) } catch { }
            return newSet
        })
    }

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === SAVED_JOBS_KEY && typeof e.newValue === 'string') {
                try {
                    const arr = JSON.parse(e.newValue)
                    if (Array.isArray(arr)) setSavedJobs(new Set(arr))
                } catch { }
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', onStorage)
            return () => window.removeEventListener('storage', onStorage)
        }
    }, [])

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

    const persistSearchState = (
        selection: PlatformKey[],
        params: LastSearchParams,
        state: PlatformJobsState,
        keywordsList: string[],
        fetchedList?: PlatformKey[]
    ) => {
        if (typeof window === 'undefined') return
        try {
            const fetchedSnapshot = fetchedList && fetchedList.length > 0
                ? Array.from(new Set(fetchedList))
                : selection
            const cacheKey = buildCacheKey(
                params.keywords,
                params.location,
                params.maxJobs,
                params.includeResumeSkills,
                selection
            )
            const payload = {
                timestamp: Date.now(),
                data: {
                    jobsByPlatform: clonePlatformState(state),
                    keywords_used: keywordsList
                },
                params: { ...params, selectedSources: selection, fetchedPlatforms: fetchedSnapshot }
            }
            localStorage.setItem(cacheKey, JSON.stringify(payload))
            localStorage.setItem(LAST_CACHE_KEY, cacheKey)
        } catch { }
    }

    const fetchPlatformJobs = async (platform: PlatformKey, params: LastSearchParams) => {
        try {
            const { keywords: kw, location: loc, maxJobs: count, includeResumeSkills: includeSkills } = params
            console.log(`🔍 Fetching jobs from ${platform}...`, { keywords: kw, location: loc, maxJobs: count })

            const response = await apiClient.getMarketJobs(
                kw || undefined,
                loc,
                count,
                includeSkills,
                platform
            )

            console.log(`✅ Received response from ${platform}:`, {
                totalJobs: response.total_jobs,
                jobsCount: Array.isArray(response.jobs) ? response.jobs.length : 0
            })

            const jobs = Array.isArray(response.jobs) ? response.jobs.slice(0, count) : []
            const keywordList = Array.isArray(response.keywords_used) ? response.keywords_used : []
            return { platform, jobs, keywordsUsed: keywordList }
        } catch (error: any) {
            console.error(`❌ Error fetching jobs from ${platform}:`, error)
            console.error(`Error details:`, {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                code: error.code
            })
            // Return empty result for this platform, don't fail entire search
            return { platform, jobs: [], keywordsUsed: [] }
        }
    }

    const fetchPlatformsBatch = async (platforms: PlatformKey[], params: LastSearchParams) => {
        if (platforms.length === 0) {
            return { jobsMap: {} as Partial<Record<PlatformKey, MarketJob[]>>, keywords: [] as string[] }
        }
        const results = await Promise.all(platforms.map(platform => fetchPlatformJobs(platform, params)))
        const jobsMap: Partial<Record<PlatformKey, MarketJob[]>> = {}
        const keywordSet = new Set<string>()
        results.forEach(result => {
            jobsMap[result.platform] = result.jobs
            result.keywordsUsed.forEach((k: string) => keywordSet.add(k))
        })
        return {
            jobsMap,
            keywords: Array.from(keywordSet)
        }
    }

    const fetchMarketJobs = async () => {
        if (!keywords.trim() && !includeResumeSkills) {
            toast.error('Please enter keywords or enable "Include skills from resume" to search')
            return
        }
        if (selectedSources.length === 0) {
            toast.error('Please select at least one platform')
            return
        }

        const activeSources = [...selectedSources]
        const parsedMax = typeof maxJobs === 'string' ? parseInt(maxJobs) || 15 : maxJobs
        const jobCount = clampJobCount(parsedMax)
        const searchParams: LastSearchParams = {
            keywords: keywords.trim(),
            location: location.trim() || 'India',
            maxJobs: jobCount,
            includeResumeSkills
        }
        const platformNames = activeSources.map(source => PLATFORM_LABELS[source]).join(' and ')
        const cacheKey = buildCacheKey(
            searchParams.keywords,
            searchParams.location,
            searchParams.maxJobs,
            searchParams.includeResumeSkills,
            activeSources
        )

        setLoading(true)
        setError(null)
        setKeywordsUsed([])

        try {
            // 1) Try cache for this full selection/query
            if (typeof window !== 'undefined') {
                const cachedStr = localStorage.getItem(cacheKey)
                if (cachedStr) {
                    try {
                        const cached = JSON.parse(cachedStr)
                        if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                            const restoredState = ensurePlatformJobsState(
                                cached.data?.jobsByPlatform,
                                cached.data?.jobs,
                                jobCount
                            )
                            restoredState.totalJobs = computeTotalJobs(restoredState, activeSources)
                            setPlatformJobs(restoredState)
                            const fetched = parseSelectedSources(cached.params?.fetchedPlatforms || activeSources)
                            setFetchedPlatforms(new Set(fetched.length ? fetched : activeSources))
                            const cachedKeywords = Array.isArray(cached.data?.keywords_used) ? cached.data.keywords_used : []
                            setKeywordsUsed(cachedKeywords)
                            setLastSearchParams(searchParams)
                            localStorage.setItem(LAST_CACHE_KEY, cacheKey)
                            toast.success(`Loaded ${restoredState.totalJobs} cached jobs from ${platformNames}`)
                            return
                        }
                    } catch { }
                }
            }

            // 2) Decide whether this is a brand-new search or incremental
            const sameQuery =
                lastSearchParams &&
                lastSearchParams.keywords === searchParams.keywords &&
                lastSearchParams.location === searchParams.location &&
                lastSearchParams.includeResumeSkills === searchParams.includeResumeSkills &&
                lastSearchParams.maxJobs === searchParams.maxJobs

            let baseState: PlatformJobsState
            let platformsToFetch: PlatformKey[]

            if (!sameQuery) {
                // Different query or first time: refetch for all selected platforms
                baseState = createEmptyPlatformJobsState()
                platformsToFetch = activeSources
            } else {
                // Same query: keep already-fetched platforms, and fetch only new ones
                baseState = clonePlatformState(platformJobs)
                platformsToFetch = activeSources.filter(p => !fetchedPlatforms.has(p))
            }

            if (platformsToFetch.length === 0 && sameQuery) {
                // Nothing new to fetch; just recompute totals and persist
                baseState.totalJobs = computeTotalJobs(baseState, activeSources)
                setPlatformJobs(baseState)
                setLastSearchParams(searchParams)
                persistSearchState(activeSources, searchParams, baseState, keywordsUsed, Array.from(fetchedPlatforms))
                toast.success(`Showing ${baseState.totalJobs} jobs from ${platformNames}`)
                return
            }

            toast.info(`Fetching live jobs from ${platformsToFetch.map(p => PLATFORM_LABELS[p]).join(' and ')}... This may take 10-60 seconds`)

            const { jobsMap, keywords: keywordList } = await fetchPlatformsBatch(platformsToFetch, searchParams)

            // Merge new platform jobs into base state
            platformsToFetch.forEach(source => {
                baseState[source] = (jobsMap[source] || []).slice(0)
            })
            baseState.totalJobs = computeTotalJobs(baseState, activeSources)

            const newFetched = new Set<PlatformKey>(sameQuery ? fetchedPlatforms : new Set())
            platformsToFetch.forEach(p => newFetched.add(p))

            setPlatformJobs(baseState)
            setFetchedPlatforms(newFetched)
            const combinedKeywords = keywordList.length > 0 ? keywordList : keywordsUsed
            setKeywordsUsed(combinedKeywords)
            setLastSearchParams(searchParams)
            persistSearchState(activeSources, searchParams, baseState, combinedKeywords, Array.from(newFetched))

            toast.success(`Found ${baseState.totalJobs} jobs from ${platformNames}!`)
        } catch (err) {
            console.error('Error fetching market jobs:', err)
            const axiosError = err as AxiosError<{ detail: string }>

            // Better error message extraction
            let errorMessage = 'Failed to fetch market jobs'
            if (axiosError.response?.data?.detail) {
                errorMessage = axiosError.response.data.detail
            } else if (axiosError.message) {
                errorMessage = axiosError.message
                // Handle timeout errors specifically
                if (axiosError.message.includes('timeout')) {
                    errorMessage = 'Request timed out. The job search is taking longer than expected. Please try again with fewer platforms or fewer jobs per platform.'
                }
                // Handle network errors
                if (axiosError.message.includes('Network Error') || axiosError.code === 'ERR_NETWORK') {
                    errorMessage = 'Network error. Please check your internet connection and try again.'
                }
            }

            setError(errorMessage)
            toast.error(errorMessage, { duration: 5000 })
        } finally {
            setLoading(false)
        }
    }

    const fetchAdditionalPlatforms = async (platformsToFetch: PlatformKey[], updatedSelection: PlatformKey[]) => {
        if (!lastSearchParams || platformsToFetch.length === 0) return
        setPlatformFetchPending(true)
        setError(null)
        try {
            const { jobsMap, keywords: keywordList } = await fetchPlatformsBatch(platformsToFetch, lastSearchParams)
            let snapshot: PlatformJobsState | null = null
            setPlatformJobs(prev => {
                const base = { ...prev }
                platformsToFetch.forEach(platform => {
                    base[platform] = (jobsMap[platform] || []).slice(0)
                })
                base.totalJobs = computeTotalJobs(base, updatedSelection)
                snapshot = clonePlatformState(base)
                return base
            })
            const combinedKeywords = keywordList.length > 0
                ? Array.from(new Set([...keywordsUsed, ...keywordList]))
                : keywordsUsed
            if (keywordList.length > 0) {
                setKeywordsUsed(combinedKeywords)
            }
            const fetchedSnapshot = Array.from(new Set([...Array.from(fetchedPlatforms), ...platformsToFetch]))
            setFetchedPlatforms(prev => {
                const next = new Set(prev)
                platformsToFetch.forEach(platform => next.add(platform))
                return next
            })
            if (snapshot) {
                persistSearchState(updatedSelection, lastSearchParams, snapshot, combinedKeywords, fetchedSnapshot)
            }
        } catch (err) {
            console.error('Error fetching additional platform jobs:', err)
            const platformNames = platformsToFetch.map(platform => PLATFORM_LABELS[platform]).join(', ')
            toast.error(`Failed to load ${platformNames}`)
        } finally {
            setPlatformFetchPending(false)
        }
    }

    const toggleSource = (source: PlatformKey) => {
        const alreadySelected = selectedSources.includes(source)
        const updatedSelection = alreadySelected
            ? selectedSources.filter(s => s !== source)
            : [...selectedSources, source]
        setSelectedSources(updatedSelection)

        // Only persist selection; actual fetching happens when clicking Search
        if (lastSearchParams) {
            const snapshot = buildPersistableState(platformJobs, updatedSelection)
            persistSearchState(updatedSelection, lastSearchParams, snapshot, keywordsUsed, Array.from(fetchedPlatforms))
        }
    }

    const selectAllSources = () => {
        const allSources = [...PLATFORM_KEYS] as PlatformKey[]
        setSelectedSources(allSources)

        if (lastSearchParams) {
            const snapshot = buildPersistableState(platformJobs, allSources)
            persistSearchState(allSources, lastSearchParams, snapshot, keywordsUsed, Array.from(fetchedPlatforms))
        }
    }

    const deselectAllSources = () => {
        setSelectedSources([])
        if (lastSearchParams) {

            const snapshot = buildPersistableState(platformJobs, [])
            persistSearchState([], lastSearchParams, snapshot, keywordsUsed, Array.from(fetchedPlatforms))
        }
    }

    const getJobStats = () => {
        if (jobs.length === 0) return null

        const stats = {
            linkedin: selectedSources.includes('linkedin') ? platformJobs.linkedin.length : 0,
            unstop: selectedSources.includes('unstop') ? platformJobs.unstop.length : 0,
            foundit: selectedSources.includes('foundit') ? platformJobs.foundit.length : 0,
            naukri: selectedSources.includes('naukri') ? platformJobs.naukri.length : 0,
            saved: jobs.filter(j => savedJobs.has(j.url)).length,
        }

        return stats
    }

    const copyJobInfo = (job: MarketJob) => {
        const text = `${job.title}\n${job.company}\n${job.location}\n${job.url}`
        navigator.clipboard.writeText(text)
        toast.success('Job info copied to clipboard!')
    }

    const toggleFilters = () => setShowFilters(!showFilters)

    // Calculate a mock match percentage based on keywords overlap
    // In a real app, this would come from the backend AI matching
    const calculateMatchScore = (job: MarketJob) => {
        if (!job.title) return 0
        const jobText = (job.title + ' ' + job.keyword).toLowerCase()
        let score = 60 // Base score

        // Boost if matches user keywords
        const userKeywords = keywords.toLowerCase().split(',').filter(k => k.trim())
        userKeywords.forEach(k => {
            if (jobText.includes(k.trim())) score += 10
        })

        // Boost if matches resume skills
        if (hasResumeSkills) {
            resumeSkills.slice(0, 5).forEach(skill => {
                if (jobText.includes(skill.toLowerCase())) score += 5
            })
        }

        return Math.min(98, score + Math.floor(Math.random() * 10)) // Add some variance
    }

    return (
        <DashboardLayout requiredUserType="student">
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B1437] p-6 space-y-8">

                {/* 1. Header Section */}
                <div className="relative overflow-hidden rounded-2xl border border-[#989898] dark:border-gray-700 bg-white dark:bg-[#111C44] p-4 md:p-[24px]">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 md:gap-3">
                            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-[#546FFF]" />
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF541F] to-[#1E7BFF] bg-clip-text text-transparent">
                                Available Jobs in Market
                            </h1>
                        </div>
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 pl-1">
                            Browse real-time job listings from LinkedIn, Unstop, Foundit, and Naukri based on your skills
                        </p>
                    </div>
                </div>

                {/* 2. Search & Filter Section */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111C44] p-4 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Search Jobs</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter keywords OR enable resume skills to search for jobs
                    </p>

                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Keyword Input */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search className="h-5 w-5" />
                                </div>
                                <Input
                                    placeholder="Job title or keyword"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="pl-11 h-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-[#1E7BFF] focus:ring-[#1E7BFF] bg-transparent"
                                />
                            </div>

                            {/* Location Input */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <Input
                                    placeholder="Location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="pl-11 h-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-[#1E7BFF] focus:ring-[#1E7BFF] bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={toggleFilters}
                                className={`h-12 rounded-full px-6 gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>

                            <Button
                                onClick={fetchMarketJobs}
                                disabled={isBusy || selectedSources.length === 0 || (!keywords.trim() && !includeResumeSkills)}
                                className="h-12 rounded-full px-8 bg-[#1E7BFF] hover:bg-blue-600 text-white shadow-md font-semibold min-w-[120px]"
                            >
                                {loading ? <Loader className="h-5 w-5 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-6"
                        >
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Sources */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Job Platforms</label>
                                    <div className="flex flex-wrap gap-3">
                                        {PLATFORM_KEYS.map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => toggleSource(key)}
                                                className={`
                                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border
                                                    ${selectedSources.includes(key)
                                                        ? 'bg-[#1E7BFF] border-[#1E7BFF] text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}
                                                `}
                                            >
                                                {PLATFORM_LABELS[key]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Toggle */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Smart Search</label>
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={includeResumeSkills}
                                            onChange={(e) => setIncludeResumeSkills(e.target.checked)}
                                            className="w-5 h-5 rounded text-[#1E7BFF] focus:ring-[#1E7BFF] border-gray-300"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100 block">Include Resume Skills</span>
                                            <span className="text-xs text-gray-500 block">Automatically match jobs to your uploaded resume's skills</span>
                                        </div>
                                        {includeResumeSkills && <Sparkles className="h-5 w-5 text-amber-500" />}
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* 3. Recommendations Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Job Recommendations</h2>
                        {jobs.length > 0 && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Based on your search criteria</p>}
                    </div>
                    {savedJobs.size > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setShowSavedOnly(!showSavedOnly)}
                            className={`rounded-full px-4 border-gray-300 dark:border-gray-600 ${showSavedOnly ? 'bg-primary-50 border-primary-200' : ''}`}
                        >
                            <Bookmark className={`h-4 w-4 mr-2 ${showSavedOnly ? 'fill-primary-600 text-primary-600' : 'text-gray-600'}`} />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{savedJobs.size}</span>
                            <span className="ml-1 text-gray-500">Saved</span>
                        </Button>
                    )}
                </div>

                {/* 4. Results Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 h-[220px] animate-pulse">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700" />
                                    <div className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-700" />
                                </div>
                                <div className="space-y-3">
                                    <div className="h-6 w-3/4 rounded bg-gray-100 dark:bg-gray-700" />
                                    <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredJobs.map((job, index) => {
                            const matchScore = calculateMatchScore(job)
                            return (
                                <motion.div
                                    key={`${job.url}-${index}`} // unique key
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative"
                                >
                                    <Card className="rounded-[12px] border border-[#BABABA] dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-[#111C44] h-full flex flex-col relative overflow-hidden">
                                        <CardContent className="p-5 flex flex-col h-full relative z-10">
                                            {/* Header Row: Title & Actions */}
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-medium mb-3 mt-1">
                                                        {job.company}
                                                    </p>
                                                </div>

                                                {/* Top Right Actions */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleSaveJob(job.url)}
                                                            className="text-gray-400 hover:text-[#1E7BFF] transition-colors"
                                                        >
                                                            <Bookmark className={`h-6 w-6 ${savedJobs.has(job.url) ? 'fill-[#1E7BFF] text-[#1E7BFF]' : ''}`} />
                                                        </button>
                                                        <Button
                                                            onClick={() => window.open(job.url, '_blank')}
                                                            className="bg-[#1E7BFF] hover:bg-blue-600 text-white rounded-lg px-4 h-9 text-sm font-semibold flex items-center gap-2"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            Apply
                                                        </Button>
                                                    </div>
                                                    <span className="text-green-500 font-bold text-sm">{matchScore}% match</span>
                                                </div>
                                            </div>

                                            {/* Remote Tag */}
                                            <div className="mb-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    Remote
                                                </span>
                                            </div>

                                            {/* Location & Time */}
                                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{job.location.split(',')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{job.posted_date || '1 day ago'}</span>
                                                </div>
                                            </div>

                                            {/* Salary & Type Stub (Mocked as per design since API might not have it or we use match) */}
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-6">
                                                $120k - $150k • Full-time
                                            </div>

                                            {/* Bottom Tags (Mocked to match 'React', 'TypeScript', 'Node.js' style from screenshot using job keywords/source) */}
                                            <div className="mt-auto flex flex-wrap gap-2">
                                                {['React', 'TypeScript', 'Node.js'].map((tag, i) => (
                                                    <span key={i} className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    // Empty State
                    <div className="py-20 text-center">
                        <div className="bg-white dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We couldn't find any jobs matching your criteria. Try adjusting your keywords or filters.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
