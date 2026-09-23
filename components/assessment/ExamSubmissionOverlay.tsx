"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssessmentSubmissionState } from "@/types/assessmentExam";

const STEPS = [
  "Checking your answers",
  "Evaluating performance",
  "Generating AI feedback",
  "Calculating score",
] as const;

export function ExamSubmissionOverlay({
  state,
  onRetry,
}: {
  state: AssessmentSubmissionState;
  onRetry?: () => void;
}) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const visible = state === "submitting" || state === "error";

  useEffect(() => {
    if (state !== "submitting") {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 400);
    return () => window.clearInterval(id);
  }, [state]);

  const activeStep = useMemo(() => {
    if (elapsedSec < 3) return 0;
    if (elapsedSec < 8) return 1;
    if (elapsedSec < 16) return 2;
    return 3;
  }, [elapsedSec]);

  if (!visible) return null;

  const isError = state === "error";

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center bg-[#FAFAFC]/95 px-4 dark:bg-slate-950/95"
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={isError ? "Submission could not be completed" : "Submitting your test"}
    >
      <div className="w-full max-w-md rounded-[20px] border border-slate-200/80 bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isError ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
          }`}
        >
          {isError ? (
            <RefreshCw className="h-8 w-8" />
          ) : (
            <CheckCircle2 className="h-8 w-8" />
          )}
        </div>

        {isError ? (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Submission could not be completed
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your answers are still preserved. Please try again.
            </p>
            {onRetry && (
              <Button
                type="button"
                className="mt-6 rounded-xl bg-violet-600 hover:bg-violet-700"
                onClick={onRetry}
              >
                Retry Submission
              </Button>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Submitting your assessment...
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we evaluate your performance.
            </p>
            <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-slate-600">
              {STEPS.map((label, index) => {
                const done = index < activeStep;
                const current = index === activeStep;
                return (
                  <li key={label} className="flex items-center gap-2">
                    {done ? (
                      <span className="text-emerald-500">✓</span>
                    ) : current ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                    ) : (
                      <span className="text-slate-300">◌</span>
                    )}
                    <span className={done ? "text-slate-800" : current ? "text-slate-700" : "text-slate-400"}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-slate-400">
              Your answers have been securely submitted and cannot be changed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
