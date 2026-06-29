'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getGuestSessionToken, setGuestSessionToken } from '@/lib/guestReadiness';
import { Loader } from '@/components/ui/loader';

type Step = 'setup' | 'quiz' | 'results';

type Props = {
  onClose?: () => void;
};

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
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
        <p className="text-sm text-gray-500">Readiness</p>
      </div>
    </div>
  );
}

export function GuestReadinessFlow({ onClose }: Props) {
  const [step, setStep] = useState<Step>('setup');
  const [token, setToken] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<{ target_roles: string[]; branches: string[] } | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [branch, setBranch] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          // not completed yet
        }
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to start readiness check');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSetupSubmit = useCallback(async () => {
    if (!token || !targetRole || !branch || !file) {
      setError('Please select role, branch, and upload your resume');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.guestReadinessSetProfile(token, targetRole, branch);
      await apiClient.guestReadinessUploadResume(token, file);
      const quiz = await apiClient.guestReadinessGetQuiz(token);
      setQuestions(quiz.questions || []);
      setStep('quiz');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }, [token, targetRole, branch, file]);

  const handleQuizSubmit = useCallback(async () => {
    if (!token) return;
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Answer all ${questions.length} questions`);
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
    <section id="guest-readiness" className="relative bg-white py-12 dark:bg-gray-950 md:py-16">
      <div className="mx-auto w-[90%] max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#FF541F]">Free · 3 minutes</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              Check Your Job Readiness Score
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Resume upload + quick aptitude quiz → instant score and gap analysis
            </p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
              Close
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex gap-2">
          {(['setup', 'quiz', 'results'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                step === s || (['quiz', 'results'].indexOf(step) >= i && step !== 'setup')
                  ? 'bg-[#FF541F]'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {step === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Target role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="">Select role</option>
                {(catalog?.target_roles || []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-900"
              >
                <option value="">Select branch</option>
                {(catalog?.branches || []).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Resume (PDF/DOCX)</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 hover:border-[#FF541F] dark:border-gray-600">
                <Upload className="mb-2 h-8 w-8 text-[#FF541F]" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'Click to upload resume'}
                </span>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF541F] py-4 font-semibold text-white hover:bg-[#e04a1a] disabled:opacity-60"
            >
              {submitting ? 'Processing…' : 'Continue to Quiz'}
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {questions.length} quick aptitude questions — under 3 minutes
            </p>
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <p className="mb-3 font-medium text-gray-900 dark:text-white">
                  {idx + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt: string) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                        answers[q.id] === opt
                          ? 'border-[#FF541F] bg-[#FFF5F0] dark:bg-[#2A1A14]'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className="text-[#FF541F]"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('setup')}
                className="flex items-center gap-1 rounded-xl border px-4 py-3 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleQuizSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF541F] py-3 font-semibold text-white hover:bg-[#e04a1a] disabled:opacity-60"
              >
                {submitting ? 'Scoring…' : 'See My Score'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
              <ScoreGauge score={results.composite_score ?? 0} />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Resume strength: {Math.round(results.resume_strength_score ?? 0)}% · Aptitude: {Math.round(results.aptitude_score ?? 0)}%
              </p>
              <p className="mt-1 text-xs text-gray-500">{results.formula?.description}</p>
            </div>

            {results.strengths?.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" /> Strengths
                </h3>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {results.strengths.map((s: string) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.gaps?.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5" /> What&apos;s pulling your score down
                </h3>
                <ul className="space-y-2">
                  {results.gaps.map((g: { area: string; message: string }) => (
                    <li key={g.area} className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>{g.area}:</strong> {g.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-gradient-to-r from-[#FF541F] to-[#ff7a4d] p-6 text-center text-white">
              <h3 className="text-xl font-bold">Save your score — create a free account</h3>
              <p className="mt-1 text-sm opacity-90">Your readiness data carries over automatically. No need to redo the check.</p>
              <Link
                href="/auth/register"
                className="mt-4 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-[#FF541F] hover:bg-gray-100"
              >
                Sign Up Free
              </Link>
              <p className="mt-3 text-xs opacity-80">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline">Log in</Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
