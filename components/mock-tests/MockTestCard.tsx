'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCategoryBadgeLabel,
  getCategoryCardTheme,
  getCategoryLabel,
  getCompanyInitial,
} from '@/lib/mockTestCategories';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  Calculator,
  Clock,
  Code2,
  FileQuestion,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  PieChart,
  Play,
  Puzzle,
  Signal,
  Users,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  technical_mcq: Code2,
  aptitude: PieChart,
  soft_skills: MessageCircle,
  logical: Puzzle,
  verbal: BookOpen,
};

function getQuestionCount(t: Record<string, unknown>): number {
  const manual = Array.isArray(t.manual_question_ids) ? t.manual_question_ids.length : 0;
  const ai = typeof t.ai_question_count === 'number' ? t.ai_question_count : 0;
  const total = manual + ai;
  return total > 0 ? total : 20;
}

function capitalizeDifficulty(d: string): string {
  const key = (d || 'medium').toLowerCase();
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getCardDescription(test: {
  description?: string | null;
  round_type?: string;
  company?: string | null;
  target_role?: string | null;
}): string {
  if (test.description?.trim()) return test.description.trim();
  const category = getCategoryLabel(test.round_type || '').replace(/ MCQ$/, '');
  if (test.company) {
    return `Practice ${category} questions tailored for ${test.company} placement preparation.`;
  }
  return `Sharpen your ${category} skills with timed multiple-choice questions.`;
}

export type MockTestCardProps = {
  test: {
    id: string;
    title: string;
    description?: string | null;
    round_type?: string;
    company?: string | null;
    target_role?: string | null;
    duration_minutes?: number;
    difficulty?: string;
    manual_question_ids?: string[];
    ai_question_count?: number;
  };
  starting?: boolean;
  onStart: (templateId: string) => void;
};

export function MockTestCard({ test, starting, onStart }: MockTestCardProps) {
  const roundType = test.round_type || '';
  const theme = getCategoryCardTheme(roundType);
  const Icon = CATEGORY_ICONS[roundType] ?? FileQuestion;
  const questionCount = getQuestionCount(test);
  const difficulty = capitalizeDifficulty(test.difficulty || 'medium');
  const companyLabel = test.company?.trim() || '\u00A0';

  return (
    <article
      className={cn(
        'relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300',
        theme.card,
        theme.cardHover,
      )}
    >
      {/* Header — fixed height */}
      <div className="flex h-7 shrink-0 items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
            theme.badge,
          )}
        >
          {getCategoryBadgeLabel(roundType)}
        </span>
        <span className={cn('inline-flex shrink-0 items-center gap-1 text-xs font-semibold', theme.statColor)}>
          <Signal className="h-3.5 w-3.5" />
          {difficulty}
        </span>
      </div>

      {/* Title block — fixed height so avatar row aligns across cards */}
      <div className="relative mt-4 flex h-[92px] shrink-0 gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold',
            theme.avatar,
          )}
        >
          {getCompanyInitial(test.company)}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pr-12">
          <h3 className="h-10 text-[15px] font-bold leading-5 text-gray-900 line-clamp-2 dark:text-white">
            {test.title}
          </h3>

          <p
            className={cn(
              'mt-0.5 flex h-4 items-center gap-1 text-xs text-gray-500 dark:text-gray-400',
              !test.company?.trim() && 'invisible',
            )}
            aria-hidden={!test.company?.trim()}
          >
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{companyLabel}</span>
          </p>

          <div className="mt-1.5 flex h-[22px] items-center">
            {test.target_role ? (
              <span className="inline-flex max-w-full truncate rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-brand-blue dark:bg-brand-blue/15 dark:text-brand-blue-light">
                {test.target_role}
              </span>
            ) : null}
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 top-0 flex h-14 w-14 items-center justify-center">
          <Icon className={cn('h-12 w-12', theme.faintIcon)} strokeWidth={1.5} />
        </div>
      </div>

      {/* Description — always two lines of space */}
      <p className="mt-3 h-8 shrink-0 text-xs leading-4 text-gray-500 line-clamp-2 dark:text-gray-400">
        {getCardDescription(test)}
      </p>

      {/* Footer pinned to bottom */}
      <div className="mt-auto shrink-0 pt-4">
        <div className="border-t border-gray-100 dark:border-gray-800" />

        <div className="mt-4 grid h-5 grid-cols-3 gap-1 text-[11px] text-gray-600 sm:text-xs dark:text-gray-400">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <FileQuestion className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
            <span className="truncate">{questionCount} Qs</span>
          </span>
          <span className="inline-flex min-w-0 items-center justify-center gap-1 truncate">
            <Clock className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
            <span className="truncate">{test.duration_minutes ?? 30} Min</span>
          </span>
          <span className="inline-flex min-w-0 items-center justify-end gap-1 truncate">
            <Signal className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
            <span className="truncate">{difficulty}</span>
          </span>
        </div>

        <Button
          type="button"
          variant="mockPrimary"
          className="mt-4 h-10 w-full gap-2 rounded-lg px-4 text-sm font-semibold"
          onClick={() => onStart(test.id)}
          disabled={starting}
        >
          <Play className="h-4 w-4 fill-current" />
          {starting ? 'Starting…' : 'Start Test'}
        </Button>
      </div>
    </article>
  );
}

/** Icons for category filter chips */
export const MOCK_TEST_FILTER_ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  technical_mcq: Code2,
  aptitude: Calculator,
  logical: Lightbulb,
  soft_skills: Users,
  verbal: MessageSquare,
};
