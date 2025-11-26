"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    Calendar as CalendarIcon,
    Clock,
    Video,
    CheckCircle2,
    PlayCircle,
    ChevronLeft,
    ChevronRight,
    Target,
    TrendingUp,
    BookOpen,
    Sparkles,
    ArrowRight,
    AlertCircle
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

interface CareerCalendarTabProps {
    sessionId: string
}

interface CalendarEvent {
    date: Date
    step: number
    topic: string
    timeline: string
    videos: Video[]
    isActive: boolean
    isCompleted: boolean
}

export default function CareerCalendarTab({ sessionId }: CareerCalendarTabProps) {
    const [playlist, setPlaylist] = useState<PlaylistStep[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [sessionStartDate, setSessionStartDate] = useState<Date | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
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
            
            if (data.session_created_at) {
                const startDate = new Date(data.session_created_at)
                setSessionStartDate(startDate)
                setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
            } else {
                setSessionStartDate(null)
                setCurrentMonth(new Date())
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load playlist')
        } finally {
            setLoading(false)
        }
    }

    // Helper function to determine if a step should be active
    const getStepStatus = (step: number, eventDate: Date) => {
        const today = new Date()
        const stepStartDate = new Date(eventDate)
        
        // Step is active if we're in its timeframe or it's the current step
        if (step === 1 && today >= stepStartDate) {
            return true
        }
        
        // For subsequent steps, check if previous steps are completed
        // and we're within the timeframe
        const allPreviousCompleted = Array.from({length: step - 1}, (_, i) => i + 1)
            .every(prevStep => completedSteps.has(prevStep))
            
        return allPreviousCompleted && today >= stepStartDate
    }

    // Parse timeline and create calendar events
    const calendarEvents = useMemo(() => {
        if (!playlist.length) return []
        
        const events: CalendarEvent[] = []
        const today = new Date()
        const baseDate = sessionStartDate || today
        const baseDayOfMonth = baseDate.getDate()
        
        const setSafeDay = (date: Date) => {
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
            date.setDate(Math.min(baseDayOfMonth, lastDay))
        }
        
        playlist.forEach((step) => {
            // Parse timeline (e.g., "Months 1-2", "Months 3-4", "Month 1", "1-2 months")
            const timelineLower = step.timeline.toLowerCase()
            let startMonthOffset = 0
            let durationMonths = 1 // Default to 1 month
            
            // Try different patterns
            const patterns = [
                /months?\s*(\d+)(?:\s*-\s*(\d+))?/i,  // "Months 1-2" or "Month 1"
                /(\d+)(?:\s*-\s*(\d+))?\s*months?/i,  // "1-2 months"
                /month\s*(\d+)/i,                      // "Month 1"
            ]
            
            let matched = false
            for (const pattern of patterns) {
                const match = step.timeline.match(pattern)
                if (match) {
                    startMonthOffset = parseInt(match[1]) - 1 // Convert to 0-indexed month offset
                    durationMonths = match[2] ? (parseInt(match[2]) - startMonthOffset) : 1
                    matched = true
                    break
                }
            }
            
            if (!matched) {
                // Fallback: use step number as month offset
                startMonthOffset = (step.step - 1) * 2 // Assume 2 months per step
                durationMonths = 2
            }
            
            // Calculate actual dates relative to today
            const eventStartDate = new Date(baseDate)
            eventStartDate.setMonth(baseDate.getMonth() + startMonthOffset)
            setSafeDay(eventStartDate)
            
            const eventEndDate = new Date(eventStartDate)
            eventEndDate.setMonth(eventStartDate.getMonth() + durationMonths - 1)
            setSafeDay(eventEndDate)

            // Create event for the start month
            events.push({
                date: new Date(eventStartDate),
                step: step.step,
                topic: step.topic,
                timeline: step.timeline,
                videos: step.videos,
                isActive: getStepStatus(step.step, eventStartDate),
                isCompleted: completedSteps.has(step.step)
            })
            
            // If it spans multiple months, also add an event for the end month
            if (durationMonths > 1) {
                events.push({
                    date: new Date(eventEndDate),
                    step: step.step,
                    topic: step.topic,
                    timeline: step.timeline,
                    videos: step.videos,
                    isActive: getStepStatus(step.step, eventEndDate),
                    isCompleted: completedSteps.has(step.step)
                })
            }

            // Add milestone in the middle of the duration for better visibility
            if (durationMonths > 2) {
                const midMonthOffset = Math.floor(durationMonths / 2)
                const midDate = new Date(eventStartDate)
                midDate.setMonth(eventStartDate.getMonth() + midMonthOffset)
                setSafeDay(midDate)
                
                events.push({
                    date: new Date(midDate),
                    step: step.step,
                    topic: step.topic,
                    timeline: step.timeline,
                    videos: step.videos,
                    isActive: getStepStatus(step.step, midDate),
                    isCompleted: completedSteps.has(step.step)
                })
            }
        })
        
        return events.sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [playlist, completedSteps, sessionStartDate])

    // Get calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()
        
        const days: Array<{ date: Date | null; events: CalendarEvent[] }> = []
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: null, events: [] })
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dayEvents = calendarEvents.filter(event => {
                const eventDate = new Date(event.date)
                return eventDate.getDate() === day && 
                       eventDate.getMonth() === month && 
                       eventDate.getFullYear() === year
            })
            days.push({ date, events: dayEvents })
        }
        
        return days
    }, [currentMonth, calendarEvents])

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev)
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1)
            } else {
                newDate.setMonth(prev.getMonth() + 1)
            }
            return newDate
        })
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
                    <CalendarIcon className="w-16 h-16 text-blue-600 animate-pulse relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Loading Your Learning Calendar</h3>
                    <p className="text-sm text-gray-600 max-w-sm">
                        We're mapping your roadmap to a beautiful calendar view...
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
                                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Calendar</h3>
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
            <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                <Card className="border-dashed border-2 border-blue-200 bg-white/80 backdrop-blur-sm max-w-lg w-full shadow-lg">
                    <CardContent className="pt-12 pb-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                                <div className="relative p-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-xl">
                                    <CalendarIcon className="h-12 w-12 text-white" />
                                </div>
                            </motion.div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Complete Your Career Journey
                                </h3>
                                <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                                    Finish the career guidance conversation to unlock your personalized learning calendar with timeline visualization.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const totalVideos = playlist.reduce((sum, step) => sum + step.videos.length, 0)

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden">
            {/* Header with Stats */}
            <div className="flex-shrink-0 p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                            Learning Calendar
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Visualize your learning roadmap timeline</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {playlist.length} Steps
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {totalVideos} Videos
                        </Badge>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToToday}
                            className="text-xs"
                        >
                            Today
                        </Button>
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="flex items-center gap-2"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-4 lg:p-6">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {dayNames.map(day => (
                                <div
                                    key={day}
                                    className="text-center text-xs font-semibold text-gray-600 py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((dayData, idx) => {
                                if (!dayData.date) {
                                    return <div key={idx} className="aspect-square" />
                                }

                                const isToday = dayData.date.toDateString() === new Date().toDateString()
                                const hasEvents = dayData.events.length > 0
                                const event = dayData.events[0] // Show first event if multiple

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className={`
                                            aspect-square rounded-lg border-2 p-2 cursor-pointer
                                            transition-all duration-200
                                            ${isToday 
                                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                : hasEvents
                                                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-md'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }
                                        `}
                                        onClick={() => hasEvents && setSelectedEvent(event)}
                                        whileHover={hasEvents ? { scale: 1.05 } : {}}
                                    >
                                        <div className="flex flex-col h-full">
                                            <div className={`
                                                text-sm font-semibold mb-1
                                                ${isToday ? 'text-blue-600' : 'text-gray-700'}
                                            `}>
                                                {dayData.date.getDate()}
                                            </div>
                                            
                                            {hasEvents && event && (
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <div className={`
                                                        px-1.5 py-0.5 rounded text-[10px] font-medium truncate
                                                        ${event.isCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : event.isActive
                                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                                                : 'bg-blue-200 text-blue-800'
                                                        }
                                                    `}>
                                                        Step {event.step}
                                                    </div>
                                                    <div className="text-[9px] text-gray-600 line-clamp-2 leading-tight">
                                                        {event.topic}
                                                    </div>
                                                    {event.videos.length > 0 && (
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                                            <Video className="h-2.5 w-2.5" />
                                                            <span>{event.videos.length}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline Legend */}
                <div className="mt-6">
                    <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                Learning Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {playlist.map((step) => {
                                    const isCompleted = completedSteps.has(step.step)
                                    const isActive = step.step === 1
                                    
                                    return (
                                        <motion.div
                                            key={step.step}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: step.step * 0.1 }}
                                            className={`
                                                flex items-center gap-4 p-3 rounded-lg border-2 transition-all
                                                ${isCompleted
                                                    ? 'bg-green-50 border-green-200'
                                                    : isActive
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md'
                                                        : 'bg-white border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                                ${isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isActive
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                                        : 'bg-gray-200 text-gray-600'
                                                }
                                            `}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5" />
                                                ) : (
                                                    step.step
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                                                        {step.topic}
                                                    </h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {step.videos.length} videos
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{step.timeline}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Event Detail Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedEvent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        >
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Step {selectedEvent.step}
                                        </CardTitle>
                                        <p className="text-blue-100 text-sm mt-1">{selectedEvent.topic}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedEvent(null)}
                                        className="text-white hover:bg-white/20"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-medium">{selectedEvent.timeline}</span>
                                    </div>
                                    
                                    {selectedEvent.videos.length > 0 ? (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <Video className="h-4 w-4" />
                                                Recommended Videos ({selectedEvent.videos.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedEvent.videos.map((video, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                                        onClick={() => window.open(video.url, '_blank')}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <PlayCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                                                    {video.title}
                                                                </h5>
                                                                {video.channel && (
                                                                    <p className="text-xs text-gray-600">{video.channel}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No videos available for this step yet.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}