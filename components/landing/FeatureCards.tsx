'use client';

import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  UserPlus,
  Lock,
  MessageSquare,
  ClipboardCheck,
  Smartphone,
  FileText,
  Send,
  Code,
  PlayCircle,
  Building2,
  Shield,
  Brain,
  Cpu,
  Users,
  Compass,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type TranslationKey = keyof import('@/lib/i18n').TranslationKeys;
type AccentCorner = 'bl' | 'tl' | 'tr' | 'br';

interface Feature {
  id: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}

const ACCENT_COLORS = ['#E85D4C', '#FF541F', '#1E7BFF', '#098855'] as const;
const ACCENT_CORNERS: AccentCorner[] = ['bl', 'tl', 'tr', 'br'];

const FEATURES: Feature[] = [
  { id: 'aptitude', icon: Brain, titleKey: 'feature.aptitude.title', descriptionKey: 'feature.aptitude.description' },
  { id: 'technical', icon: Cpu, titleKey: 'feature.technical.title', descriptionKey: 'feature.technical.description' },
  { id: 'mock-interview', icon: Mic, titleKey: 'feature.mockInterview.title', descriptionKey: 'feature.mockInterview.description' },
  { id: 'gd', icon: Users, titleKey: 'feature.gd.title', descriptionKey: 'feature.gd.description' },
  { id: 'career-guidance', icon: Compass, titleKey: 'feature.careerGuidance.title', descriptionKey: 'feature.careerGuidance.description' },
  { id: 'dashboard', icon: LayoutDashboard, titleKey: 'feature.dashboard.title', descriptionKey: 'feature.dashboard.description' },
  { id: 'onboarding', icon: UserPlus, titleKey: 'feature.onboarding.title', descriptionKey: 'feature.onboarding.description' },
  { id: 'auth', icon: Lock, titleKey: 'feature.auth.title', descriptionKey: 'feature.auth.description' },
  { id: 'feedback', icon: MessageSquare, titleKey: 'feature.feedback.title', descriptionKey: 'feature.feedback.description' },
  { id: 'review', icon: ClipboardCheck, titleKey: 'feature.review.title', descriptionKey: 'feature.review.description' },
  { id: 'responsive', icon: Smartphone, titleKey: 'feature.responsive.title', descriptionKey: 'feature.responsive.description' },
  { id: 'ats', icon: FileText, titleKey: 'feature.ats.title', descriptionKey: 'feature.ats.description' },
  { id: 'automation', icon: Send, titleKey: 'feature.automation.title', descriptionKey: 'feature.automation.description' },
  { id: 'coding', icon: Code, titleKey: 'feature.coding.title', descriptionKey: 'feature.coding.description' },
  { id: 'playlist', icon: PlayCircle, titleKey: 'feature.playlist.title', descriptionKey: 'feature.playlist.description' },
  { id: 'college-dashboard', icon: Building2, titleKey: 'feature.collegeDashboard.title', descriptionKey: 'feature.collegeDashboard.description' },
  { id: 'admin-panel', icon: Shield, titleKey: 'feature.adminPanel.title', descriptionKey: 'feature.adminPanel.description' },
];

function CornerAccent({ color, corner }: { color: string; corner: AccentCorner }) {
  const cornerClass: Record<AccentCorner, string> = {
    bl: 'bottom-3 left-3 border-b-[3px] border-l-[3px] rounded-bl-[1.75rem]',
    tl: 'top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-[1.75rem]',
    tr: 'top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-[1.75rem]',
    br: 'bottom-3 right-3 border-b-[3px] border-r-[3px] rounded-br-[1.75rem]',
  };

  const endVertical: Record<AccentCorner, string> = {
    bl: 'bottom-[3.4rem] left-3 -translate-x-1/2',
    tl: 'top-[3.4rem] left-3 -translate-x-1/2',
    tr: 'top-[3.4rem] right-3 translate-x-1/2',
    br: 'bottom-[3.4rem] right-3 translate-x-1/2',
  };

  const endHorizontal: Record<AccentCorner, string> = {
    bl: 'bottom-3 left-[3.4rem] translate-y-1/2',
    tl: 'top-3 left-[3.4rem] -translate-y-1/2',
    tr: 'top-3 right-[3.4rem] -translate-y-1/2',
    br: 'bottom-3 right-[3.4rem] translate-y-1/2',
  };

  return (
    <>
      <div
        className={cn('pointer-events-none absolute h-14 w-14', cornerClass[corner])}
        style={{ borderColor: color }}
        aria-hidden
      />
      <span
        className={cn('pointer-events-none absolute h-2.5 w-2.5 rounded-full', endVertical[corner])}
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className={cn('pointer-events-none absolute h-2.5 w-2.5 rounded-full', endHorizontal[corner])}
        style={{ backgroundColor: color }}
        aria-hidden
      />
    </>
  );
}

export const FeatureCards = memo(function FeatureCards() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 300;

    if (direction === 'left') {
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } else {
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setCurrentIndex((prev) => Math.min(FEATURES.length - 1, prev + 1));
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const newIndex = Math.round(container.scrollLeft / 300);
      setCurrentIndex(Math.max(0, Math.min(FEATURES.length - 1, newIndex)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-hidden bg-white py-16 dark:bg-gray-950 sm:py-24 lg:scroll-mt-[76px] lg:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/10 blur-[110px] dark:bg-brand-blue/15" />

      <div className="relative z-10 mx-auto mb-12 w-[90%] max-w-[1400px] text-center sm:mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-4xl font-bold text-gray-800 dark:text-white sm:text-5xl lg:text-6xl"
        >
          Powerful <span className="text-orange-500">Features</span> to Help You Succeed
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300"
        >
          {t('features.subtitle')}
        </motion.p>
      </div>

      <div className="relative z-10 mx-auto w-full">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-5 overflow-x-auto scroll-smooth px-[5vw] pb-10 pt-2 sm:gap-6 sm:px-[8vw]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} t={t} />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => scroll('left')}
            type="button"
            disabled={currentIndex === 0}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full bg-[#FF541F] text-white shadow-md transition hover:bg-[#e04818]',
              currentIndex === 0 && 'opacity-50',
            )}
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            type="button"
            disabled={currentIndex >= FEATURES.length - 1}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:border-[#FF541F] hover:text-[#FF541F] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
              currentIndex >= FEATURES.length - 1 && 'opacity-50',
            )}
            aria-label="Next feature"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
});

interface FeatureCardProps {
  feature: Feature;
  index: number;
  t: (key: TranslationKey) => string;
}

function FeatureCard({ feature, index, t }: FeatureCardProps) {
  const title = t(feature.titleKey).replace(/[💬🎯🤖🧾💼]/gu, '').trim();
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const corner = ACCENT_CORNERS[index % ACCENT_CORNERS.length];
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="w-[240px] shrink-0 sm:w-[250px] md:w-[260px]"
      style={{ scrollSnapAlign: 'center' }}
    >
      <div
        className="relative flex min-h-[320px] flex-col items-center rounded-[2rem] border border-gray-200 bg-white px-6 py-8 text-center dark:border-gray-700 dark:bg-gray-900 sm:min-h-[340px] sm:rounded-[2.25rem] sm:px-7 sm:py-9"
        style={{
          boxShadow: `0 18px 40px -18px ${accent}55`,
        }}
      >
        <CornerAccent color={accent} corner={corner} />

        <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center text-gray-900 dark:text-white">
          <Icon className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <h3
          className="relative z-10 mb-4 text-sm font-bold uppercase tracking-[0.14em] sm:text-[15px]"
          style={{ color: accent }}
        >
          {title}
        </h3>

        <p className="relative z-10 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t(feature.descriptionKey)}
        </p>
      </div>
    </motion.div>
  );
}
