'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  TrendingUp
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

export function FeatureCards() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const features: Feature[] = [
    {
      id: 'job-hunter',
      icon: (
        <div className="relative">
          <Briefcase className="w-8 h-8" strokeWidth={2} />
          <DollarSign className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={2.5} />
        </div>
      ),
      titleKey: 'feature.jobHunter.title',
      descriptionKey: 'feature.jobHunter.description',
      gradient: 'from-purple-200 to-orange-200',
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
      gradient: 'from-orange-200 to-purple-200',
    },
    {
      id: 'copilot',
      icon: (
        <div className="relative">
          <Monitor className="w-8 h-8" strokeWidth={2} />
          <Square className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={2.5} />
        </div>
      ),
      titleKey: 'feature.assessment.title',
      descriptionKey: 'feature.assessment.description',
      gradient: 'from-purple-200 to-orange-200',
    },
    {
      id: 'analytics',
      icon: <TrendingUp className="w-8 h-8" strokeWidth={2} />,
      titleKey: 'feature.analytics.title',
      descriptionKey: 'feature.analytics.description',
      gradient: 'from-orange-200 to-purple-200',
    },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    // Calculate card width including gap (22% + gap)
    const cardWidth = container.offsetWidth * 0.22 + 24; // 22% width + 24px gap (gap-6)
    const scrollAmount = cardWidth * 1.2; // Scroll 1.2 cards
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setCurrentIndex(Math.max(0, currentIndex - 1));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setCurrentIndex(Math.min(features.length - 1, currentIndex + 1));
    }
  };

  // Update current index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      // Calculate card width including gap (22% + gap)
      const cardWidth = container.offsetWidth * 0.22 + 24; // 22% width + 24px gap (gap-6)
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.max(0, Math.min(features.length - 1, newIndex)));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [features.length]);

  return (
    <section id="features" className="section-container bg-white dark:bg-gray-900 relative overflow-hidden py-16">
      <div className="text-center mb-12 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-800 dark:text-white"
        >
          Powerful <span className="text-orange-500">Features</span> to Help You Succeed
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          {t('features.subtitle')}
        </motion.p>
      </div>

      <div className="relative w-[90vw] mx-auto px-4">
        {/* Cards Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              t={t}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => scroll('left')}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              currentIndex === 0
                ? "bg-orange-500 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500"
            )}
            aria-label="Previous feature"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              "bg-white border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500"
            )}
            aria-label="Next feature"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

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
      className="flex-shrink-0 w-[22%] min-w-[280px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className={cn(
        "relative rounded-2xl p-8 h-full bg-gradient-to-r",
        feature.gradient,
        "dark:from-purple-900/30 dark:to-orange-900/30"
      )}>
        {/* Icon Container */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
            <div className="text-white">
              {feature.icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white text-center">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-center">
          {t(feature.descriptionKey)}
        </p>
      </div>
    </motion.div>
  );
}

