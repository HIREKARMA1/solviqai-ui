'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { McqExamView } from '@/components/exam/McqExamView';
import { ExamCameraPanel } from '@/components/disha/ExamCameraPanel';
import { useExamFullscreen } from '@/hooks/useExamFullscreen';
import { useExamCamera } from '@/hooks/useExamCamera';
import { useProctorSnapshots } from '@/hooks/useProctorSnapshots';
import { apiClient } from '@/lib/api';
import { CheckCircle2, Camera, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type ExamPhase = 'camera_setup' | 'exam' | 'completed';

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
  const [phase, setPhase] = useState<ExamPhase>('camera_setup');
  const startTime = useRef(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const currentQ = useRef<string | null>(null);
  const { isFullscreen, toggleFullscreen } = useExamFullscreen({
    autoEnter: phase === 'exam',
  });
  const examCamera = useExamCamera();

  const serverCapturedIndexes = useMemo(() => {
    const snaps = attempt?.proctoring_snapshots;
    if (!Array.isArray(snaps)) return [];
    return snaps
      .map((s: { index?: number }) => s?.index)
      .filter((n: unknown): n is number => typeof n === 'number');
  }, [attempt?.proctoring_snapshots]);

  const onUploadSnapshot = useCallback(
    async (snapshotIndex: number, blob: Blob) => {
      if (!attemptId) return;
      await apiClient.uploadMockTestProctoringSnapshot(attemptId, snapshotIndex, blob);
    },
    [attemptId],
  );

  const { runCaptureCheck, captureNow } = useProctorSnapshots({
    enabled: phase === 'exam' && !!attemptId,
    attemptId,
    getVideoElement: examCamera.getVideoElement,
    isCameraActive: examCamera.isCameraActive,
    startedAtIso: attempt?.started_at ?? null,
    overallTimeRemainingSeconds: timeLeft,
    onUpload: onUploadSnapshot,
    serverCapturedIndexes,
  });

  const runCaptureCheckRef = useRef(runCaptureCheck);
  const captureNowRef = useRef(captureNow);
  runCaptureCheckRef.current = runCaptureCheck;
  captureNowRef.current = captureNow;

  useEffect(() => {
    if (phase !== 'exam' || !attemptId || !examCamera.isCameraActive) return;
    const delays = [4_000, 12_000, 22_000, 35_000];
    const timers = delays.map((ms) =>
      setTimeout(() => void runCaptureCheckRef.current(), ms),
    );
    const early = [
      setTimeout(() => captureNowRef.current(1), 3_000),
      setTimeout(() => captureNowRef.current(2), 15_000),
    ];
    return () => {
      timers.forEach(clearTimeout);
      early.forEach(clearTimeout);
    };
  }, [phase, attemptId, examCamera.isCameraActive]);

  useEffect(() => {
    if (phase === 'completed' || attempt?.status === 'COMPLETED') {
      examCamera.stopCamera();
    }
  }, [phase, attempt?.status, examCamera.stopCamera]);

  const load = useCallback(async () => {
    if (!attemptId) return;
    const data = await apiClient.getMockTestAttempt(attemptId);
    setAttempt(data);
    if (data.status === 'COMPLETED') {
      setPhase('completed');
      return;
    }
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

  const handleBeginExam = async () => {
    if (!examCamera.isCameraActive) {
      const ok = await examCamera.startCamera();
      if (!ok) return;
    }
    startTime.current = Date.now();
    setPhase('exam');
  };

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
      setPhase('completed');
      examCamera.stopCamera();
      if (driveAttemptId && driveStageIndex != null) {
        const driveAlreadyAdvanced =
          result.drive_advanced || Boolean(result.drive_attempt);
        if (!driveAlreadyAdvanced) {
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
  }, [
    attemptId,
    answers,
    submitting,
    driveAttemptId,
    driveStageIndex,
    simulationRunId,
    simulationStageIndex,
    router,
    examCamera,
  ]);

  useEffect(() => {
    if (timeLeft === null || attempt?.status === 'COMPLETED' || phase !== 'exam') return;
    if (timeLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, attempt?.status, submit, phase]);

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

  if (phase === 'completed' || attempt?.status === 'COMPLETED') {
    const backHref = driveAttemptId
      ? `/dashboard/student/placement-drives/run?attempt_id=${driveAttemptId}`
      : simulationRunId
        ? `/dashboard/student/simulations/run?run_id=${simulationRunId}`
        : '/dashboard/student/mock-tests';

    const breakdown = attempt.breakdown || [];

    return (
      <DashboardLayout requiredUserType="student">
        <div className="relative min-h-screen bg-mock-page-bg dark:bg-brand-hero-dark -mx-6 -mb-6 -mt-20 lg:-mt-24 p-4 sm:p-6 pt-20 lg:pt-24 pb-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-8 text-center shadow-sm backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/80">
              <CheckCircle2 className="mx-auto h-14 w-14 text-brand-green" />
              <h1 className="mt-4 text-4xl font-extrabold text-brand-blue dark:text-brand-cyan">
                {Math.round(attempt.score ?? 0)}%
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {attempt.correct_count}/{attempt.total_count} correct ·{' '}
                {attempt.time_taken_seconds ?? 0}s
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Answer review</h2>
              {breakdown.map((b: any, idx: number) => (
                <article
                  key={b.question_id}
                  className={cn(
                    'rounded-xl border p-4 text-left shadow-sm',
                    b.correct
                      ? 'border-brand-green/30 bg-brand-green/5 dark:border-brand-green/25 dark:bg-brand-green/10'
                      : 'border-red-200/80 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20',
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Q{idx + 1}. {b.question_text || 'Question'}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        b.correct ? 'bg-brand-green/15 text-brand-green-dark' : 'bg-red-100 text-red-700',
                      )}
                    >
                      {b.correct ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                  {!b.correct && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-red-700 dark:text-red-300">
                        Your answer:{' '}
                        <span className="font-medium">
                          {b.your_answer_display || b.your_answer || '—'}
                        </span>
                      </p>
                      <p className="text-brand-green-dark dark:text-brand-green-light">
                        Correct answer:{' '}
                        <span className="font-medium">
                          {b.correct_answer_display || b.correct_answer || '—'}
                        </span>
                      </p>
                    </div>
                  )}
                  {b.correct && b.your_answer_display && (
                    <p className="mt-1 text-sm text-brand-green-dark dark:text-brand-green-light">
                      Your answer: {b.your_answer_display}
                    </p>
                  )}
                  {b.explanation && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      {b.explanation}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <Button variant="mockPrimary" className="h-11 w-full rounded-xl" onClick={() => router.push(backHref)}>
              {driveAttemptId || simulationRunId ? 'Continue' : 'Back to library'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (phase === 'camera_setup') {
    return (
      <DashboardLayout requiredUserType="student" hideNavigation>
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue dark:bg-brand-blue/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Camera required
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This mock test is proctored. Enable your webcam before starting.
                  Snapshots are captured silently during the exam.
                </p>
              </div>
            </div>

            <ExamCameraPanel
              variant="setup"
              videoRef={examCamera.videoRef}
              status={examCamera.status}
              onEnableCamera={examCamera.startCamera}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push('/dashboard/student/mock-tests')}
              >
                Cancel
              </Button>
              <Button
                variant="mockPrimary"
                className="gap-2 rounded-xl"
                disabled={!examCamera.isCameraActive || examCamera.isCameraPending}
                onClick={() => void handleBeginExam()}
              >
                <Camera className="h-4 w-4" />
                {examCamera.isCameraActive ? 'Start Test' : 'Enable camera to continue'}
              </Button>
            </div>
          </div>
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
      <div className="relative h-[calc(100vh-5rem)] min-h-0">
        <ExamCameraPanel
          variant="floating"
          videoRef={examCamera.videoRef}
          status={examCamera.status}
          onEnableCamera={async () => {
            const ok = await examCamera.startCamera();
            if (!ok) toast.error('Camera is required for this mock test.');
          }}
          className="!bottom-auto !left-auto top-20 right-4"
        />
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
