'use client';

import { Maximize, Video } from 'lucide-react';
import type { AssessmentSecurityBlock, AssessmentSecurityIntent } from '@/hooks/useAssessmentSecurity';

export function AssessmentFullscreenOverlay({
  reason,
  intent = 'none',
  onRestoreFullscreen,
  onRestoreCamera,
  onRestoreAll,
  cameraPending = false,
}: {
  reason: AssessmentSecurityBlock;
  intent?: AssessmentSecurityIntent;
  onRestoreFullscreen: () => void | Promise<boolean>;
  onRestoreCamera: () => void | Promise<boolean>;
  onRestoreAll: () => void | Promise<boolean>;
  cameraPending?: boolean;
}) {
  if (!reason) return null;

  const isSubmit = intent === 'submit';

  let title = 'Fullscreen Required';
  let body = (
    <>
      Your assessment is currently paused because fullscreen mode was exited.
      <br />
      Please return to fullscreen to continue your assessment.
    </>
  );
  let actionLabel = 'Return to Fullscreen';
  let action = onRestoreFullscreen;
  let Icon = Maximize;

  if (reason === 'camera') {
    title = 'Camera Connection Lost';
    body = <>Your camera is required to continue this assessment.</>;
    actionLabel = cameraPending ? 'Reconnecting…' : 'Reconnect Camera';
    action = onRestoreCamera;
    Icon = Video;
    if (isSubmit) {
      title = 'Camera Required';
      body = <>Camera is required to submit this assessment.</>;
    }
  } else if (reason === 'both') {
    title = isSubmit ? 'Camera and Fullscreen Required' : 'Assessment Paused';
    body = isSubmit ? (
      <>Camera and fullscreen mode are required to submit this assessment.</>
    ) : (
      <>
        Your camera and fullscreen mode are required to continue this assessment.
      </>
    );
    actionLabel = 'Restore Camera & Fullscreen';
    action = onRestoreAll;
  } else if (reason === 'fullscreen' && isSubmit) {
    title = 'Fullscreen Required';
    body = <>Fullscreen mode is required to submit this assessment.</>;
  }

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
        <button
          type="button"
          onClick={() => void action()}
          disabled={cameraPending && reason === 'camera'}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function CameraStatusIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? 'bg-white/20 text-white' : 'bg-red-600/90 text-white'
      }`}
      title={active ? 'Camera on' : 'Camera off'}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'animate-pulse bg-emerald-300' : 'bg-white'}`} />
      {active ? 'Camera On' : 'Camera Off'}
    </div>
  );
}

export function FullscreenStatusIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? 'bg-white/20 text-white' : 'bg-amber-600/90 text-white'
      }`}
      title={active ? 'Fullscreen on' : 'Fullscreen off'}
    >
      <Maximize className="h-3 w-3" />
      {active ? 'Fullscreen' : 'Not Fullscreen'}
    </div>
  );
}
