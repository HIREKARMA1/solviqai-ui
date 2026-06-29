'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { MockInterviewRoom } from '@/components/interview/MockInterviewRoom';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function PlacementDriveRunPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams?.get('attempt_id');
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    refresh().finally(() => setLoading(false));
  }, [attemptId, refresh, router]);

  const startMockTestStage = async () => {
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

  const onInterviewComplete = async (result: { overall_score: number }) => {
    if (!attemptId || !attempt) return;
    const idx = attempt.current_stage_index;
    const persona = attempt.current_stage?.config?.persona || 'technical';
    const updated = await apiClient.completePlacementDriveStage(attemptId, {
      stage_index: idx,
      score: result.overall_score,
      metadata: { stage_type: 'mock_interview', persona },
    });
    setAttempt(updated);
  };

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
          <Button className="w-full" onClick={() => router.push('/dashboard/student/placement-drives')}>
            Back to drive library
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stage = attempt.current_stage;
  const stageNum = attempt.current_stage_index + 1;

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div>
          <Badge className="mb-2">Stage {stageNum} of {attempt.total_stages}</Badge>
          <h1 className="text-2xl font-bold">{attempt.template?.title}</h1>
          <p className="text-gray-600">{stage?.title} — {stage?.stage_type?.replace('_', ' ')}</p>
          <p className="text-sm text-amber-700 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Stages are sequential — complete this round to proceed.
          </p>
        </div>

        {stage?.stage_type === 'mock_test' && (
          <div className="rounded-xl border p-6 space-y-4">
            <p>Take the timed MCQ round linked to this drive stage.</p>
            {stage.mock_test?.title && <p className="font-medium">Test: {stage.mock_test.title}</p>}
            <Button onClick={startMockTestStage} className="gap-2">
              Start MCQ round <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {stage?.stage_type === 'mock_interview' && (
          <div className="rounded-xl border p-6">
            <MockInterviewRoom
              persona={stage.config?.persona || 'technical'}
              targetRole={attempt.template?.target_role || 'Software Engineer'}
              company={attempt.template?.company}
              driveAttemptId={attemptId!}
              driveStageIndex={attempt.current_stage_index}
              onComplete={onInterviewComplete}
            />
          </div>
        )}

        {(attempt.stage_results || []).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Completed stages</h3>
            {attempt.stage_results.map((s: any) => (
              <div key={s.stage_index} className="text-sm flex justify-between border-b py-1">
                <span>{s.title}</span>
                <span>{s.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
