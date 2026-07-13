"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import {
  buildDailyStudyPlan,
  loadDayProgress,
  saveDayProgress,
  toDateKey,
  type DailyStudyTask,
  type DayTaskStatus,
  type PlaylistStepInput,
} from '@/lib/career-calendar'

interface CareerCalendarTabProps {
  sessionId: string
}

export default function CareerCalendarTab({ sessionId }: CareerCalendarTabProps) {
  const [playlist, setPlaylist] = useState<PlaylistStepInput[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [planStartDate, setPlanStartDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState<DailyStudyTask | null>(null)
  const [dayProgress, setDayProgress] = useState<Record<string, DayTaskStatus>>({})

  useEffect(() => {
    setDayProgress(loadDayProgress(sessionId))
  }, [sessionId])

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

      const start = data.session_created_at ? new Date(data.session_created_at) : new Date()
      start.setHours(12, 0, 0, 0)
      setPlanStartDate(start)
      setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const dailyTasks = useMemo(
    () => buildDailyStudyPlan(playlist, planStartDate),
    [playlist, planStartDate],
  )

  const tasksByDate = useMemo(() => {
    const map = new Map<string, DailyStudyTask>()
    dailyTasks.forEach((task) => map.set(task.dateKey, task))
    return map
  }, [dailyTasks])

  const setTaskStatus = useCallback(
    (dateKey: string, status: DayTaskStatus) => {
      setDayProgress((prev) => {
        const next = { ...prev, [dateKey]: status }
        saveDayProgress(sessionId, next)
        return next
      })
    },
    [sessionId],
  )

  const completedCount = useMemo(
    () => Object.values(dayProgress).filter((s) => s === 'done').length,
    [dayProgress],
  )

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startingDayOfWeek = firstDay.getDay()
    const todayKey = toDateKey(new Date())

    const days: Array<{ date: Date | null; task?: DailyStudyTask; status?: DayTaskStatus }> = []

    for (let i = 0; i < startingDayOfWeek; i += 1) {
      days.push({ date: null })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day, 12, 0, 0, 0)
      const dateKey = toDateKey(date)
      const task = tasksByDate.get(dateKey)
      days.push({
        date,
        task,
        status: dayProgress[dateKey] || (task ? 'pending' : undefined),
      })
    }

    return { days, todayKey }
  }, [currentMonth, tasksByDate, dayProgress])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
      return next
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <CalendarIcon className="w-16 h-16 text-blue-600 animate-pulse" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Building Your Daily Study Plan</h3>
          <p className="text-sm text-gray-600 max-w-sm">Spreading videos across each day of your roadmap...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Card className="border-red-200 bg-red-50/50 max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={loadPlaylist} variant="outline">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Card className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="py-12 px-6 text-center space-y-4">
            <CalendarIcon className="h-12 w-12 text-[#0068FC] mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">Complete Your Career Journey</h3>
            <p className="text-sm text-gray-600">Finish counseling to unlock your daily learning calendar.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const planEndDate = dailyTasks.length > 0 ? dailyTasks[dailyTasks.length - 1].date : planStartDate
  const totalPlannedDays = dailyTasks.length

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden">
      <div className="flex-shrink-0 p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              Daily Learning Calendar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalPlannedDays} study days from {planStartDate.toLocaleDateString()} to {planEndDate.toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">{playlist.length} phases</Badge>
            <Badge className="bg-green-100 text-green-700">{completedCount} completed</Badge>
            <Badge className="bg-purple-100 text-purple-700">{totalPlannedDays - completedCount} remaining</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> Planned</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Done</span>
          <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Skipped</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-4 lg:p-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.days.map((dayData, idx) => {
                if (!dayData.date) {
                  return <div key={`empty-${idx}`} className="min-h-[110px]" />
                }

                const dateKey = toDateKey(dayData.date)
                const isToday = dateKey === calendarDays.todayKey
                const task = dayData.task
                const status = dayData.status
                const isPlanned = Boolean(task)
                const isPast = dayData.date < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <motion.div
                    key={dateKey}
                    className={`
                      min-h-[110px] rounded-lg border-2 p-1.5 flex flex-col
                      ${isToday ? 'border-blue-500 bg-blue-50 shadow-md' : ''}
                      ${!isToday && isPlanned ? 'border-indigo-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50' : ''}
                      ${!isToday && !isPlanned ? 'border-gray-100 bg-gray-50/50' : ''}
                      ${isPast && status === 'pending' ? 'opacity-80' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {dayData.date.getDate()}
                      </span>
                      {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                      {status === 'skipped' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    </div>

                    {task ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedDay(task)}
                          className="text-left flex-1 min-h-0"
                        >
                          <p className="text-[9px] font-semibold text-indigo-700 truncate">Step {task.step}</p>
                          <p className="text-[9px] text-gray-700 line-clamp-2 leading-tight mt-0.5">{task.taskLabel}</p>
                          <p className="text-[8px] text-gray-500 mt-0.5">Day {task.dayIndex}/{task.totalDaysInStep}</p>
                        </button>
                        <div className="flex gap-0.5 mt-1">
                          <button
                            type="button"
                            title="Mark done"
                            onClick={(e) => { e.stopPropagation(); setTaskStatus(dateKey, 'done') }}
                            className={`flex-1 py-0.5 rounded text-[10px] flex items-center justify-center ${status === 'done' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Mark skipped"
                            onClick={(e) => { e.stopPropagation(); setTaskStatus(dateKey, 'skipped') }}
                            className={`flex-1 py-0.5 rounded text-[10px] flex items-center justify-center ${status === 'skipped' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[9px] text-gray-400 mt-2">No plan</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Phase Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {playlist.map((step) => {
                const stepTasks = dailyTasks.filter((t) => t.step === step.step)
                const stepDone = stepTasks.filter((t) => dayProgress[t.dateKey] === 'done').length
                return (
                  <div key={step.step} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{step.topic}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.timeline} · {stepDone}/{stepTasks.length} days done
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardTitle>
                <p className="text-blue-100 text-sm">Step {selectedDay.step}: {selectedDay.topic}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Day {selectedDay.dayIndex} of {selectedDay.totalDaysInStep} in this phase ({selectedDay.timeline})
                </p>
                <div className="p-4 rounded-xl border bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedDay.taskLabel}</p>
                      {selectedDay.video.channel && (
                        <p className="text-xs text-gray-500 mt-1">{selectedDay.video.channel}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedDay.video.url && (
                    <Button className="flex-1" onClick={() => window.open(selectedDay.video.url, '_blank')}>
                      <PlayCircle className="w-4 h-4 mr-2" /> Watch Video
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-green-700 border-green-300"
                    onClick={() => { setTaskStatus(selectedDay.dateKey, 'done'); setSelectedDay(null) }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-300"
                    onClick={() => { setTaskStatus(selectedDay.dateKey, 'skipped'); setSelectedDay(null) }}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Skip
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
