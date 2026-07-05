'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCategoryBadgeLabel,
  getCategoryCardTheme,
  getCategoryLabel,
} from '@/lib/mockTestCategories';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Clock,
  Code2,
  FileQuestion,
  MessageCircle,
  PieChart,
  Play,
  Puzzle,
  Signal,
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

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-300',
        theme.card,
        theme.cardHover,
      )}
    >
      <span
        className={cn(
          'inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
          theme.badge,
        )}
      >
        {getCategoryBadgeLabel(roundType)}
      </span>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold leading-snug text-gray-900 line-clamp-2 dark:text-white">
            {test.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2 dark:text-gray-400">
            {getCardDescription(test)}
          </p>
        </div>
        <div
          className={cn(
            'flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl',
            theme.iconBox,
          )}
        >
          <Icon className={cn('h-9 w-9', theme.iconColor)} strokeWidth={1.75} />
        </div>
      </div>

      <div className="my-4 border-t border-gray-100 dark:border-gray-800" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <FileQuestion className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
          {questionCount} Questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
          {test.duration_minutes ?? 30} Min
        </span>
        <span className="inline-flex items-center gap-1.5 capitalize">
          <Signal className={cn('h-3.5 w-3.5 shrink-0', theme.statColor)} />
          {capitalizeDifficulty(test.difficulty || 'medium')} Difficulty
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
    </article>
  );
}
