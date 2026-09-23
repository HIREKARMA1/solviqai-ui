"use client";

import { Button } from "@/components/ui/button";
import {
  AgentWorkspace,
  CompanyMark,
  MatchRing,
  ReadinessBar,
  StepHeading,
  Surface,
} from "@/components/assessment-agent/AgentVisual";
import type { JobMatch, JobReadiness } from "@/types/assessmentAgent";
import { readinessLabel } from "@/lib/assessmentAgent";
import { Check, Circle } from "lucide-react";

interface JobReadinessStepProps {
  job: JobMatch | null;
  readiness: JobReadiness | null;
  continuing: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function JobReadinessStep({
  job,
  readiness,
  continuing,
  onContinue,
  onBack,
}: JobReadinessStepProps) {
  const score = Math.round(readiness?.readiness_score ?? 0);
  const strengths = readiness?.strengths?.length
    ? readiness.strengths
    : job?.matched_skills ?? [];
  const gaps = readiness?.skill_gaps?.length
    ? readiness.skill_gaps
    : job?.skill_gaps ?? [];

  return (
    <AgentWorkspace>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyMark name={job?.company ?? null} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {job?.title || "Selected role"}
            </h2>
            <p className="text-sm text-slate-500">{job?.company || "Company"}</p>
          </div>
        </div>
        {job && <MatchRing percent={job.match_score} label="Match Score" />}
      </div>

      <StepHeading
        title="Your readiness for this role"
        subtitle="See how your profile compares with this role."
      />

      <div className="mb-5">
        <ReadinessBar score={score} label={readinessLabel(score)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Surface>
          <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">Strengths</p>
          <ul className="space-y-2">
            {strengths.length === 0 && (
              <li className="text-sm text-slate-400">No highlighted strengths yet.</li>
            )}
            {strengths.map((skill) => (
              <li key={skill} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {skill}
              </li>
            ))}
          </ul>
        </Surface>
        <Surface>
          <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
            Improvement Areas
          </p>
          <ul className="space-y-2">
            {gaps.length === 0 && (
              <li className="text-sm text-slate-400">No major gaps listed.</li>
            )}
            {gaps.map((skill) => (
              <li key={skill} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {skill}
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-violet-600 hover:bg-violet-700"
          loading={continuing}
          disabled={continuing}
          onClick={onContinue}
        >
          View assessment plan
        </Button>
      </div>
    </AgentWorkspace>
  );
}
