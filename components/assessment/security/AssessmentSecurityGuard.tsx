'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader } from '@/components/ui/loader';
import { AssessmentSetupGate } from '@/components/assessment/security/AssessmentSetupGate';
import { AssessmentFullscreenOverlay } from '@/components/assessment/security/AssessmentFullscreenOverlay';
import type { useAssessmentSecurity } from '@/hooks/useAssessmentSecurity';
import { ExamCameraPanel } from '@/components/disha/ExamCameraPanel';

type Security = ReturnType<typeof useAssessmentSecurity>;

export function AssessmentSecurityGuard({
  loading,
  sessionStarted,
  security,
  onBegin,
  roundTitle,
  children,
  loadingMessage,
  examLocked = false,
}: {
  loading?: boolean;
  sessionStarted: boolean;
  security: Security;
  onBegin: () => void | Promise<void>;
  roundTitle?: string;
  children: ReactNode;
  loadingMessage?: string;
  examLocked?: boolean;
}) {
  return (
    <DashboardLayout requiredUserType="student" hideNavigation lockViewport>
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-lg px-6 text-center">
            <Loader size="lg" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {loadingMessage || 'Preparing Your Assessment'}
            </h2>
            <p className="mt-3 text-gray-600">
              Please wait and do not close this page.
            </p>
          </div>
        </div>
      ) : !sessionStarted ? (
        <AssessmentSetupGate security={security} onBegin={onBegin} roundTitle={roundTitle} />
      ) : (
        <div className="relative h-full min-h-0 overflow-hidden">
          <div
            className={`h-full min-h-0 overflow-hidden ${security.isBlocked && !examLocked ? 'pointer-events-none select-none' : ''}`}
            aria-hidden={security.isBlocked && !examLocked}
          >
            {children}
          </div>
          {sessionStarted && (
            <ExamCameraPanel
              variant="floating"
              videoRef={security.camera.videoRef}
              status={security.camera.status}
              onEnableCamera={security.restoreCamera}
            />
          )}
          {security.isBlocked && !examLocked && (
            <AssessmentFullscreenOverlay
              reason={security.blockReason}
              intent={security.intent}
              onRestoreFullscreen={security.restoreFullscreen}
              onRestoreCamera={security.restoreCamera}
              onRestoreAll={security.restoreAll}
              cameraPending={security.camera.isCameraPending}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
