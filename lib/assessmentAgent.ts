import { getErrorMessage } from "@/lib/utils";
import type {
  AssessmentAgentProfile,
  AssessmentAgentStep,
  JobMatch,
  PreferenceQuestion,
} from "@/types/assessmentAgent";

export const ASSESSMENT_AGENT_SOURCE = "assessment-agent";

const FLOW_STORAGE_KEY = "solviq.assessmentAgent.flow";
const SELECTED_JOB_KEY = "solviq.assessmentAgent.selectedJob";

export const CONVERSATION_PROFILE_QUESTIONS: PreferenceQuestion[] = [
  {
    question_id: "education",
    prompt: "What is your highest education level?",
    type: "single_choice",
    required: true,
    options: [
      { value: "B.Tech / B.E.", label: "B.Tech / B.E." },
      { value: "M.Tech / M.E.", label: "M.Tech / M.E." },
      { value: "MCA", label: "MCA" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    question_id: "field_of_study",
    prompt: "What is your primary field of study?",
    type: "text",
    required: true,
    placeholder: "Computer Science Engineering",
  },
];

export const DEFAULT_PREFERENCE_QUESTIONS: PreferenceQuestion[] = [
  {
    question_id: "target_roles",
    prompt: "What kind of role are you looking for?",
    type: "multi_choice",
    required: true,
    helper_text: "Select every role that feels like a fit.",
    options: [
      { value: "Backend Developer", label: "Backend Developer" },
      { value: "Full Stack Developer", label: "Full Stack Developer" },
      { value: "Software Engineer", label: "Software Engineer" },
      { value: "Data Analyst", label: "Data Analyst" },
    ],
  },
  {
    question_id: "preferred_locations",
    prompt: "Where would you prefer to work?",
    type: "multi_choice",
    required: true,
    options: [
      { value: "Remote", label: "Remote" },
      { value: "Bengaluru", label: "Bengaluru" },
      { value: "Hyderabad", label: "Hyderabad" },
      { value: "Pune", label: "Pune" },
      { value: "Anywhere", label: "Anywhere" },
    ],
  },
  {
    question_id: "expected_salary",
    prompt: "What's your preferred salary range?",
    type: "single_choice",
    required: false,
    options: [
      { value: "₹3–6 LPA", label: "₹3–6 LPA" },
      { value: "₹6–10 LPA", label: "₹6–10 LPA" },
      { value: "₹10–15 LPA", label: "₹10–15 LPA" },
      { value: "₹15+ LPA", label: "₹15+ LPA" },
    ],
  },
  {
    question_id: "employment_preference",
    prompt: "What type of opportunity do you want?",
    type: "single_choice",
    required: true,
    options: [
      { value: "Full-time", label: "Full-time" },
      { value: "Internship", label: "Internship" },
      { value: "Contract", label: "Contract" },
      { value: "Remote", label: "Remote" },
    ],
  },
];

export interface AssessmentAgentFlowState {
  step: AssessmentAgentStep;
  jobRoleId?: string;
  jobsLimit?: number;
}

const EMPTY_PROFILE: Omit<AssessmentAgentProfile, "id"> = {
  education: null,
  field_of_study: null,
  experience_years: null,
  skills: [],
  target_roles: [],
  preferred_locations: [],
  expected_salary: null,
  employment_preference: null,
  career_interests: [],
  resume_analysis: null,
  skill_gaps: [],
  preference_answers: {},
};

export function toPublicProfile(raw: Record<string, unknown>): AssessmentAgentProfile {
  const list = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item).trim()).filter(Boolean);
  };

  const resume = raw.resume_analysis;
  return {
    id: String(raw.id ?? ""),
    education: raw.education != null ? String(raw.education) : null,
    field_of_study: raw.field_of_study != null ? String(raw.field_of_study) : null,
    experience_years: (() => {
      if (typeof raw.experience_years === "number") return raw.experience_years;
      if (raw.experience_years == null) return null;
      const parsed = Number(raw.experience_years);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
    skills: list(raw.skills),
    target_roles: list(raw.target_roles),
    preferred_locations: list(raw.preferred_locations),
    expected_salary: raw.expected_salary != null ? String(raw.expected_salary) : null,
    employment_preference:
      raw.employment_preference != null ? String(raw.employment_preference) : null,
    career_interests: list(raw.career_interests),
    resume_analysis:
      resume && typeof resume === "object"
        ? (resume as AssessmentAgentProfile["resume_analysis"])
        : null,
    skill_gaps: list(raw.skill_gaps),
    preference_answers:
      raw.preference_answers && typeof raw.preference_answers === "object"
        ? (raw.preference_answers as Record<string, unknown>)
        : {},
  };
}

export function emptyProfile(): AssessmentAgentProfile {
  return { id: "", ...EMPTY_PROFILE };
}

export function agentErrorMessage(error: unknown, fallback: string): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }
  const message = getErrorMessage(error, fallback);
  if (message.toLowerCase().includes("traceback") || message.length > 280) {
    return fallback;
  }
  return message;
}

export function readinessLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Fair";
  return "Needs work";
}

export function formatMatchPercent(score: number): string {
  return `${Math.round(score)}%`;
}

export function parseListInput(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function readFlowState(): AssessmentAgentFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentAgentFlowState;
    if (!parsed?.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFlowState(state: AssessmentAgentFlowState): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(state));
}

export function clearFlowState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FLOW_STORAGE_KEY);
  sessionStorage.removeItem(SELECTED_JOB_KEY);
}

export function writeSelectedJob(job: JobMatch): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SELECTED_JOB_KEY, JSON.stringify(job));
}

export function readSelectedJob(): JobMatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SELECTED_JOB_KEY);
    return raw ? (JSON.parse(raw) as JobMatch) : null;
  } catch {
    return null;
  }
}

export function withAssessmentSource(path: string, source?: string | null): string {
  if (!source) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}source=${encodeURIComponent(source)}`;
}

export function getPostRoundPath(
  assessmentId: string,
  roundNumber: number,
  source?: string | null,
): string {
  if (source === ASSESSMENT_AGENT_SOURCE) {
    return `/dashboard/student/agents/assessment/round-result?assessment_id=${encodeURIComponent(
      assessmentId,
    )}&round=${roundNumber}`;
  }
  return `/dashboard/student/assessment?id=${encodeURIComponent(assessmentId)}`;
}

export function getAssessmentOverviewPath(
  assessmentId: string,
  source?: string | null,
): string {
  return withAssessmentSource(
    `/dashboard/student/assessment?id=${encodeURIComponent(assessmentId)}`,
    source,
  );
}

export function getAssessmentRoundPath(
  assessmentId: string,
  roundNumber: number,
  source?: string | null,
): string {
  return withAssessmentSource(
    `/dashboard/student/assessment/round?assessment_id=${encodeURIComponent(
      assessmentId,
    )}&round=${roundNumber}`,
    source,
  );
}

export function mergeConversationQuestions(
  fromApi: PreferenceQuestion[] | null | undefined,
  fallback: PreferenceQuestion[] = DEFAULT_PREFERENCE_QUESTIONS,
): PreferenceQuestion[] {
  const source = fromApi?.length ? fromApi : fallback;
  const seen = new Set(source.map((item) => item.question_id));
  const starters = CONVERSATION_PROFILE_QUESTIONS.filter(
    (item) => !seen.has(item.question_id),
  );
  return [...starters, ...source];
}

export function companyInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "SQ";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function profileAnswerForQuestion(
  profile: AssessmentAgentProfile,
  questionId: string,
): string {
  const fromPrefs = profile.preference_answers?.[questionId];
  if (fromPrefs != null && fromPrefs !== "") {
    const text = Array.isArray(fromPrefs) ? fromPrefs.join(", ") : String(fromPrefs);
    if (questionId === "education") return normalizeEducationChoice(text);
    return text;
  }
  // Target roles must come from an explicit Assessment Agent preference answer.
  // Do not fall back to profile.target_roles — that field may contain seeded
  // student.job_roles_of_interest noise (e.g. Software Engineer) that would
  // incorrectly broaden Top Job Matches.
  if (questionId === "target_roles") {
    return "";
  }
  const direct = profile[questionId as keyof AssessmentAgentProfile];
  if (Array.isArray(direct)) return direct.join(", ");
  if (direct == null || typeof direct === "object") return "";
  const text = String(direct);
  if (questionId === "education") return normalizeEducationChoice(text);
  return text;
}

export function normalizeEducationChoice(value: string): string {
  const n = value.trim().toLowerCase();
  if (!n) return "";
  if (n === "b.tech / b.e." || n.includes("b.tech") || n.includes("b.e") || n.includes("btech")) {
    return "B.Tech / B.E.";
  }
  if (n === "m.tech / m.e." || n.includes("m.tech") || n.includes("m.e") || n.includes("mtech")) {
    return "M.Tech / M.E.";
  }
  if (n === "mca" || n.includes("mca")) return "MCA";
  return value;
}
