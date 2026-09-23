"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanyMark,
  MatchRing,
  Surface,
} from "@/components/assessment-agent/AgentVisual";
import type { AssessmentPlan, JobMatch } from "@/types/assessmentAgent";
import { cn } from "@/lib/utils";

interface JobPlanStepProps {
  plan: AssessmentPlan;
  selectedJob: JobMatch | null;
  starting: boolean;
  alreadyActive: boolean;
  onStart: () => void;
  onBack: () => void;
}

function roundKind(round: AssessmentPlan["rounds"][number]): string | null {
  const type = (round.round_type || "").toLowerCase();
  if (type.includes("interview")) return "AI Interview";
  if (type.includes("coding")) return "Coding";
  if (type.includes("gd") || type.includes("group")) return "Discussion";
  return null;
}

function roundMeta(round: AssessmentPlan["rounds"][number]): string {
  const parts: string[] = [];
  if (round.question_count) {
    parts.push(
      `${round.question_count} ${round.question_count === 1 ? "Question" : "Questions"}`,
    );
  }
  const kind = roundKind(round);
  if (kind) parts.push(kind);
  if (round.duration_minutes) {
    parts.push(`${round.duration_minutes} mins`);
  }
  return parts.join(" · ");
}

export function JobPlanStep({
  plan,
  selectedJob,
  starting,
  alreadyActive,
  onStart,
  onBack,
}: JobPlanStepProps) {
  const job = plan.job;
  const explanation = selectedJob?.match_explanation?.trim();
  const [tab, setTab] = useState("rounds");

  return (
    <div className="mx-auto w-full max-w-4xl pb-10">
      <button type="button" className="sr-only" onClick={onBack}>
        Back
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyMark name={job.company} size="lg" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {job.title}
            </h2>
            <p className="text-sm text-slate-500">{job.company || "Selected company"}</p>
            <p className="mt-1 text-xs font-medium text-violet-700">
              Company-specific interview simulation
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.employment_type && <span>{job.employment_type}</span>}
              {job.salary_range && <span>{job.salary_range}</span>}
            </p>
          </div>
        </div>
        <MatchRing percent={plan.overall_match_score} label="Match Score" size={64} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-b border-slate-200 bg-transparent p-0 dark:border-slate-800">
          {[
            { id: "details", label: "Job Details" },
            { id: "company", label: "Company Profile" },
            { id: "rounds", label: "Assessment Rounds" },
            { id: "requirements", label: "Requirements" },
          ].map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-sm font-medium text-slate-400 shadow-none",
                "data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-violet-700 data-[state=active]:shadow-none",
              )}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Surface>
              <p className="text-sm font-medium text-slate-900 dark:text-white">About this role</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {job.description ||
                  explanation ||
                  "Role details for this job will appear here when available."}
              </p>
            </Surface>
            <AboutCard plan={plan} explanation={explanation} />
          </div>
        </TabsContent>

        <TabsContent value="company" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Surface>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {job.company || "Company"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {[job.company, job.location].filter(Boolean).join(" · ") ||
                  "Company profile details are not available for this role."}
              </p>
            </Surface>
            <AboutCard plan={plan} explanation={explanation} />
          </div>
        </TabsContent>

        <TabsContent value="rounds" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              {plan.rounds.map((round, index) => (
                <div
                  key={`${round.round_type}-${index}`}
                  className="flex items-center gap-4 rounded-[16px] border border-slate-200/80 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="w-7 shrink-0 text-sm font-semibold text-violet-600">
                    {String(round.round_number ?? index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {round.title}
                    </p>
                    <p className="text-xs text-slate-400">{roundMeta(round)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">Pending</span>
                </div>
              ))}
            </div>
            <AboutCard plan={plan} explanation={explanation} />
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Surface>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Required skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(job.required_skills || []).length === 0 && (
                  <p className="text-sm text-slate-400">None listed</p>
                )}
                {(job.required_skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm font-medium text-slate-900 dark:text-white">Matched skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.matched_skills.length === 0 && (
                  <p className="text-sm text-slate-400">None listed</p>
                )}
                {plan.matched_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm font-medium text-slate-900 dark:text-white">Skill gaps</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.skill_gaps.length === 0 && (
                  <p className="text-sm text-slate-400">None listed</p>
                )}
                {plan.skill_gaps.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs text-amber-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Surface>
            <AboutCard plan={plan} explanation={explanation} />
          </div>
        </TabsContent>
      </Tabs>

      {alreadyActive && (
        <p className="mt-5 text-sm text-amber-600">
          An assessment is already in progress. You will continue that session.
        </p>
      )}

      <Surface className="mt-6">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Before you start</p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <li>
            You are attending a simulated interview for{" "}
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {[job.company, job.title].filter(Boolean).join(" – ") || job.title}
            </span>
            .
          </li>
          <li>
            Estimated duration:{" "}
            {plan.rounds.reduce((sum, round) => sum + (round.duration_minutes || 0), 0) || 120} minutes
            across {plan.rounds.length} rounds.
          </li>
          <li>Camera must stay on for every round. The round cannot start without an active camera.</li>
          <li>The assessment runs in browser fullscreen. If you exit, you must return to fullscreen to continue.</li>
          <li>Submit locks your answers immediately. You cannot edit after clicking Submit.</li>
        </ul>
      </Surface>

      <div className="mt-8">
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-700 sm:w-auto sm:min-w-[220px]"
          disabled={starting}
          loading={starting}
          onClick={onStart}
        >
          Start Assessment
        </Button>
      </div>
    </div>
  );
}

function AboutCard({
  plan,
  explanation,
}: {
  plan: AssessmentPlan;
  explanation?: string;
}) {
  return (
    <Surface className="h-fit">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">About this Role</p>
      {explanation && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {explanation}
        </p>
      )}
      <div className="mt-4 space-y-3 text-sm">
        {plan.job.employment_type && (
          <div>
            <p className="text-xs font-medium text-slate-400">Employment Type</p>
            <p className="mt-0.5 text-slate-700 dark:text-slate-200">{plan.job.employment_type}</p>
          </div>
        )}
        {plan.job.location && (
          <div>
            <p className="text-xs font-medium text-slate-400">Location</p>
            <p className="mt-0.5 text-slate-700 dark:text-slate-200">{plan.job.location}</p>
          </div>
        )}
        {plan.job.salary_range && (
          <div>
            <p className="text-xs font-medium text-slate-400">Salary</p>
            <p className="mt-0.5 text-slate-700 dark:text-slate-200">{plan.job.salary_range}</p>
          </div>
        )}
      </div>
    </Surface>
  );
}
