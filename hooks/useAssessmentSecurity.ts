'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAssessmentCamera } from '@/hooks/useAssessmentCamera';
import { readAssessmentFullscreen, useAssessmentFullscreen } from '@/hooks/useAssessmentFullscreen';

export type AssessmentSecurityBlock = 'camera' | 'fullscreen' | 'both' | null;
export type AssessmentSecurityIntent = 'none' | 'start' | 'resume' | 'submit';

export function useAssessmentSecurity(options?: { sessionActive?: boolean; preventLeave?: boolean }) {
  const sessionActive = options?.sessionActive ?? false;
  const preventLeave = options?.preventLeave ?? sessionActive;

  const camera = useAssessmentCamera();
  const fullscreen = useAssessmentFullscreen({ active: sessionActive });
  const [intent, setIntent] = useState<AssessmentSecurityIntent>('none');
  const [startError, setStartError] = useState<string | null>(null);

  const cameraReady = camera.status === 'active';
  const fullscreenActive = fullscreen.isFullscreen;
  const canStartAssessment = cameraReady && fullscreenActive;

  const blockReason: AssessmentSecurityBlock = useMemo(() => {
    if (!sessionActive) return null;
    if (!cameraReady && !fullscreenActive) return 'both';
    if (!cameraReady) return 'camera';
    if (!fullscreenActive) return 'fullscreen';
    return null;
  }, [sessionActive, cameraReady, fullscreenActive]);

  const isBlocked = blockReason !== null;

  useEffect(() => {
    if (!isBlocked) setIntent((prev) => (prev === 'resume' || prev === 'submit' ? 'none' : prev));
  }, [isBlocked]);

  useEffect(() => {
    if (!preventLeave) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [preventLeave]);

  const beginAssessment = useCallback(async (): Promise<boolean> => {
    setIntent('start');
    setStartError(null);

    let camOk = camera.status === 'active';
    if (!camOk) {
      camOk = await camera.startCamera();
    }
    if (!camOk) {
      setStartError('Camera is required to continue the assessment.');
      return false;
    }

    const fsOk = await fullscreen.enterFullscreen();
    if (!fsOk || !readAssessmentFullscreen()) {
      setStartError('Fullscreen mode is required. Please allow fullscreen to continue the assessment.');
      return false;
    }

    setIntent('none');
    return true;
  }, [camera, fullscreen]);

  const restoreFullscreen = useCallback(async (): Promise<boolean> => {
    setIntent('resume');
    return fullscreen.enterFullscreen();
  }, [fullscreen]);

  const restoreCamera = useCallback(async (): Promise<boolean> => {
    setIntent('resume');
    return camera.startCamera();
  }, [camera]);

  const restoreAll = useCallback(async (): Promise<boolean> => {
    setIntent('resume');
    const camOk = cameraReady || (await camera.startCamera());
    const fsOk = fullscreenActive || (await fullscreen.enterFullscreen());
    return Boolean(camOk && fsOk);
  }, [camera, cameraReady, fullscreen, fullscreenActive]);

  const validateForSubmit = useCallback((): { ok: boolean; reason: AssessmentSecurityBlock; message: string | null } => {
    const cam = camera.status === 'active';
    const fs = readAssessmentFullscreen();
    if (!cam && !fs) {
      setIntent('submit');
      return {
        ok: false,
        reason: 'both',
        message: 'Camera and fullscreen mode are required to submit this assessment.',
      };
    }
    if (!cam) {
      setIntent('submit');
      return {
        ok: false,
        reason: 'camera',
        message: 'Camera is required to submit this assessment.',
      };
    }
    if (!fs) {
      setIntent('submit');
      return {
        ok: false,
        reason: 'fullscreen',
        message: 'Fullscreen mode is required to submit this assessment.',
      };
    }
    setIntent('none');
    return { ok: true, reason: null, message: null };
  }, [camera.status]);

  const finishSession = useCallback(async () => {
    camera.stopCamera();
    await fullscreen.exitFullscreen();
  }, [camera, fullscreen]);

  const pendingSubmitRef = useRef(false);

  return {
    camera,
    fullscreen,
    cameraReady,
    fullscreenActive,
    canStartAssessment,
    isBlocked,
    blockReason,
    intent,
    startError,
    beginAssessment,
    restoreFullscreen,
    restoreCamera,
    restoreAll,
    validateForSubmit,
    finishSession,
    pendingSubmitRef,
  };
}
