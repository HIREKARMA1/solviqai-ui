"use client";

import { useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/ui/loader";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Gauge,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

export type GapAnalysis = {
  overall_match_score?: number;
  keyword_overlap_score?: number;
  skill_match_percent?: number | null;
  experience_match_percent?: number | null;
  education_match_percent?: number | null;
  keyword_coverage_percent?: number | null;
  keyword_categories?: {
    present?: Record<string, string[]>;
    missing?: Record<string, string[]>;
  };
  matched_keywords?: string[];
  missing_keywords?: string[];
  rewrite_suggestions?: Array<{
    section: string;
    issue: string;
    suggested_text: string;
    rationale: string;
    category?: string;
    priority?: string;
    original_text?: string;
  }>;
  predicted_ats_score?: number | null;
  improvement_percent?: number | null;
  improvement_points?: number | null;
  gaps?: Array<{ area: string; message: string; priority: string; category: string }>;
};

type Recommendation = {
  priority: string;
  title: string;
  reason: string;
  expected_benefit: string;
  estimated_ats_gain: number;
  difficulty: string;
  estimated_time_required: string;
};

type RewritePair = { original?: string; improved?: string; reason?: string };

type Props = {
  currentAtsScore: number;
  estimatedFutureScore: number;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onAnalyzeJd: () => void;
  onUploadJdFile: (file: File) => void;
  jdMatch: GapAnalysis | null;
  jdLoading: boolean;
  jdParsing: boolean;
  jdError: string | null;
  recommendations: Recommendation[];
  intelligenceRewrites: RewritePair[];
  formattingSuggestions: string[];
  skillSuggestions: string[];
};

const WORKSPACE_TABS = [
  { id: "overview", label: "ATS Overview" },
  { id: "jd", label: "JD Match Analysis" },
  { id: "keywords", label: "Missing Keywords" },
  { id: "suggestions", label: "AI Suggestions" },
  { id: "simulator", label: "ATS Score Simulator" },
] as const;

type TabId = (typeof WORKSPACE_TABS)[number]["id"];

const CATEGORY_LABELS: Record<string, string> = {
  technical_skills: "Technical",
  tools: "Tools",
  soft_skills: "Soft skills",
  experience: "Experience",
  education: "Education",
  domain: "Domain",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function barColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function ScoreRing({ score, label, size = 132 }: { score: number; label: string; size?: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="transparent" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="transparent"
            stroke="currentColor"
            className={scoreColor(clamped)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (clamped / 100) * circ}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-extrabold ${scoreColor(clamped)}`}>{Math.round(clamped)}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
    </div>
  );
}

function MatchBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className={`font-bold ${scoreColor(v)}`}>{v.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor(v)}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function priorityClass(priority?: string) {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400";
  if (p === "low") return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
  return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400";
}

export function ResumeATSWorkspace({
  currentAtsScore,
  estimatedFutureScore,
  jobDescription,
  onJobDescriptionChange,
  onAnalyzeJd,
  onUploadJdFile,
  jdMatch,
  jdLoading,
  jdParsing,
  jdError,
  recommendations,
  intelligenceRewrites,
  formattingSuggestions,
  skillSuggestions,
}: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [appliedRecs, setAppliedRecs] = useState<Record<number, boolean>>({});
  const [appliedKeywords, setAppliedKeywords] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const predictedFromJd = jdMatch?.predicted_ats_score ?? estimatedFutureScore;
  const improvementPct =
    jdMatch?.improvement_percent ??
    (currentAtsScore > 0
      ? Math.round(((predictedFromJd - currentAtsScore) / currentAtsScore) * 1000) / 10
      : 0);

  const mergedSuggestions = useMemo(() => {
    const fromGap = (jdMatch?.rewrite_suggestions || []).map((s) => ({
      section: s.section,
      category: s.category || "bullet_rewrite",
      priority: s.priority || "medium",
      issue: s.issue,
      original: s.original_text || "",
      improved: s.suggested_text,
      rationale: s.rationale,
    }));
    const fromIntel = intelligenceRewrites.map((s) => ({
      section: "experience",
      category: "bullet_rewrite",
      priority: "high",
      issue: s.reason || "Strengthen this bullet",
      original: s.original || "",
      improved: s.improved || "",
      rationale: s.reason || "",
    }));
    const extras = [
      ...formattingSuggestions.slice(0, 2).map((text) => ({
        section: "formatting",
        category: "formatting",
        priority: "medium",
        issue: "Formatting improvement",
        original: "",
        improved: text,
        rationale: "Cleaner structure helps ATS parsers map sections correctly.",
      })),
      ...skillSuggestions.slice(0, 2).map((text) => ({
        section: "skills",
        category: "skill_enhancement",
        priority: "medium",
        issue: "Skill enhancement",
        original: "",
        improved: text,
        rationale: "Closer skill coverage improves keyword match against the target role.",
      })),
    ];
    const combined = [...fromGap, ...fromIntel, ...extras];
    const seen = new Set<string>();
    return combined.filter((item) => {
      const key = `${item.category}:${item.improved}`.slice(0, 160);
      if (!item.improved || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [jdMatch, intelligenceRewrites, formattingSuggestions, skillSuggestions]);

  const simulatedScore = useMemo(() => {
    let next = currentAtsScore;
    recommendations.forEach((rec, idx) => {
      if (appliedRecs[idx]) next += rec.estimated_ats_gain || 0;
    });
    Object.entries(appliedKeywords).forEach(([, on]) => {
      if (on) next += 0.7;
    });
    return Math.min(98, Math.round(next * 10) / 10);
  }, [appliedKeywords, appliedRecs, currentAtsScore, recommendations]);

  const presentCats = jdMatch?.keyword_categories?.present || {};
  const missingCats = jdMatch?.keyword_categories?.missing || {};
  const missingFlat = jdMatch?.missing_keywords || [];
  const matchedFlat = jdMatch?.matched_keywords || [];

  return (
    <Card className="scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <CardHeader className="border-b border-gray-50 pb-3 dark:border-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
              <Gauge className="h-4 w-4 text-blue-600" />
              ATS Optimization Workspace
            </CardTitle>
            <CardDescription className="text-xs">
              JD match, keyword coverage, AI rewrites, and a before/after ATS simulator
            </CardDescription>
          </div>
          {jdMatch && (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
              JD match {Math.round(jdMatch.overall_match_score || 0)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-2 scrollbar-none dark:border-gray-800">
        {WORKSPACE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-shrink-0 px-3 py-3 text-xs font-semibold transition-all sm:text-sm ${
              tab === item.id
                ? "border-b-2 border-blue-600 bg-blue-50/10 text-blue-600 dark:text-blue-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <CardContent className="space-y-5 p-4 sm:p-6">
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ScoreRing score={currentAtsScore} label="Current ATS" />
              <ScoreRing score={predictedFromJd} label="Predicted after fixes" />
              <div className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <TrendingUp className="mb-2 h-5 w-5 text-blue-600" />
                <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">
                  +{Math.max(0, Math.round(predictedFromJd - currentAtsScore))}
                </p>
                <p className="text-xs font-semibold text-gray-500">points · {improvementPct}% lift</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MatchBar label="Keyword coverage" value={jdMatch?.keyword_coverage_percent ?? 0} />
              <MatchBar label="Skill match" value={jdMatch?.skill_match_percent ?? 0} />
              <MatchBar label="Experience match" value={jdMatch?.experience_match_percent ?? 0} />
              <MatchBar label="Education match" value={jdMatch?.education_match_percent ?? 0} />
            </div>
            {!jdMatch && (
              <p className="text-xs text-gray-500">
                Paste or upload a job description in <span className="font-semibold">JD Match Analysis</span> to unlock skill, experience, and education match percentages.
              </p>
            )}
          </div>
        )}

        {tab === "jd" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Job description
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadJdFile(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => fileRef.current?.click()}
                    disabled={jdParsing || jdLoading}
                  >
                    {jdParsing ? <Loader size="sm" /> : <FileUp className="mr-1.5 h-3.5 w-3.5" />}
                    Upload JD
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Paste the full job description, or upload a PDF/DOCX..."
                value={jobDescription}
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                rows={6}
                disabled={jdLoading || jdParsing}
                className="rounded-xl text-xs sm:text-sm"
              />
              <Button
                onClick={onAnalyzeJd}
                disabled={jdLoading || jobDescription.trim().length < 20}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {jdLoading ? (
                  <>
                    <Loader size="sm" />
                    Comparing resume to JD...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate Resume Match Score
                  </>
                )}
              </Button>
              {jdError && (
                <p className="flex items-center gap-1.5 text-xs text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {jdError}
                </p>
              )}
            </div>

            {jdMatch && (
              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-800/20">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Overall resume match
                    </p>
                    <p className={`text-4xl font-extrabold ${scoreColor(jdMatch.overall_match_score || 0)}`}>
                      {Math.round(jdMatch.overall_match_score || 0)}
                      <span className="text-base font-semibold text-gray-400">/100</span>
                    </p>
                  </div>
                  <Badge className="bg-white text-gray-600 dark:bg-gray-900">
                    Keyword overlap {Math.round(jdMatch.keyword_overlap_score || 0)}%
                  </Badge>
                </div>
                <Progress value={jdMatch.overall_match_score || 0} className="h-2.5" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MatchBar label="Skills" value={jdMatch.skill_match_percent || 0} />
                  <MatchBar label="Experience" value={jdMatch.experience_match_percent || 0} />
                  <MatchBar label="Education" value={jdMatch.education_match_percent || 0} />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "keywords" && (
          <div className="space-y-5">
            {!jdMatch ? (
              <p className="text-sm text-gray-500">Run a JD comparison to extract present vs missing ATS keywords.</p>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Present keywords ({matchedFlat.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchedFlat.length ? (
                      matchedFlat.map((kw) => (
                        <Badge
                          key={kw}
                          className="rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        >
                          ✓ {kw}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs italic text-gray-400">No overlapping keywords yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Missing ATS keywords ({missingFlat.length}) · coverage{" "}
                    {Math.round(jdMatch.keyword_coverage_percent || 0)}%
                  </p>
                  {Object.entries(missingCats).map(([cat, words]) =>
                    words?.length ? (
                      <div key={cat} className="mb-3">
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          {CATEGORY_LABELS[cat] || cat}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {words.map((kw) => (
                            <Badge
                              key={`${cat}-${kw}`}
                              className="rounded-md border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            >
                              + {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
                {Object.keys(presentCats).some((k) => (presentCats[k] || []).length > 0) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Coverage by category
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.keys(CATEGORY_LABELS).map((cat) => {
                        const present = presentCats[cat]?.length || 0;
                        const missing = missingCats[cat]?.length || 0;
                        const total = present + missing;
                        if (!total) return null;
                        return (
                          <MatchBar
                            key={cat}
                            label={CATEGORY_LABELS[cat]}
                            value={Math.round((present / total) * 100)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "suggestions" && (
          <div className="space-y-3">
            {mergedSuggestions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Suggestions appear after analysis. Compare against a JD for rewritten bullets and keyword optimization.
              </p>
            ) : (
              mergedSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className={`border text-[10px] uppercase ${priorityClass(item.priority)}`}>
                      {item.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {item.category.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {item.section}
                    </span>
                  </div>
                  <p className="mb-3 text-xs font-medium text-gray-600 dark:text-gray-300">{item.issue}</p>
                  {item.original ? (
                    <div className="mb-2 rounded-lg bg-rose-50/70 p-2.5 text-xs text-rose-800 dark:bg-rose-950/20 dark:text-rose-300">
                      <span className="font-bold">Before: </span>
                      {item.original}
                    </div>
                  ) : null}
                  <div className="rounded-lg bg-emerald-50/80 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <span className="font-bold">After: </span>
                    {item.improved}
                  </div>
                  {item.rationale && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                      {item.rationale}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "simulator" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
              <ScoreRing score={currentAtsScore} label="Before" />
              <ArrowRight className="mx-auto hidden h-6 w-6 text-gray-300 sm:block" />
              <ScoreRing score={simulatedScore} label="After selected fixes" />
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                +{Math.max(0, Math.round((simulatedScore - currentAtsScore) * 10) / 10)} points
                {currentAtsScore > 0
                  ? ` · ${Math.round(((simulatedScore - currentAtsScore) / currentAtsScore) * 1000) / 10}% improvement`
                  : ""}
              </p>
              <p className="text-[11px] text-gray-500">Toggle recommendations and keywords to model a new ATS score</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recommendations</p>
              {recommendations.length === 0 && (
                <p className="text-xs text-gray-400">No scored recommendations on this report yet.</p>
              )}
              {recommendations.map((rec, idx) => (
                <label
                  key={idx}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-3 text-xs hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={Boolean(appliedRecs[idx])}
                    onChange={(e) =>
                      setAppliedRecs((prev) => ({ ...prev, [idx]: e.target.checked }))
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{rec.title}</span>
                      <Badge className={`border text-[10px] ${priorityClass(rec.priority)}`}>{rec.priority}</Badge>
                      <span className="font-bold text-emerald-600">+{rec.estimated_ats_gain}</span>
                    </span>
                    <span className="mt-0.5 block text-gray-500">{rec.reason}</span>
                  </span>
                </label>
              ))}
            </div>

            {missingFlat.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Add missing keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingFlat.slice(0, 16).map((kw) => {
                    const on = Boolean(appliedKeywords[kw]);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() =>
                          setAppliedKeywords((prev) => ({ ...prev, [kw]: !prev[kw] }))
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          on
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-amber-200"
                        }`}
                      >
                        {on ? <CheckCircle2 className="mr-1 inline h-3 w-3" /> : "+ "}
                        {kw}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Sparkles className="h-3.5 w-3.5" />
              Predicted score is an estimate based on typical ATS keyword and content gains — re-upload an edited resume for a live rescore.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
