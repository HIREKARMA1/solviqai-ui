"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { companyInitials } from "@/lib/assessmentAgent";

export function AgentWorkspace({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
}) {
  const max =
    width === "wide" ? "max-w-3xl" : width === "narrow" ? "max-w-xl" : "max-w-2xl";
  return (
    <div className={cn("mx-auto w-full min-w-0 px-1 pb-10 pt-1 sm:px-2", max, className)}>
      {children}
    </div>
  );
}

export function StepHeading({
  title,
  subtitle,
  action,
  align = "left",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        align === "center" && "text-center sm:flex-col sm:items-center",
      )}
    >
      <div className={cn(align === "center" && "mx-auto max-w-lg")}>
        <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function AgentChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warn";
}) {
  const tones = {
    neutral:
      "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    accent:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
    warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CompanyMark({
  name,
  logoUrl,
  size = "md",
}: {
  name: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-xs";
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name || "Company"}
        className={cn("rounded-xl object-contain bg-white ring-1 ring-slate-100", dim)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-slate-50 font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
        dim,
      )}
    >
      {companyInitials(name)}
    </div>
  );
}

export function MatchRing({
  percent,
  label = "Match",
  size = 56,
}: {
  percent: number;
  label?: string;
  size?: number;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-violet-100 dark:text-violet-900"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-violet-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-300">
            {value}%
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-0.5 text-[11px] font-medium text-slate-400">{label}</span>
      )}
    </div>
  );
}

export function ReadinessBar({ score, label }: { score: number; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="rounded-[16px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        Job Readiness Score
      </p>
      <div className="mt-3 flex items-center gap-4">
        <p className="shrink-0 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {value}
          <span className="text-sm font-normal text-slate-400"> / 100</span>
        </p>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950/60">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="shrink-0 text-sm font-medium text-emerald-600">{label}</p>
      </div>
    </div>
  );
}
