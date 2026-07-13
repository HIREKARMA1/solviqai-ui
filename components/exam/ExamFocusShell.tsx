'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useExamFullscreen } from '@/hooks/useExamFullscreen';

type Props = {
  title: string;
  subtitle?: string;
  stageLabel?: string;
  children: ReactNode;
  /** When false, navigation remains visible (e.g. drive lobby before starting a stage). */
  focusMode?: boolean;
};

export function ExamFocusShell({
  title,
  subtitle,
  stageLabel,
  children,
  focusMode = true,
}: Props) {
  const { isFullscreen, toggleFullscreen } = useExamFullscreen({ autoEnter: focusMode });

  if (!focusMode) {
    return (
      <DashboardLayout requiredUserType="student">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">{children}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="student" hideNavigation>
      <div
        className="flex h-[calc(100vh-5rem)] min-h-0 flex-col overflow-hidden bg-gray-100 font-sans select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative z-20 flex h-16 shrink-0 items-center justify-between bg-[#2563EB] px-6 text-white shadow-md">
          <div className="min-w-0">
            {stageLabel && <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">{stageLabel}</p>}
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-sm text-blue-100">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="shrink-0 rounded-md bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </DashboardLayout>
  );
}
