'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Briefcase, CheckCircle2, Clock } from 'lucide-react';

type Step = 'loading' | 'welcome' | 'exam' | 'done' | 'error';

export default function EnterpriseAssessPage() {
  const params = useParams();
  const token = params?.token as string;
  const [step, setStep] = useState<Step>('loading');
  const [invite, setInvite] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTime = useRef(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const currentQ = useRef<string | null>(null);

  const loadInvite = useCallback(async () => {
    try {
      const data = await apiClient.getEnterprisePublicInvite(token);
      setInvite(data);
      if (data.status === 'COMPLETED') setStep('done');
      else if (data.status === 'IN_PROGRESS') {
        const att = await apiClient.startEnterpriseAssessment(token);
        setAttempt(att);
        setStep('exam');
        if (att.expires_at) {
          setTimeLeft(Math.max(0, Math.floor((new Date(att.expires_at).getTime() - Date.now()) / 1000)));
        }
      } else if (data.candidate_name) {
        setName(data.candidate_name);
        setEmail(data.candidate_email || '');
        setStep('welcome');
      } else setStep('welcome');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Invalid invite link');
      setStep('error');
    }
  }, [token]);

  useEffect(() => { if (token) loadInvite(); }, [token, loadInvite]);

  const begin = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email');
      return;
    }
    setError('');
    await apiClient.acceptEnterpriseInvite(token, { candidate_name: name.trim(), candidate_email: email.trim() });
    const att = await apiClient.startEnterpriseAssessment(token);
    setAttempt(att);
    setStep('exam');
    if (att.expires_at) {
      setTimeLeft(Math.max(0, Math.floor((new Date(att.expires_at).getTime() - Date.now()) / 1000)));
    }
  };

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await apiClient.submitEnterpriseAssessment(token, {
        answers,
        time_per_question: questionTimes.current,
        time_taken_seconds: Math.floor((Date.now() - startTime.current) / 1000),
      });
      setInvite(result);
      setStep('done');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [answers, submitting, token]);

  useEffect(() => {
    if (step !== 'exam' || timeLeft === null) return;
    if (timeLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [step, timeLeft, submit]);

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader size="lg" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600">Unable to open assessment</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-4" />
          <h1 className="text-2xl font-bold">Assessment submitted</h1>
          <p className="text-gray-600 mt-2">Thank you, {invite?.candidate_name || name}. The hiring team will review your results.</p>
          {invite?.score != null && (
            <p className="mt-4 text-sm text-gray-500">Your score: <strong>{invite.score}%</strong></p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-12 px-4">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Briefcase className="h-5 w-5" />
            <span>{invite?.organization_name}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{invite?.campaign?.title}</h1>
            <p className="text-slate-300 mt-2">Role: {invite?.campaign?.job_role}</p>
            <p className="text-slate-400 text-sm mt-4">
              Skills assessment · ~{invite?.assessment?.duration_minutes || 30} minutes · timed MCQ round
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 space-y-3">
            <Input className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="text-red-300 text-sm">{error}</p>}
            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100" onClick={begin}>Begin assessment</Button>
          </div>
        </div>
      </div>
    );
  }

  const questions = attempt?.questions || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 px-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{invite?.campaign?.title}</h1>
            <p className="text-sm text-gray-500">Hiring assessment — answer all questions before time runs out</p>
          </div>
          {timeLeft != null && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </Badge>
          )}
        </div>

        {questions.map((q: any, idx: number) => (
          <div
            key={q.id || idx}
            className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800"
            onFocus={() => {
              if (currentQ.current && currentQ.current !== q.id) {
                questionTimes.current[currentQ.current] = (questionTimes.current[currentQ.current] || 0) + 1;
              }
              currentQ.current = q.id;
            }}
          >
            <p className="font-medium mb-3">{idx + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {(q.options || []).map((opt: string, oi: number) => (
                <label key={oi} className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit assessment'}
        </Button>
      </div>
    </div>
  );
}
