'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SimulationLibrary } from '@/components/simulation/SimulationLibrary';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { CalendarClock, ClipboardList, LayoutGrid, Play } from 'lucide-react';
import toast from 'react-hot-toast';

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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Prep Simulation</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-2xl">
            Full multi-round placement prep tailored to your role — free, resume-aware, adaptive
            difficulty.
          </p>
        </div>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'browse' | 'assigned')} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:w-auto sm:inline-flex">
            <TabsTrigger value="browse" className="gap-2 px-5 py-2.5">
              <LayoutGrid className="h-4 w-4 shrink-0" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="assigned" className="gap-2 px-5 py-2.5">
              <ClipboardList className="h-4 w-4 shrink-0" />
              Assigned
              {pendingAssigned.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1.5 text-xs">
                  {pendingAssigned.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-0 focus-visible:outline-none">
            <SimulationLibrary
              startBasePath="/dashboard/student/simulations/start"
              inProgress={inProgress}
              completed={completed}
              loadingRuns={loadingRuns}
            />
          </TabsContent>

          <TabsContent value="assigned" className="mt-0 focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned simulations</CardTitle>
                <CardDescription>
                  Simulations assigned by your admin or TPO. Complete them before the due date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssigned ? (
                  <div className="flex justify-center py-12">
                    <Loader />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-10 text-center dark:border-gray-700">
                    <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="font-medium">No assigned simulations</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your admin or TPO will assign prep here. Browse the library to start on your
                      own.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setMainTab('browse')}
                    >
                      Browse simulations
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {assignments.map((a) => {
                      const isPending = ['ASSIGNED', 'OVERDUE', 'STARTED'].includes(a.status);
                      return (
                        <div
                          key={a.assignment_id}
                          className={`rounded-xl border p-5 dark:border-gray-700 ${
                            a.status === 'OVERDUE'
                              ? 'border-red-200 bg-red-50/30 dark:border-red-900'
                              : ''
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap gap-2">
                            {a.company && <Badge variant="secondary">{a.company}</Badge>}
                            {a.job_role_slug && (
                              <Badge variant="outline">{a.job_role_slug.replace(/_/g, ' ')}</Badge>
                            )}
                            <Badge
                              variant={
                                a.status === 'OVERDUE'
                                  ? 'destructive'
                                  : a.status === 'COMPLETED'
                                    ? 'default'
                                    : 'outline'
                              }
                            >
                              {a.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{a.pipeline_name || 'Simulation'}</h3>
                          {a.stage_count != null && (
                            <p className="mt-1 text-sm text-muted-foreground">{a.stage_count} rounds</p>
                          )}
                          {a.due_at && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="h-3 w-3" />
                              Due {new Date(a.due_at).toLocaleString()}
                            </p>
                          )}
                          {a.notes && <p className="mt-2 text-sm text-gray-600">{a.notes}</p>}
                          {isPending && (
                            <Button
                              className="mt-4 w-full gap-2"
                              size="sm"
                              onClick={() =>
                                handleStartAssignment(
                                  a.assignment_id,
                                  a.status === 'STARTED' ? a.simulation_run_id : null
                                )
                              }
                              disabled={starting === a.assignment_id}
                            >
                              <Play className="h-4 w-4" />
                              {a.status === 'STARTED' ? 'Continue' : 'Start simulation'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
