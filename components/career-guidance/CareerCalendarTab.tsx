"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  Sparkles,
  AlertCircle,
  Loader2,
  Route,
} from 'lucide-react'
import { toDateKey } from '@/lib/career-calendar'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import YouTubeEmbedModal, { type EmbeddableVideo } from './YouTubeEmbedModal'

interface CareerCalendarTabProps {
  sessionId: string
}

type DayStatus = 'pending' | 'done' | 'skipped'

interface StudySession {
  index: number
  day_offset: number
  week: number
  phase: string
  topic: string
  video: (EmbeddableVideo & { thumbnail?: string }) | Record<string, never>
  status: DayStatus
}

interface StudyPlan {
  target_role: string
  start_date: string
  cadence_days: number
  total_sessions: number
  sessions: StudySession[]
}

interface RoleOption {
  target_role: string
  match_percentage: number
  phases: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseStartDate(s?: string): Date {
  const d = s ? new Date(`${s}T12:00:00`) : new Date()
  if (Number.isNaN(d.getTime())) return new Date()
  d.setHours(12, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

export default function CareerCalendarTab({ sessionId }: CareerCalendarTabProps) {
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const [activeVideo, setActiveVideo] = useState<EmbeddableVideo | null>(null)

  // Load target roles from the student's GPS, then any existing plan for the first role.
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const { apiClient } = await import('@/lib/api')
        const data = await apiClient.getStudyPlanRoles()
        const roleList: RoleOption[] = data?.roles || []
        if (cancelled) return
        setRoles(roleList)
        if (roleList.length > 0) {
          const first = roleList[0].target_role
          setSelectedRole(first)
          const existing = await apiClient.getStudyPlan(first)
          if (!cancelled && existing?.plan) {
            applyPlan(existing.plan)
          }
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Failed to load study plan'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void init()
    return () => { cancelled = true }
  }, [sessionId])

  const applyPlan = (p: StudyPlan) => {
    setPlan(p)
    const start = parseStartDate(p.start_date)
    setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1))
  }

  const handleRoleChange = async (role: string) => {
    setSelectedRole(role)
    setPlan(null)
    setError(null)
    try {
      const { apiClient } = await import('@/lib/api')
      const existing = await apiClient.getStudyPlan(role)
      if (existing?.plan) applyPlan(existing.plan)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load study plan'))
    }
  }

  const confirmStudyPlan = async (force = false) => {
    if (!selectedRole) return
    setGenerating(true)
    setError(null)
    try {
      const { apiClient } = await import('@/lib/api')
      const data = await apiClient.generateStudyPlan({ role: selectedRole, force })
      if (data?.plan) {
        applyPlan(data.plan)
        toast.success(`Study plan ready for ${data.plan.target_role}`)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate study plan'))
    } finally {
      setGenerating(false)
    }
  }

  const setSessionStatus = useCallback(
    async (session: StudySession, status: DayStatus) => {
      if (!plan) return
      // Optimistic update.
      setPlan((prev) =>
        prev
          ? { ...prev, sessions: prev.sessions.map((s) => (s.index === session.index ? { ...s, status } : s)) }
          : prev,
      )
      try {
        const { apiClient } = await import('@/lib/api')
        await apiClient.updateStudyPlanDay({ role: plan.target_role, session_index: session.index, status })
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to save progress'))
      }
    },
    [plan],
  )

  // Map sessions -> concrete calendar dates (start_date + day_offset). No cycling.
  const { tasksByDate, planStart, planEnd } = useMemo(() => {
    const map = new Map<string, StudySession & { date: Date }>()
    if (!plan) return { tasksByDate: map, planStart: new Date(), planEnd: new Date() }
    const start = parseStartDate(plan.start_date)
    let last = start
    plan.sessions.forEach((s) => {
      const date = addDays(start, s.day_offset)
      last = date
      map.set(toDateKey(date), { ...s, date })
    })
    return { tasksByDate: map, planStart: start, planEnd: last }
  }, [plan])

  const completedCount = plan ? plan.sessions.filter((s) => s.status === 'done').length : 0

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startingDayOfWeek = firstDay.getDay()
    const todayKey = toDateKey(new Date())

    const days: Array<{ date: Date | null; task?: StudySession & { date: Date } }> = []
    for (let i = 0; i < startingDayOfWeek; i += 1) days.push({ date: null })
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day, 12, 0, 0, 0)
      days.push({ date, task: tasksByDate.get(toDateKey(date)) })
    }
    return { days, todayKey }
  }, [currentMonth, tasksByDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
      return next
    })
  }

  const selectedRoleObj = roles.find((r) => r.target_role === selectedRole)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-600">Loading your study calendar...</p>
      </div>
    )
  }

  if (error && roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Card className="border-red-200 bg-red-50/50 max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Card className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="py-12 px-6 text-center space-y-4">
            <CalendarIcon className="h-12 w-12 text-[#0068FC] mx-auto" />
            <h3 className="text-xl font-bold text-gray-900">No Career Paths Yet</h3>
            <p className="text-sm text-gray-600">
              Generate your Career GPS paths first — then pick one here to build a daily study plan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden">
      <YouTubeEmbedModal video={activeVideo} onClose={() => setActiveVideo(null)} />

      {/* Role selection + confirm bar */}
      <div className="flex-shrink-0 p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Daily Learning Calendar
          </h2>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Route className="h-4 w-4 text-[#f58020]" />
            Your detailed career path is here — pick a target role and confirm your study plan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target role (from your Career GPS)</label>
            <select
              value={selectedRole}
              onChange={(e) => void handleRoleChange(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-[#1b52a4] focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.target_role} value={r.target_role}>
                  {r.target_role} — {r.match_percentage}% match ({r.phases} phases)
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => void confirmStudyPlan(false)}
            disabled={generating || !selectedRole}
            className="bg-[#1b52a4] hover:bg-[#164080] text-white gap-2 rounded-xl py-2.5 px-5 font-semibold h-[46px]"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {plan ? 'View Plan' : 'Confirm Study Plan'}
          </Button>
          {plan && (
            <Button
              variant="outline"
              onClick={() => void confirmStudyPlan(true)}
              disabled={generating}
              className="rounded-xl py-2.5 px-4 h-[46px] border-[#1b52a4]/40 text-[#1b52a4]"
            >
              Rebuild
            </Button>
          )}
        </div>

        {plan && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className="bg-blue-100 text-blue-700">{plan.total_sessions} study days</Badge>
            <Badge className="bg-green-100 text-green-700">{completedCount} completed</Badge>
            <Badge className="bg-purple-100 text-purple-700">{plan.total_sessions - completedCount} remaining</Badge>
            <span className="text-xs text-gray-500">
              {planStart.toLocaleDateString()} → {planEnd.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
        {!plan ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-[#E8E0F5]">
              <CalendarIcon className="h-12 w-12 text-[#7F56D9]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Build your day-by-day plan for {selectedRoleObj?.target_role || selectedRole}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              We’ll turn this role’s roadmap into an ordered curriculum and assign a specific video to
              each study day — all playable right here on SolvIQ.
            </p>
            <Button
              onClick={() => void confirmStudyPlan(false)}
              disabled={generating}
              className="bg-[#f58020] hover:bg-[#d66d12] text-white gap-2 mt-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Confirm & Generate Plan
            </Button>
          </div>
        ) : (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <h3 className="text-lg font-bold text-gray-900">
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAY_NAMES.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.days.map((dayData, idx) => {
                    if (!dayData.date) return <div key={`empty-${idx}`} className="min-h-[104px]" />

                    const dateKey = toDateKey(dayData.date)
                    const isToday = dateKey === calendarDays.todayKey
                    const task = dayData.task
                    const status = task?.status

                    return (
                      <div
                        key={dateKey}
                        className={`
                          min-h-[104px] rounded-lg border-2 p-1.5 flex flex-col
                          ${isToday ? 'border-blue-500 bg-blue-50' : ''}
                          ${!isToday && task ? 'border-indigo-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/50' : ''}
                          ${!isToday && !task ? 'border-gray-100 bg-gray-50/50' : ''}
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
                          <button
                            type="button"
                            onClick={() => setSelectedSession(task)}
                            className="text-left flex-1 min-h-0"
                          >
                            <p className="text-[9px] font-semibold text-indigo-700 truncate">Day {task.index}</p>
                            <p className="text-[9px] text-gray-700 line-clamp-3 leading-tight mt-0.5">
                              {task.topic || task.video?.title || 'Study session'}
                            </p>
                          </button>
                        ) : (
                          <p className="text-[9px] text-gray-400 mt-2">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Curriculum overview */}
            <div className="mt-6">
              <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {plan.target_role} — Curriculum ({plan.total_sessions} sessions)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plan.sessions.map((s) => {
                    const date = addDays(planStart, s.day_offset)
                    return (
                      <div key={s.index} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {s.index}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSession(s)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="font-semibold text-sm truncate">{s.topic || s.video?.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {date.toLocaleDateString()} · {s.phase || 'Study'}
                          </p>
                        </button>
                        {s.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                        {s.status === 'skipped' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Day detail modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedSession(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Day {selectedSession.index}
              </CardTitle>
              <p className="text-blue-100 text-sm">
                {selectedSession.phase} · {addDays(planStart, selectedSession.day_offset).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="font-medium text-gray-900">{selectedSession.topic}</p>
              <div className="p-4 rounded-xl border bg-gray-50 flex items-start gap-3">
                <Video className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedSession.video?.title || 'Recommended video'}
                  </p>
                  {selectedSession.video?.channel && (
                    <p className="text-xs text-gray-500 mt-1">{selectedSession.video.channel}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSession.video?.video_id || selectedSession.video?.embed_url || selectedSession.video?.url ? (
                  <Button
                    className="flex-1 min-w-[130px]"
                    onClick={() => {
                      setActiveVideo(selectedSession.video as EmbeddableVideo)
                      setSelectedSession(null)
                    }}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" /> Watch here
                  </Button>
                ) : (
                  <p className="text-xs text-gray-500 flex-1">No video was resolved for this session.</p>
                )}
                <Button
                  variant="outline"
                  className="text-green-700 border-green-300"
                  onClick={() => { void setSessionStatus(selectedSession, 'done'); setSelectedSession(null) }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                </Button>
                <Button
                  variant="outline"
                  className="text-red-700 border-red-300"
                  onClick={() => { void setSessionStatus(selectedSession, 'skipped'); setSelectedSession(null) }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Skip
                </Button>
              </div>
            </CardContent>
          </motion.div>
        </div>
      )}
    </div>
  )
}
