'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SimulationLibrary } from '@/components/simulation/SimulationLibrary';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { Briefcase, CalendarClock, ClipboardList, Clock3, Play } from 'lucide-react';
import toast from 'react-hot-toast';

function toTitleCase(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function deriveCompanyLabel(rawValue?: string | null) {
  const value = rawValue?.trim();
  if (!value) return '';

  const firstChunk = value.split(/[,.]/)[0]?.trim() || value;
  const words = firstChunk.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const cleaned =
    words.length > 3
      ? words.slice(0, 2).join(' ')
      : words.join(' ');

  return cleaned.replace(/^about\s+/i, '').trim();
}

function deriveContextSnippet(rawValue?: string | null, fallback?: string | null) {
  const direct = fallback?.trim();
  if (direct) return direct;

  const value = rawValue?.trim();
  if (!value) return '';

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 40) return '';

  return normalized.replace(/^about\s+/i, '');
}

export default function StudentSimulationsPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<'browse' | 'assigned'>('browse');
  const [runs, setRuns] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .listSimulationRuns()
      .then((data) => setRuns(data.runs || []))
      .catch(console.error)
      .finally(() => setLoadingRuns(false));
  }, []);

  useEffect(() => {
    apiClient
      .getSimulationAssignments()
      .then((data) => setAssignments(data.assignments || []))
      .catch(console.error)
      .finally(() => setLoadingAssigned(false));
  }, []);

  const inProgress = runs.filter((r) => r.status === 'IN_PROGRESS');
  const completed = runs.filter((r) => r.status === 'COMPLETED');
  const pendingAssigned = assignments.filter((a) =>
    ['ASSIGNED', 'OVERDUE', 'STARTED'].includes(a.status)
  );

  const handleStartAssignment = async (assignmentId: string, runId?: string | null) => {
    if (runId) {
      router.push(`/dashboard/student/simulations/run?run_id=${runId}`);
      return;
    }
    setStarting(assignmentId);
    try {
      const run = await apiClient.startSimulationFromAssignment(assignmentId);
      router.push(`/dashboard/student/simulations/run?run_id=${run.run_id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Could not start simulation');
    } finally {
      setStarting(null);
    }
  };

  return (
    <DashboardLayout requiredUserType="student">
      <div
        className={cn(
          'relative -mx-6 -mt-20 min-h-[calc(100dvh-6.5rem)] w-auto bg-brand-hero p-4 pb-4 pt-24 dark:bg-brand-hero-dark sm:p-6 sm:pt-28',
          'lg:-mt-24 lg:pt-24',
        )}
      >
        <div className="mx-auto max-w-7xl">
          <SimulationLibrary
            startBasePath="/dashboard/student/simulations/start"
            inProgress={inProgress}
            completed={completed}
            loadingRuns={loadingRuns}
            mainTab={mainTab}
            onMainTabChange={setMainTab}
            assignedCount={pendingAssigned.length}
            assignedContent={
              loadingAssigned ? (
                <div className="flex justify-center rounded-[24px] border border-[#e7eef8] bg-white py-16 shadow-[0_8px_28px_rgba(17,44,150,0.06)] dark:border-gray-800 dark:bg-gray-900">
                  <Loader />
                </div>
              ) : assignments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-[0_8px_28px_rgba(17,44,150,0.06)] dark:border-gray-700 dark:bg-gray-900">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No assigned simulations</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your admin or TPO will assign prep here. Browse the library to start on your
                    own.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-xl"
                    onClick={() => setMainTab('browse')}
                  >
                    Browse simulations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-[#e7eef8] bg-white p-5 shadow-[0_8px_28px_rgba(17,44,150,0.06)] dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                    <h2 className="text-lg font-bold text-[#111827] dark:text-white">Assigned simulations</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Simulations assigned by your admin or TPO. Complete them before the due date.
                    </p>
                  </div>
                  <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {assignments.map((a) => {
                      const isPending = ['ASSIGNED', 'OVERDUE', 'STARTED'].includes(a.status);
                      const companyLabel = deriveCompanyLabel(a.company) || 'Assigned';
                      const contextSnippet = deriveContextSnippet(a.company, a.notes);
                      const roleLabel = toTitleCase(a.job_role_slug) || 'General role';
                      return (
                        <div
                          key={a.assignment_id}
                          className={`group relative overflow-hidden rounded-[22px] border shadow-[0_6px_24px_rgba(17,44,150,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(17,44,150,0.10)] dark:border-gray-700 ${
                            a.status === 'OVERDUE'
                              ? 'border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/10'
                              : 'border-[#e7eef8] bg-white dark:bg-gray-900'
                          }`}
                        >
                          <div
                            className={cn(
                              'h-1.5 bg-gradient-to-r',
                              a.status === 'OVERDUE'
                                ? 'from-red-500 to-orange-500'
                                : 'from-blue-500 to-cyan-600',
                            )}
                          />
                          <div className="flex h-full flex-col p-4">
                            <div className="mb-4 flex min-h-[82px] items-start gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-sm font-bold text-white shadow-md ring-4 ring-white dark:ring-gray-900">
                                {(companyLabel || a.pipeline_name || 'S')
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((part: string) => part[0])
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light"
                                  >
                                    {companyLabel}
                                  </Badge>
                                  <Badge
                                    variant={
                                      a.status === 'OVERDUE'
                                        ? 'destructive'
                                        : a.status === 'COMPLETED'
                                          ? 'default'
                                          : 'outline'
                                    }
                                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                                  >
                                    {a.status}
                                  </Badge>
                                </div>
                                <h3 className="line-clamp-2 min-h-[48px] text-[1.02rem] font-bold leading-snug text-[#111827] dark:text-white">
                                  {a.pipeline_name || 'Simulation'}
                                </h3>
                                <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {roleLabel}
                                </p>
                              </div>
                            </div>

                            <div className="mb-4 min-h-[66px] rounded-2xl bg-[#f8fbff] px-3.5 py-3 dark:bg-white/5">
                              {contextSnippet ? (
                                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                  {contextSnippet}
                                </p>
                              ) : (
                                <p className="line-clamp-3 text-sm leading-relaxed text-gray-400 dark:text-gray-500">
                                  Practice this assigned simulation with role-focused rounds and a
                                  guided interview flow.
                                </p>
                              )}
                            </div>

                            <div className="mb-4 flex min-h-[28px] items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex flex-wrap items-center gap-3">
                                {a.stage_count != null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Play className="h-3.5 w-3.5" />
                                    {a.stage_count} Rounds
                                  </span>
                                )}
                                {a.estimated_duration_minutes != null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    ~{a.estimated_duration_minutes} min
                                  </span>
                                )}
                                {a.due_at && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {new Date(a.due_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                <span className="inline-flex items-center gap-1.5">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  Assigned
                                </span>
                              </span>
                            </div>

                            {isPending && (
                              <div className="mt-auto">
                                <Button
                                  className="h-11 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-[0_10px_24px_rgba(30,74,138,0.18)]"
                                  size="sm"
                                  onClick={() =>
                                    handleStartAssignment(
                                      a.assignment_id,
                                      a.status === 'STARTED' ? a.simulation_run_id : null,
                                    )
                                  }
                                  disabled={starting === a.assignment_id}
                                >
                                  <Play className="h-4 w-4" />
                                  {a.status === 'STARTED' ? 'Continue Simulation' : 'Start Simulation'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
