'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/** Decorative blobs + wave lines (same as MockInterviewLanding). */
export function StudentBrandPageDecorations() {
  return (
    <>
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#dce8f8]/40 dark:bg-blue-950/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-32 h-48 w-48 rounded-full bg-[#ffe8d6]/30 dark:bg-orange-950/10 blur-3xl" />
      <svg
        className="pointer-events-none absolute right-[18%] top-8 hidden h-24 w-40 text-[#c5d9f0]/40 dark:text-orange-500/10 lg:block"
        viewBox="0 0 160 80"
        fill="none"
        aria-hidden
      >
        <path d="M0 40 Q40 10 80 40 T160 40" stroke="currentColor" strokeWidth="2" />
        <path d="M0 55 Q50 25 90 55 T160 55" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      </svg>
    </>
  )
}

type StudentBrandPageShellProps = {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  maxWidthClass?: string
}

/**
 * Full-bleed student page wrapper with brand-hero gradient + shared decorative background.
 * Matches mock-interview, simulations, mock-tests, and career-guidance pages.
 */
export function StudentBrandPageShell({
  children,
  className,
  contentClassName,
  maxWidthClass = 'w-full max-w-none',
}: StudentBrandPageShellProps) {
  return (
    <div
      className={cn(
        'relative -mx-6 -mb-6 -mt-20 min-h-screen w-auto overflow-x-hidden',
        'bg-brand-hero dark:bg-brand-hero-dark',
        // Cancel DashboardLayout p-6 for full-bleed bg; keep only minimal edge inset for content
        'px-3 pb-10 pt-20 sm:px-4 lg:-mt-24 lg:px-5 lg:pt-24 xl:px-6',
        className,
      )}
    >
      <StudentBrandPageDecorations />
      <div className={cn('relative w-full', maxWidthClass, contentClassName)}>
        {children}
      </div>
    </div>
  )
}
