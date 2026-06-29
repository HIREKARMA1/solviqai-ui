'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Building2, Play, Layers, CalendarClock } from 'lucide-react';

export default function PlacementDriveLibraryPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      apiClient.getPlacementDriveLibrary(),
      apiClient.getAssignedPlacementDrives(),
    ])
      .then(([lib, asn]) => {
        setDrives(lib.drives || []);
        setAssigned(asn.assignments || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (id: string) => {
    setStarting(id);
    try {
      const attempt = await apiClient.startPlacementDrive(id);
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
          <p className="text-gray-600">Sequential company drives — aptitude, tests, and AI interviews with a combined verdict.</p>
        </div>

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
        ) : drives.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No published placement drives yet.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Drive library</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {drives.map((d) => (
                <div key={d.id} className="rounded-xl border p-5 dark:border-gray-700">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {d.company && <Badge variant="secondary"><Building2 className="h-3 w-3 mr-1 inline" />{d.company}</Badge>}
                    <Badge><Layers className="h-3 w-3 mr-1 inline" />{d.stage_count} stages</Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{d.description || d.target_role}</p>
                  <Button className="mt-4 w-full gap-2" onClick={() => handleStart(d.id)} disabled={starting === d.id}>
                    <Play className="h-4 w-4" />
                    {starting === d.id ? 'Starting…' : 'Start Drive'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

