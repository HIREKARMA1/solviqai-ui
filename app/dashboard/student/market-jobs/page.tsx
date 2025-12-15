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

    return (
        <DashboardLayout requiredUserType="student">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 gradient-bg">
                    <AnimatedBackground variant="default" />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-6">
                {/* Header - Updated to Match Assessment Overview Style */}
                <motion.div
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 group min-h-[140px] sm:min-h-[160px] md:min-h-[160px] lg:min-h-[140px]"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Decorative Animated Background Corners */}
                    <motion.div
                        className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 sm:w-56 sm:h-56 rotate-45 bg-gradient-to-br from-teal-100/40 to-cyan-100/30 dark:from-teal-900/30 dark:to-cyan-900/20"
                        animate={{ rotate: [45, 50, 45] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <motion.div
                        className="pointer-events-none absolute -bottom-14 -left-14 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-cyan-100/30 to-teal-100/20 dark:from-cyan-900/20 dark:to-teal-900/10"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-4">
                            {/* Rotating Icon */}
                            <motion.div
                                className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex-shrink-0"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                            </motion.div>

                            {/* Animated Title */}
                            <motion.h1
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text truncate"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                            >
                                <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                    Available Jobs in Market
                                </span>
                                <motion.span
                                    className="inline-block"
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                >
                                    💼
                                </motion.span>
                            </motion.h1>
                        </div>

                        {/* Subtitle */}
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                            Browse real-time job listings from LinkedIn, Unstop, Foundit, and Naukri based on your skills
                        </p>
                    </div>
                </motion.div>


                {/* Search Card - Enhanced UI */}
                <Card className="border rounded-2xl shadow-lg bg-gradient-to-br from-white/90 via-white/50 to-teal-50/40 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-teal-900/20 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md">
                                <Search className="h-5 w-5 text-white" />
                            </div>
                            Search Jobs
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Enter keywords OR enable resume skills to search for jobs
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Inputs */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Keywords */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1">
                                    Keywords (comma-separated) *
                                </label>

                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500" />

                                    <Input
                                        placeholder="e.g., software engineer, data analyst"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        disabled={isBusy}
                                        className={`
                            pl-10 py-3 rounded-xl transition-all bg-white dark:bg-gray-800
                            border shadow-sm
                            group-hover:shadow-md
                            focus:ring-2 focus:ring-teal-400
                            ${!keywords.trim() && !includeResumeSkills ?
                                                'border-amber-300 dark:border-amber-700' :
                                                'border-gray-300 dark:border-gray-700'}
                        `}
                                    />
                                </div>

                                {/* small helper */}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Required if resume skills are not enabled
                                </p>
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Location</label>

                                <Input
                                    placeholder="e.g., India, Bangalore"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={isBusy}
                                    className="py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-teal-400"
                                />
                            </div>
                        </div>

                        {/* Job Platforms */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Job Platforms</label>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={selectAllSources}
                                        disabled={isBusy}
                                        className="text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-40"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-400">|</span>
                                    <button
                                        type="button"
                                        onClick={deselectAllSources}
                                        disabled={isBusy}
                                        className="text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-40"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Tag Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: "linkedin", name: "LinkedIn", icon: Briefcase, color: "from-blue-500 to-blue-600" },
                                    { key: "unstop", name: "Unstop", icon: Sparkles, color: "from-orange-500 to-orange-600" },
                                    { key: "foundit", name: "FoundIt", icon: Building, color: "from-yellow-500 to-yellow-600" },
                                    { key: "naukri", name: "Naukri", icon: Briefcase, color: "from-purple-500 to-purple-600" },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => toggleSource(item.key as PlatformKey)}
                                        disabled={isBusy}
                                        className={`
                            px-4 py-2 rounded-xl font-medium transition-all shadow-sm 
                            flex items-center gap-2 border 
                            ${selectedSources.includes(item.key as PlatformKey)
                                                ? `text-white bg-gradient-to-r ${item.color} shadow-md`
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}
                        `}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </button>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Select one or more platforms to search
                            </p>
                        </div>

                        {/* Max Jobs & Search Button */}
                        <div className="flex items-end gap-4">
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
                                        const val = parseInt(e.target.value) || "";
                                        setMaxJobs(val === "" ? "" : Math.min(15, Math.max(1, val)));
                                    }}
                                    onBlur={() => !maxJobs && setMaxJobs(15)}
                                    disabled={isBusy}
                                    className="py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-teal-400"
                                />
                            </div>

                            <Button
                                onClick={fetchMarketJobs}
                                disabled={isBusy || selectedSources.length === 0 || (!keywords.trim() && !includeResumeSkills)}
                                size="lg"
                                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl shadow-md px-6 py-3"
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
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="h-4 w-4" />
                                <span>Please enter keywords or enable resume skills to start searching</span>
                            </div>
                        )}

                        {/* Resume Skills Toggle */}
                        <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800 shadow-sm">
                            <input
                                type="checkbox"
                                id="includeResumeSkills"
                                checked={includeResumeSkills}
                                onChange={(e) => setIncludeResumeSkills(e.target.checked)}
                                disabled={isBusy}
                                className="w-4 h-4 text-teal-600 bg-white border-gray-300 rounded cursor-pointer focus:ring-teal-500 focus:ring-2"
                            />
                            <label
                                htmlFor="includeResumeSkills"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Include skills extracted from my resume (Alternative to keywords)
                            </label>
                        </div>

                        {/* Resume Skills Display */}
                        {includeResumeSkills && (
                            <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                {loadingSkills ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Loader size="sm" />
                                        <span>Loading resume skills...</span>
                                    </div>
                                ) : hasResumeSkills && resumeSkills.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                            <span className="text-sm font-semibold">Top 5 skills from your resume:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {resumeSkills.slice(0, 5).map((skill, i) => (
                                                <Badge
                                                    key={i}
                                                    className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl shadow"
                                                >
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>No resume skills found. Upload and analyze your resume first.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Keywords Used */}
                        {keywordsUsed.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-semibold">Searching for:</span>
                                {keywordsUsed.map((k, i) => (
                                    <Badge
                                        key={i}
                                        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-xl"
                                    >
                                        {k}
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

                {/* Loading Skeleton */}
                {loading && (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`h-full relative overflow-hidden ${viewMode === 'list' ? 'w-full' : ''}`}>
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 animate-pulse">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                                    <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
                                    <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="mt-4 h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {jobs.length > 0 && !loading && (
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard
                                icon={LinkedinIcon}
                                label="LinkedIn"
                                value={getJobStats()?.linkedin || 0}
                                color="text-blue-600 dark:text-blue-400"
                                bgColor="bg-blue-200 dark:bg-blue-800"
                                colorClass="blue"
                            />

                            <StatCard
                                icon={Sparkles} // Perfect for Unstop's youthful, energetic brand
                                label="Unstop"
                                value={getJobStats()?.unstop || 0}
                                color="text-orange-600 dark:text-orange-400"
                                bgColor="bg-orange-200 dark:bg-orange-800"
                                colorClass="orange"
                            />

                            <StatCard
                                icon={Search} // Represents job search functionality
                                label="Foundit"
                                value={getJobStats()?.foundit || 0}
                                color="text-green-600 dark:text-green-400"
                                bgColor="bg-green-200 dark:bg-green-800"
                                colorClass="green"
                            />

                            <StatCard
                                icon={Briefcase} // Classic job/career symbol
                                label="Naukri"
                                value={getJobStats()?.naukri || 0}
                                color="text-purple-600 dark:text-purple-400"
                                bgColor="bg-purple-200 dark:bg-purple-800"
                                colorClass="purple"
                            />

                            <StatCard
                                icon={Bookmark}
                                label="Saved"
                                value={getJobStats()?.saved || 0}
                                color="text-teal-600 dark:text-teal-400"
                                bgColor="bg-teal-200 dark:bg-teal-800"
                                colorClass="teal"
                            />
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
                                        className={`p-2 rounded transition-all ${viewMode === 'grid'
                                            ? 'bg-white dark:bg-gray-700 shadow-sm'
                                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        title="Grid View"
                                    >
                                        <Grid3x3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded transition-all ${viewMode === 'list'
                                            ? 'bg-white dark:bg-gray-700 shadow-sm'
                                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        title="List View"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Saved Toggle */}
                                <Button
                                    onClick={() => setShowSavedOnly(s => !s)}
                                    variant={showSavedOnly ? 'default' : 'outline'}
                                    size="sm"
                                    className={showSavedOnly ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white' : 'gap-2'}
                                    title="Show saved jobs only"
                                >
                                    <Bookmark className="h-4 w-4" />
                                    {showSavedOnly ? 'Saved Only' : 'Show Saved'}
                                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                                        {getJobStats()?.saved || 0}
                                    </Badge>
                                </Button>

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
                                                    <option value="linkedin" disabled>LinkedIn (Coming Soon)</option>
                                                    <option value="unstop">Unstop</option>
                                                    <option value="foundit" disabled>FoundIt (Coming Soon)</option>
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
                                        <Card className={`h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${viewMode === 'list' ? 'flex flex-row' : ''
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
                                                    className={`bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white ${viewMode === 'list' ? 'mt-0' : 'w-full mt-4'
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
