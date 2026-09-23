'use client';

import { useCallback, useEffect, useState } from 'react';
import { exitExamFullscreen } from '@/hooks/useExamFullscreen';

export function readAssessmentFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
      (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
      (document as Document & { msFullscreenElement?: Element }).msFullscreenElement,
  );
}

/**
 * Assessment fullscreen — enter only from a user gesture (no auto-enter).
 */
export function useAssessmentFullscreen(options?: { active?: boolean }) {
  const active = options?.active ?? true;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => setIsFullscreen(readAssessmentFullscreen());
    sync();
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach((event) => document.addEventListener(event, sync));
    return () => events.forEach((event) => document.removeEventListener(event, sync));
  }, []);

  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      if (!readAssessmentFullscreen()) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
        else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      }
      await new Promise((r) => setTimeout(r, 80));
      const ok = readAssessmentFullscreen();
      setIsFullscreen(ok);
      return ok;
    } catch {
      setIsFullscreen(readAssessmentFullscreen());
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    await exitExamFullscreen();
    setIsFullscreen(readAssessmentFullscreen());
  }, []);

  useEffect(() => {
    if (!active) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [active]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
