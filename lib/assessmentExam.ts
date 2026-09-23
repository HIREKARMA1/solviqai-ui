import type { AssessmentSubmissionState } from "@/types/assessmentExam";

export function snapshotAnswers<T>(answers: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(answers);
    } catch {
      // Fall through to JSON clone for values structuredClone cannot copy.
    }
  }
  return JSON.parse(JSON.stringify(answers)) as T;
}

export function isExamInteractionLocked(state: AssessmentSubmissionState): boolean {
  return state === "submitting" || state === "error" || state === "completed";
}

export function isExamSubmitInFlight(state: AssessmentSubmissionState): boolean {
  return state === "submitting";
}
