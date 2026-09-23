export type PreferenceQuestionType =
  | "single_choice"
  | "multi_choice"
  | "text"
  | "select"
  | "number";

export interface PreferenceQuestionOption {
  value: string;
  label: string;
}

export interface PreferenceQuestion {
  question_id: string;
  prompt: string;
  type: PreferenceQuestionType;
  options?: PreferenceQuestionOption[];
  placeholder?: string;
  helper_text?: string;
  required?: boolean;
}

export interface AssessmentAgentResumeAnalysis {
  ats_cache_id?: string;
  ats_score?: number | null;
  extracted_skills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  has_intelligence_report?: boolean;
}

export interface AssessmentAgentProfile {
  id: string;
  education: string | null;
  field_of_study: string | null;
  experience_years: number | null;
  skills: string[];
  target_roles: string[];
  preferred_locations: string[];
  expected_salary: string | null;
  employment_preference: string | null;
  career_interests: string[];
  resume_analysis: AssessmentAgentResumeAnalysis | null;
  skill_gaps: string[];
  preference_answers: Record<string, unknown>;
}

export interface AssessmentAgentProfileUpsert {
  education?: string | null;
  field_of_study?: string | null;
  experience_years?: number | null;
  skills?: string[];
  target_roles?: string[];
  preferred_locations?: string[];
  expected_salary?: string | null;
  employment_preference?: string | null;
  career_interests?: string[];
  skill_gaps?: string[];
}

export interface PreferenceQuestionAnswer {
  question_id: string;
  answer: string | number | string[] | null;
}

export interface PreferenceQuestionsRequest {
  answers?: Record<string, unknown>;
  questions?: PreferenceQuestionAnswer[];
}

export interface JobMatch {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  match_score: number;
  matched_skills: string[];
  skill_gaps: string[];
  match_explanation: string;
  score_breakdown: Record<string, number>;
  required_skills?: string[];
}

export interface JobMatchResponse {
  matches: JobMatch[];
  profile_empty: boolean;
  selected_roles?: string[];
  role_filtered?: boolean;
}

export interface JobReadiness {
  readiness_score: number;
  strengths: string[];
  skill_gaps: string[];
  recommendations: string[];
  breakdown: Record<string, number>;
  job_role_id: string | null;
}

export interface AssessmentPlanRound {
  round_type: string;
  title: string;
  question_count: number | null;
  duration_minutes: number | null;
  purpose: string | null;
  round_number: number | null;
  optional: boolean;
}

export interface AssessmentPlanJob {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  required_skills?: string[];
  description?: string | null;
}

export interface AssessmentPlan {
  job: AssessmentPlanJob;
  overall_match_score: number;
  readiness_score: number;
  readiness: JobReadiness;
  rounds: AssessmentPlanRound[];
  round_plan_key: string | null;
  matched_skills: string[];
  skill_gaps: string[];
}

export interface StartAssessmentJobRole {
  title: string | null;
  category: string | null;
  description: string | null;
  company?: string | null;
  required_skills?: string[];
}

export interface StartAssessmentResponse {
  message: string;
  assessment_id: string;
  job_role: StartAssessmentJobRole;
  total_rounds: number;
  estimated_duration: number;
  status: string;
  already_active: boolean;
  round_plan_key: string | null;
  plan: AssessmentPlan;
}

export type AssessmentAgentStep =
  | "upload"
  | "profile"
  | "questions"
  | "jobs"
  | "readiness"
  | "plan";
