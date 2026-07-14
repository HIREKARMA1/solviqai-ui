'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MockInterviewRoom } from '@/components/interview/MockInterviewRoom';
import { MockInterviewLanding } from '@/components/interview/MockInterviewLanding';
import { ExamFocusShell } from '@/components/exam/ExamFocusShell';
import { ExamCameraPanel } from '@/components/disha/ExamCameraPanel';
import { Button } from '@/components/ui/button';
import { useExamCamera } from '@/hooks/useExamCamera';
import { exitExamFullscreen } from '@/hooks/useExamFullscreen';
import { useProctorSnapshots } from '@/hooks/useProctorSnapshots';
import { apiClient } from '@/lib/api';
import { ArrowLeft, BarChart3, Camera, RotateCcw, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Phase = 'setup' | 'camera' | 'interview' | 'report';

export default function StandaloneMockInterviewPage() {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [company, setCompany] = useState('');
  const [persona, setPersona] = useState<'technical' | 'hr'>('technical');
  const [phase, setPhase] = useState<Phase>('setup');
  const [report, setReport] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverCapturedIndexes, setServerCapturedIndexes] = useState<number[]>([]);
  const [startedAtIso, setStartedAtIso] = useState<string | null>(null);
  const examCamera = useExamCamera();

  const onUploadSnapshot = useCallback(
    async (snapshotIndex: number, blob: Blob) => {
      if (!sessionId) return;
      await apiClient.uploadMockInterviewProctoringSnapshot(sessionId, snapshotIndex, blob);
    },
    [sessionId],
  );

  const { runCaptureCheck, captureNow } = useProctorSnapshots({
    enabled: phase === 'interview' && !!sessionId,
    attemptId: sessionId,
    getVideoElement: examCamera.getVideoElement,
    isCameraActive: examCamera.isCameraActive,
    startedAtIso,
    overallTimeRemainingSeconds: null,
    onUpload: onUploadSnapshot,
    serverCapturedIndexes,
  });

  const runCaptureCheckRef = useRef(runCaptureCheck);
  const captureNowRef = useRef(captureNow);
  runCaptureCheckRef.current = runCaptureCheck;
  captureNowRef.current = captureNow;

  useEffect(() => {
    if (phase !== 'interview' || !sessionId || !examCamera.isCameraActive) return;
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
  }, [phase, sessionId, examCamera.isCameraActive]);

  useEffect(() => {
    if (phase === 'report' || phase === 'setup') {
      examCamera.stopCamera();
    }
  }, [phase, examCamera.stopCamera]);

  const resetFlow = () => {
    examCamera.stopCamera();
    setPhase('setup');
    setReport(null);
    setSessionId(null);
    setServerCapturedIndexes([]);
    setStartedAtIso(null);
  };

  const handleBeginFromLanding = () => setPhase('camera');

  const handleBeginInterview = async () => {
    if (!examCamera.isCameraActive) {
      const ok = await examCamera.startCamera();
      if (!ok) return;
    }
    setStartedAtIso(new Date().toISOString());
    setPhase('interview');
  };

  const handleSessionReady = useCallback((id: string) => {
    setSessionId(id);
    setStartedAtIso((prev) => prev || new Date().toISOString());
  }, []);

  const handleInterviewComplete = useCallback(async (r: any) => {
    setReport(r);
    setPhase('report');
    examCamera.stopCamera();
  }, [examCamera]);

  useEffect(() => {
    if (phase === 'report') {
      void exitExamFullscreen();
    }
  }, [phase]);

  if (phase === 'report' && report) {
    const score = report.overall_score ?? report.report?.overall_score ?? 0;
    const summary = report.report?.summary || report.summary || 'Interview completed.';
    const isFallback = report.ai_mode === 'fallback' || report.report?.ai_mode === 'fallback';

    return (
      <DashboardLayout requiredUserType="student">
        <div className="relative -mx-6 -mt-20 min-h-screen bg-brand-hero p-4 pb-10 pt-20 dark:bg-brand-hero-dark sm:p-6 lg:-mt-24 lg:pt-24">
          <div className="mx-auto max-w-2xl space-y-6">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={resetFlow}>
              <ArrowLeft className="h-4 w-4" /> Back to setup
            </Button>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40">
                  <BarChart3 className="h-7 w-7 text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Report</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{summary}</p>
              </div>

              {isFallback && (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Demo mode — not full AI evaluation.{' '}
                  {report.fallback_reason ||
                    report.report?.fallback_reason ||
                    'Configure Cohere API for real scoring.'}
                </p>
              )}

              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue dark:bg-brand-blue/15">
                  <Star className="h-3 w-3 fill-current" />
                  Overall Score
                </span>
              </div>
              <p className="mt-2 text-center text-5xl font-bold text-brand-blue">{Math.round(score)}%</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="mockPrimary" className="flex-1 gap-2 rounded-xl" onClick={resetFlow}>
                  <RotateCcw className="h-4 w-4" />
                  Start another interview
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" asChild>
                  <Link href="/dashboard/student">View dashboard</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (phase === 'camera') {
    return (
      <DashboardLayout requiredUserType="student" hideNavigation>
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue dark:bg-brand-blue/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Camera required</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This AI interview is proctored. Enable your webcam before beginning. Snapshots are
                  captured silently during the session.
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
              <Button variant="outline" className="rounded-xl" onClick={resetFlow}>
                Cancel
              </Button>
              <Button
                className="gap-2 rounded-xl"
                disabled={!examCamera.isCameraActive || examCamera.isCameraPending}
                onClick={() => void handleBeginInterview()}
              >
                <Camera className="h-4 w-4" />
                {examCamera.isCameraActive ? 'Begin Interview' : 'Enable camera to continue'}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (phase === 'interview') {
    return (
      <ExamFocusShell
        title="AI Mock Interview"
        subtitle={`${persona === 'hr' ? 'HR' : 'Technical'} · ${targetRole}${company ? ` · ${company}` : ''}`}
      >
        <ExamCameraPanel
          variant="floating"
          videoRef={examCamera.videoRef}
          status={examCamera.status}
          onEnableCamera={async () => {
            const ok = await examCamera.startCamera();
            if (!ok) toast.error('Camera is required for this interview.');
          }}
        />
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <MockInterviewRoom
            persona={persona}
            targetRole={targetRole}
            company={company || undefined}
            onSessionReady={handleSessionReady}
            onComplete={handleInterviewComplete}
          />
        </div>
      </ExamFocusShell>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      <div
        className={cn(
          'relative -mx-6 -mt-10 w-auto p-4 pb-10 pt-12 sm:p-6 min-h-screen sm:pt-16',
          'lg:-mt-24 lg:pt-38 lg:pb-12',
          'bg-brand-hero dark:bg-brand-hero-dark',
        )}
      >
        <div className="mx-auto max-w-[1180px]">
          <MockInterviewLanding
            targetRole={targetRole}
            company={company}
            persona={persona}
            onTargetRoleChange={setTargetRole}
            onCompanyChange={setCompany}
            onPersonaChange={setPersona}
            onBegin={handleBeginFromLanding}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
