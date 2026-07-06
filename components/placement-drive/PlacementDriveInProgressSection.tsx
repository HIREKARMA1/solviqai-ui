'use client';

import { Button } from '@/components/ui/button';
import { STAGE_LABELS } from '@/components/placement-drive/PlacementDriveStageEditor';
import { cn } from '@/lib/utils';
import { getCompanyInitial, getStageTheme } from '@/lib/placementDriveStages';
import { Briefcase, Play, Target } from 'lucide-react';

export type InProgressAttempt = {
  attempt_id: string;
  current_stage_index?: number;
  total_stages?: number;
  stage_results?: Array<{ stage_index?: number }>;
  current_stage?: { title?: string; stage_type?: string };
  template?: {
    title?: string;
    company?: string | null;
    target_role?: string | null;
  };
};

type PlacementDriveInProgressSectionProps = {
  attempts: InProgressAttempt[];
  onContinue: (attemptId: string) => void;
};

function CompactProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div
        className="h-full rounded-full bg-brand-blue transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function InProgressDriveCard({
  attempt,
  onContinue,
}: {
  attempt: InProgressAttempt;
  onContinue: (attemptId: string) => void;
}) {
  const totalStages = attempt.total_stages ?? 0;
  const currentIndex = attempt.current_stage_index ?? 0;
  const completedCount = attempt.stage_results?.length ?? currentIndex;
  const progressPercent = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0;
  const stageNumber = currentIndex + 1;
  const stageTitle =
    attempt.current_stage?.title ||
    STAGE_LABELS[attempt.current_stage?.stage_type || ''] ||
    'Current stage';
  const stageType = attempt.current_stage?.stage_type;
  const StageIcon = getStageTheme(stageType || '').icon;

  return (
    <article className="flex w-[min(100%,300px)] shrink-0 flex-col rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:w-[300px]">
      <div className="flex gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue text-sm font-bold text-white">
          {getCompanyInitial(attempt.template?.company)}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light">
            <span className="h-1 w-1 rounded-full bg-brand-blue" />
            Active
          </span>
          <h3 className="mt-1 text-sm font-bold leading-tight text-gray-900 line-clamp-1 dark:text-white">
            {attempt.template?.title || 'Placement drive'}
          </h3>
          {attempt.template?.company && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500 line-clamp-1 dark:text-gray-400">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">{attempt.template.company}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-800/60">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            getStageTheme(stageType || '').iconBg,
          )}
        >
          <StageIcon className={cn('h-3.5 w-3.5', getStageTheme(stageType || '').iconColor)} />
        </div>
        <p className="min-w-0 text-[11px] font-semibold leading-tight text-gray-800 line-clamp-2 dark:text-gray-200">
          Stage {stageNumber}/{totalStages}
          <span className="text-gray-400"> · </span>
          {stageTitle}
        </p>
      </div>

      <Button
        variant="mockPrimary"
        size="sm"
        className="mt-3 h-9 w-full gap-1.5 rounded-lg text-xs font-semibold"
        onClick={() => onContinue(attempt.attempt_id)}
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        Continue Drive
      </Button>

      <div className="mt-2.5 space-y-1">
        <CompactProgressBar percent={progressPercent} />
        <div className="flex items-center justify-between text-[10px] text-orange-500 dark:text-gray-400">
          <span>{progressPercent}% complete</span>
          <span>
            {completedCount}/{totalStages} stages
          </span>
        </div>
      </div>
    </article>
  );
}

export function PlacementDriveInProgressSection({
  attempts,
  onContinue,
}: PlacementDriveInProgressSectionProps) {
  if (!attempts.length) return null;

  return (
    <section className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/50 via-white to-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4 dark:border-brand-blue/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 dark:bg-brand-blue/20">
          <Target className="h-4 w-4 text-orange-500" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-base">
            Continue in Progress
          </h2>
          <p className="text-xs text-orange-500 line-clamp-1 dark:text-gray-400">
            Pick up where you left off — {attempts.length} active drive{attempts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {attempts.map((attempt) => (
          <InProgressDriveCard
            key={attempt.attempt_id}
            attempt={attempt}
            onContinue={onContinue}
          />
        ))}
      </div>
    </section>
  );
}
