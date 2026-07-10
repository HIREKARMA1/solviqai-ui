export interface CalendarVideo {
  title: string
  url: string
  thumbnail?: string
  duration?: string
  channel?: string
}

export interface PlaylistStepInput {
  step: number
  topic: string
  timeline: string
  videos: CalendarVideo[]
}

export type DayTaskStatus = 'pending' | 'done' | 'skipped'

export interface DailyStudyTask {
  dateKey: string
  date: Date
  step: number
  topic: string
  timeline: string
  dayIndex: number
  totalDaysInStep: number
  video: CalendarVideo
  taskLabel: string
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse timeline strings like "1 Month", "2 Months", "3 Weeks", "~1 month" into day count. */
export function parseTimelineDays(timeline: string): number {
  const t = (timeline || '').toLowerCase().trim()
  if (!t) return 30

  const weeks = t.match(/(\d+)\s*weeks?/)
  if (weeks) return Math.max(7, parseInt(weeks[1], 10) * 7)

  const rangeMonths = t.match(/(\d+)\s*-\s*(\d+)\s*months?/)
  if (rangeMonths) {
    const span = parseInt(rangeMonths[2], 10) - parseInt(rangeMonths[1], 10) + 1
    return Math.max(7, span * 30)
  }

  const months = t.match(/(\d+)\s*months?/) || t.match(/months?\s*(\d+)/)
  if (months) return Math.max(7, parseInt(months[1], 10) * 30)

  if (t.includes('month')) return 30
  if (t.includes('week')) return 14

  const nums = t.match(/(\d+)/)
  if (nums) return Math.max(7, parseInt(nums[1], 10) * 30)

  return 30
}

/** Spread playlist steps across consecutive calendar days with one video/task per day. */
export function buildDailyStudyPlan(
  playlist: PlaylistStepInput[],
  planStart: Date,
): DailyStudyTask[] {
  if (!playlist.length) return []

  const tasks: DailyStudyTask[] = []
  let cursor = addDays(planStart, 0)

  for (const step of playlist) {
    const totalDays = parseTimelineDays(step.timeline)
    const videos =
      step.videos.length > 0
        ? step.videos
        : [{ title: `Study session: ${step.topic}`, url: '' }]

    for (let day = 0; day < totalDays; day += 1) {
      const date = addDays(cursor, day)
      const video = videos[day % videos.length]
      tasks.push({
        dateKey: toDateKey(date),
        date,
        step: step.step,
        topic: step.topic,
        timeline: step.timeline,
        dayIndex: day + 1,
        totalDaysInStep: totalDays,
        video,
        taskLabel: video.title || step.topic,
      })
    }

    cursor = addDays(cursor, totalDays)
  }

  return tasks
}

const STORAGE_PREFIX = 'career_calendar_progress_'

export function loadDayProgress(sessionId: string): Record<string, DayTaskStatus> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`)
    return raw ? (JSON.parse(raw) as Record<string, DayTaskStatus>) : {}
  } catch {
    return {}
  }
}

export function saveDayProgress(sessionId: string, progress: Record<string, DayTaskStatus>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify(progress))
}
