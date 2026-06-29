'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SimulationLibrary } from '@/components/simulation/SimulationLibrary';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Play } from 'lucide-react';

export default function StudentSimulationsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  useEffect(() => {
    apiClient
      .listSimulationRuns()
      .then((data) => setRuns(data.runs || []))
      .catch(console.error)
      .finally(() => setLoadingRuns(false));
  }, []);

  const inProgress = runs.filter((r) => r.status === 'IN_PROGRESS');

  return (
    <DashboardLayout requiredUserType="student">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Job Prep Simulation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Full multi-round placement prep tailored to your role — free, resume-aware, adaptive difficulty.
          </p>
        </div>

        {loadingRuns ? (
          <div className="flex justify-center py-6">
            <Loader />
          </div>
        ) : inProgress.length > 0 ? (
          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <h2 className="font-semibold mb-3">Continue in progress</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {inProgress.map((r) => (
                <div key={r.run_id} className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge>{r.job_role_slug}</Badge>
                    {r.company && <Badge variant="secondary">{r.company}</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">
                    Stage {r.current_stage_index + 1} of {r.total_stages}
                    {r.current_stage?.title ? ` — ${r.current_stage.title}` : ''}
                  </p>
                  <Button className="mt-3 w-full gap-2" size="sm" asChild>
                    <Link href={`/dashboard/student/simulations/run?run_id=${r.run_id}`}>
                      <Play className="h-4 w-4" /> Continue
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <SimulationLibrary startBasePath="/dashboard/student/simulations/start" />
      </div>
    </DashboardLayout>
  );
}
