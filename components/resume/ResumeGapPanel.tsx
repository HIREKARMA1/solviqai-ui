'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { Target, Sparkles, AlertTriangle, CheckCircle2, History } from 'lucide-react';

interface GapAnalysis {
  id: string;
  keyword_overlap_score: number;
  overall_match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  gaps: Array<{ area: string; message: string; priority: string; category: string }>;
  rewrite_suggestions: Array<{ section: string; issue: string; suggested_text: string; rationale: string }>;
  created_at?: string;
}

interface ResumeGapPanelProps {
  hasResume: boolean;
  jobDescription?: string;
  onJobDescriptionChange?: (value: string) => void;
}

export function ResumeGapPanel({ hasResume, jobDescription = '', onJobDescriptionChange }: ResumeGapPanelProps) {
  const [jd, setJd] = useState(jobDescription);
  const [targetRole, setTargetRole] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GapAnalysis | null>(null);
  const [history, setHistory] = useState<GapAnalysis[]>([]);
  const [versions, setVersions] = useState<Array<{ id: string; version_number: number; is_active: boolean }>>([]);

  useEffect(() => {
    setJd(jobDescription);
  }, [jobDescription]);

  useEffect(() => {
    if (!hasResume) return;
    (async () => {
      try {
        const [v, a] = await Promise.all([
          apiClient.getResumeGapVersions(),
          apiClient.getResumeGapAnalyses(5),
        ]);
        setVersions(v.versions || []);
        setHistory(a.analyses || []);
      } catch {
        /* non-blocking */
      }
    })();
  }, [hasResume]);

  const handleJdChange = (value: string) => {
    setJd(value);
    onJobDescriptionChange?.(value);
  };

  const runAnalysis = async () => {
    if (jd.trim().length < 20) {
      setError('Paste a job description (at least 20 characters) to analyze gaps.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.analyzeResumeGaps({
        job_description: jd,
        target_role: targetRole || undefined,
        job_title: jobTitle || undefined,
      });
      setResult(data);
      setHistory((prev) => [data, ...prev.filter((x) => x.id !== data.id)].slice(0, 5));
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Gap analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasResume) return null;

  const scoreColor = (s: number) =>
    s >= 70 ? 'text-green-600' : s >= 45 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="border-0 bg-gradient-to-br from-white via-emerald-50 to-teal-50 shadow-lg dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <CardHeader className="border-b border-emerald-200/60 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-md">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Resume Gap Engine</CardTitle>
            <CardDescription>
              JD keyword match, named gaps, and AI rewrite suggestions — with resume versioning
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {versions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <History className="h-4 w-4" />
            <span>
              Resume v{versions.find((v) => v.is_active)?.version_number ?? versions[0].version_number} active
              {versions.length > 1 ? ` · ${versions.length} versions saved` : ''}
            </span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job title (optional)</label>
            <Input
              placeholder="e.g. Software Engineer Intern"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target role (optional)</label>
            <Input
              placeholder="e.g. Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Job description</label>
          <Textarea
            placeholder="Paste the full JD — we extract keywords and compare against your resume..."
            value={jd}
            onChange={(e) => handleJdChange(e.target.value)}
            rows={5}
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Analyzing gaps…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run Gap Analysis
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-5 border-t pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-white/80 p-4 text-center dark:bg-gray-900/50">
                <p className="text-xs uppercase tracking-wide text-gray-500">Keyword overlap</p>
                <p className={`text-3xl font-bold ${scoreColor(result.keyword_overlap_score)}`}>
                  {result.keyword_overlap_score}%
                </p>
              </div>
              <div className="rounded-lg border bg-white/80 p-4 text-center dark:bg-gray-900/50">
                <p className="text-xs uppercase tracking-wide text-gray-500">Overall match</p>
                <p className={`text-3xl font-bold ${scoreColor(result.overall_match_score)}`}>
                  {result.overall_match_score}%
                </p>
              </div>
            </div>

            {result.matched_keywords.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">Matched keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_keywords.slice(0, 20).map((kw) => (
                    <Badge key={kw} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.missing_keywords.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.slice(0, 20).map((kw) => (
                    <Badge key={kw} variant="outline" className="border-red-300 text-red-700">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.gaps.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Named gaps</p>
                {result.gaps.map((gap, i) => (
                  <div
                    key={`${gap.area}-${i}`}
                    className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">{gap.area}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {gap.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{gap.message}</p>
                  </div>
                ))}
              </div>
            )}

            {result.rewrite_suggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Rewrite suggestions
                </p>
                {result.rewrite_suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border bg-white p-4 dark:bg-gray-900/60">
                    <Badge className="mb-2 capitalize">{s.section}</Badge>
                    <p className="text-xs text-gray-500 mb-2">{s.issue}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.suggested_text}</p>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{s.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {history.length > 1 && !result && (
          <p className="text-xs text-gray-500">{history.length} past analyses — run a new one with a JD above.</p>
        )}
      </CardContent>
    </Card>
  );
}
