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
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                        {/* Multi-color decorative shapes */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-200/30 to-blue-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-200/25 to-teal-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute top-1/2 -right-16 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-100/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <CardContent className="relative z-10 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                                    <GraduationCap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Topics</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {playlist.length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                        {/* Multi-color decorative shapes */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200/30 to-purple-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-pink-200/25 to-rose-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute top-1/2 -right-16 w-16 h-16 rounded-full bg-gradient-to-br from-violet-200/20 to-fuchsia-100/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <CardContent className="relative z-10 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                                    <Play className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Resources</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {playlist.reduce((sum, item) => sum + item.videos.length, 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                        {/* Multi-color decorative shapes */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-green-200/30 to-green-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-200/25 to-teal-100/10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                        <div className="absolute top-1/2 -right-16 w-16 h-16 rounded-full bg-gradient-to-br from-lime-200/20 to-yellow-100/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <CardContent className="relative z-10 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Platforms</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {new Set(playlist.flatMap(item => item.videos.map(v => v.platform))).size}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-primary-200/20 to-secondary-200/20 blur-2xl" />
                    <CardContent className="relative z-10 pt-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <Filter className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform:</span>
                            <div className="flex gap-2">
                                <Button
                                    variant={platformFilter === 'youtube' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPlatformFilter('youtube')}
                                    className={`flex items-center gap-1 ${platformFilter === 'youtube' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md' : ''}`}
                                >
                                    <Youtube className="h-3 w-3" />
                                    YouTube
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Topics Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredPlaylist.map((item, idx) => (
                    <Button
                        key={idx}
                        variant={activeTopic === item.topic ? 'default' : 'outline'}
                        onClick={() => setActiveTopic(item.topic)}
                        className={`whitespace-nowrap transition-all duration-300 ${
                            activeTopic === item.topic 
                                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-md' 
                                : ''
                        }`}
                    >
                        {item.topic}
                        <Badge variant="secondary" className={`ml-2 ${activeTopic === item.topic ? 'bg-white/20 text-white' : ''}`}>
                            {item.videos.length}
                        </Badge>
                    </Button>
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
                                        className="group cursor-pointer"
                                        onClick={() => window.open(video.url, '_blank')}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                                            {video.thumbnail ? (
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Play className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Play className="w-12 h-12 text-white drop-shadow-lg fill-current" />
                                            </div>

                                            {/* Duration Badge */}
                                            {video.duration && (
                                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {video.duration}
                                                </div>
                                            )}
                                            
                                            {/* Quality Badge - Minimal */}
                                            {video.quality_score && video.quality_score >= 0.9 && (
                                                <div className="absolute top-2 left-2">
                                                    <Badge className="bg-yellow-400 text-yellow-900 border-0 text-[10px] px-1.5 py-0">
                                                        Top Rated
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-sm sm:text-base leading-tight text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {video.title}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <PlatformIcon className="h-3 w-3" />
                                                    <span>{video.channel || video.platform}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{video.views || 'Recommended'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )
            })()}
        </div>
    )
}

