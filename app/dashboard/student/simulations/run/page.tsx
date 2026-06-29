'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { MockInterviewRoom } from '@/components/interview/MockInterviewRoom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  ExternalLink,
} from 'lucide-react';

export default function SimulationRunPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams?.get('run_id');
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingMcq, setStartingMcq] = useState(false);

  const refresh = useCallback(async () => {
    if (!runId) return;
    const data = await apiClient.getSimulationRun(runId);
    setRun(data);
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      router.replace('/dashboard/student/simulations');
      return;
    }
    refresh()
      .catch(() => router.replace('/dashboard/student/simulations'))
      .finally(() => setLoading(false));
  }, [runId, refresh, router]);

  const startMcqStage = async () => {
    if (!runId) return;
    setStartingMcq(true);
    try {
      const attempt = await apiClient.startSimulationMcqStage(runId);
      const q = new URLSearchParams({
        attempt_id: attempt.attempt_id,
        simulation_run_id: runId,
        simulation_stage_index: String(run.current_stage_index),
      });
      router.push(`/dashboard/student/mock-tests/exam?${q.toString()}`);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start MCQ round');
    } finally {
      setStartingMcq(false);
    }
  };

  const onInterviewComplete = async (result: { overall_score: number }) => {
    if (!runId || !run) return;
    const idx = run.current_stage_index;
    const updated = await apiClient.completeSimulationStage(runId, {
      stage_index: idx,
      score: result.overall_score,
      metadata: {
        stage_type: run.stage_runner?.stage_type || 'mock_interview',
        persona: run.stage_runner?.persona,
      },
    });
    setRun(updated);
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!run) return null;

  if (run.status === 'COMPLETED') {
    const report = run.final_report || {};
    return (
      <DashboardLayout requiredUserType="student">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h1 className="text-2xl font-bold">Simulation Complete</h1>
            {report.summary && <p className="text-gray-600 mt-2">{report.summary}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Verdict</p>
              <p className="text-xl font-bold">{run.verdict}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Readiness</p>
              <p className="text-xl font-bold">{run.job_readiness_score ?? 0}%</p>
            </div>
          </div>
          {(report.stage_breakdown || []).map((s: any) => (
            <div key={s.stage_index} className="flex justify-between rounded border p-3 text-sm">
              <span>{s.title || `Stage ${s.stage_index + 1}`}</span>
              <span>
                {s.score}% {s.passed ? '✓' : '✗'}
              </span>
            </div>
          ))}
          <Button className="w-full" asChild>
            <Link href="/dashboard/student/simulations">Back to library</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stage = run.current_stage;
  const runner = run.stage_runner || {};
  const stageNum = run.current_stage_index + 1;
  const targetRole = run.job_role_slug?.replace(/_/g, ' ') || 'Candidate';

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/student/simulations">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
        </Button>

        <div>
          <Badge className="mb-2">
            Stage {stageNum} of {run.total_stages}
          </Badge>
          <h1 className="text-2xl font-bold">{run.pipeline?.name}</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="outline">{run.job_role_slug}</Badge>
            {run.company && <Badge variant="secondary">{run.company}</Badge>}
            <Badge className="bg-green-600">Free</Badge>
            {run.adaptive_state?.difficulty_bucket && (
              <Badge variant="outline">Difficulty: {run.adaptive_state.difficulty_bucket}</Badge>
            )}
          </div>
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
              width: `${((run.current_stage_index + (run.stage_results?.length ? 0.5 : 0)) / Math.max(run.total_stages, 1)) * 100}%`,
            }}
          />
        </div>

        <p className="text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Complete this round to unlock the next stage.
        </p>

        {runner.type === 'mcq' && (
          <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
            <p>Timed MCQ round — questions are generated for your role and difficulty level.</p>
            <Button onClick={startMcqStage} disabled={startingMcq} className="gap-2 w-full sm:w-auto">
              {startingMcq ? 'Loading questions…' : 'Start MCQ round'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {runner.type === 'mock_interview' && (
          <div className="rounded-xl border p-6 dark:border-gray-700">
            <MockInterviewRoom
              persona={runner.persona === 'hr' ? 'hr' : 'technical'}
              targetRole={targetRole}
              company={run.company}
              onComplete={onInterviewComplete}
            />
          </div>
        )}

        {runner.type === 'playground' && (
          <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
            <p className="text-sm text-gray-600">{runner.message}</p>
            <Button variant="outline" asChild className="gap-2">
              <Link href={runner.practice_path || '/dashboard/student/practice'}>
                Open Practice <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-gray-500">
              Full in-simulation GD / sales / case study playgrounds are coming next. Use Practice for now, then continue other pipeline stages.
            </p>
          </div>
        )}

        {runner.type === 'unsupported' && (
          <div className="rounded-xl border p-6 text-sm text-gray-600 dark:border-gray-700">
            This stage type ({runner.stage_type}) is not wired yet. Contact your admin or skip to a role pipeline with MCQ + interview rounds.
          </div>
        )}

        {(run.stage_results || []).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" /> Completed stages
            </h3>
            {run.stage_results.map((s: any) => (
              <div key={s.stage_index} className="flex justify-between border-b py-2 text-sm">
                <span>Stage {s.stage_index + 1}</span>
                <span>{s.score != null ? `${s.score}%` : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
