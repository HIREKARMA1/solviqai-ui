"use client"

import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'
import { Award, FolderKanban, Gauge, ShieldCheck, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { strengthBarClass, strengthTone } from '@/lib/studentProfile'

function Widget({
  href,
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  children,
}: {
  href?: string
  icon: ElementType
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
  children?: ReactNode
}) {
  const inner = (
    <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-[#1C2938] p-4 shadow-sm min-h-[132px] flex flex-col h-full transition-shadow hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      {children}
      {sub ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto pt-1">{sub}</p> : null}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    )
  }
  return inner
}

export function StudentProfileWidgets({
  completion = 0,
  strengthScore = 0,
  strengthLevel = 'Weak',
  totalSkills = 0,
  totalProjects = 0,
  totalCertifications = 0,
  linkToProfile = true,
}: {
  completion?: number
  strengthScore?: number
  strengthLevel?: string
  totalSkills?: number
  totalProjects?: number
  totalCertifications?: number
  linkToProfile?: boolean
}) {
  const profileHref = linkToProfile ? '/dashboard/student/profile' : undefined
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <Widget
        href={profileHref}
        icon={Sparkles}
        label="Profile Completion"
        value={`${Math.round(completion)}%`}
        sub="Complete your profile to stand out"
        iconBg="bg-blue-100 dark:bg-blue-950/50"
        iconColor="text-[#0068FC] dark:text-[#8EBDFF]"
      >
        <Progress value={Math.min(100, Math.max(0, completion))} className="mt-2 h-2" />
      </Widget>
      <Widget
        href={profileHref}
        icon={Gauge}
        label="Strength Score"
        value={Math.round(strengthScore)}
        sub={strengthLevel}
        iconBg="bg-violet-100 dark:bg-violet-950/50"
        iconColor="text-violet-600 dark:text-violet-400"
      >
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full transition-all ${strengthBarClass(strengthLevel)}`}
            style={{ width: `${Math.min(100, Math.max(0, strengthScore))}%` }}
          />
        </div>
        <p className={`text-xs font-semibold mt-1 ${strengthTone(strengthLevel)}`}>{strengthLevel}</p>
      </Widget>
      <Widget
        href={profileHref}
        icon={ShieldCheck}
        label="Total Skills"
        value={totalSkills}
        sub="From resume, assessments & you"
        iconBg="bg-emerald-100 dark:bg-emerald-950/50"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <Widget
        href={profileHref}
        icon={FolderKanban}
        label="Total Projects"
        value={totalProjects}
        sub="Showcase your work"
        iconBg="bg-orange-100 dark:bg-orange-950/50"
        iconColor="text-[#f58020]"
      />
      <Widget
        href={profileHref}
        icon={Award}
        label="Total Certifications"
        value={totalCertifications}
        sub="Verified credentials"
        iconBg="bg-amber-100 dark:bg-amber-950/50"
        iconColor="text-amber-600 dark:text-amber-400"
      />
    </div>
  )
}
