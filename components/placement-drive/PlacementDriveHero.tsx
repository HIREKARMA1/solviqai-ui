'use client';

import Image from 'next/image';
import { Briefcase, Sparkles, Target, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

const HERO_PILLS = [
  { icon: Briefcase, label: 'Real Drives' },
  { icon: Target, label: 'Real Experience' },
  { icon: Sparkles, label: 'Real Opportunities' },
] as const;

export function PlacementDriveHero() {
  const { user } = useAuth();

  const welcomeName = useMemo(() => {
    const first = user?.name?.trim().split(/\s+/)[0];
    return first ? first.toUpperCase() : 'STUDENT';
  }, [user?.name]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-r from-[#eef4fc] via-[#f4f8fe] to-[#fafcff] shadow-[0_4px_24px_rgba(27,82,164,0.06)] dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Soft gradient orbs */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand-blue/[0.07]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-brand-cyan/[0.06]" />

      {/* Dot grid — top right */}
      <div className="pointer-events-none absolute right-6 top-5 hidden gap-1.5 opacity-35 sm:grid sm:grid-cols-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="h-1 w-1 rounded-full bg-brand-blue/50" />
        ))}
      </div>

      {/* Decorative arc SVG */}
      <svg
        className="pointer-events-none absolute right-[28%] top-0 hidden h-full w-32 text-brand-blue/[0.06] lg:block"
        viewBox="0 0 120 200"
        fill="none"
        aria-hidden
      >
        <path
          d="M60 0 C100 40 100 160 60 200"
          stroke="currentColor"
          strokeWidth="28"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex min-h-[180px] flex-col p-6 sm:min-h-[200px] sm:p-8 lg:min-h-[230px] lg:p-10 lg:py-12 lg:flex-row lg:items-center lg:pr-[min(38%,300px)]">
        <div className="max-w-xl flex-1">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-[11px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400 mb-3">
            <span className="inline-flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-orange-500 text-white">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
            </span>
            Welcome, {welcomeName}!
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[#1a2d52] sm:text-2xl lg:text-[1.75rem] dark:text-white">
            Placement Drive Simulation
          </h1>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#5a6b85] sm:text-sm dark:text-gray-300">
            Experience real company hiring processes with multiple rounds. Practice. Improve. Get Hired!
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {HERO_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-semibold text-brand-blue shadow-sm dark:border-brand-blue/20 dark:bg-gray-900/60 dark:text-brand-blue-light"
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Illustration — anchored bottom-right */}
      <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[min(36%,280px)] max-w-[300px] lg:block">
        <Image
          src="/images/20943965.png"
          alt="Placement drive illustration"
          width={300}
          height={220}
          className="h-auto w-full object-contain object-bottom"
          priority
        />
      </div>

    </section>
  );
}
