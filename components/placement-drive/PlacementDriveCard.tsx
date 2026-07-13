'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatTotalDuration,
  getCompanyAvatarClass,
  getCompanyInitial,
  getStageTheme,
  sumStageDurationSeconds,
} from '@/lib/placementDriveStages';
import { ChevronRight, Clock, Play } from 'lucide-react';

const MAX_VISIBLE_STAGES = 5;

export type PlacementDriveCardData = {
  id: string;
  title: string;
  description?: string | null;
  company?: string | null;
  target_role?: string | null;
  tags?: string[] | null;
  stages?: Array<{ stage_type?: string; duration_seconds?: number; title?: string }>;
  stage_count?: number;
};

type PlacementDriveCardProps = {
  drive: PlacementDriveCardData;
  inProgress?: boolean;
  starting?: boolean;
  onStart: (templateId: string) => void;
};

export function PlacementDriveCard({
  drive,
  inProgress,
  starting,
  onStart,
}: PlacementDriveCardProps) {
  const stages = drive.stages ?? [];
  const stageCount = drive.stage_count ?? stages.length;
  const visibleStages = stages.slice(0, MAX_VISIBLE_STAGES);
  const hiddenCount = Math.max(0, stages.length - MAX_VISIBLE_STAGES);
  const totalSeconds = sumStageDurationSeconds(stages);
  const tags = Array.isArray(drive.tags) && drive.tags.length > 0
    ? drive.tags
    : drive.target_role
      ? [drive.target_role]
      : [];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-gray-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="mb-4 flex items-start justify-between gap-2">
        {drive.company ? (
          <span className="inline-flex max-w-[65%] items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light">
            <span className="truncate">{drive.company}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold text-white">
          {stageCount} Stage{stageCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
            getCompanyAvatarClass(drive.company),
          )}
        >
          {getCompanyInitial(drive.company)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-gray-900 line-clamp-2 dark:text-white">
            {drive.title}
          </h3>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">
        {drive.description?.trim() || drive.target_role || 'Multi-round placement simulation drive.'}
      </p>

      {stages.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold text-gray-900 dark:text-gray-100">Drive Stages</p>
          <div className="flex flex-wrap items-start gap-3">
            {visibleStages.map((stage, idx) => {
              const theme = getStageTheme(stage.stage_type || '');
              const Icon = theme.icon;
              return (
                <div key={`${stage.stage_type}-${idx}`} className="flex w-[52px] flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      theme.iconBg,
                    )}
                  >
                    <Icon className={cn('h-4 w-4', theme.iconColor)} strokeWidth={2} />
                  </div>
                  <span className="text-center text-[9px] font-medium leading-tight text-gray-500 dark:text-gray-400">
                    {theme.label}
                  </span>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <div className="flex h-10 items-center">
                <span className="text-xs font-semibold text-gray-400">+{hiddenCount} More</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-brand-green dark:text-brand-green-light">
              {inProgress ? 'In progress' : 'Registrations Open'}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatTotalDuration(totalSeconds)}
            </p>
          </div>
          <Button
            type="button"
            variant="mockPrimary"
            className="h-10 shrink-0 gap-1.5 rounded-xl px-5 text-sm font-semibold sm:min-w-[140px]"
            onClick={() => onStart(drive.id)}
            disabled={starting}
          >
            {/* <Play className="h-4 w-4 fill-current" /> */}
            {starting ? 'Starting…' : inProgress ? 'Continue' : 'Start Drive'}
            {/* <ChevronRight className="ml-0.5 h-4 w-4" /> */}
          </Button>
        </div>
      </div>
    </article>
  );
}
