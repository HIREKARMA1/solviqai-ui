'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Play, Layers, CalendarClock, RefreshCw } from 'lucide-react';
import { STAGE_LABELS } from '@/components/placement-drive/PlacementDriveStageEditor';

function stagePreview(stages: Array<{ stage_type?: string }> = []) {
  return stages
    .slice(0, 5)
    .map((s) => STAGE_LABELS[s.stage_type || ''] || s.stage_type)
    .join(' → ');
}

export default function PlacementDriveLibraryPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();

  const loadLibrary = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      apiClient.getPlacementDriveLibrary(),
      apiClient.getAssignedPlacementDrives(),
    ])
      .then(([lib, asn]) => {
        setDrives(Array.isArray(lib?.drives) ? lib.drives : []);
        setInProgress(Array.isArray(lib?.in_progress) ? lib.in_progress : []);
        setAssigned(Array.isArray(asn?.assignments) ? asn.assignments : []);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Could not load placement drives';
        setLoadError(typeof msg === 'string' ? msg : 'Could not load placement drives');
        toast.error('Failed to load placement drives');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const inProgressByTemplate = useMemo(() => {
    const map: Record<string, any> = {};
    for (const a of inProgress) {
      if (a.template_id) map[a.template_id] = a;
    }
    return map;
  }, [inProgress]);

  const continueDrive = (attemptId: string) => {
    router.push(`/dashboard/student/placement-drives/run?attempt_id=${attemptId}`);
  };

  const handleStart = async (templateId: string) => {
    const existing = inProgressByTemplate[templateId];
    if (existing?.attempt_id) {
      continueDrive(existing.attempt_id);
      return;
    }
    setStarting(templateId);
    try {
      const attempt = await apiClient.startPlacementDrive(templateId);
      router.push(`/dashboard/student/placement-drives/run?attempt_id=${attempt.attempt_id}`);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Could not start drive');
    } finally {
      setStarting(null);
    }
  };

  const pendingAssigned = assigned.filter((a) => ['ASSIGNED', 'OVERDUE', 'STARTED'].includes(a.status));

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Placement Drive Simulation</h1>
          <p className="text-gray-600">
            Sequential company drives — aptitude, coding, interviews, GD, and more with a combined verdict.
          </p>
        </div>

        {inProgress.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="font-semibold mb-3">Continue in progress</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {inProgress.map((a) => (
                <div key={a.attempt_id} className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="font-semibold">{a.template?.title || 'Placement drive'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stage {(a.current_stage_index ?? 0) + 1} of {a.total_stages}
                    {a.current_stage?.title ? ` · ${a.current_stage.title}` : ''}
                  </p>
                  <Button className="mt-3 w-full gap-2" size="sm" onClick={() => continueDrive(a.attempt_id)}>
                    <Play className="h-4 w-4" />
                    Continue drive
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingAssigned.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4" /> Assigned by your TPO
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingAssigned.map((a) => (
                <div key={a.assignment_id} className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {a.company && <Badge variant="secondary">{a.company}</Badge>}
                    <Badge variant={a.status === 'OVERDUE' ? 'destructive' : 'outline'}>{a.status}</Badge>
                  </div>
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.due_at && (
                    <p className="text-xs text-gray-500 mt-1">Due {new Date(a.due_at).toLocaleString()}</p>
                  )}
                  {a.notes && <p className="text-sm text-gray-600 mt-2">{a.notes}</p>}
                  <Button className="mt-3 w-full gap-2" size="sm" onClick={() => handleStart(a.template_id)} disabled={starting === a.template_id}>
                    <Play className="h-4 w-4" />
                    {starting === a.template_id ? 'Starting…' : a.status === 'STARTED' ? 'Continue' : 'Start assigned drive'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader size="lg" /></div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
            <p className="text-red-800 dark:text-red-200">{loadError}</p>
            <Button className="mt-4 gap-2" variant="outline" onClick={loadLibrary}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : drives.length === 0 && pendingAssigned.length === 0 && inProgress.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">No published placement drives yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              An admin must create a drive and set it to <strong>Published</strong> before it appears here.
              If your college assigned a drive via TPO, it will show in the assigned section above.
            </p>
          </div>
        ) : drives.length === 0 ? null : (
          <>
            <h2 className="text-lg font-semibold">Drive library</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {drives.map((d) => {
                const active = inProgressByTemplate[d.id];
                return (
                  <div key={d.id} className="rounded-xl border p-5 dark:border-gray-700">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {d.company && (
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1 inline" />
                          {d.company}
                        </Badge>
                      )}
                      <Badge>
                        <Layers className="h-3 w-3 mr-1 inline" />
                        {d.stage_count} stages
                      </Badge>
                      {active && <Badge variant="outline">In progress</Badge>}
                    </div>
                    <h3 className="text-lg font-semibold">{d.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{d.description || d.target_role}</p>
                    {d.stages?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">{stagePreview(d.stages)}</p>
                    )}
                    <Button
                      className="mt-4 w-full gap-2"
                      onClick={() => handleStart(d.id)}
                      disabled={starting === d.id}
                    >
                      <Play className="h-4 w-4" />
                      {starting === d.id ? 'Starting…' : active ? 'Continue' : 'Start drive'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
