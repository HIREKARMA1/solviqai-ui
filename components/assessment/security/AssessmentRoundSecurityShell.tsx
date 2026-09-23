'use client';

import { ReactNode, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AssessmentSecurityGuard } from '@/components/assessment/security/AssessmentSecurityGuard';
import { useAssessmentSecurity } from '@/hooks/useAssessmentSecurity';

export function AssessmentRoundSecurityShell({
  enabled,
  completed = false,
  submitting = false,
  roundTitle,
  children,
}: {
  enabled: boolean;
  completed?: boolean;
  submitting?: boolean;
  roundTitle?: string;
  children: (security: ReturnType<typeof useAssessmentSecurity>) => ReactNode;
}) {
  const [sessionStarted, setSessionStarted] = useState(false);
  const security = useAssessmentSecurity({
    sessionActive: enabled && sessionStarted && !completed,
    preventLeave: enabled && sessionStarted && !completed,
  });

  const inner = children(security);

  if (!enabled) {
    return <DashboardLayout requiredUserType="student">{inner}</DashboardLayout>;
  }

  return (
    <AssessmentSecurityGuard
      sessionStarted={sessionStarted}
      security={security}
      roundTitle={roundTitle}
      examLocked={submitting || completed}
      onBegin={async () => {
        const ok = await security.beginAssessment();
        if (ok) setSessionStarted(true);
      }}
    >
      <div className="h-full min-h-0 overflow-y-auto">{inner}</div>
    </AssessmentSecurityGuard>
  );
}
