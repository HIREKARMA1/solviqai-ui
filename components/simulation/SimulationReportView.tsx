'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });
const RadarChart = dynamic(() => import('recharts').then((m) => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then((m) => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import('recharts').then((m) => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then((m) => m.Legend), { ssr: false });
const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });

type ReportData = {
  run_id: string;
  job_role_slug?: string;
  company?: string;
  pipeline_name?: string;
  verdict?: string;
  job_readiness_score?: number;
  completed_at?: string;
  report: {
    summary?: string;
    ai_summary?: string;
    skill_radar?: Array<{ dimension: string; score: number; benchmark: number }>;
    stage_breakdown?: Array<{
      stage_index: number;
      title?: string;
      stage_type?: string;
      score?: number;
      passed?: boolean;
      skill_dimension?: string;
      duration_seconds?: number;
      feedback?: {
        strengths?: string[];
        improvements?: string[];
        ai_feedback?: string;
      };
    }>;
    strengths?: string[];
    improvements?: string[];
    next_steps?: string[];
    focus_areas?: string[];
    stages_passed?: number;
    stages_total?: number;
  };
};

function verdictStyle(verdict?: string) {
  if (verdict === 'READY' || verdict === 'CLEAR') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
  }
  if (verdict === 'NEEDS_PRACTICE' || verdict === 'NEEDS_IMPROVEMENT') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
}

function verdictLabel(verdict?: string) {
  if (verdict === 'READY' || verdict === 'CLEAR') return verdict === 'CLEAR' ? 'Cleared' : 'Job Ready';
  if (verdict === 'NEEDS_PRACTICE' || verdict === 'NEEDS_IMPROVEMENT') {
    return verdict === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : 'Needs Practice';
  }
  if (verdict === 'NOT_READY' || verdict === 'NOT_CLEAR') {
    return verdict === 'NOT_CLEAR' ? 'Not Cleared' : 'Not Ready';
  }
  return verdict || '—';
}

type ReportViewOptions = {
  backHref?: string;
  backLabel?: string;
  title?: string;
  scoreLabel?: string;
  showRetry?: boolean;
  retryHref?: string;
  retryLabel?: string;
};

export function SimulationReportView({
  data,
  options,
}: {
  data: ReportData;
  options?: ReportViewOptions;
}) {
  const backHref = options?.backHref ?? '/dashboard/student/simulations';
  const backLabel = options?.backLabel ?? 'Simulations';
  const title = options?.title ?? 'Simulation Report';
  const scoreLabel = options?.scoreLabel ?? 'Job readiness';
  const showRetry = options?.showRetry ?? true;
  const retryHref =
    options?.retryHref ?? `/dashboard/student/simulations/start?role=${data.job_role_slug || ''}`;
  const retryLabel = options?.retryLabel ?? 'Retry simulation';
  const report = data.report || {};
  const radarData = (report.skill_radar || []).map((r) => ({
    subject: r.dimension,
    score: r.score,
    benchmark: r.benchmark,
  }));

  const barData = (report.stage_breakdown || []).map((s) => ({
    name: (s.title || `R${s.stage_index + 1}`).slice(0, 14),
    score: s.score ?? 0,
    passed: s.passed,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-3" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {data.pipeline_name || 'Job Prep Simulation'}
            {data.company && ` · ${data.company}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.job_role_slug && (
              <Badge variant="outline">{data.job_role_slug.replace(/_/g, ' ')}</Badge>
            )}
            {data.completed_at && (
              <Badge variant="secondary">
                {new Date(data.completed_at).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${verdictStyle(data.verdict)}`}>
            {verdictLabel(data.verdict)}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">{scoreLabel}</p>
            <p className="text-4xl font-bold text-primary">{Math.round(data.job_readiness_score ?? 0)}%</p>
          </div>
          {report.stages_total != null && (
            <p className="text-sm text-gray-500">
              {report.stages_passed}/{report.stages_total} rounds passed
            </p>
          )}
        </div>
      </div>

      {(report.ai_summary || report.summary) && (
        <section className="rounded-xl border bg-gradient-to-br from-violet-50/80 to-white p-5 dark:from-violet-950/20 dark:to-gray-900 dark:border-gray-700">
          <h2 className="font-semibold flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Coach summary
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {report.ai_summary || report.summary}
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {radarData.length > 0 && (
          <section className="rounded-xl border p-5 dark:border-gray-700">
            <h2 className="font-semibold flex items-center gap-2 mb-1">
              <Target className="h-4 w-4" />
              Skill radar
            </h2>
            <p className="text-sm text-gray-500 mb-4">Your scores vs 70% placement benchmark</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="You" dataKey="score" stroke="#5388D8" fill="#5388D8" fillOpacity={0.35} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#F4BE37" fill="#F4BE37" fillOpacity={0.15} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {barData.length > 0 && (
          <section className="rounded-xl border p-5 dark:border-gray-700">
            <h2 className="font-semibold flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4" />
              Round scores
            </h2>
            <p className="text-sm text-gray-500 mb-4">Performance by stage</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="score" fill="#5388D8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(report.strengths?.length ?? 0) > 0 && (
          <section className="rounded-xl border p-5 dark:border-gray-700">
            <h2 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Strengths</h2>
            <ul className="space-y-2 text-sm">
              {report.strengths!.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(report.improvements?.length ?? 0) > 0 && (
          <section className="rounded-xl border p-5 dark:border-gray-700">
            <h2 className="font-semibold text-amber-700 dark:text-amber-400 mb-3">Areas to improve</h2>
            <ul className="space-y-2 text-sm">
              {report.improvements!.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {(report.next_steps?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
          <h2 className="font-semibold mb-3">Recommended next steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {report.next_steps!.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Per-round feedback</h2>
        {(report.stage_breakdown || []).map((stage) => {
          const fb = stage.feedback || {};
          const hasDetail =
            fb.ai_feedback ||
            (fb.strengths?.length ?? 0) > 0 ||
            (fb.improvements?.length ?? 0) > 0;
          return (
            <details
              key={stage.stage_index}
              className="group rounded-xl border dark:border-gray-700 open:bg-gray-50/50 dark:open:bg-gray-900/30"
              open={stage.passed === false}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{stage.title || `Round ${stage.stage_index + 1}`}</span>
                  {stage.skill_dimension && (
                    <Badge variant="outline" className="text-xs">
                      {stage.skill_dimension}
                    </Badge>
                  )}
                  {stage.passed === false && (
                    <Badge variant="destructive" className="text-xs">
                      Below threshold
                    </Badge>
                  )}
                </div>
                <span className="font-semibold tabular-nums">
                  {stage.score != null ? `${Math.round(stage.score)}%` : '—'}
                  {stage.passed ? ' ✓' : stage.passed === false ? ' ✗' : ''}
                </span>
              </summary>
              <div className="border-t px-4 pb-4 pt-3 text-sm dark:border-gray-700">
                {stage.stage_type && (
                  <p className="text-xs text-gray-500 mb-2">{stage.stage_type.replace(/_/g, ' ')}</p>
                )}
                {hasDetail ? (
                  <div className="space-y-3">
                    {fb.ai_feedback && (
                      <p className="text-gray-700 dark:text-gray-300">{fb.ai_feedback}</p>
                    )}
                    {fb.strengths && fb.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-emerald-700 mb-1">Strengths</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {fb.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {fb.improvements && fb.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">Improve</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {fb.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No detailed feedback captured for this round.</p>
                )}
              </div>
            </details>
          );
        })}
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button asChild>
          <Link href={backHref}>Back to library</Link>
        </Button>
        {showRetry && (
          <Button variant="outline" asChild>
            <Link href={retryHref}>{retryLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
