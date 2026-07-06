import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  Code2,
  FileText,
  Heart,
  MessageCircle,
  Mic,
  PieChart,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';

export type StageTheme = {
  icon: LucideIcon;
  label: string;
  iconBg: string;
  iconColor: string;
};

export const STAGE_THEMES: Record<string, StageTheme> = {
  aptitude: {
    icon: PieChart,
    label: 'Aptitude',
    iconBg: 'bg-orange-100 dark:bg-orange-950/40',
    iconColor: 'text-orange-500',
  },
  technical_mcq: {
    icon: Code2,
    label: 'Tech MCQ',
    iconBg: 'bg-blue-100 dark:bg-blue-950/40',
    iconColor: 'text-brand-blue',
  },
  coding: {
    icon: Terminal,
    label: 'Coding',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-brand-green',
  },
  short_answer: {
    icon: FileText,
    label: 'Short Ans',
    iconBg: 'bg-sky-100 dark:bg-sky-950/40',
    iconColor: 'text-sky-600',
  },
  essay: {
    icon: FileText,
    label: 'Essay',
    iconBg: 'bg-sky-100 dark:bg-sky-950/40',
    iconColor: 'text-sky-600',
  },
  prompt_engineering: {
    icon: Sparkles,
    label: 'Prompt',
    iconBg: 'bg-violet-100 dark:bg-violet-950/40',
    iconColor: 'text-violet-600',
  },
  technical_interview: {
    icon: Mic,
    label: 'Tech Int.',
    iconBg: 'bg-purple-100 dark:bg-purple-950/40',
    iconColor: 'text-purple-600',
  },
  hr_interview: {
    icon: Users,
    label: 'HR Int.',
    iconBg: 'bg-teal-100 dark:bg-teal-950/40',
    iconColor: 'text-teal-600',
  },
  culture_fit: {
    icon: Heart,
    label: 'Culture',
    iconBg: 'bg-pink-100 dark:bg-pink-950/40',
    iconColor: 'text-pink-600',
  },
  soft_skills: {
    icon: MessageCircle,
    label: 'Soft Skills',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    iconColor: 'text-brand-green',
  },
  group_discussion: {
    icon: Users,
    label: 'GD',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600',
  },
  gd_playground: {
    icon: Users,
    label: 'GD',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600',
  },
  case_study: {
    icon: Brain,
    label: 'Case Study',
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-600',
  },
};

export const DEFAULT_STAGE_THEME: StageTheme = {
  icon: Brain,
  label: 'Stage',
  iconBg: 'bg-gray-100 dark:bg-gray-800',
  iconColor: 'text-gray-500',
};

export function getStageTheme(stageType: string): StageTheme {
  return STAGE_THEMES[stageType] ?? {
    ...DEFAULT_STAGE_THEME,
    label: stageType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export function sumStageDurationSeconds(
  stages: Array<{ duration_seconds?: number }> = [],
): number {
  return stages.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
}

export function formatTotalDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) return `~${hours}h ${mins}m total`;
  if (hours > 0) return `~${hours} Hour${hours > 1 ? 's' : ''} total`;
  return `~${mins} Min total`;
}

const COMPANY_AVATAR_PALETTE = [
  'bg-brand-blue text-white',
  'bg-brand-green text-white',
  'bg-purple-600 text-white',
  'bg-orange-500 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
] as const;

export function getCompanyInitial(company?: string | null): string {
  const trimmed = company?.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function getCompanyAvatarClass(company?: string | null): string {
  const key = (company || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997;
  return COMPANY_AVATAR_PALETTE[hash % COMPANY_AVATAR_PALETTE.length];
}
