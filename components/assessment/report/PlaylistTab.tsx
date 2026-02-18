"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { 
    Play, 
    ExternalLink, 
    Youtube, 
    GraduationCap, 
    Clock,
    TrendingUp,
    Filter,
    Search,
    Sparkles,
    AlertCircle
} from 'lucide-react'
import Image from 'next/image'

interface Video {
    id?: string
    title: string
    url: string
    thumbnail?: string
    duration?: string
    channel?: string
    views?: string
    platform: string
    quality_score?: number
    rating?: string
    price?: string
}

interface PlaylistItem {
    topic: string
    videos: Video[]
}

interface PlaylistTabProps {
    assessmentId: string
}

export default function PlaylistTab({ assessmentId }: PlaylistTabProps) {
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTopic, setActiveTopic] = useState<string | null>(null)
    const [platformFilter, setPlatformFilter] = useState<string>('all')

    // Fetch playlist on mount
    React.useEffect(() => {
        loadPlaylist()
    }, [assessmentId])

    const loadPlaylist = async () => {
        setLoading(true)
        setError(null)
        try {
            const { apiClient } = await import('@/lib/api')
            const data = await apiClient.getAssessmentPlaylist(assessmentId)
            setPlaylist(data.playlist || [])
            
            // Auto-select first topic
            if (data.playlist && data.playlist.length > 0) {
                setActiveTopic(data.playlist[0].topic)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load playlist')
        } finally {
            setLoading(false)
        }
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube':
                return Youtube
            case 'udemy':
                return GraduationCap
            default:
                return ExternalLink
        }
    }

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case 'youtube':
                return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400'
            case 'udemy':
                return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400'
            default:
                return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400'
        }
    }

    const getQualityBadgeColor = (score?: number) => {
        if (!score) return 'bg-gray-100 text-gray-600'
        if (score >= 0.9) return 'bg-green-100 text-green-700'
        if (score >= 0.8) return 'bg-yellow-100 text-yellow-700'
        return 'bg-orange-100 text-orange-700'
    }

    const filteredPlaylist = playlist.map(item => ({
        ...item,
        videos: item.videos.filter(v => platformFilter === 'all' || v.platform === platformFilter)
    })).filter(item => item.videos.length > 0)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader size="lg" />
                <p className="text-gray-600 dark:text-gray-400">Loading your personalized playlist...</p>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-red-300">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (playlist.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="pt-12 pb-12">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            No Learning Resources Yet
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                            Complete your assessment to get personalized video recommendations for your weak areas.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Topics Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="bg-[#DDEEFF] dark:bg-[#DDEEFF]/10 rounded-[16px] p-5 h-[116px] flex flex-col justify-center relative overflow-hidden border border-[#DDEEFF] dark:border-blue-900/30">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-white/50 flex items-center justify-center shrink-0">
                                <GraduationCap className="h-5 w-5 text-gray-800 dark:text-gray-200" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Topics</span>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{playlist.length}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Resources Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="bg-[#F8EFFF] dark:bg-[#F8EFFF]/10 rounded-[16px] p-5 h-[116px] flex flex-col justify-center relative overflow-hidden border border-[#F8EFFF] dark:border-purple-900/30">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-white/50 border border-purple-100 flex items-center justify-center shrink-0">
                                <Play className="h-5 w-5 text-gray-800 dark:text-gray-200 ml-0.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resources</span>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {playlist.reduce((sum, item) => sum + item.videos.length, 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Platforms Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="bg-[#FFEFFF] dark:bg-[#FFEFFF]/10 rounded-[16px] p-5 h-[116px] flex flex-col justify-center relative overflow-hidden border border-[#FFEFFF] dark:border-pink-900/30">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-[#FF88D9] flex items-center justify-center shrink-0 shadow-sm">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Platforms</span>
                                <span className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {new Set(playlist.flatMap(item => item.videos.map(v => v.platform))).size}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Topics Tabs */}
            <div className="space-y-4">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {filteredPlaylist.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTopic(item.topic)}
                            className={`
                                whitespace-nowrap px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200 flex items-center gap-2
                                ${activeTopic === item.topic 
                                    ? 'bg-gradient-to-r from-[#1E7BFF] to-[#8650FF] text-white shadow-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                            `}
                        >
                            {activeTopic === item.topic && <TrendingUp className="h-3.5 w-3.5" />}
                            {item.topic}
                        </button>
                    ))}
                </div>

                {/* Videos Grid */}
                {activeTopic && (() => {
                    const activeItem = filteredPlaylist.find(item => item.topic === activeTopic)
                    if (!activeItem || activeItem.videos.length === 0) {
                        return (
                            <Card className="border-dashed border-gray-300 shadow-none">
                                <CardContent className="pt-12 pb-12 text-center">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No videos found for this topic.
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    }

                    return (
                        <div className="space-y-6">
                            <div className="bg-[#F0F7FF] dark:bg-[#1E7BFF]/10 p-4 rounded-[12px] border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {activeTopic}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Curated content to enhance your skills
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeItem.videos.map((video, idx) => {
                                    const PlatformIcon = getPlatformIcon(video.platform)
                                    
                                    return (
                                        <motion.div
                                            key={video.id || idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        >
                                            <div 
                                                className="group cursor-pointer flex flex-col gap-3"
                                                onClick={() => window.open(video.url, '_blank')}
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative aspect-video rounded-[12px] overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-all">
                                                    {video.thumbnail ? (
                                                        <img
                                                            src={video.thumbnail}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                                                            <Play className="h-12 w-12 text-gray-400" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Play Overlay */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                                                            <Play className="w-5 h-5 text-gray-900 fill-current ml-0.5" />
                                                        </div>
                                                    </div>

                                                    {/* Duration Badge */}
                                                    {video.duration && (
                                                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-[4px]">
                                                            {video.duration}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <h4 className="font-bold text-sm sm:text-[15px] leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-[#1E7BFF] transition-colors">
                                                        {video.title}
                                                    </h4>
                                                    
                                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <PlatformIcon className="h-3 w-3" />
                                                            </div>
                                                            <span className="font-medium">{video.channel || video.platform}</span>
                                                        </div>
                                                        {video.views && <span>{video.views} views</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}

