"use client";

import { ArrowRight, Clock3, Layers3, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function companyAccent(name: string): string {
  const palette = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

type PrepCardProps = {
  prep: {
    id: string;
    company: string;
    card_title: string;
    card_description?: string;
    job_role_slug: string;
    difficulty_bias?: string;
    tags?: string[];
    stage_count?: number;
    estimated_minutes?: number;
    pipeline?: { stage_count?: number; estimated_duration_minutes?: number };
  };
  onStart: () => void;
};

export function SimulationPrepCard({ prep, onStart }: PrepCardProps) {
  const accent = companyAccent(prep.company || "Co");
  const stages = prep.stage_count ?? prep.pipeline?.stage_count;
  const minutes =
    prep.estimated_minutes ?? prep.pipeline?.estimated_duration_minutes;
  const difficulty =
    prep.difficulty_bias && prep.difficulty_bias !== "standard"
      ? prep.difficulty_bias
      : "Medium";

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e7eef8] bg-white shadow-[0_6px_24px_rgba(17,44,150,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(17,44,150,0.12)] dark:border-gray-800 dark:bg-gray-900">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex min-h-[82px] items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-sm font-bold text-white shadow-md ring-4 ring-white`}
          >
            {initials(prep.company)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {prep.company}
            </p>
            <h3 className="line-clamp-2 min-h-[48px] text-[1.02rem] font-bold leading-snug text-[#111827] dark:text-white">
              {prep.card_title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {prep.job_role_slug?.replace(/_/g, " ")}
            </p>
          </div>
          <Badge className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
            Free
          </Badge>
        </div>

        <div className="mb-4 min-h-[48px] rounded-2xl bg-[#f8fbff] px-3.5 py-3 dark:bg-white/5">
          {prep.card_description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {prep.card_description}
            </p>
          ) : (
            <p className="line-clamp-2 text-sm leading-relaxed text-transparent">
              Placeholder description for consistent card height.
            </p>
          )}
        </div>

        <div className="mb-5 flex min-h-[28px] items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center gap-3">
            {stages != null && (
              <span className="inline-flex items-center gap-1.5">
                <Layers3 className="h-3.5 w-3.5" />
                {stages} Rounds
              </span>
            )}
            {minutes != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />~{minutes} min
              </span>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold",
              difficulty.toLowerCase().includes("hard")
                ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                : difficulty.toLowerCase().includes("easy")
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-blue-50 text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light",
            )}
          >
            {difficulty}
          </span>
        </div>

        <div className="mt-auto">
          <Button
            className="h-11 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-[0_10px_24px_rgba(30,74,138,0.18)]"
            onClick={onStart}
          >
            <Play className="h-4 w-4" />
            Start Preparation
          </Button>
        </div>
      </div>
    </div>
  );
}

type RoleCardProps = {
  role: {
    slug: string;
    display_name: string;
    category?: string;
    default_pipeline?: {
      stage_count?: number;
      estimated_duration_minutes?: number;
    };
  };
  onStart: () => void;
  disabled?: boolean;
};

export function SimulationRoleCard({ role, onStart, disabled }: RoleCardProps) {
  const pipeline = role.default_pipeline;
  const tone = (role.category || role.display_name || "").toLowerCase().includes("data")
    ? "orange"
    : "blue";

  return (
    <div className="group flex h-full flex-col rounded-[22px] border border-[#e7eef8] bg-white p-5 shadow-[0_6px_24px_rgba(17,44,150,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(17,44,150,0.10)] dark:border-gray-800 dark:bg-gray-900">
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm",
          tone === "orange"
            ? "bg-gradient-to-br from-orange-500 to-amber-500"
            : "bg-gradient-to-br from-blue-500 to-cyan-600",
        )}
      >
        {initials(role.display_name)}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full",
            tone === "orange"
              ? "border-orange-200 text-orange-600 dark:border-orange-900/40 dark:text-orange-400"
              : "border-blue-200 text-brand-blue dark:border-blue-900/40 dark:text-brand-blue-light",
          )}
        >
          {role.category || "General"}
        </Badge>
        {pipeline?.stage_count != null && (
          <Badge variant="outline" className="gap-1 rounded-full">
            <Layers3 className="h-3 w-3" />
            {pipeline.stage_count} rounds
          </Badge>
        )}
        <Badge className="rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
          Free
        </Badge>
      </div>
      <h3 className="min-h-[48px] font-bold leading-snug text-[#111827] dark:text-white">
        {role.display_name}
      </h3>
      <p className="mt-1 min-h-[32px] text-xs leading-relaxed text-gray-500">
        {role.slug.replace(/_/g, " ")}
      </p>
      {pipeline?.estimated_duration_minutes != null && (
        <p className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Clock3 className="h-3 w-3" /> ~{pipeline.estimated_duration_minutes}{" "}
          min
        </p>
      )}
      <Button
        className={cn(
          "mt-auto w-full gap-2 rounded-xl",
          tone === "orange"
            ? "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-400 dark:hover:bg-orange-950/20"
            : "border-blue-200 text-brand-blue hover:bg-blue-50 dark:border-blue-900/40 dark:text-brand-blue-light dark:hover:bg-blue-950/20",
        )}
        variant="outline"
        onClick={onStart}
        disabled={disabled}
      >
        {/* <Sparkles className="/h-4 w-4" /> */}
        {disabled ? "Pipeline pending" : "Start Preparation"}
      </Button>
    </div>
  );
}

export function SimulationFeaturedBanner() {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-5 dark:border-violet-900 dark:from-violet-950/30 dark:to-blue-950/20">
      <div className="flex flex-wrap items-center gap-3">
        <ArrowRight className="h-8 w-8 text-violet-600" />
        <div>
          <h2 className="font-semibold">Company-specific prep</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prep for interviews at any company — pick a company, run the full
            multi-round pipeline, adaptive difficulty included.
          </p>
        </div>
      </div>
    </div>
  );
}
