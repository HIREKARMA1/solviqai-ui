'use client';

import { Maximize, Shield, Video } from 'lucide-react';
import { ExamCameraPanel } from '@/components/disha/ExamCameraPanel';
import type { useAssessmentSecurity } from '@/hooks/useAssessmentSecurity';

type Security = ReturnType<typeof useAssessmentSecurity>;

export function AssessmentSetupGate({
  security,
  onBegin,
  roundTitle,
}: {
  security: Security;
  onBegin: () => void | Promise<void>;
  roundTitle?: string;
}) {
  const cameraReady = security.cameraReady;
  const fullscreenActive = security.fullscreenActive;
  const canStart = cameraReady && fullscreenActive;

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-gray-100 p-4">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Secure assessment setup</h1>
            <p className="mt-1 text-sm text-gray-500">
              {roundTitle ? `${roundTitle}: ` : ''}
              Enable your camera and enter fullscreen before the round begins.
            </p>
          </div>
        </div>

        <ExamCameraPanel
          variant="setup"
          videoRef={security.camera.videoRef}
          status={security.camera.status}
          onEnableCamera={security.camera.startCamera}
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className={`rounded-lg border px-3 py-2 ${cameraReady ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <Video className="mb-1 h-4 w-4" />
            Camera {cameraReady ? '✓' : '✕'}
          </div>
          <div className={`rounded-lg border px-3 py-2 ${fullscreenActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
            <Maximize className="mb-1 h-4 w-4" />
            Fullscreen {fullscreenActive ? '✓' : '✕'}
          </div>
        </div>

        {security.startError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p className="font-semibold">Fullscreen mode is required</p>
            <p className="mt-0.5">{security.startError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void onBegin()}
          disabled={security.camera.isCameraPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          <Maximize className="h-4 w-4" />
          {canStart ? 'Start Assessment' : cameraReady ? 'Enter Fullscreen' : 'Enable camera, then continue'}
        </button>
      </div>
    </div>
  );
}
