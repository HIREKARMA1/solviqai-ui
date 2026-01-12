'use client';

import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mic,
  Monitor,
  DollarSign,
  Circle,
  Square,
  TrendingUp,
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
  LayoutDashboard
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  icon: React.ReactNode;
  titleKey: keyof import('@/lib/i18n').TranslationKeys;
  descriptionKey: keyof import('@/lib/i18n').TranslationKeys;
  gradient: string;
}

// Move features array outside component to prevent recreation on each render
const FEATURES: Feature[] = [
  {
    id: 'aptitude',
    icon: <Brain className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.aptitude.title',
    descriptionKey: 'feature.aptitude.description',
    gradient: 'from-pink-100 to-rose-200',
  },
  {
    id: 'technical',
    icon: <Cpu className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.technical.title',
    descriptionKey: 'feature.technical.description',
    gradient: 'from-sky-200 to-blue-300',
  },
  {
    id: 'mock-interview',
    icon: (
      <div className="relative">
        <Mic className="w-8 h-8" strokeWidth={2} />
        <Circle className="w-3 h-3 absolute top-1 left-1/2 transform -translate-x-1/2 fill-white" />
      </div>
    ),
    titleKey: 'feature.mockInterview.title',
    descriptionKey: 'feature.mockInterview.description',
    gradient: 'from-orange-100 to-amber-200',
  },
  {
    id: 'gd',
    icon: <Users className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.gd.title',
    descriptionKey: 'feature.gd.description',
    gradient: 'from-indigo-100 to-purple-200',
  },
  {
    id: 'career-guidance',
    icon: <Compass className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.careerGuidance.title',
    descriptionKey: 'feature.careerGuidance.description',
    gradient: 'from-emerald-100 to-teal-200',
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.dashboard.title',
    descriptionKey: 'feature.dashboard.description',
    gradient: 'from-blue-100 to-indigo-200',
  },
  {
    id: 'onboarding',
    icon: <UserPlus className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.onboarding.title',
    descriptionKey: 'feature.onboarding.description',
    gradient: 'from-rose-100 to-pink-200',
  },
  {
    id: 'auth',
    icon: <Lock className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.auth.title',
    descriptionKey: 'feature.auth.description',
    gradient: 'from-slate-100 to-gray-200',
  },
  {
    id: 'feedback',
    icon: <MessageSquare className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.feedback.title',
    descriptionKey: 'feature.feedback.description',
    gradient: 'from-yellow-100 to-orange-200',
  },
  {
    id: 'review',
    icon: <ClipboardCheck className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.review.title',
    descriptionKey: 'feature.review.description',
    gradient: 'from-green-100 to-emerald-200',
  },
  {
    id: 'responsive',
    icon: <Smartphone className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.responsive.title',
    descriptionKey: 'feature.responsive.description',
    gradient: 'from-cyan-100 to-sky-200',
  },
  {
    id: 'ats',
    icon: <FileText className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.ats.title',
    descriptionKey: 'feature.ats.description',
    gradient: 'from-violet-100 to-purple-200',
  },
  {
    id: 'automation',
    icon: <Send className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.automation.title',
    descriptionKey: 'feature.automation.description',
    gradient: 'from-fuchsia-100 to-pink-200',
  },
  {
    id: 'coding',
    icon: <Code className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.coding.title',
    descriptionKey: 'feature.coding.description',
    gradient: 'from-indigo-100 to-blue-200',
  },
  {
    id: 'playlist',
    icon: <PlayCircle className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.playlist.title',
    descriptionKey: 'feature.playlist.description',
    gradient: 'from-red-100 to-orange-200',
  },
  {
    id: 'college-dashboard',
    icon: <Building2 className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.collegeDashboard.title',
    descriptionKey: 'feature.collegeDashboard.description',
    gradient: 'from-teal-100 to-green-200',
  },
  {
    id: 'admin-panel',
    icon: <Shield className="w-8 h-8" strokeWidth={2} />,
    titleKey: 'feature.adminPanel.title',
    descriptionKey: 'feature.adminPanel.description',
    gradient: 'from-gray-100 to-slate-200',
  },
];

export const FeatureCards = memo(function FeatureCards() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    // Scroll amount for wider cards
    const scrollAmount = 470; // 450px width + 20px gap

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setCurrentIndex(prev => Math.min(FEATURES.length - 1, prev + 1));
    }
  }, []);

  // Update current index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = 470; // 450px + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.max(0, Math.min(FEATURES.length - 1, newIndex)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="features" className="section-container bg-white dark:bg-[#2B354B] relative overflow-hidden py-24 lg:py-32 min-h-screen flex flex-col justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="text-center mb-12 relative z-10 w-[90%] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-gray-800 dark:text-white"
        >
          Powerful <span className="text-orange-500">Features</span> to Help You Succeed
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
        >
          {t('features.subtitle')}
        </motion.p>
      </div>

      <div className="relative w-full mx-auto px-4 z-10">
        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-8 px-[5vw] sm:px-[10vw]"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              t={t}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => scroll('left')}
            type="button"
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-md",
            )}
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            type="button"
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 shadow-sm"
            )}
            aria-label="Next feature"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
});

interface FeatureCardProps {
  feature: Feature;
  index: number;
  t: (key: keyof import('@/lib/i18n').TranslationKeys) => string;
}

function FeatureCard({ feature, index, t }: FeatureCardProps) {
  // Remove emojis from title
  const title = t(feature.titleKey).replace(/[💬🎯🤖🧾💼]/g, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex-shrink-0 w-[320px] sm:w-[380px] md:w-[450px]"
      style={{ scrollSnapAlign: 'center' }}
    >
      <div className={cn(
        "relative rounded-2xl p-8 h-full bg-gradient-to-b flex flex-col items-center justify-center min-h-[320px]",
        feature.gradient,
        "dark:from-purple-900/30 dark:to-orange-900/30"
      )}>
        {/* Icon Container */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg border-2 border-white/20">
            <div className="text-white">
              {feature.icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-center font-medium">
          {t(feature.descriptionKey)}
        </p>
      </div>
    </motion.div>
  );
}

