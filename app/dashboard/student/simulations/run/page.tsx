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
import { SimulationCodingRound } from '@/components/simulation/SimulationCodingRound';
import { SimulationGroupDiscussion } from '@/components/simulation/SimulationGroupDiscussion';
import { SimulationSalesRoleplay } from '@/components/simulation/SimulationSalesRoleplay';
import { SimulationWrittenStage } from '@/components/simulation/SimulationWrittenStage';
import { ExamFocusShell } from '@/components/exam/ExamFocusShell';
import { isEmbeddedExamStage } from '@/lib/examStageTypes';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileBarChart, Layers } from 'lucide-react';

function interviewPersona(runner: { persona?: string }): 'technical' | 'hr' | 'culture_fit' {
  const p = runner.persona;
  if (p === 'hr') return 'hr';
  if (p === 'culture_fit') return 'culture_fit';
  return 'technical';
}

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

  const onStageComplete = (updated: any) => setRun(updated);

  const onInterviewComplete = async (result: {
    overall_score: number;
    report?: any;
    session_id?: string;
  }) => {
    if (!runId || !run) return;
    const idx = run.current_stage_index;
    const updated = await apiClient.completeSimulationStage(runId, {
      stage_index: idx,
      score: result.overall_score,
      engine_session_id: result.session_id,
      feedback: result.report
        ? {
            strengths: result.report.strengths,
            weaknesses: result.report.weaknesses || result.report.red_flags,
            ai_feedback: result.report.summary,
          }
        : undefined,
      metadata: {
        stage_type: run.stage_runner?.stage_type || 'mock_interview',
        persona: run.stage_runner?.persona,
        transcript: result.report?.transcript,
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
            {(report.ai_summary || report.summary) && (
              <p className="text-gray-600 mt-2">{report.ai_summary || report.summary}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Verdict</p>
              <p className="text-xl font-bold">{run.verdict?.replace(/_/g, ' ')}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs uppercase text-gray-500">Readiness</p>
              <p className="text-xl font-bold">{run.job_readiness_score ?? 0}%</p>
            </div>
          </div>
          <Button className="w-full gap-2" asChild>
            <Link href={`/dashboard/student/simulations/report?run_id=${runId}`}>
              <FileBarChart className="h-4 w-4" />
              View full report — skill radar & round feedback
            </Link>
          </Button>
          <Button className="w-full" variant="outline" asChild>
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

  const stageBody = (
    <>
      {runner.type === 'mcq' && (
        <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
          <p>Timed MCQ round — questions match your role, difficulty, and question mode.</p>
          <Button onClick={startMcqStage} disabled={startingMcq} className="gap-2 w-full sm:w-auto">
            {startingMcq ? 'Loading questions…' : 'Start MCQ round'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {runner.type === 'coding' && runId && (
        <SimulationCodingRound runId={runId} onComplete={onStageComplete} />
      )}

      {runner.type === 'mock_interview' && runId && (
        <MockInterviewRoom
          persona={interviewPersona(runner)}
          targetRole={targetRole}
          company={run.company}
          simulationRunId={runId}
          simulationStageIndex={run.current_stage_index}
          onComplete={onInterviewComplete}
        />
      )}

      {runner.type === 'playground' && runId && runner.playground_type === 'sales' && (
        <SimulationSalesRoleplay runId={runId} onComplete={onStageComplete} />
      )}

      {runner.type === 'playground' && runId && runner.playground_type !== 'sales' && (
        <SimulationGroupDiscussion
          runId={runId}
          stageNum={stageNum}
          totalStages={run.total_stages}
          onComplete={onStageComplete}
        />
      )}

      {['short_answer', 'essay', 'prompt_engineering', 'case_study', 'finance'].includes(runner.type) &&
        runId && (
          <SimulationWrittenStage runId={runId} stageType={runner.type} onComplete={onStageComplete} />
        )}

      {runner.type === 'unsupported' && (
        <div className="rounded-xl border p-6 text-sm text-gray-600 dark:border-gray-700">
          This stage type ({runner.stage_type}) is not wired yet.
        </div>
      )}
    </>
  );

  if (isEmbeddedExamStage(runner.type)) {
    return (
      <ExamFocusShell
        title={run.pipeline?.name || 'Job Prep Simulation'}
        subtitle={stage?.title ? `${stage.title} — ${stage.stage_type?.replace(/_/g, ' ')}` : undefined}
        stageLabel={`Stage ${stageNum} of ${run.total_stages}`}
      >
        <div className="h-full overflow-y-auto p-4 md:p-6">{stageBody}</div>
      </ExamFocusShell>
    );
  }

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
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
          {run.adaptive_hint?.message && (
            <p className="mt-2 text-sm text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 rounded-lg px-3 py-2">
              {run.adaptive_hint.message}
            </p>
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
              width: `${((run.current_stage_index + (run.stage_results?.length ? 0.5 : 0)) / Math.max(run.total_stages, 1)) * 100}%`,
            }}
          />
        </div>

        <p className="text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Complete this round to unlock the next stage.
        </p>

        {stageBody}

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
