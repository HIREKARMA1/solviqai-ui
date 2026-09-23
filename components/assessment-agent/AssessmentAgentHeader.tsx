"use client";

import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AssessmentAgentHeaderProps {
  title?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  progressLabel?: string;
  progressValue?: number;
  onNewChat?: () => void;
  showNewChat?: boolean;
}

export function AssessmentAgentHeader({
  title = "Assessment Agent",
  onBack,
  rightSlot,
  progressLabel,
  progressValue,
  onNewChat,
  showNewChat = true,
}: AssessmentAgentHeaderProps) {
  return (
    <div className="mb-3 sm:mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-0.5">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 shrink-0 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="truncate text-[15px] font-medium text-slate-800 dark:text-white sm:text-base">
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showNewChat && onNewChat && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-slate-500 hover:text-violet-700"
              onClick={onNewChat}
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </Button>
          )}
          {rightSlot}
        </div>
      </div>

      {progressLabel && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
            <span>{progressLabel}</span>
            {typeof progressValue === "number" && <span>{Math.round(progressValue)}%</span>}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressValue ?? 0))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
