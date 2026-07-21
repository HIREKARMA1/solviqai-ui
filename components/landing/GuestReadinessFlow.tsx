'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Sparkles,
  Brain,
  FileSearch,
  Mic,
  Layers,
  Code2,
  GraduationCap,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getGuestSessionToken, setGuestSessionToken } from '@/lib/guestReadiness';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

type Step = 'setup' | 'quiz' | 'results';

type Props = {
  onClose?: () => void;
};

const PRODUCT_FEATURES = [
  {
    icon: FileSearch,
    title: 'AI Resume Analysis',
    description: 'Deep ATS scoring, keyword gaps, and section-wise feedback tailored to your target role.',
  },
  {
    icon: Mic,
    title: 'AI Mock Interviews',
    description: 'Practice HR, technical, and culture-fit rounds with real-time AI evaluation.',
  },
  {
    icon: Layers,
    title: 'Placement Drive Simulations',
    description: 'Multi-round hiring drives — aptitude, coding, GD, and interviews in one flow.',
  },
  {
    icon: Code2,
    title: 'Coding & Aptitude Tests',
    description: 'Role-aligned MCQs and coding challenges with instant scoring.',
  },
  {
    icon: Brain,
    title: 'AI Career Guidance',
    description: 'Personalized career paths, skill gaps, and study plans powered by your profile.',
  },
  {
    icon: GraduationCap,
    title: 'University-Ready Platform',
    description: 'Built for campuses — track student readiness and placement outcomes at scale.',
  },
];

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#098855' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 327} 327`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold text-gray-900 dark:text-white">{Math.round(pct)}</p>
        <p className="text-sm text-gray-500">Readiness Score</p>
      </div>
    </div>
  );
}

const fieldClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

export function GuestReadinessFlow({ onClose }: Props) {
  const [step, setStep] = useState<Step>('setup');
  const [token, setToken] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{ target_roles: string[]; education_options: string[] } | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [education, setEducation] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const graduationYears = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => String(current - 2 + i));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cat = await apiClient.guestReadinessCatalog();
        setCatalog(cat);
        let t = getGuestSessionToken();
        if (!t) {
          const started = await apiClient.guestReadinessStart();
          t = started.session_token;
          setGuestSessionToken(t);
        }
        setToken(t);
        try {
          const existing = await apiClient.guestReadinessGetResults(t);
          setResults(existing);
          setStep('results');
        } catch {
          /* not completed yet */
        }
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to start readiness check');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validateSetup = () => {
    if (!fullName.trim()) return 'Please enter your full name';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email';
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, '').slice(-10))) return 'Please enter a valid 10-digit mobile number';
    if (!education) return 'Please select your education';
    if (!graduationYear) return 'Please select graduation year';
    if (!targetRole) return 'Please select your target role';
    if (!file) return 'Please upload your resume';
    return '';
  };

  const handleSetupSubmit = useCallback(async () => {
    const validationError = validateSetup();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!token) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.guestReadinessSetProfile(token, {
        full_name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.replace(/\D/g, '').slice(-10),
        education,
        graduation_year: parseInt(graduationYear, 10),
        target_role: targetRole,
      });
      await apiClient.guestReadinessUploadResume(token, file!);
      const quiz = await apiClient.guestReadinessGetQuiz(token);
      setQuestions(quiz.questions || []);
      setStep('quiz');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not save your details');
    } finally {
      setSubmitting(false);
    }
  }, [token, fullName, email, mobile, education, graduationYear, targetRole, file]);

  const handleQuizSubmit = useCallback(async () => {
    if (!token) return;
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all ${questions.length} questions`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.guestReadinessSubmitQuiz(token, answers);
      setResults(res);
      setStep('results');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [token, questions, answers]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <section
      id="guest-readiness"
      className="relative scroll-mt-20 border-t border-gray-200/80 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-950 md:scroll-mt-24 md:py-16 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(9,136,85,0.06),transparent_45%)]" />
      <div className="relative mx-auto w-[90%] max-w-[1400px]">
        <div className="relative z-10 mb-10 text-center sm:mb-14">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-0 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
          )}
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#FF541F]">
            <span className="h-2 w-2 rounded-full bg-[#FF541F]" />
            Free · 3 minutes
          </p>
          <h2 className="mb-4 text-4xl font-bold text-gray-800 dark:text-white sm:text-5xl lg:text-6xl">
            Get Your Free{' '}
            <span className="text-orange-500">Job Readiness</span> Score
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            Share a few details, upload your resume, and complete a short role-based quiz to see where you stand.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Step indicator */}
          <div className="mb-6 flex gap-2 md:mb-8">
            {(['setup', 'quiz', 'results'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  step === s || (['quiz', 'results'].indexOf(step) >= i && step !== 'setup')
                    ? 'bg-brand-green'
                    : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {step === 'setup' && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="gr-name">Full name</label>
                    <input
                      id="gr-name"
                      className={fieldClass}
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gr-email">Email</label>
                    <input
                      id="gr-email"
                      type="email"
                      className={fieldClass}
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gr-mobile">Mobile number</label>
                    <input
                      id="gr-mobile"
                      type="tel"
                      className={fieldClass}
                      placeholder="10-digit mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gr-education">Education</label>
                    <select
                      id="gr-education"
                      className={fieldClass}
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                    >
                      <option value="">Select education</option>
                      {(catalog?.education_options || []).map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="gr-year">Graduation year</label>
                    <select
                      id="gr-year"
                      className={fieldClass}
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    >
                      <option value="">Select year</option>
                      {graduationYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="gr-role">Target role</label>
                    <select
                      id="gr-role"
                      className={fieldClass}
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    >
                      <option value="">Select target role</option>
                      {(catalog?.target_roles || []).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Resume (PDF / DOCX)</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 transition hover:border-brand-green hover:bg-brand-green/5 dark:border-gray-700 dark:bg-gray-950/50">
                    <Upload className="mb-2 h-8 w-8 text-brand-green" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {file ? file.name : 'Drop your resume here or click to upload'}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">Used for scoring only — not stored in our lead records</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSetupSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green py-4 text-base font-semibold text-white shadow-[0_8px_24px_rgba(9,136,85,0.35)] transition hover:bg-brand-green-dark disabled:opacity-60"
                >
                  {submitting ? 'Processing…' : 'Continue to Quiz'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {step === 'quiz' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-brand-green/10 px-4 py-3 text-sm text-brand-green-dark dark:bg-brand-green/15 dark:text-brand-green-light">
                  <span className="font-semibold">{targetRole}</span> — {questions.length} role-based questions
                </div>
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">{q.topic}</p>
                    <p className="mb-3 font-medium text-gray-900 dark:text-white">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt: string) => (
                        <label
                          key={opt}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition',
                            answers[q.id] === opt
                              ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                          )}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className="text-brand-green"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('setup')}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleQuizSubmit}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-green-dark disabled:opacity-60"
                  >
                    {submitting ? 'Scoring…' : 'See My Score'}
                  </button>
                </div>
              </div>
            )}

            {step === 'results' && results && (
              <div className="space-y-8">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-950/50">
                  <ScoreGauge score={results.composite_score ?? 0} />
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Aptitude: {Math.round(results.aptitude_score ?? 0)}% · Resume signal: {Math.round(results.resume_strength_score ?? 0)}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    This is your quick readiness snapshot. Sign up for a full AI-powered analysis.
                  </p>
                </div>

                {/* Sign-up CTA + product showcase */}
                <div className="overflow-hidden rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/5 via-white to-[#FF541F]/5 dark:from-brand-green/10 dark:via-gray-900 dark:to-gray-900">
                  <div className="border-b border-brand-green/10 px-4 py-4 text-center sm:px-8 sm:py-5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white sm:text-2xl">
                      Sign up free — get your resume analyzed by AI
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-lg text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-sm">
                      Unlock deep ATS scoring, personalized gap analysis, mock interviews, placement drive
                      simulations, and career guidance — all in one platform.
                    </p>
                    <Link
                      href="/auth/register"
                      className="mt-4 inline-flex w-full max-w-xs items-center justify-center gap-1.5 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(9,136,85,0.3)] transition hover:bg-brand-green-dark sm:mt-5 sm:w-auto sm:rounded-xl sm:px-7 sm:py-3.5 sm:text-base sm:shadow-[0_8px_24px_rgba(9,136,85,0.35)]"
                    >
                      <span className="sm:hidden">Sign Up Free — Analyze Resume</span>
                      <span className="hidden sm:inline">Sign Up Free </span>
                      {/* <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" /> */}
                    </Link>
                    <p className="mt-3 text-xs text-gray-500">
                      Already have an account?{' '}
                      <Link href="/auth/login" className="font-medium text-brand-blue hover:underline dark:text-brand-cyan">
                        Log in
                      </Link>
                    </p>
                  </div>

                  <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
                    {PRODUCT_FEATURES.map((feature) => (
                      <div
                        key={feature.title}
                        className="flex gap-3 rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{feature.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
