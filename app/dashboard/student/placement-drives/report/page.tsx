'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { SimulationReportView } from '@/components/simulation/SimulationReportView';
import { apiClient } from '@/lib/api';

function driveToReportData(attempt: Record<string, unknown>) {
  const report = (attempt.report as Record<string, unknown>) || {};
  const template = (attempt.template as Record<string, unknown>) || {};
  return {
    run_id: String(attempt.attempt_id || ''),
    company: (report.company as string) || (template.company as string),
    pipeline_name: (report.drive_title as string) || (template.title as string),
    verdict: (report.verdict as string) || (attempt.verdict as string),
    job_readiness_score:
      (report.readiness_score as number) ?? (attempt.readiness_score as number),
    completed_at: attempt.completed_at as string | undefined,
    report: {
      ...report,
      summary: (report.ai_summary as string) || (report.summary as string),
      job_readiness_score:
        (report.readiness_score as number) ?? (attempt.readiness_score as number),
    },
  };
}

export default function PlacementDriveReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams?.get('attempt_id');
  const [attempt, setAttempt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      router.replace('/dashboard/student/placement-drives');
      return;
    }
    apiClient
      .getPlacementDriveAttempt(attemptId)
      .then((data) => {
        if (data.status !== 'COMPLETED') {
          router.replace(`/dashboard/student/placement-drives/run?attempt_id=${attemptId}`);
          return;
        }
        setAttempt(data);
      })
      .catch(() => router.replace('/dashboard/student/placement-drives'))
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  if (loading) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!attempt) return null;

  return (
    <DashboardLayout requiredUserType="student">
      <SimulationReportView
        data={driveToReportData(attempt)}
        options={{
          backHref: '/dashboard/student/placement-drives',
          backLabel: 'Placement drives',
          title: 'Placement Drive Report',
          scoreLabel: 'Readiness contribution',
          showRetry: true,
          retryHref: '/dashboard/student/placement-drives',
          retryLabel: 'Try another drive',
        }}
      />
    </DashboardLayout>
  );
}
