"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    Play, 
    ExternalLink, 
    Youtube, 
    Clock,
    TrendingUp,
    Sparkles,
    AlertCircle,
    Calendar,
    Target,
    BookOpen,
    CheckCircle2,
    Loader2,
    ArrowRight,
    GraduationCap,
    Video,
    PlayCircle
} from 'lucide-react'

interface Video {
    title: string
    url: string
    thumbnail?: string
    duration?: string
    channel?: string
    views?: string
    description?: string
}

interface PlaylistStep {
    step: number
    topic: string
    timeline: string
    videos: Video[]
}

interface CareerPlaylistTabProps {
    sessionId: string
}

export default function CareerPlaylistTab({ sessionId }: CareerPlaylistTabProps) {
    const [playlist, setPlaylist] = useState<PlaylistStep[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeStep, setActiveStep] = useState<number>(1)
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

    useEffect(() => {
        loadPlaylist()
    }, [sessionId])

    const loadPlaylist = async () => {
        setLoading(true)
        setError(null)
        try {
            const { apiClient } = await import('@/lib/api')
            const data = await apiClient.getCareerGuidancePlaylist(sessionId)
            setPlaylist(data.playlist || [])
            
            // Auto-select first step
            if (data.playlist && data.playlist.length > 0) {
                setActiveStep(data.playlist[0].step)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load playlist')
        } finally {
            setLoading(false)
        }
    }

    const handleVideoClick = (video: Video, stepNumber: number) => {
        window.open(video.url, '_blank', 'noopener,noreferrer')
        // Mark step as completed if all videos are watched (simplified logic)
        // In production, you'd track individual video completion
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Loading Your Learning Roadmap</h3>
                    <p className="text-sm text-gray-600 max-w-sm">
                        We're curating the best resources for your career journey...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <Card className="border-red-200 bg-red-50/50 max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Playlist</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <Button 
                                onClick={loadPlaylist}
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (playlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                {/* Figma: 558 fill × 313, 10px radius, 1px border, padding 52px top/bottom 100px left/right, gap 10px */}
                <Card
                    className="w-full max-w-[558px] rounded-[10px] border border-gray-200 bg-white shadow-sm flex flex-col gap-[10px] py-[52px] px-6 md:px-[100px] min-h-[313px]"
                >
                    <CardContent className="p-0 flex flex-col items-center justify-center text-center gap-[10px] flex-1">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: '#E8E0F5' }}>
                                <GraduationCap className="h-12 w-12 text-[#7F56D9]" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Complete Your Career Journey
                        </h3>
                        <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                            Finish the career guidance conversation to unlock your personalized learning roadmap with curated video resources tailored to your goals.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Sparkles className="h-4 w-4 text-[#8D5AFF]" />
                            <span>Your roadmap will appear here once the session is complete</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const activeStepData = playlist.find(s => s.step === activeStep)
    const totalVideos = playlist.reduce((sum, step) => sum + step.videos.length, 0)

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden">
            {/* Scrollable Content Area - Everything scrolls together */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Professional Header with Stats */}
            <div className="p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                        <Target className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-0.5">Learning Steps</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {playlist.length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                        <Video className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-0.5">Total Videos</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {totalVideos}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                                        <Youtube className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-0.5">Platform</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            YouTube
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Step Navigation - Professional Pills */}
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Learning Path</span>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                    {playlist.map((step, index) => {
                        const isActive = activeStep === step.step
                        const isCompleted = completedSteps.has(step.step)
                        // All steps are accessible - users can view any step at any time
                        const isAccessible = true
                        
                        return (
                            <motion.button
                                key={step.step}
                                onClick={() => setActiveStep(step.step)}
                                className={`
                                    flex-shrink-0 flex flex-col items-start gap-2 px-4 py-3 rounded-xl
                                    transition-all duration-300 min-w-[140px]
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                                        : isCompleted
                                            ? 'bg-green-50 border-2 border-green-200 hover:border-green-300 hover:shadow-md text-gray-700'
                                            : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-700'
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <div className={`
                                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}
                                            `}>
                                                {step.step}
                                            </div>
                                        )}
                                        <Badge 
                                            variant="secondary" 
                                            className={`
                                                text-xs px-2 py-0.5
                                                ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 text-gray-600'}
                                            `}
                                        >
                                            {step.videos.length} videos
                                        </Badge>
                                    </div>
                                </div>
                                <span className="text-left font-semibold text-xs line-clamp-2 leading-tight">
                                    {step.topic}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                                    <Clock className="h-3 w-3" />
                                    <span>{step.timeline}</span>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Videos Content Area */}
            <div className="p-4 lg:p-6">
                {activeStepData && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Step Header Card */}
                            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm shadow-md">
                                                    Step {activeStepData.step}
                                                </div>
                                                <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
                                                    {activeStepData.topic}
                                                </CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium">{activeStepData.timeline}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <PlayCircle className="h-4 w-4 text-purple-500" />
                                                    <span className="font-medium">{activeStepData.videos.length} videos</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/60 rounded-xl shadow-sm">
                                            <BookOpen className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Videos Grid */}
                            {activeStepData.videos.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="pt-12 pb-12 text-center">
                                        <p className="text-gray-600">No videos available for this step yet.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {activeStepData.videos.map((video, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                                        >
                                            <Card
                                                className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
                                                onClick={() => handleVideoClick(video, activeStepData.step)}
                                            >
                                                <div className="flex flex-col sm:flex-row gap-4 p-4">
                                                    {/* Thumbnail */}
                                                    <div className="relative flex-shrink-0 w-full sm:w-56 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                                                        {video.thumbnail ? (
                                                            <img
                                                                src={video.thumbnail}
                                                                alt={video.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-indigo-100">
                                                                <Play className="h-12 w-12 text-blue-500" />
                                                            </div>
                                                        )}
                                                        
                                                        {/* Play Overlay */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                            <div className="p-4 bg-red-600 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                                                <Play className="h-8 w-8 text-white fill-white" />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Duration Badge */}
                                                        {video.duration && (
                                                            <div className="absolute bottom-2 right-2 bg-black/90 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {video.duration}
                                                            </div>
                                                        )}
                                                        
                                                        {/* YouTube Badge */}
                                                        <div className="absolute top-2 left-2">
                                                            <Badge className="bg-red-600 text-white border-0 shadow-lg text-xs px-2 py-1">
                                                                <Youtube className="h-3 w-3 mr-1" />
                                                                YouTube
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors text-base leading-tight">
                                                                {video.title}
                                                            </h4>

                                                            {/* Meta Info */}
                                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
                                                                {video.channel && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[10px] font-bold text-white">
                                                                            {video.channel.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="font-medium truncate max-w-[120px]">{video.channel}</span>
                                                                    </div>
                                                                )}
                                                                {video.views && (
                                                                    <>
                                                                        <span className="text-gray-400">•</span>
                                                                        <span>{video.views}</span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Description */}
                                                            {video.description && (
                                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed hidden sm:block">
                                                                    {video.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Action Button */}
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Button
                                                                size="sm"
                                                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 flex-1 h-9 text-sm"
                                                            >
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Play className="h-4 w-4" />
                                                                    <span className="font-semibold">Watch on YouTube</span>
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
            </div>
        </div>
    )
}
