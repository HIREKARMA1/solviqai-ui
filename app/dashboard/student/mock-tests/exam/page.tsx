'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { McqExamView } from '@/components/exam/McqExamView';
import { useExamFullscreen } from '@/hooks/useExamFullscreen';
import { apiClient } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';

export default function MockTestExamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams?.get('attempt_id');
  const driveAttemptId = searchParams?.get('drive_attempt_id');
  const driveStageIndex = searchParams?.get('drive_stage_index');
  const simulationRunId = searchParams?.get('simulation_run_id');
  const simulationStageIndex = searchParams?.get('simulation_stage_index');
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const currentQ = useRef<string | null>(null);
  const { isFullscreen, toggleFullscreen } = useExamFullscreen({ autoEnter: true });

  const load = useCallback(async () => {
    if (!attemptId) return;
    const data = await apiClient.getMockTestAttempt(attemptId);
    setAttempt(data);
    if (data.status === 'COMPLETED') return;
    if (data.expires_at) {
      const ms = new Date(data.expires_at).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) {
      router.replace('/dashboard/student/mock-tests');
      return;
    }
    load().finally(() => setLoading(false));
  }, [attemptId, load, router]);

  const submit = useCallback(async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const result = await apiClient.submitMockTestAttempt(attemptId, {
        answers,
        time_per_question: questionTimes.current,
        time_taken_seconds: Math.floor((Date.now() - startTime.current) / 1000),
      });
      setAttempt(result);
      if (driveAttemptId && driveStageIndex != null) {
        if (!result.drive_advanced) {
          await apiClient.completePlacementDriveStage(driveAttemptId, {
            stage_index: parseInt(driveStageIndex, 10),
            score: result.score ?? 0,
            metadata: {
              stage_type: result.template?.tags?.stage_type || result.template?.round_type || 'aptitude',
              round_type: result.template?.round_type || 'aptitude',
            },
          });
        }
        router.push(`/dashboard/student/placement-drives/run?attempt_id=${driveAttemptId}`);
      } else if (simulationRunId && simulationStageIndex != null) {
        if (!result.simulation_advanced) {
          await apiClient.completeSimulationStage(simulationRunId, {
            stage_index: parseInt(simulationStageIndex, 10),
            score: result.score ?? 0,
            metadata: {
              stage_type: result.template?.round_type || 'aptitude',
            },
            engine_session_id: attemptId,
          });
        }
        router.push(`/dashboard/student/simulations/run?run_id=${simulationRunId}`);
      }
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, submitting, driveAttemptId, driveStageIndex, simulationRunId, simulationStageIndex, router]);

  useEffect(() => {
    if (timeLeft === null || attempt?.status === 'COMPLETED') return;
    if (timeLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, attempt?.status, submit]);

  const selectAnswer = (qid: string, opt: string) => {
    if (currentQ.current && currentQ.current !== qid) {
      questionTimes.current[currentQ.current] = (questionTimes.current[currentQ.current] || 0) + 5;
    }
    currentQ.current = qid;
    if (!opt) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
      return;
    }
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student" hideNavigation>
        <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (attempt?.status === 'COMPLETED') {
    const backHref = driveAttemptId
      ? `/dashboard/student/placement-drives/run?attempt_id=${driveAttemptId}`
      : simulationRunId
        ? `/dashboard/student/simulations/run?run_id=${simulationRunId}`
        : '/dashboard/student/mock-tests';

    return (
      <DashboardLayout requiredUserType="student">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold">{Math.round(attempt.score ?? 0)}%</h1>
          <p className="text-gray-600">
            {attempt.correct_count}/{attempt.total_count} correct · {attempt.time_taken_seconds}s
          </p>
          <div className="rounded-xl border p-4 text-left dark:border-gray-700">
            <h3 className="mb-2 font-semibold">Breakdown</h3>
            {(attempt.breakdown || []).map((b: any) => (
              <div
                key={b.question_id}
                className={`mb-2 text-sm ${b.correct ? 'text-green-700' : 'text-red-700'}`}
              >
                {b.correct ? '✓' : '✗'} Q{b.question_id.slice(0, 8)}… — yours: {b.your_answer ?? '—'}{' '}
                {!b.correct && `(correct: ${b.correct_answer})`}
              </div>
            ))}
          </div>
          <Button onClick={() => router.push(backHref)}>
            {driveAttemptId || simulationRunId ? 'Continue' : 'Back to library'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const questions = (attempt?.questions || []).map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options || [],
  }));

  const subtitleParts: string[] = [];
  if (attempt?.template?.round_type) {
    subtitleParts.push(attempt.template.round_type.replace(/_/g, ' '));
  }
  if (driveAttemptId) subtitleParts.push('Placement Drive');
  if (simulationRunId) subtitleParts.push('Job Prep Simulation');

  return (
    <DashboardLayout requiredUserType="student" hideNavigation>
      <div className="h-[calc(100vh-5rem)] min-h-0">
        <McqExamView
          title={attempt?.template?.title || 'Mock Test'}
          subtitle={subtitleParts.join(' · ') || undefined}
          questions={questions}
          answers={answers}
          onAnswerChange={selectAnswer}
          timeLeftSeconds={timeLeft}
          submitting={submitting}
          onSubmit={submit}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </DashboardLayout>
  );
}
