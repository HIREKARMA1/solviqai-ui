"use client";

import { Sparkles } from "lucide-react";
import { AgentWorkspace } from "@/components/assessment-agent/AgentVisual";

export function AiAnalysisScreen() {
  return (
    <AgentWorkspace width="narrow" className="flex h-full min-h-0 flex-col justify-center overflow-hidden py-8 text-center sm:py-16">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-950/50">
        <Sparkles className="h-5 w-5 animate-pulse" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
        Analyzing your resume
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        I’m reviewing your skills, experience and education.
      </p>
    </AgentWorkspace>
  );
}
