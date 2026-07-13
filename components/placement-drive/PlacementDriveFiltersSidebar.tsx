'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Filter, Search } from 'lucide-react';
import { STAGE_LABELS } from './PlacementDriveStageEditor';

export type DriveFilters = {
  search: string;
  company: string;
  target_role: string;
  stage_type: string;
};

type FilterOptions = {
  companies: string[];
  roles: string[];
  stageTypes: string[];
};

type PlacementDriveFiltersSidebarProps = {
  draft: DriveFilters;
  onDraftChange: (next: DriveFilters) => void;
  onApply: () => void;
  onReset: () => void;
  options: FilterOptions;
  className?: string;
};

const fieldLabel = 'mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300';
const selectClass =
  'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200';

export function PlacementDriveFiltersSidebar({
  draft,
  onDraftChange,
  onApply,
  onReset,
  options,
  className,
}: PlacementDriveFiltersSidebarProps) {
  return (
    <aside
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-brand-blue hover:underline dark:text-brand-blue-light"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-0 lg:space-y-4">
        <div>
          <label className={fieldLabel} htmlFor="drive-company">
            Company
          </label>
          <select
            id="drive-company"
            className={selectClass}
            value={draft.company}
            onChange={(e) => onDraftChange({ ...draft, company: e.target.value })}
          >
            <option value="">All Companies</option>
            {options.companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="drive-role">
            Role
          </label>
          <select
            id="drive-role"
            className={selectClass}
            value={draft.target_role}
            onChange={(e) => onDraftChange({ ...draft, target_role: e.target.value })}
          >
            <option value="">All Roles</option>
            {options.roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="drive-stage">
            Stage / Round
          </label>
          <select
            id="drive-stage"
            className={selectClass}
            value={draft.stage_type}
            onChange={(e) => onDraftChange({ ...draft, stage_type: e.target.value })}
          >
            <option value="">All Stages</option>
            {options.stageTypes.map((st) => (
              <option key={st} value={st}>
                {STAGE_LABELS[st] || st}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="button"
        variant="mockPrimary"
        className="mt-4 h-10 w-full gap-2 rounded-lg text-sm font-semibold sm:mt-5"
        onClick={onApply}
      >
        <Filter className="h-4 w-4" />
        Apply Filters
      </Button>
    </aside>
  );
}
