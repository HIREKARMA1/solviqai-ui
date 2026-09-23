'use client';

import dynamic from 'next/dynamic';

const ResumePage = dynamic(() => import('@/app/dashboard/student/resume/page'), { ssr: false });
const AssessmentPage = dynamic(() => import('@/app/dashboard/student/assessment/page'), { ssr: false });
const JobsPage = dynamic(() => import('@/app/dashboard/student/jobs/page'), { ssr: false });
const AutoApplyPage = dynamic(() => import('@/app/dashboard/student/auto-apply/page'), { ssr: false });

export function HomeFeatureHost({ feature }: { feature: string }) {
  switch (feature) {
    case 'resume':
      return <ResumePage />;
    case 'assessment':
      return <AssessmentPage />;
    case 'jobs':
      return <JobsPage />;
    case 'auto-apply':
      return <AutoApplyPage />;
    default:
      return null;
  }
}
