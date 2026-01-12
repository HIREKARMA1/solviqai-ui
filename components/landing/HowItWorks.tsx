'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  titleKey: keyof import('@/lib/i18n').TranslationKeys;
  descriptionKey: keyof import('@/lib/i18n').TranslationKeys;
}

export function HowItWorks() {
  const { t } = useTranslation();

  const steps: Step[] = [
    {
      number: 1,
      titleKey: 'howItWorks.step1.title',
      descriptionKey: 'howItWorks.step1.description',
    },
    {
      number: 2,
      titleKey: 'howItWorks.step2.title',
      descriptionKey: 'howItWorks.step2.description',
    },
    {
      number: 3,
      titleKey: 'howItWorks.step3.title',
      descriptionKey: 'howItWorks.step3.description',
    },
    {
      number: 4,
      titleKey: 'howItWorks.step4.title',
      descriptionKey: 'howItWorks.step4.description',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-16 bg-[#6c6e9a] dark:bg-[#310139] lg:py-32"
    >
      <div className="w-[90vw] mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
          >
            <span className="text-white">How </span>
            <span className="text-[#FF541F]">Solviq</span>
            <span className="text-white">.AI Works</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white"
          >
            {t('howItWorks.subtitle')}
          </motion.p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Desktop View - Horizontal Layout */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-4 gap-6 relative">
              {steps.map((step, index) => (
                <StepCard
                  key={step.number}
                  step={step}
                  index={index}
                  t={t}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>


          </div>

          {/* Mobile/Tablet View - Vertical Layout */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <StepCard
                  step={step}
                  index={index}
                  t={t}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                />
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex justify-center"
                  >
                    <ArrowRight className="w-6 h-6 text-[#FF541F] transform rotate-90" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface StepCardProps {
  step: Step;
  index: number;
  t: (key: keyof import('@/lib/i18n').TranslationKeys) => string;
  isFirst: boolean;
  isLast: boolean;
}

function StepCard({ step, index, t, isFirst, isLast }: StepCardProps) {
  // Remove emojis from title
  const title = t(step.titleKey).replace(/[🧾🎯📊🚀]/g, '').trim();
  const description = t(step.descriptionKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative flex flex-col h-full pb-12"
    >
      {/* Vertical white bar on left (first) or right (last) */}
      {(isFirst || isLast) && (
        <div
          className={cn(
            "absolute top-0 bottom-8 w-1 bg-white",
            isFirst ? "left-0" : "right-0"
          )}
        />
      )}

      {/* Step Content */}
      <div className="px-6 py-8 flex flex-col h-full">
        {/* Step Number */}
        <div className="mb-6">
          <span className="text-5xl font-bold text-[#EFEFEF]">
            {String(step.number).padStart(2, '0')}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-4 text-white">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#CDCDCD] leading-relaxed">
          {description}
        </p>
      </div>

    </motion.div>
  );
}

