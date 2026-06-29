'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  Play,
  Upload,
} from 'lucide-react';

export default function SimulationStartPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams?.get('role') || '';
  const prepId = searchParams?.get('prep_id') || undefined;
  const company = searchParams?.get('company') || undefined;

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [resumeVersions, setResumeVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [hasResumeFile, setHasResumeFile] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!role) return;
    const data = await apiClient.previewSimulationEntry({
      job_role_slug: role,
      company_role_prep_id: prepId,
      company,
    });
    setPreview(data);
  }, [role, prepId, company]);

  const loadResume = useCallback(async () => {
    try {
      const [versionsData, status] = await Promise.all([
        apiClient.getResumeGapVersions(),
        apiClient.getResumeStatus().catch(() => null),
      ]);
      const versions = versionsData.versions || [];
      setResumeVersions(versions);
      setHasResumeFile(Boolean(status?.has_resume || status?.resume_uploaded));
      const active = versions.find((v: any) => v.is_active) || versions[0];
      if (active) setSelectedVersionId(active.id);
    } catch {
      setResumeVersions([]);
    }
  }, []);

  useEffect(() => {
    if (!role) {
      router.replace('/dashboard/student/simulations');
      return;
    }
    Promise.all([loadPreview(), loadResume()])
      .catch((e: any) => {
        toast.error(e?.response?.data?.detail || 'Could not load simulation preview');
        router.replace('/dashboard/student/simulations');
      })
      .finally(() => setLoading(false));
  }, [role, router, loadPreview, loadResume]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await apiClient.uploadResume(file);
      toast.success('Resume uploaded');
      setHasResumeFile(true);
      await loadResume();
      setStep(2);
    } catch {
      toast.error('Resume upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedVersionId && !hasResumeFile && resumeVersions.length === 0) {
      toast.error('Upload your resume first');
      setStep(1);
      return;
    }
    setStarting(true);
    try {
      const run = await apiClient.startSimulationRun({
        job_role_slug: role,
        resume_version_id: selectedVersionId || undefined,
        company_role_prep_id: prepId,
        company,
      });
      router.push(`/dashboard/student/simulations/run?run_id=${run.run_id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not start simulation');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!preview) return null;

  const stages = preview.pipeline?.stages || [];
  const roleName = preview.job_role?.display_name || role;
  const canContinueResume = Boolean(selectedVersionId || hasResumeFile || resumeVersions.length > 0);

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/student/simulations">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>
        </Button>

        <div>
          <Badge className="mb-2 bg-green-600">Free simulation</Badge>
          <h1 className="text-2xl font-bold">{preview.company_prep?.card_title || roleName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {preview.company
              ? `Prep for ${preview.company} · ${roleName}`
              : `Role-based pipeline · ${roleName}`}
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`flex-1 rounded-full py-1 text-center ${
                step === n
                  ? 'bg-primary-600 text-white'
                  : step > n
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}
            >
              {n === 1 ? 'Resume' : n === 2 ? 'Pipeline' : 'Start'}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" /> Step 1 — Your resume
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your resume personalizes technical questions in later rounds.
            </p>

            {resumeVersions.length > 0 ? (
              <div className="space-y-2">
                {resumeVersions.slice(0, 3).map((v: any) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                      selectedVersionId === v.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      checked={selectedVersionId === v.id}
                      onChange={() => setSelectedVersionId(v.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {v.original_filename || `Version ${v.version_number}`}
                        {v.is_active && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Active
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        v{v.version_number} · {new Date(v.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-700">No resume on file yet. Upload to continue.</p>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 hover:bg-gray-50 dark:hover:bg-gray-900">
              <Upload className="h-5 w-5" />
              <span>{uploading ? 'Uploading…' : 'Upload PDF or DOCX'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>

            <Button
              className="w-full gap-2"
              onClick={() => setStep(2)}
              disabled={!canContinueResume}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
            <h2 className="font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5" /> Step 2 — Your pipeline ({stages.length} rounds)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sequential rounds — complete each stage to unlock the next. Difficulty adapts as you progress.
            </p>
            <ol className="space-y-2">
              {stages.map((s: any, i: number) => (
                <li key={s.id || i} className="flex gap-3 rounded-lg border px-3 py-2 text-sm dark:border-gray-700">
                  <span className="font-mono text-gray-400">{i + 1}.</span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.stage_type.replace(/_/g, ' ')}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                Review & start <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border p-6 space-y-4 dark:border-gray-700">
            <h2 className="font-semibold">Ready to begin?</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Role: {roleName}
              </li>
              {preview.company && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Company: {preview.company}
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {stages.length} sequential rounds
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Free — no subscription required
              </li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1 gap-2" onClick={handleStart} disabled={starting}>
                <Play className="h-4 w-4" />
                {starting ? 'Starting…' : 'Start Simulation'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
