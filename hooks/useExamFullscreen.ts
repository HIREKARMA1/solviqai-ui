'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function readFullscreenState(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
      (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement ||
      (document as Document & { msFullscreenElement?: Element }).msFullscreenElement,
  );
}

/** Exit browser fullscreen if active — safe to call from any exam/results screen. */
export async function exitExamFullscreen(): Promise<void> {
  if (typeof document === 'undefined' || !readFullscreenState()) return;

  try {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
    else if (doc.msExitFullscreen) await doc.msExitFullscreen();
  } catch {
    // ignore — user may have already exited manually
  }
}

export function useExamFullscreen(options?: { autoEnter?: boolean; active?: boolean }) {
  const autoEnter = options?.autoEnter !== false;
  const active = options?.active ?? autoEnter;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const autoAttemptedRef = useRef(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(readFullscreenState());
    sync();
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach((event) => document.addEventListener(event, sync));
    return () => events.forEach((event) => document.removeEventListener(event, sync));
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      if (!readFullscreenState()) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
        else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
        else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      }
      setTimeout(() => setIsFullscreen(readFullscreenState()), 100);
    } catch {
      // Browser may block without user gesture — exam UI still runs in focus mode
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    await exitExamFullscreen();
    setTimeout(() => setIsFullscreen(readFullscreenState()), 100);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (readFullscreenState()) await exitFullscreen();
    else await enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  useEffect(() => {
    if (!autoEnter || !active || autoAttemptedRef.current) return;
    autoAttemptedRef.current = true;

    const t = setTimeout(() => {
      void enterFullscreen();
    }, 120);

    const once = () => {
      document.removeEventListener('pointerdown', once);
      document.removeEventListener('keydown', once);
      void enterFullscreen();
    };
    document.addEventListener('pointerdown', once, { once: true });
    document.addEventListener('keydown', once, { once: true });

    return () => clearTimeout(t);
  }, [autoEnter, active, enterFullscreen]);

  // Leave fullscreen when exam phase ends (results, lobby, navigation).
  useEffect(() => {
    if (active) {
      wasActiveRef.current = true;
      return;
    }
    if (wasActiveRef.current) {
      void exitFullscreen();
      wasActiveRef.current = false;
    }
    autoAttemptedRef.current = false;
  }, [active, exitFullscreen]);

  useEffect(() => {
    return () => {
      void exitExamFullscreen();
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
