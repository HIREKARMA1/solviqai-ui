"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StudentBrandPageShell } from "@/components/dashboard/StudentBrandPageShell";
import { AssessmentAgentHeader } from "@/components/assessment-agent/AssessmentAgentHeader";
import { AgentErrorState } from "@/components/assessment-agent/AgentStates";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  ASSESSMENT_AGENT_SOURCE,
  agentErrorMessage,
  getAssessmentRoundPath,
} from "@/lib/assessmentAgent";

interface StatusRound {
  round_number: number;
  round_type: string;
  status: string;
  score: number | null;
  percentage: number | null;
  max_score?: number | null;
  strengths?: string[];
  improvement_areas?: string[];
  ai_feedback?: string | null;
}

interface StatusPayload {
  assessment_id: string;
  status: string;
  rounds: StatusRound[];
}

function isCompleted(status: string): boolean {
  return String(status).toLowerCase() === "completed";
}

function resultLabel(percentage: number): string {
  if (percentage >= 85) return "Excellent work!";
  if (percentage >= 70) return "Good Work!";
  if (percentage >= 50) return "Keep practicing";
  return "There's room to improve";
}

const COMPLETE_ERROR = "Unable to complete your assessment. Please try again.";

function logAgentTiming(
  operation: string,
  details: {
    assessment_id: string;
    round_id?: number;
    elapsed_ms: number;
    success: boolean;
  },
) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[assessment-agent]", {
    endpoint: operation,
    operation,
    ...details,
  });
}

export function RoundResultScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams?.get("assessment_id") ?? "";
  const roundNumber = Number(searchParams?.get("round") || "1");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!assessmentId) {
      setError("Assessment ID is required");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const statusStarted = performance.now();
      let stayOnSubmitting = false;
      try {
        const data = (await apiClient.getAssessmentStatus(
          assessmentId,
        )) as StatusPayload;
        logAgentTiming("GET /assessments/{id}/status", {
          assessment_id: assessmentId,
          round_id: roundNumber,
          elapsed_ms: Math.round(performance.now() - statusStarted),
          success: true,
        });
        if (cancelled) return;

        const roundsComplete = Boolean(
          data.rounds?.length &&
            data.rounds.every((round) => isCompleted(String(round.status))),
        );

        if (roundsComplete) {
          const completeStarted = performance.now();
          try {
            await apiClient.completeAssessment(assessmentId);
            logAgentTiming("POST /assessments/{id}/complete", {
              assessment_id: assessmentId,
              round_id: roundNumber,
              elapsed_ms: Math.round(performance.now() - completeStarted),
              success: true,
            });
          } catch (completeErr) {
            logAgentTiming("POST /assessments/{id}/complete", {
              assessment_id: assessmentId,
              round_id: roundNumber,
              elapsed_ms: Math.round(performance.now() - completeStarted),
              success: false,
            });
            const message = agentErrorMessage(completeErr, COMPLETE_ERROR);
            if (
              message.toLowerCase().includes("timeout") ||
              message.toLowerCase().includes("traceback")
            ) {
              throw new Error(COMPLETE_ERROR);
            }
            throw completeErr;
          }
          if (!cancelled) {
            stayOnSubmitting = true;
            router.replace(
              `/dashboard/student/assessment/report?id=${assessmentId}`,
            );
          }
          return;
        }

        setStatus(data);
      } catch (err) {
        logAgentTiming("round-result", {
          assessment_id: assessmentId,
          round_id: roundNumber,
          elapsed_ms: Math.round(performance.now() - statusStarted),
          success: false,
        });
        if (!cancelled) {
          const raw = agentErrorMessage(err, COMPLETE_ERROR);
          setError(raw.toLowerCase().includes("timeout") ? COMPLETE_ERROR : raw);
        }
      } finally {
        if (!cancelled && !stayOnSubmitting) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, roundNumber, retryKey, router]);

  const currentRound = status?.rounds?.find(
    (round) => Number(round.round_number) === roundNumber,
  );
  const nextRound = useMemo(() => {
    if (!status?.rounds) return null;
    return (
      status.rounds.find(
        (round) =>
          Number(round.round_number) > roundNumber &&
          !isCompleted(String(round.status)),
      ) || null
    );
  }, [roundNumber, status]);

  const allDone = Boolean(
    status?.rounds?.length &&
      status.rounds.every((round) => isCompleted(String(round.status))),
  );

  const percentage = Number(currentRound?.percentage ?? 0);
  const score = Number(currentRound?.score ?? 0);
  const maxScore =
    currentRound?.max_score != null ? Number(currentRound.max_score) : null;
  const strengths = currentRound?.strengths ?? [];
  const improvements = currentRound?.improvement_areas ?? [];
  const feedback = currentRound?.ai_feedback?.trim();

  const continueNext = async () => {
    if (allDone) {
      try {
        await apiClient.completeAssessment(assessmentId);
      } catch {
        // Assessment may already be completed by the overview page.
      }
      router.push(`/dashboard/student/assessment/report?id=${assessmentId}`);
      return;
    }
    if (nextRound) {
      router.push(
        getAssessmentRoundPath(
          assessmentId,
          Number(nextRound.round_number),
          ASSESSMENT_AGENT_SOURCE,
        ),
      );
      return;
    }
    router.push(
      `/dashboard/student/assessment?id=${assessmentId}&source=${ASSESSMENT_AGENT_SOURCE}`,
    );
  };

  const title = currentRound
    ? `Round ${currentRound.round_number}: ${String(currentRound.round_type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())}`
    : `Round ${roundNumber}`;

  return (
    <DashboardLayout requiredUserType="student">
      <StudentBrandPageShell className="bg-[#FAFAFC] dark:bg-slate-950">
        <div className="mx-auto max-w-4xl">
          <AssessmentAgentHeader
            onBack={() =>
              router.push(
                `/dashboard/student/assessment?id=${assessmentId}&source=${ASSESSMENT_AGENT_SOURCE}`,
              )
            }
            showNewChat={false}
            rightSlot={
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-slate-500"
                onClick={() =>
                  router.push(
                    `/dashboard/student/assessment?id=${assessmentId}&source=${ASSESSMENT_AGENT_SOURCE}`,
                  )
                }
              >
                View All Rounds
              </Button>
            }
          />

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto max-w-md rounded-[20px] border border-slate-200/80 bg-white px-6 py-12 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Submitting your test...
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Please wait while we evaluate your performance.
              </p>
            </motion.div>
          ) : error ? (
            <AgentErrorState
              title="Something went wrong"
              message={error}
              onRetry={() => {
                setError(null);
                setLoading(true);
                setRetryKey((key) => key + 1);
              }}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[20px] border border-slate-200/80 bg-white px-6 py-8 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-400">{title}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">Your Result</p>
                <div className="relative mx-auto mt-6 h-36 w-36">
                  <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-emerald-100"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 18}
                      strokeDashoffset={
                        2 * Math.PI * 18 * (1 - Math.max(0, Math.min(100, percentage)) / 100)
                      }
                      className="text-emerald-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {maxScore != null && (
                      <p className="text-sm font-medium text-slate-500">
                        {Math.round(score)} / {Math.round(maxScore)}
                      </p>
                    )}
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {Math.round(percentage)}%
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-medium text-emerald-600">{resultLabel(percentage)}</p>
                {maxScore == null && (
                  <p className="mt-1 text-xs text-slate-400">You scored {Math.round(score)} pts</p>
                )}
              </div>

              <div className="rounded-[20px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
                <p className="font-semibold text-slate-900 dark:text-white">AI Feedback</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {feedback ||
                    `Your score for this round is ${Math.round(percentage)}%. Detailed AI feedback is included in the full assessment report after all rounds are complete.`}
                </p>
                {strengths.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-800">Strengths</p>
                    <ul className="mt-2 space-y-1.5">
                      {strengths.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvements.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-800">Improvement Areas</p>
                    <ul className="mt-2 space-y-1.5">
                      {improvements.map((item) => (
                        <li key={item} className="text-sm text-slate-600">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button
                  type="button"
                  className="mt-8 w-full rounded-xl bg-violet-600 hover:bg-violet-700"
                  onClick={() => void continueNext()}
                >
                  {allDone
                    ? "View assessment report"
                    : nextRound
                      ? `Continue to Round ${nextRound.round_number}`
                      : "Continue"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </StudentBrandPageShell>
    </DashboardLayout>
  );
}
