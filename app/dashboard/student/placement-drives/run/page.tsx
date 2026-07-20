'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { ExamCameraPanel } from '@/components/disha/ExamCameraPanel';
import { apiClient } from '@/lib/api';
import { MockInterviewRoom } from '@/components/interview/MockInterviewRoom';
import { SimulationCodingRound } from '@/components/simulation/SimulationCodingRound';
import { SimulationGroupDiscussion } from '@/components/simulation/SimulationGroupDiscussion';
import { SimulationSalesRoleplay } from '@/components/simulation/SimulationSalesRoleplay';
import { SimulationWrittenStage } from '@/components/simulation/SimulationWrittenStage';
import { ExamFocusShell } from '@/components/exam/ExamFocusShell';
import { useExamCamera } from '@/hooks/useExamCamera';
import { useProctorSnapshots } from '@/hooks/useProctorSnapshots';
import { isEmbeddedExamStage } from '@/lib/examStageTypes';
import { exitExamFullscreen } from '@/hooks/useExamFullscreen';
import { CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Layers, FileBarChart, Camera, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

function interviewPersona(runner: { persona?: string }): 'technical' | 'hr' | 'culture_fit' {
  const p = runner.persona;
  if (p === 'hr') return 'hr';
  if (p === 'culture_fit') return 'culture_fit';
  return 'technical';
}

type DrivePhase = 'camera_setup' | 'active';

export default function PlacementDriveRunPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams?.get('attempt_id');
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingMcq, setStartingMcq] = useState(false);
  const [phase, setPhase] = useState<DrivePhase>('camera_setup');
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
      await apiClient.uploadPlacementDriveProctoringSnapshot(
        attemptId,
        snapshotIndex,
        blob,
        attempt?.current_stage_index,
      );
    },
    [attemptId, attempt?.current_stage_index],
  );

  const { runCaptureCheck, captureNow } = useProctorSnapshots({
    enabled: phase === 'active' && !!attemptId && attempt?.status === 'IN_PROGRESS',
    attemptId,
    getVideoElement: examCamera.getVideoElement,
    isCameraActive: examCamera.isCameraActive,
    startedAtIso: attempt?.started_at ?? null,
    overallTimeRemainingSeconds: null,
    onUpload: onUploadSnapshot,
    serverCapturedIndexes,
  });

  const runCaptureCheckRef = useRef(runCaptureCheck);
  const captureNowRef = useRef(captureNow);
  runCaptureCheckRef.current = runCaptureCheck;
  captureNowRef.current = captureNow;

  useEffect(() => {
    if (phase !== 'active' || !attemptId || !examCamera.isCameraActive) return;
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
    if (attempt?.status === 'COMPLETED') {
      examCamera.stopCamera();
    }
  }, [attempt?.status, examCamera.stopCamera]);

  const refresh = useCallback(async () => {
    if (!attemptId) return;
    const data = await apiClient.getPlacementDriveAttempt(attemptId);
    setAttempt(data);
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) {
      router.replace('/dashboard/student/placement-drives');
      return;
    }
    refresh()
      .catch(() => router.replace('/dashboard/student/placement-drives'))
      .finally(() => setLoading(false));
  }, [attemptId, refresh, router]);

  const handleBeginDrive = async () => {
    if (!examCamera.isCameraActive) {
      const ok = await examCamera.startCamera();
      if (!ok) return;
    }
    setPhase('active');
  };

  const startLegacyMockTest = async () => {
    const stage = attempt?.current_stage;
    const tid = stage?.config?.mock_test_template_id || stage?.mock_test?.id;
    if (!tid) {
      alert('Mock test not configured for this stage');
      return;
    }
    const mt = await apiClient.startMockTest(tid);
    const q = new URLSearchParams({
      attempt_id: mt.attempt_id,
      drive_attempt_id: attemptId!,
      drive_stage_index: String(attempt.current_stage_index),
    });
    router.push(`/dashboard/student/mock-tests/exam?${q.toString()}`);
  };

  const startMcqStage = async () => {
    if (!attemptId) return;
    setStartingMcq(true);
    try {
      const mt = await apiClient.startPlacementDriveMcqStage(attemptId);
      const q = new URLSearchParams({
        attempt_id: mt.attempt_id,
        drive_attempt_id: attemptId,
        drive_stage_index: String(attempt.current_stage_index),
      });
      router.push(`/dashboard/student/mock-tests/exam?${q.toString()}`);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start MCQ round');
    } finally {
      setStartingMcq(false);
    }
  };

  const onStageComplete = (updated: any) => setAttempt(updated);

  const onInterviewComplete = useCallback(async (result: {
    overall_score: number;
    report?: any;
    session_id?: string;
  }) => {
    if (!attemptId) return;

    // Always re-fetch latest attempt so we don't use a stale stage index / status.
    let latest = attempt;
    try {
      latest = await apiClient.getPlacementDriveAttempt(attemptId);
      setAttempt(latest);
    } catch {
      /* keep in-memory attempt */
    }
    if (!latest) return;

    if (latest.status === 'COMPLETED') {
      setAttempt(latest);
      return;
    }

    const idx =
      typeof latest.current_stage_index === 'number'
        ? latest.current_stage_index
        : attempt?.current_stage_index;
    if (typeof idx !== 'number') return;

    const alreadyDone = (latest.stage_results || []).some(
      (s: { stage_index?: number }) => s.stage_index === idx,
    );
    if (alreadyDone) {
      const refreshed = await apiClient.getPlacementDriveAttempt(attemptId);
      setAttempt(refreshed);
      return;
    }

    try {
      const updated = await apiClient.completePlacementDriveStage(attemptId, {
        stage_index: idx,
        score: Math.min(100, Math.max(0, result.overall_score ?? 0)),
        metadata: {
          stage_type:
            latest.stage_runner?.stage_type ||
            latest.current_stage?.stage_type ||
            attempt?.stage_runner?.stage_type ||
            'mock_interview',
          persona: latest.stage_runner?.persona || attempt?.stage_runner?.persona,
          transcript: result.report?.transcript,
          engine_session_id: result.session_id,
        },
      });
      setAttempt(updated);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      try {
        const refreshed = await apiClient.getPlacementDriveAttempt(attemptId);
        setAttempt(refreshed);
        if (refreshed?.status === 'COMPLETED') return;
      } catch {
        /* ignore refresh failure */
      }
      throw e instanceof Error
        ? e
        : new Error(typeof detail === 'string' ? detail : 'Could not advance to the next stage');
    }
  }, [attemptId, attempt]);

  useEffect(() => {
    if (attempt?.status === 'COMPLETED') {
      void exitExamFullscreen();
    }
  }, [attempt?.status]);

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!attempt) return null;

  if (attempt.status === 'COMPLETED') {
    const report = attempt.report || {};
    return (
      <DashboardLayout requiredUserType="student">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold">Drive Complete</h1>
            <p className="text-gray-600 mt-2">{report.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Verdict</p>
              <p className="text-xl font-bold">{attempt.verdict}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Combined score</p>
              <p className="text-xl font-bold">{attempt.combined_score}%</p>
            </div>
            <div className="rounded-lg border p-4 text-center col-span-2">
              <p className="text-xs uppercase text-gray-500">Readiness contribution</p>
              <p className="text-xl font-bold">{attempt.readiness_score}%</p>
            </div>
          </div>
          {(report.stage_breakdown || []).map((s: any) => (
            <div key={s.stage_index} className="flex justify-between rounded border p-3 text-sm">
              <span>{s.title}</span>
              <span>{s.score}% {s.passed ? '✓' : '✗'}</span>
            </div>
          ))}
          <Button className="w-full" asChild>
            <Link href={`/dashboard/student/placement-drives/report?attempt_id=${attemptId}`}>
              <FileBarChart className="mr-2 h-4 w-4 inline" />
              View full report
            </Link>
          </Button>
          <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/student/placement-drives')}>
            Back to drive library
          </Button>
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
                  This placement drive is proctored. Enable your webcam before continuing.
                  Snapshots are captured silently during active stages.
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
                onClick={() => router.push('/dashboard/student/placement-drives')}
              >
                Cancel
              </Button>
              <Button
                className="gap-2 rounded-xl"
                disabled={!examCamera.isCameraActive || examCamera.isCameraPending}
                onClick={() => void handleBeginDrive()}
              >
                <Camera className="h-4 w-4" />
                {examCamera.isCameraActive ? 'Continue to Drive' : 'Enable camera to continue'}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stage = attempt.current_stage;
  const runner = attempt.stage_runner || {};
  const stageNum = attempt.current_stage_index + 1;
  const targetRole = attempt.template?.target_role || 'Software Engineer';

  const floatingCamera = (
    <ExamCameraPanel
      variant="floating"
      videoRef={examCamera.videoRef}
      status={examCamera.status}
      onEnableCamera={async () => {
        const ok = await examCamera.startCamera();
        if (!ok) toast.error('Camera is required for this placement drive.');
      }}
    />
  );

  const stageBody = (
    <>
      {runner.type === 'legacy_mcq' && (
        <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
          <p>Take the timed MCQ round linked to this drive stage.</p>
          {stage?.mock_test?.title && <p className="font-medium">Test: {stage.mock_test.title}</p>}
          <Button onClick={startLegacyMockTest} className="gap-2">
            Start MCQ round <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {runner.type === 'mcq' && (
        <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
          <p>Timed MCQ round — questions are generated for this placement drive stage.</p>
          <Button onClick={startMcqStage} disabled={startingMcq} className="gap-2">
            {startingMcq ? 'Loading questions…' : 'Start MCQ round'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {runner.type === 'coding' && attemptId && (
        <SimulationCodingRound
          key={`coding-${attempt.current_stage_index}`}
          driveAttemptId={attemptId}
          onComplete={onStageComplete}
        />
      )}

      {runner.type === 'mock_interview' && attemptId && (
        <MockInterviewRoom
          key={`interview-${attempt.current_stage_index}`}
          persona={interviewPersona(runner)}
          targetRole={targetRole}
          company={attempt.template?.company}
          driveAttemptId={attemptId}
          driveStageIndex={attempt.current_stage_index}
          maxTurns={stage?.config?.max_turns}
          onComplete={onInterviewComplete}
        />
      )}

      {runner.type === 'playground' && attemptId && runner.playground_type === 'sales' && (
        <SimulationSalesRoleplay
          key={`sales-${attempt.current_stage_index}`}
          driveAttemptId={attemptId}
          onComplete={onStageComplete}
        />
      )}

      {runner.type === 'playground' && attemptId && runner.playground_type !== 'sales' && (
        <SimulationGroupDiscussion
          key={`gd-${attempt.current_stage_index}`}
          driveAttemptId={attemptId}
          stageNum={stageNum}
          totalStages={attempt.total_stages}
          onComplete={onStageComplete}
        />
      )}

      {['short_answer', 'essay', 'prompt_engineering', 'case_study', 'finance'].includes(runner.type) &&
        attemptId && (
          <SimulationWrittenStage
            key={`written-${attempt.current_stage_index}`}
            driveAttemptId={attemptId}
            stageType={runner.type}
            onComplete={onStageComplete}
          />
        )}

      {runner.type === 'unsupported' && (
        <div className="rounded-xl border p-6 text-sm text-gray-600 dark:border-gray-700">
          This stage type ({runner.stage_type}) is not supported yet.
        </div>
      )}
    </>
  );

  if (isEmbeddedExamStage(runner.type)) {
    return (
      <ExamFocusShell
        title={attempt.template?.title || 'Placement Drive'}
        subtitle={stage?.title ? `${stage.title} — ${stage.stage_type?.replace(/_/g, ' ')}` : undefined}
        stageLabel={`Stage ${stageNum} of ${attempt.total_stages}`}
      >
        {floatingCamera}
        <div className="h-full overflow-y-auto p-4 md:p-6">{stageBody}</div>
      </ExamFocusShell>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      {floatingCamera}
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/student/placement-drives">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
        </Button>

        <div>
          <Badge className="mb-2">Stage {stageNum} of {attempt.total_stages}</Badge>
          <h1 className="text-2xl font-bold">{attempt.template?.title}</h1>
          {attempt.template?.company && (
            <Badge variant="secondary" className="mt-1 text-orange-500">{attempt.template.company}</Badge>
          )}
          {stage && (
            <p className="text-gray-600 mt-2">
              {stage.title} — {stage.stage_type?.replace(/_/g, ' ')}
            </p>
          )}
        </div>

        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all"
            style={{
              width: `${((attempt.current_stage_index + 0.5) / Math.max(attempt.total_stages, 1)) * 100}%`,
            }}
          />
        </div>

        <p className="text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Stages are sequential — complete this round to proceed.
        </p>

        {stageBody}

        {attempt.status === 'COMPLETED' && (attempt.stage_results || []).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" /> Completed stages
            </h3>
            {attempt.stage_results.map((s: any) => (
              <div key={s.stage_index} className="text-sm flex justify-between border-b py-2">
                <span>{s.title || `Stage ${s.stage_index + 1}`}</span>
                <span>{s.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
