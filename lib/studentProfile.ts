import { config } from '@/lib/config'

export type SkillSource = 'manual' | 'resume' | 'assessment'
export type SkillCategory = 'technical' | 'soft' | 'domain' | 'tool'

export interface StudentSkill {
  id: string
  name: string
  category: SkillCategory
  source: SkillSource
}

export interface StudentProject {
  id: string
  title: string
  description?: string
  technologies?: string[]
  url?: string
  start_date?: string
  end_date?: string
}

export interface StudentCertification {
  id: string
  name: string
  issuer?: string
  issue_date?: string
  expiry_date?: string
  credential_url?: string
}

export interface StudentExperience {
  id: string
  title: string
  organization?: string
  employment_type?: string
  start_date?: string
  end_date?: string
  currently_working?: boolean
  description?: string
  location?: string
}

export interface CareerPreferences {
  preferred_industries: string[]
  job_roles: string[]
  locations: string[]
  work_mode?: string
  expected_ctc?: string
  job_type?: string
}

export interface ProfileStrength {
  score: number
  level: string
  breakdown?: Record<string, number>
}

export interface ProfileCompletion {
  completion_percentage: number
  completed_sections?: string[]
  missing_sections?: string[]
  section_status?: Record<string, boolean>
}

export function profileMediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const origin = config.api.baseUrl.replace(/\/api\/v1\/?$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalized}`
}

export function strengthTone(level?: string): string {
  switch ((level || '').toLowerCase()) {
    case 'excellent':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'strong':
      return 'text-blue-600 dark:text-blue-400'
    case 'average':
      return 'text-amber-600 dark:text-amber-400'
    default:
      return 'text-rose-600 dark:text-rose-400'
  }
}

export function strengthBarClass(level?: string): string {
  switch ((level || '').toLowerCase()) {
    case 'excellent':
      return 'bg-emerald-500'
    case 'strong':
      return 'bg-blue-500'
    case 'average':
      return 'bg-amber-500'
    default:
      return 'bg-rose-500'
  }
}

export const SECTION_LABELS: Record<string, string> = {
  profile_details: 'Profile details',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  experience: 'Experience',
  career_preferences: 'Career preferences',
  resume: 'Resume',
  profile_photo: 'Profile photo',
}
