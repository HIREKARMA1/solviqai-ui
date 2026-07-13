/** Finalized mock test category IDs — keep in sync with backend MOCK_TEST_CATEGORY_IDS */

export const POPULAR_CATEGORIES = [
  { id: 'all', label: 'All Tests' },
  { id: 'technical_mcq', label: 'Technical MCQ' },
  { id: 'aptitude', label: 'Aptitude MCQ' },
  { id: 'logical', label: 'Logical Reasoning MCQ' },
  { id: 'soft_skills', label: 'HR & Soft Skills MCQ' },
  { id: 'verbal', label: 'Verbal Ability MCQ' },
] as const;

export type MockTestCategoryId = (typeof POPULAR_CATEGORIES)[number]['id'];

export const MOCK_TEST_CATEGORY_IDS = POPULAR_CATEGORIES.filter((c) => c.id !== 'all').map(
  (c) => c.id,
);

export const CATEGORY_STYLES: Record<string, string> = {
  technical_mcq: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300',
  aptitude: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-300',
  soft_skills: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300',
  logical: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300',
  verbal: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-300',
};

/** Uppercase badge labels for mock test cards */
export const CATEGORY_BADGE_LABELS: Record<string, string> = {
  technical_mcq: 'TECHNICAL',
  aptitude: 'APTITUDE',
  soft_skills: 'SOFT SKILLS',
  logical: 'LOGICAL',
  verbal: 'VERBAL',
};

export type CategoryCardTheme = {
  badge: string;
  iconBox: string;
  iconColor: string;
  statColor: string;
  avatar: string;
  card: string;
  cardHover: string;
  faintIcon: string;
};

export const CATEGORY_CARD_THEMES: Record<string, CategoryCardTheme> = {
  technical_mcq: {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    iconBox: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-brand-blue dark:text-brand-blue-light',
    statColor: 'text-brand-blue dark:text-brand-blue-light',
    avatar: 'bg-brand-blue text-white',
    faintIcon: 'text-brand-blue/15 dark:text-brand-blue/20',
    card: 'border-blue-100/80 bg-white dark:border-blue-950/40 dark:bg-gray-900',
    cardHover:
      'hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(27,82,164,0.1)] dark:hover:border-blue-500/30',
  },
  aptitude: {
    badge: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300',
    iconBox: 'bg-orange-50 dark:bg-orange-950/30',
    iconColor: 'text-orange-500 dark:text-orange-400',
    statColor: 'text-orange-500 dark:text-orange-400',
    avatar: 'bg-orange-500 text-white',
    faintIcon: 'text-orange-500/15 dark:text-orange-400/20',
    card: 'border-orange-100/80 bg-white dark:border-orange-950/40 dark:bg-gray-900',
    cardHover:
      'hover:border-orange-200 hover:shadow-[0_8px_24px_rgba(245,128,32,0.1)] dark:hover:border-orange-500/30',
  },
  soft_skills: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    iconBox: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-brand-green dark:text-brand-green-light',
    statColor: 'text-brand-green dark:text-brand-green-light',
    avatar: 'bg-brand-green text-white',
    faintIcon: 'text-brand-green/15 dark:text-brand-green/20',
    card: 'border-emerald-100/80 bg-white dark:border-emerald-950/40 dark:bg-gray-900',
    cardHover:
      'hover:border-emerald-200 hover:shadow-[0_8px_24px_rgba(9,136,85,0.1)] dark:hover:border-emerald-500/30',
  },
  logical: {
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    iconBox: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    statColor: 'text-purple-600 dark:text-purple-400',
    avatar: 'bg-purple-600 text-white',
    faintIcon: 'text-purple-600/15 dark:text-purple-400/20',
    card: 'border-purple-100/80 bg-white dark:border-purple-950/40 dark:bg-gray-900',
    cardHover:
      'hover:border-purple-200 hover:shadow-[0_8px_24px_rgba(124,58,237,0.1)] dark:hover:border-purple-500/30',
  },
  verbal: {
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    iconBox: 'bg-sky-50 dark:bg-sky-950/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    statColor: 'text-sky-600 dark:text-sky-400',
    avatar: 'bg-sky-600 text-white',
    faintIcon: 'text-sky-600/15 dark:text-sky-400/20',
    card: 'border-sky-100/80 bg-white dark:border-sky-950/40 dark:bg-gray-900',
    cardHover:
      'hover:border-sky-200 hover:shadow-[0_8px_24px_rgba(14,165,233,0.1)] dark:hover:border-sky-500/30',
  },
};

export const DEFAULT_CARD_THEME: CategoryCardTheme = {
  badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  iconBox: 'bg-gray-50 dark:bg-gray-800',
  iconColor: 'text-gray-500 dark:text-gray-400',
  statColor: 'text-gray-500 dark:text-gray-400',
  avatar: 'bg-gray-500 text-white',
  faintIcon: 'text-gray-400/20',
  card: 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900',
  cardHover: 'hover:border-gray-200 hover:shadow-md',
};

export function getCompanyInitial(company?: string | null): string {
  const trimmed = company?.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function getCategoryCardTheme(roundType: string): CategoryCardTheme {
  return CATEGORY_CARD_THEMES[roundType] ?? DEFAULT_CARD_THEME;
}

export function getCategoryBadgeLabel(roundType: string): string {
  return CATEGORY_BADGE_LABELS[roundType] ?? roundType.replace(/_/g, ' ').toUpperCase();
}

export function formatCategoryLabel(roundType: string): string {
  const labels: Record<string, string> = {
    technical_mcq: 'technical',
    aptitude: 'aptitude',
    soft_skills: 'soft-skills',
    logical: 'logical',
    verbal: 'verbal',
  };
  return labels[roundType] || roundType.replace(/_/g, '-').toLowerCase();
}

export function getCategoryLabel(roundType: string): string {
  return POPULAR_CATEGORIES.find((c) => c.id === roundType)?.label ?? roundType;
}
