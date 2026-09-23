"use client";

import { motion } from "framer-motion";
import { MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AgentWorkspace,
  CompanyMark,
  MatchRing,
  ReadinessBar,
  StepHeading,
} from "@/components/assessment-agent/AgentVisual";
import type { JobMatch, JobReadiness } from "@/types/assessmentAgent";
import { readinessLabel } from "@/lib/assessmentAgent";
import { AgentEmptyState } from "@/components/assessment-agent/AgentStates";

interface JobMatchesStepProps {
  matches: JobMatch[];
  readiness: JobReadiness | null;
  loadingMore: boolean;
  selectedRoles: string[];
  showingRelated: boolean;
  onSelect: (job: JobMatch) => void;
  onViewMore: () => void;
  onRefine: () => void;
  onTryAnotherRole: () => void;
  onShowRelated: () => void;
  canViewMore: boolean;
}

function JobMeta({ job }: { job: JobMatch }) {
  const items = [job.location, job.employment_type, job.salary_range].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
      {job.location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
      )}
      {job.employment_type && <span>{job.employment_type}</span>}
      {job.salary_range && <span>{job.salary_range}</span>}
    </p>
  );
}

function headingForRoles(selectedRoles: string[], showingRelated: boolean) {
  if (showingRelated) {
    return {
      title: "Related opportunities",
      subtitle: "Broader matches based on your skills, experience and preferences.",
    };
  }
  if (selectedRoles.length === 1) {
    return {
      title: `Top ${selectedRoles[0]} jobs for you`,
      subtitle: "Based on your selected role, skills, experience and preferences.",
    };
  }
  if (selectedRoles.length > 1) {
    return {
      title: "Top job matches for your selected roles",
      subtitle: "Based on your selected roles, skills, experience and preferences.",
    };
  }
  return {
    title: "Here are the top job matches for you",
    subtitle: "Based on your skills, experience and preferences.",
  };
}

function emptyCopy(selectedRoles: string[]) {
  if (selectedRoles.length === 1) {
    return {
      title: `No ${selectedRoles[0]} jobs are currently available.`,
      message: "Try another role, or refine your preferences. Related opportunities are shown only if you choose to broaden the search.",
    };
  }
  if (selectedRoles.length > 1) {
    return {
      title: "No jobs are currently available for your selected roles.",
      message: "Try another role, or refine your preferences. Related opportunities are shown only if you choose to broaden the search.",
    };
  }
  return {
    title: "No matching jobs found",
    message: "Unable to load your job matches. Try refining your preferences.",
  };
}

export function JobMatchesStep({
  matches,
  readiness,
  loadingMore,
  selectedRoles,
  showingRelated,
  onSelect,
  onViewMore,
  onRefine,
  onTryAnotherRole,
  onShowRelated,
  canViewMore,
}: JobMatchesStepProps) {
  const score = readiness ? Math.round(readiness.readiness_score) : null;
  const heading = headingForRoles(selectedRoles, showingRelated);
  const empty = emptyCopy(selectedRoles);

  return (
    <AgentWorkspace width="wide">
      <StepHeading
        title={heading.title}
        subtitle={heading.subtitle}
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 rounded-full text-slate-500 hover:text-violet-700"
            onClick={onRefine}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Refine Preferences
          </Button>
        }
      />

      {score != null && (
        <div className="mb-6">
          <ReadinessBar score={score} label={readinessLabel(score)} />
        </div>
      )}

      {matches.length === 0 ? (
        <AgentEmptyState
          title={empty.title}
          message={empty.message}
          actionLabel="Try another role"
          onAction={onTryAnotherRole}
          secondaryActionLabel={selectedRoles.length > 0 && !showingRelated ? "Related opportunities" : "Refine Preferences"}
          onSecondaryAction={
            selectedRoles.length > 0 && !showingRelated ? onShowRelated : onRefine
          }
        />
      ) : (
        <div className="space-y-3">
          {matches.map((job, index) => (
            <motion.button
              key={job.job_id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.2 }}
              onClick={() => onSelect(job)}
              className="flex w-full items-center gap-4 rounded-[16px] border border-slate-200/80 bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:px-5"
            >
              <span className="w-5 shrink-0 text-sm font-medium text-slate-400">
                {index + 1}
              </span>
              <CompanyMark name={job.company} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
                  {job.title}
                </h3>
                <p className="truncate text-sm text-slate-500">{job.company || "Company"}</p>
                <JobMeta job={job} />
                {job.matched_skills.length > 0 && (
                  <p className="mt-1.5 truncate text-xs text-slate-400">
                    {job.matched_skills.slice(0, 4).join(" · ")}
                  </p>
                )}
              </div>
              <MatchRing percent={job.match_score} />
            </motion.button>
          ))}
        </div>
      )}

      {canViewMore && matches.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-violet-200 px-6 text-violet-700 hover:bg-violet-50"
            loading={loadingMore}
            onClick={onViewMore}
          >
            View More Jobs
          </Button>
        </div>
      )}
    </AgentWorkspace>
  );
}
