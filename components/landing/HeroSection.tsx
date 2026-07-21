'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSimulationsPathForUser } from '@/lib/dashboardNavigation';
import { cn } from '@/lib/utils';

const PARTNERSHIP_STATS = [
  {
    value: '500+',
    title: 'Universities',
    subtitle: 'Trust us',
    icon: IconUniversities,
  },
  {
    value: '50,000+',
    title: 'Students Guided',
    subtitle: 'And growing',
    icon: IconStudents,
  },
  {
    value: '2 Million+',
    title: 'AI Interactions',
    subtitle: 'Every month',
    icon: IconAiChat,
  },
  {
    value: '92%',
    title: 'Placement Readiness',
    subtitle: 'Average Improvement',
    icon: IconGrowth,
  },
  {
    value: '150+',
    title: 'Partner Companies',
    subtitle: 'Hiring our students',
    icon: IconBriefcase,
  },
] as const;

function IconUniversities({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 10.5 12 5l9 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 11.5v6.2c0 .4.2.8.6 1L12 21.5l5.9-2.8c.4-.2.6-.6.6-1v-6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12.5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 14.2v3.2M15.5 14.2v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconStudents({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 19.5c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14.2 19.5c.4-2.2 1.9-3.6 3.8-3.6 1.1 0 2.1.4 2.8 1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAiChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="9.5" r="0.9" fill="currentColor" />
      <circle cx="15" cy="9.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconGrowth({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19.5h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6.5 15.5 10 11l3 2.5 4.5-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 7.5h2.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="8"
        width="17"
        height="11.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 8V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8V8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3.5 12.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 11.2v2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const HeroSection = memo(function HeroSection({
  onStartReadiness,
}: {
  onStartReadiness?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const simulationsHref = getSimulationsPathForUser(user?.user_type);

  const handlePrimaryCta = useCallback(() => {
    if (user) {
      router.push('/dashboard/student');
      return;
    }
    onStartReadiness?.();
    document.getElementById('guest-readiness')?.scrollIntoView({ behavior: 'smooth' });
  }, [user, router, onStartReadiness]);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] scroll-mt-20 flex-col overflow-hidden bg-white dark:bg-gray-950 lg:scroll-mt-[76px]"
    >
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-brand-green/5 blur-3xl dark:bg-brand-green/10" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#FF541F]/5 blur-3xl dark:bg-[#FF541F]/10" />

      {/* Navbar clearance only — no extra top gap */}
      <div className="h-16 shrink-0 lg:h-[76px]" aria-hidden />

      <div className="relative z-10 mx-auto flex w-[90%] max-w-[1400px] flex-1 items-start pt-4 pb-6 sm:pt-6 lg:pt-6 lg:pb-4">
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* Left — copy & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="order-1 flex w-full flex-col justify-start"
          >
            <div className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#FF541F] lg:mb-6">
              <span className="h-2 w-2 rounded-full bg-[#FF541F]" aria-hidden />
              AI Career Platform
            </div>

            <h1 className="space-y-0 text-[1.75rem] font-bold leading-[1.2] tracking-tight text-gray-900 [word-spacing:0.12em] dark:text-white sm:text-4xl sm:leading-[1.22] sm:[word-spacing:0.14em] lg:text-[2.5rem] xl:text-[2.75rem]">
              <span className="block">
                Transform Student Potential into Placement Success
              </span>
              <span className="block">
                Prepare Smarter.{' '}
                <span className="text-[#FF541F]">Get Placed Faster.</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-[1.75] text-gray-600 dark:text-gray-400 sm:mt-7 sm:text-base sm:leading-[1.8] lg:mt-8 lg:text-lg lg:leading-[1.85]">
              Empower students with personalized career guidance, AI mock interviews, resume analysis,
              coding assessments, and placement preparation—all in one intelligent platform designed for
              universities.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mt-10">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className={cn(
                  'inline-flex w-full max-w-md items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(9,136,85,0.3)] transition-all duration-300',
                  'bg-brand-green hover:bg-brand-green-dark hover:shadow-[0_12px_28px_rgba(9,136,85,0.38)]',
                  'sm:w-auto sm:rounded-xl sm:px-6 sm:py-3 sm:text-base',
                )}
              >
                <span className="sm:hidden">Check Job Readiness — Free</span>
                <span className="hidden sm:inline">Check Your Job Readiness Score</span>
              </button>

              <Link
                href={simulationsHref}
                className="inline-flex items-center gap-2.5 text-sm font-semibold text-gray-900 transition hover:text-brand-blue dark:text-white dark:hover:text-brand-cyan sm:gap-3 sm:text-base"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF541F] text-white shadow-md transition hover:scale-105 sm:h-11 sm:w-11">
                  <Play className="ml-0.5 h-4 w-4 fill-current sm:h-5 sm:w-5" />
                </span>
                Job Prep Simulation
              </Link>
            </div>
          </motion.div>

          {/* Right — hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative order-2 mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px] sm:aspect-square sm:max-w-[500px] lg:max-w-none lg:aspect-auto lg:h-[min(calc(100dvh-14rem),480px)]">
              {/* Concentric rings */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="absolute h-[92%] w-[92%] rounded-full border border-gray-200/70 dark:border-gray-800/80" />
                <div className="absolute h-[78%] w-[78%] rounded-full border border-gray-200/50 dark:border-gray-800/60" />
                <div className="absolute h-[64%] w-[64%] rounded-full border border-gray-100 dark:border-gray-800/40" />
              </div>

              {/* Geometric accent shapes */}
              <div className="pointer-events-none absolute -right-2 top-6 hidden sm:block lg:-right-4 lg:top-8">
                <div className="relative h-28 w-28 lg:h-36 lg:w-36">
                  <div className="absolute inset-0 rotate-12 rounded-2xl bg-brand-green/90 shadow-lg" />
                  <div className="absolute -bottom-2 -left-3 h-20 w-20 rotate-[-8deg] rounded-2xl bg-[#FF541F]/90 shadow-md lg:h-24 lg:w-24" />
                  <span className="absolute left-3 top-4 text-xl font-bold tracking-wide text-white/25 lg:text-2xl">
                    Learn
                  </span>
                </div>
              </div>

              {/* Decorative dots */}
              <span className="absolute left-[8%] top-[18%] h-2.5 w-2.5 rounded-full bg-brand-green" />
              <span className="absolute right-[12%] top-[28%] h-2 w-2 rounded-full bg-[#FF541F]" />
              <span className="absolute bottom-[22%] right-[6%] h-2.5 w-2.5 rounded-full bg-brand-green/70" />

              {/* Floating — verified badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute left-0 top-[12%] z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:bg-gray-900 sm:left-4 sm:h-11 sm:w-11"
              >
                <CheckCircle2 className="h-5 w-5 text-brand-yellow sm:h-6 sm:w-6" />
              </motion.div>

              {/* Floating — platform badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute right-4 top-[8%] z-20 rounded-xl bg-white px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:bg-gray-900 sm:right-8"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trusted by</p>
                <p className="text-sm font-bold text-brand-blue dark:text-brand-cyan">Universities</p>
              </motion.div>

              {/* Hero image */}
              <div className="relative z-10 flex h-full items-end justify-center pb-2">
                <div className="relative h-[88%] w-[85%]">
                  <Image
                    src="/images/modelimage.webp"
                    alt="Student preparing for placement with SolviQ"
                    fill
                    className="object-contain object-bottom drop-shadow-2xl"
                    priority
                    sizes="(max-width: 768px) 90vw, 50vw"
                  />
                </div>
              </div>

              {/* Floating — testimonial card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute bottom-[6%] left-0 z-20 max-w-[200px] rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.1)] dark:border-gray-800 dark:bg-gray-900 sm:left-2 sm:max-w-[220px]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue dark:bg-brand-blue/20 dark:text-brand-cyan">
                    SK
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">Placement Ready</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Campus Student</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
                  ))}
                  <span className="ml-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">4.9 Rating</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Partnership / impact banner — laptop+ only */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative z-10 mx-auto mt-auto hidden w-[90%] max-w-[1400px] pb-8 pt-0 lg:block"
      >
        <div className="rounded-2xl border border-gray-100 bg-white px-2 py-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)] xl:px-4">
          <div className="grid grid-cols-5 divide-x divide-gray-100 dark:divide-gray-800">
            {PARTNERSHIP_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="flex flex-col items-center px-3 py-2 text-center xl:px-5"
                >
                  <Icon className="mb-2.5 h-7 w-7 text-brand-green" />
                  <p className="text-2xl font-bold tracking-tight text-brand-green xl:text-[1.65rem]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {stat.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {stat.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
});
