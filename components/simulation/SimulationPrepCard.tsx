"use client";

import { Building2, Clock, Layers, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className={`h-2 bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-sm font-bold text-white shadow`}
          >
            {initials(prep.company)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {prep.company}
            </p>
            <h3 className="font-semibold leading-snug line-clamp-2">
              {prep.card_title}
            </h3>
          </div>
          <Badge className="shrink-0 bg-emerald-600">Free</Badge>
        </div>

        {prep.card_description && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {prep.card_description}
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {stages != null && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Layers className="h-3 w-3" />
              {stages} rounds
            </Badge>
          )}
          {minutes != null && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />~{minutes} min
            </Badge>
          )}
          {prep.difficulty_bias && prep.difficulty_bias !== "standard" && (
            <Badge variant="secondary" className="text-xs capitalize">
              {prep.difficulty_bias}
            </Badge>
          )}
          {(prep.tags || []).slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <Button className="w-full gap-2" onClick={onStart}>
          <Play className="h-4 w-4" />
          Start Prep Simulation
        </Button>
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
  return (
    <div className="rounded-2xl border p-5 transition hover:border-primary/40 hover:shadow-sm dark:border-gray-700">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge variant="outline">{role.category || "General"}</Badge>
        {pipeline?.stage_count != null && (
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            {pipeline.stage_count} rounds
          </Badge>
        )}
        <Badge className="bg-emerald-600">Free</Badge>
      </div>
      <h3 className="font-semibold">{role.display_name}</h3>
      <p className="mt-1 text-xs text-gray-500">
        {role.slug.replace(/_/g, " ")}
      </p>
      {pipeline?.estimated_duration_minutes != null && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" /> ~{pipeline.estimated_duration_minutes}{" "}
          min
        </p>
      )}
      <Button
        className="mt-4 w-full gap-2"
        variant="outline"
        onClick={onStart}
        disabled={disabled}
      >
        <Sparkles className="h-4 w-4" />
        {disabled ? "Pipeline pending" : "Start role simulation"}
      </Button>
    </div>
  );
}

export function SimulationFeaturedBanner() {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-5 dark:border-violet-900 dark:from-violet-950/30 dark:to-blue-950/20">
      <div className="flex flex-wrap items-center gap-3">
        <Building2 className="h-8 w-8 text-violet-600" />
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
