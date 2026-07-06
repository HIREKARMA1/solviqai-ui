'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Code2,
  Lightbulb,
  Mic,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Volume2,
} from 'lucide-react';

const ROLE_OPTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Product Manager',
  'Business Analyst',
  'DevOps Engineer',
];

const HERO_TAGS = [
  { icon: Mic, label: 'Voice Input' },
  { icon: Sparkles, label: 'Smart AI' },
  { icon: BarChart3, label: 'Real-time Feedback' },
  { icon: Target, label: 'Get Hired' },
] as const;

const WHY_PRACTICE = [
  {
    icon: Mic,
    tone: 'orange' as const,
    title: 'Voice-Powered Interaction',
    description: 'Speak naturally — we transcribe your answers in real time.',
  },
  {
    icon: Brain,
    tone: 'blue' as const,
    title: 'Adaptive AI Interviewer',
    description: 'Questions adapt to your role, company, and interview type.',
  },
  {
    icon: TrendingUp,
    tone: 'orange' as const,
    title: 'Smart Feedback',
    description: 'Get scored reports with strengths and areas to improve.',
  },
  {
    icon: Shield,
    tone: 'blue' as const,
    title: 'Private & Secure',
    description: 'Your sessions stay private. Voice capture only with consent.',
  },
] as const;

// const FOOTER_FEATURES = [
//   { icon: Mic, tone: 'orange' as const, title: 'Voice Input (STT)', subtitle: 'Speak naturally, we transcribe your answers.' },
//   { icon: Volume2, tone: 'blue' as const, title: 'Spoken Questions (TTS)', subtitle: 'Listen to AI questions like a real interview.' },
//   { icon: Target, tone: 'orange' as const, title: 'Role-Specific Questions', subtitle: 'Tailored questions based on your selected role.' },
//   { icon: BarChart3, tone: 'blue' as const, title: 'Performance Insights', subtitle: 'Track your progress and improve continuously.' },
// ] as const;

const cardShadow = 'shadow-[0_8px_32px_rgba(26,43,75,0.05)]';

const iconSquare = (tone: 'orange' | 'blue') =>
  tone === 'orange'
    ? 'bg-[#fff0e6] dark:bg-orange-950/40 text-[#f97316]'
    : 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1e4a8a] dark:text-blue-400';

const iconCircle = (tone: 'orange' | 'blue') =>
  tone === 'orange'
    ? 'bg-[#fff0e6] dark:bg-orange-950/40 text-[#f97316] border-[#ffe4cc] dark:border-orange-900/30'
    : 'bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1e4a8a] dark:text-blue-400 border-[#d4e4f7] dark:border-blue-900/30';

type MockInterviewLandingProps = {
  targetRole: string;
  company: string;
  persona: 'technical' | 'hr';
  onTargetRoleChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onPersonaChange: (value: 'technical' | 'hr') => void;
  onBegin: () => void;
};

export function MockInterviewLanding({
  targetRole,
  company,
  persona,
  onTargetRoleChange,
  onCompanyChange,
  onPersonaChange,
  onBegin,
}: MockInterviewLandingProps) {
  return (
    <div className="relative w-full pt-6 pb-6 sm:pt-8 lg:pt-4 lg:pb-10">
      {/* Decorative background */}
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

      <div className="relative mx-auto max-w-[1100px] flex flex-col gap-8">
        {/* ── Row 1: Hero Text (Left) + Setup Card with Robot on Top (Right) ── */}
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Header (Title + Tags) */}
          <header className="order-1 flex flex-col justify-start pt-2 sm:pt-4 lg:col-span-5 lg:pt-10 xl:pt-14">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e6] dark:bg-orange-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-orange-400">
                {/* <Sparkles className="h-3.5 w-3.5" /> */}
                AI-Powered
              </span>

              <h1 className="mt-4 text-[2.35rem] sm:text-[2.75rem] lg:text-[3.25rem] font-extrabold leading-tight tracking-tight">
                <span className="text-[#f97316]">AI</span>{' '}
                <span className="text-[#1a2d52] dark:text-white">Mock Interview</span>
              </h1>

              <p className="mt-4 max-w-md text-[16px] sm:text-[17px] leading-relaxed text-[#64748b] dark:text-gray-300">
                Practice real interviews with our adaptive AI interviewer featuring voice input (STT)
                and spoken questions (TTS).
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {HERO_TAGS.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-xs font-semibold text-[#334155] dark:text-gray-200 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#64748b] dark:text-gray-400" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* Right Column: Setup card — offset down to align with hero title */}
          <div className="order-2 flex flex-col lg:col-span-7 lg:mt-0 lg:pt-10 xl:pt-14">
            {/* Setup card */}
            <section
              className={cn(
                'rounded-2xl border border-[#eef2f6] dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 relative z-0',
                cardShadow,
              )}
            >
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1e4a8a] dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1a2d52] dark:text-white">Let&apos;s set up your interview</h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-[#64748b] dark:text-gray-400">
                    Tell us a few details to personalize your interview experience.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#334155] dark:text-gray-300" htmlFor="interview-role">
                    Role
                  </label>
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <select
                      id="interview-role"
                      value={targetRole}
                      onChange={(e) => onTargetRoleChange(e.target.value)}
                      className="h-[42px] w-full appearance-none rounded-xl border border-[#e2e8f0] dark:border-gray-855 bg-white dark:bg-gray-900 pl-9 pr-10 text-xs sm:text-sm font-medium text-[#1e293b] dark:text-white shadow-sm outline-none transition-colors focus:border-[#1e4a8a]/40 focus:ring-2 focus:ring-[#1e4a8a]/10"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role} className="dark:bg-gray-900">
                          {role}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#334155] dark:text-gray-300" htmlFor="interview-company">
                    Company <span className="font-normal text-[#94a3b8] dark:text-gray-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="interview-company"
                      type="text"
                      placeholder="Enter company name (e.g., Google, Microsoft)"
                      value={company}
                      onChange={(e) => onCompanyChange(e.target.value)}
                      className="h-[42px] w-full rounded-xl border border-[#e2e8f0] dark:border-gray-855 bg-white dark:bg-gray-900 pl-9 pr-4 text-xs sm:text-sm text-[#1e293b] dark:text-white shadow-sm outline-none transition-colors placeholder:text-[#94a3b8] dark:placeholder:text-gray-500 focus:border-[#1e4a8a]/40 focus:ring-2 focus:ring-[#1e4a8a]/10"
                    />
                  </div>
                </div>

                {/* Interview type */}
                <div>
                  <span className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#334155] dark:text-gray-300">Interview Type</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onPersonaChange('technical')}
                      className={cn(
                        'flex h-[42px] items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200',
                        persona === 'technical'
                          ? 'border-[#f97316] bg-[#f97316] text-white shadow-md shadow-orange-200/50 dark:shadow-orange-950/20'
                          : 'border-orange-200 dark:border-white bg-orange-50/10 dark:bg-orange-950/5 text-[#ea580c] dark:text-orange-400 hover:border-[#f97316] hover:bg-orange-50/40 dark:hover:bg-orange-950/20',
                      )}
                    >
                      <Code2 className="h-4 w-4" />
                      Technical
                    </button>
                    <button
                      type="button"
                      onClick={() => onPersonaChange('hr')}
                      className={cn(
                        'flex h-[42px] items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200',
                        persona === 'hr'
                          ? 'border-[#f97316] bg-[#f97316] text-white shadow-md shadow-orange-200/50 dark:shadow-orange-950/20'
                          : 'border-orange-200 dark:border-white bg-orange dark:bg-orange-950/5 text-[#ea580c] dark:text-orange-400 hover:border-[#f97316] hover:bg-orange-50/40 dark:hover:bg-orange-950/20',
                      )}
                    >
                      <Users className="h-4 w-4" />
                      HR
                    </button>
                  </div>
                </div>

                {/* Tip box */}
                <div className="rounded-xl border border-[#ffedd5] dark:border-orange-950/40 bg-[#fff7ed] dark:bg-orange-950/15 px-3 py-2.5">
                  <div className="flex gap-2.5">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" />
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-950 dark:text-white">
                      {persona === 'technical'
                        ? 'Technical interviews focus on problem-solving, system design, and role-specific skills.'
                        : 'HR interviews focus on behavioral questions, culture fit, motivation, and communication.'}
                    </p>
                  </div>
                </div>

                {/* CTA — blue per mockup */}
                <button
                  type="button"
                  onClick={onBegin}
                  disabled={!targetRole.trim()}
                  className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#1e4a8a] text-sm font-semibold text-white shadow-lg shadow-[#1e4a8a]/25 transition-colors hover:bg-[#163a6e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {/* <Mic className="h-4 w-4" /> */}
                  Start Interview
                </button>

                {/* <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#64748b] dark:text-gray-400">
                  <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                  You can leave anytime and resume later
                </p> */}
              </div>
            </section>
          </div>
        </div>

        {/* ── Row 2: Why Practice Card (Full-width row) ── */}
        <section
          className={cn(
            'rounded-2xl border border-[#eef2f6] dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-7',
            cardShadow,
          )}
        >
          <h2 className="text-lg font-bold text-[#1a2d52] dark:text-white mb-6">Why practice with AI?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_PRACTICE.map(({ icon: Icon, tone, title, description }) => (
              <div key={title} className="flex gap-3.5">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    iconSquare(tone),
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-[#1a2d52] dark:text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748b] dark:text-gray-450">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
