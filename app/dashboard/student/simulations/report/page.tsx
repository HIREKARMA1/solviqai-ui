'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { SimulationReportView } from '@/components/simulation/SimulationReportView';
import { apiClient } from '@/lib/api';

export default function SimulationReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams?.get('run_id');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runId) {
      router.replace('/dashboard/student/simulations');
      return;
    }
    apiClient
      .getSimulationReport(runId)
      .then(setData)
      .catch(() => router.replace('/dashboard/student/simulations'))
      .finally(() => setLoading(false));
  }, [runId, router]);

  return (
    <DashboardLayout requiredUserType="student">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      ) : data ? (
        <SimulationReportView data={data} />
      ) : null}
    </DashboardLayout>
  );
}
