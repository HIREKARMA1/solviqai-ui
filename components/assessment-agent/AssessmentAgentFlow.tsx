"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StudentBrandPageShell } from "@/components/dashboard/StudentBrandPageShell";
import { AssessmentAgentHeader } from "@/components/assessment-agent/AssessmentAgentHeader";
import { ResumeUploadStep } from "@/components/assessment-agent/ResumeUploadStep";
import { PreferenceQuestionsStep } from "@/components/assessment-agent/PreferenceQuestionsStep";
import { JobMatchesStep } from "@/components/assessment-agent/JobMatchesStep";
import { JobReadinessStep } from "@/components/assessment-agent/JobReadinessStep";
import { JobPlanStep } from "@/components/assessment-agent/JobPlanStep";
import {
  AgentErrorState,
  AgentLoadingState,
} from "@/components/assessment-agent/AgentStates";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ASSESSMENT_AGENT_SOURCE,
  DEFAULT_PREFERENCE_QUESTIONS,
  agentErrorMessage,
  clearFlowState,
  emptyProfile,
  getAssessmentOverviewPath,
  mergeConversationQuestions,
  profileAnswerForQuestion,
  readFlowState,
  readSelectedJob,
  toPublicProfile,
  writeFlowState,
  writeSelectedJob,
} from "@/lib/assessmentAgent";
import type {
  AssessmentAgentProfile,
  AssessmentAgentStep,
  AssessmentPlan,
  JobMatch,
  JobReadiness,
  PreferenceQuestion,
  StartAssessmentResponse,
} from "@/types/assessmentAgent";
import { cn } from "@/lib/utils";

const STEP_ORDER: AssessmentAgentStep[] = [
  "upload",
  "profile",
  "questions",
  "jobs",
  "readiness",
  "plan",
];

function isStep(value: string | null): value is AssessmentAgentStep {
  return !!value && STEP_ORDER.includes(value as AssessmentAgentStep);
}

function selectedRolesFromMatch(raw: Record<string, unknown>, fallback: string[]): string[] {
  if (Array.isArray(raw.selected_roles)) {
    return raw.selected_roles.map(String).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function asJobMatches(raw: Record<string, unknown>): JobMatch[] {
  const matches = Array.isArray(raw.matches) ? raw.matches : [];
  return matches.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      job_id: String(row.job_id ?? ""),
      title: String(row.title ?? "Job"),
      company: row.company != null ? String(row.company) : null,
      location: row.location != null ? String(row.location) : null,
      employment_type:
        row.employment_type != null ? String(row.employment_type) : null,
      salary_range: row.salary_range != null ? String(row.salary_range) : null,
      match_score: Number(row.match_score ?? 0),
      matched_skills: Array.isArray(row.matched_skills)
        ? row.matched_skills.map(String)
        : [],
      skill_gaps: Array.isArray(row.skill_gaps) ? row.skill_gaps.map(String) : [],
      match_explanation: String(row.match_explanation ?? ""),
      score_breakdown:
        row.score_breakdown && typeof row.score_breakdown === "object"
          ? (row.score_breakdown as Record<string, number>)
          : {},
      required_skills: Array.isArray(row.required_skills)
        ? row.required_skills.map(String)
        : [],
    };
  });
}

function asReadiness(raw: Record<string, unknown>): JobReadiness {
  return {
    readiness_score: Number(raw.readiness_score ?? 0),
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String) : [],
    skill_gaps: Array.isArray(raw.skill_gaps) ? raw.skill_gaps.map(String) : [],
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map(String)
      : [],
    breakdown:
      raw.breakdown && typeof raw.breakdown === "object"
        ? (raw.breakdown as Record<string, number>)
        : {},
    job_role_id: raw.job_role_id != null ? String(raw.job_role_id) : null,
  };
}

function asPlan(raw: Record<string, unknown>): AssessmentPlan {
  const job = (raw.job as Record<string, unknown>) || {};
  const readinessRaw = (raw.readiness as Record<string, unknown>) || {};
  const rounds = Array.isArray(raw.rounds) ? raw.rounds : [];
  return {
    job: {
      job_id: String(job.job_id ?? ""),
      title: String(job.title ?? "Role"),
      company: job.company != null ? String(job.company) : null,
      location: job.location != null ? String(job.location) : null,
      employment_type:
        job.employment_type != null ? String(job.employment_type) : null,
      salary_range: job.salary_range != null ? String(job.salary_range) : null,
      required_skills: Array.isArray(job.required_skills)
        ? job.required_skills.map(String)
        : [],
      description: job.description != null ? String(job.description) : null,
    },
    overall_match_score: Number(raw.overall_match_score ?? 0),
    readiness_score: Number(raw.readiness_score ?? 0),
    readiness: asReadiness(readinessRaw),
    rounds: rounds.map((item, roundIndex) => {
      const round = item as Record<string, unknown>;
      return {
        round_type: String(round.round_type ?? ""),
        title: String(round.title ?? `Round ${roundIndex + 1}`),
        question_count:
          round.question_count == null ? null : Number(round.question_count),
        duration_minutes:
          round.duration_minutes == null ? null : Number(round.duration_minutes),
        purpose: round.purpose != null ? String(round.purpose) : null,
        round_number:
          round.round_number == null ? roundIndex + 1 : Number(round.round_number),
        optional: Boolean(round.optional),
      };
    }),
    round_plan_key: raw.round_plan_key != null ? String(raw.round_plan_key) : null,
    matched_skills: Array.isArray(raw.matched_skills)
      ? raw.matched_skills.map(String)
      : [],
    skill_gaps: Array.isArray(raw.skill_gaps) ? raw.skill_gaps.map(String) : [],
  };
}

function questionsFromApi(raw: Record<string, unknown>): PreferenceQuestion[] | null {
  const candidate = raw.questions ?? raw.preference_questions;
  if (!Array.isArray(candidate) || candidate.length === 0) return null;
  const mapped = candidate
    .map((item) => {
      const row = item as Record<string, unknown>;
      const questionId = String(row.question_id ?? row.id ?? "");
      if (!questionId) return null;
      const type = String(row.type ?? "single_choice") as PreferenceQuestion["type"];
      const options = Array.isArray(row.options)
        ? row.options.map((option) => {
            if (typeof option === "string") {
              return { value: option, label: option };
            }
            const opt = option as Record<string, unknown>;
            const value = String(opt.value ?? opt.label ?? "");
            return { value, label: String(opt.label ?? value) };
          })
        : undefined;
      const question: PreferenceQuestion = {
        question_id: questionId,
        prompt: String(row.prompt ?? row.question ?? questionId),
        type,
        options,
        placeholder: row.placeholder != null ? String(row.placeholder) : undefined,
        helper_text: row.helper_text != null ? String(row.helper_text) : undefined,
        required: row.required !== false,
      };
      return question;
    })
    .filter((item): item is PreferenceQuestion => item != null);
  return mapped.length ? mapped : null;
}

function readAgentUrlState(): { step: string | null; job: string | null } {
  if (typeof window === "undefined") return { step: null, job: null };
  const params = new URLSearchParams(window.location.search);
  return { step: params.get("step"), job: params.get("job") };
}

export function AssessmentAgentFlow() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<AssessmentAgentStep>("upload");
  const [hydrated, setHydrated] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlJob, setUrlJob] = useState<string | null>(null);

  const [hasResume, setHasResume] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const [profile, setProfile] = useState<AssessmentAgentProfile>(emptyProfile());
  const [submittingQuestions, setSubmittingQuestions] = useState(false);
  const [preferenceQuestions, setPreferenceQuestions] = useState<PreferenceQuestion[]>(
    DEFAULT_PREFERENCE_QUESTIONS,
  );

  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [matchRoles, setMatchRoles] = useState<string[]>([]);
  const [includeRelated, setIncludeRelated] = useState(false);
  const [jobsLimit, setJobsLimit] = useState(20);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readiness, setReadiness] = useState<JobReadiness | null>(null);
  const [overallReadiness, setOverallReadiness] = useState<JobReadiness | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [plan, setPlan] = useState<AssessmentPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [starting, setStarting] = useState(false);
  const [alreadyActive, setAlreadyActive] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);

  const goToStep = useCallback(
    (next: AssessmentAgentStep, jobId?: string, limit?: number) => {
      setStep(next);
      const resolvedJob =
        jobId ??
        ((next === "plan" || next === "readiness") ? urlJob : null) ??
        undefined;
      writeFlowState({
        step: next,
        jobRoleId: resolvedJob,
        jobsLimit: limit ?? jobsLimit,
      });
      const params = new URLSearchParams();
      params.set("step", next);
      if (resolvedJob && (next === "plan" || next === "readiness")) {
        params.set("job", resolvedJob);
        setUrlJob(resolvedJob);
      } else if (next !== "plan" && next !== "readiness") {
        setUrlJob(null);
      }
      const href = `/dashboard/student/agents/assessment?${params.toString()}`;
      const current =
        typeof window === "undefined"
          ? ""
          : `${window.location.pathname}${window.location.search}`;
      if (current !== href) {
        router.replace(href, { scroll: false });
      }
    },
    [jobsLimit, router, urlJob],
  );

  const loadProfile = useCallback(async (): Promise<AssessmentAgentProfile> => {
    try {
      const raw = await apiClient.getAssessmentAgentProfile();
      const mapped = toPublicProfile(raw);
      setProfile(mapped);
      return mapped;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        const created = await apiClient.upsertAssessmentAgentProfile({});
        const mapped = toPublicProfile(created);
        setProfile(mapped);
        return mapped;
      }
      throw err;
    }
  }, []);

  const seedProfileAfterResume = useCallback(async () => {
    setAnalyzing(true);
    try {
      // Profile upsert already attaches the latest ATS cache snapshot.
      // Do not wait on /students/ats-score — that Cohere/RAG path can hang
      // the Assessment Agent with no UI response.
      await apiClient.upsertAssessmentAgentProfile({});
      await loadProfile();
    } finally {
      setAnalyzing(false);
    }
  }, [loadProfile]);

  // Keep role fallback in a ref so loadMatches stays referentially stable.
  // Depending on profile.target_roles (a new array after every loadProfile)
  // retriggered the bootstrap effect in an infinite GET /students/resume/status loop.
  const profileRolesRef = useRef(profile.target_roles);
  profileRolesRef.current = profile.target_roles;
  const profileIdRef = useRef(profile.id);
  profileIdRef.current = profile.id;

  const loadMatches = useCallback(async (limit: number, related = false) => {
    const raw = await apiClient.matchAssessmentAgentJobs(limit, related);
    setMatches(asJobMatches(raw));
    setMatchRoles(selectedRolesFromMatch(raw, profileRolesRef.current));
    try {
      const readinessRaw = await apiClient.getAssessmentAgentReadiness();
      setOverallReadiness(asReadiness(readinessRaw));
    } catch {
      setOverallReadiness(null);
    }
  }, []);

  const loadReadiness = useCallback(async (jobRoleId: string) => {
    setLoadingReadiness(true);
    setError(null);
    try {
      const raw = await apiClient.getAssessmentAgentReadiness(jobRoleId);
      setReadiness(asReadiness(raw));
      return true;
    } catch (err) {
      setError(
        agentErrorMessage(err, "Unable to load job readiness. Please try again."),
      );
      return false;
    } finally {
      setLoadingReadiness(false);
    }
  }, []);

  const loadPlan = useCallback(async (jobRoleId: string) => {
    setLoadingPlan(true);
    setError(null);
    try {
      const raw = await apiClient.createAssessmentAgentPlan(jobRoleId);
      const nextPlan = asPlan(raw);
      setPlan(nextPlan);
      const cached = readSelectedJob();
      if (cached && cached.job_id === jobRoleId) {
        setSelectedJob(cached);
      }
      return true;
    } catch (err) {
      setError(
        agentErrorMessage(err, "Unable to load the assessment plan. Please try again."),
      );
      return false;
    } finally {
      setLoadingPlan(false);
    }
  }, []);

  useEffect(() => {
    const stored = readFlowState();
    const fromUrl = readAgentUrlState();
    const initialStep = isStep(fromUrl.step) ? fromUrl.step : stored?.step ?? "upload";
    const initialJob = fromUrl.job || stored?.jobRoleId || null;
    const initialLimit = stored?.jobsLimit ?? 20;
    setJobsLimit(initialLimit);
    setStep(initialStep);
    setUrlJob(initialJob);
    if (initialJob) {
      const cached = readSelectedJob();
      if (cached?.job_id === initialJob) setSelectedJob(cached);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const fromUrl = readAgentUrlState();
      if (isStep(fromUrl.step)) setStep(fromUrl.step);
      setUrlJob(fromUrl.job);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const bootstrap = async () => {
      setBootstrapping(true);
      setError(null);
      try {
        if (step === "upload") {
          const resumeStatus = await apiClient.getResumeStatus();
          const existing = Boolean(
            resumeStatus?.resume_uploaded || resumeStatus?.has_resume,
          );
          if (!cancelled) setHasResume(existing);
          return;
        }

        if (!profileIdRef.current) {
          await loadProfile();
        }
        if (step === "jobs") {
          await loadMatches(jobsLimit);
        }
        if (step === "readiness" && (urlJob || selectedJob?.job_id)) {
          const jobId = urlJob || selectedJob!.job_id;
          await loadReadiness(jobId);
          const ok = await loadPlan(jobId);
          if (ok && !cancelled) goToStep("plan", jobId);
        }
        if (step === "plan" && (urlJob || selectedJob?.job_id)) {
          await loadPlan(urlJob || selectedJob!.job_id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            agentErrorMessage(err, "Unable to load Assessment Agent. Please try again."),
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Intentionally omit loader callbacks and selectedJob: those identities
    // previously retriggered this effect (GET /students/resume/status loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, step, urlJob]);

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Please upload a resume smaller than 10MB.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      await apiClient.uploadResume(file, (progress) => setUploadProgress(progress));
      setHasResume(true);
      await seedProfileAfterResume();
      goToStep("questions");
    } catch (err) {
      setError(
        agentErrorMessage(err, "Unable to upload your resume. Please try again."),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleContinueExisting = async () => {
    setError(null);
    try {
      await seedProfileAfterResume();
      goToStep("questions");
    } catch (err) {
      setError(
        agentErrorMessage(err, "Unable to load your resume profile. Please try again."),
      );
    }
  };

  const handleQuestionsComplete = async (
    answers: Record<string, string | number | string[]>,
  ) => {
    setSubmittingQuestions(true);
    setError(null);
    try {
      const raw = await apiClient.submitAssessmentAgentQuestions({ answers });
      setProfile(toPublicProfile(raw));
      const fromApi = questionsFromApi(raw);
      if (fromApi) setPreferenceQuestions(fromApi);
      setLoadingJobs(true);
      setIncludeRelated(false);
      await loadMatches(jobsLimit, false);
      goToStep("jobs");
    } catch (err) {
      setError(
        agentErrorMessage(err, "Unable to save your preferences. Please try again."),
      );
    } finally {
      setSubmittingQuestions(false);
      setLoadingJobs(false);
    }
  };

  const handleSelectJob = async (job: JobMatch) => {
    setSelectedJob(job);
    writeSelectedJob(job);
    const ok = await loadPlan(job.job_id);
    if (ok) goToStep("plan", job.job_id);
  };

  const handleContinueToPlan = async () => {
    const jobRoleId = selectedJob?.job_id || urlJob;
    if (!jobRoleId) return;
    const ok = await loadPlan(jobRoleId);
    if (ok) goToStep("plan", jobRoleId);
  };

  const handleViewMore = async () => {
    const nextLimit = Math.min(50, jobsLimit + 10);
    setLoadingMore(true);
    setError(null);
    try {
      setJobsLimit(nextLimit);
      await loadMatches(nextLimit, includeRelated);
      writeFlowState({ step: "jobs", jobsLimit: nextLimit });
    } catch (err) {
      setError(agentErrorMessage(err, "Unable to load more jobs. Please try again."));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStart = async () => {
    const jobRoleId = plan?.job.job_id || selectedJob?.job_id || urlJob;
    if (!jobRoleId || starting) return;
    setStarting(true);
    setError(null);
    try {
      const raw = (await apiClient.startAssessmentFromAgent(
        jobRoleId,
      )) as unknown as StartAssessmentResponse;
      setAlreadyActive(Boolean(raw.already_active));
      if (raw.already_active) {
        toast.success("An assessment is already in progress.");
      } else {
        toast.success("Assessment started.");
      }
      router.push(getAssessmentOverviewPath(raw.assessment_id, ASSESSMENT_AGENT_SOURCE));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const fallback =
        status === 401
          ? "Your session has expired. Please log in again."
          : status === 400 || status === 404
            ? "This job is invalid or no longer available. Please choose another role."
            : "Unable to start the assessment. Please try again.";
      setError(agentErrorMessage(err, fallback));
      setStarting(false);
    }
  };

  const conversationQuestions = useMemo(
    () => mergeConversationQuestions(preferenceQuestions),
    [preferenceQuestions],
  );

  const preferenceInitialAnswers = useMemo(() => {
    const answers: Record<string, string> = {};
    for (const question of conversationQuestions) {
      answers[question.question_id] = profileAnswerForQuestion(
        profile,
        question.question_id,
      );
    }
    return answers;
  }, [profile, conversationQuestions]);

  const handleNewChat = () => {
    clearFlowState();
    setProfile(emptyProfile());
    setMatches([]);
    setMatchRoles([]);
    setIncludeRelated(false);
    setPlan(null);
    setSelectedJob(null);
    setReadiness(null);
    setOverallReadiness(null);
    setError(null);
    setAlreadyActive(false);
    setHasResume(false);
    goToStep("upload");
  };

  const onHeaderBack = () => {
    if (step === "upload") {
      router.push("/dashboard/student/agents");
      return;
    }
    const previous = STEP_ORDER[Math.max(0, stepIndex - 1)];
    goToStep(
      previous,
      previous === "plan" || previous === "readiness"
        ? urlJob || selectedJob?.job_id || undefined
        : undefined,
    );
  };

  const loadingMessage =
    loadingPlan
      ? "Loading your assessment plan..."
      : loadingReadiness
        ? "Loading job readiness..."
        : loadingJobs
          ? "Finding matching jobs..."
          : "Loading Assessment Agent...";

  const showGlobalLoading =
    (bootstrapping && step !== "upload") ||
    loadingJobs ||
    loadingPlan ||
    (loadingReadiness && !readiness);

  const lockChatLayout = step === "profile" || step === "questions";

  return (
    <DashboardLayout requiredUserType="student">
      <StudentBrandPageShell
        className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#FAFAFC] pb-3 dark:bg-slate-950 sm:pb-4"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-5xl flex-col overflow-hidden">
          <div className="shrink-0">
            <AssessmentAgentHeader
              onBack={onHeaderBack}
              onNewChat={handleNewChat}
              showNewChat={step !== "upload"}
            />
          </div>

          {error && step !== "upload" && (
            <div className="mb-3 shrink-0 sm:mb-4">
              <AgentErrorState message={error} onRetry={() => goToStep(step)} />
            </div>
          )}

          {showGlobalLoading ? (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <AgentLoadingState message={loadingMessage} />
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col",
                lockChatLayout
                  ? "overflow-hidden"
                  : "overflow-x-hidden overflow-y-auto",
              )}
            >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex min-h-0 min-w-0 flex-col",
                  lockChatLayout
                    ? "h-full flex-1 overflow-hidden"
                    : "min-h-full",
                )}
              >
                {step === "upload" && (
                  <ResumeUploadStep
                    hasExistingResume={hasResume}
                    uploading={uploading}
                    progress={uploadProgress}
                    analyzing={analyzing}
                    error={error}
                    onUpload={(file) => void handleUpload(file)}
                    onContinueExisting={() => void handleContinueExisting()}
                    onRetry={() => setError(null)}
                  />
                )}
                {(step === "profile" || step === "questions") && (
                  <PreferenceQuestionsStep
                    questions={conversationQuestions}
                    initialAnswers={preferenceInitialAnswers}
                    submitting={submittingQuestions}
                    studentName={user?.name}
                    onBack={() => goToStep("upload")}
                    onComplete={(answers) => void handleQuestionsComplete(answers)}
                  />
                )}
                {step === "jobs" && (
                  <JobMatchesStep
                    matches={matches}
                    readiness={overallReadiness}
                    loadingMore={loadingMore}
                    selectedRoles={matchRoles.length ? matchRoles : profile.target_roles}
                    showingRelated={includeRelated}
                    canViewMore={jobsLimit < 50}
                    onSelect={(job) => void handleSelectJob(job)}
                    onViewMore={() => void handleViewMore()}
                    onRefine={() => goToStep("questions")}
                    onTryAnotherRole={() => goToStep("questions")}
                    onShowRelated={() => {
                      setIncludeRelated(true);
                      setLoadingJobs(true);
                      void loadMatches(jobsLimit, true).finally(() => setLoadingJobs(false));
                    }}
                  />
                )}
                {step === "readiness" && (
                  <JobReadinessStep
                    job={selectedJob}
                    readiness={readiness}
                    continuing={loadingPlan}
                    onContinue={() => void handleContinueToPlan()}
                    onBack={() => goToStep("jobs")}
                  />
                )}
                {step === "plan" && plan && (
                  <JobPlanStep
                    plan={plan}
                    selectedJob={selectedJob}
                    starting={starting}
                    alreadyActive={alreadyActive}
                    onStart={() => void handleStart()}
                    onBack={() => goToStep("jobs")}
                  />
                )}
                {step === "plan" && !plan && (
                  <AgentErrorState
                    title="Assessment plan unavailable"
                    message="We could not load a personalized plan for this job."
                    onRetry={() => {
                      const jobId = urlJob || selectedJob?.job_id;
                      if (jobId) void loadPlan(jobId);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            </div>
          )}
        </div>
      </StudentBrandPageShell>
    </DashboardLayout>
  );
}
