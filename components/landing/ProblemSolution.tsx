'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

type TranslationKey = keyof import('@/lib/i18n').TranslationKeys;

interface CompareItem {
  id: string;
  titleKey: TranslationKey;
  pointKeys: TranslationKey[];
}

const SOLUTIONS: CompareItem[] = [
  {
    id: 'ai-practice',
    titleKey: 'solution.aiPractice.title',
    pointKeys: [
      'solution.aiPractice.benefit1',
      'solution.aiPractice.benefit2',
      'solution.aiPractice.benefit3',
    ],
  },
  {
    id: 'instant-feedback',
    titleKey: 'solution.instantFeedback.title',
    pointKeys: [
      'solution.instantFeedback.benefit1',
      'solution.instantFeedback.benefit2',
      'solution.instantFeedback.benefit3',
    ],
  },
  {
    id: 'comprehensive',
    titleKey: 'solution.comprehensive.title',
    pointKeys: [
      'solution.comprehensive.benefit1',
      'solution.comprehensive.benefit2',
      'solution.comprehensive.benefit3',
    ],
  },
  {
    id: 'smart-prep',
    titleKey: 'solution.smartPrep.title',
    pointKeys: [
      'solution.smartPrep.benefit1',
      'solution.smartPrep.benefit2',
      'solution.smartPrep.benefit3',
    ],
  },
];

const PROBLEMS: CompareItem[] = [
  {
    id: 'unprepared',
    titleKey: 'problem.unprepared.title',
    pointKeys: [
      'problem.unprepared.point1',
      'problem.unprepared.point2',
      'problem.unprepared.point3',
    ],
  },
  {
    id: 'time',
    titleKey: 'problem.time.title',
    pointKeys: ['problem.time.point1', 'problem.time.point2', 'problem.time.point3'],
  },
  {
    id: 'feedback',
    titleKey: 'problem.feedback.title',
    pointKeys: [
      'problem.feedback.point1',
      'problem.feedback.point2',
      'problem.feedback.point3',
    ],
  },
  {
    id: 'outdated',
    titleKey: 'problem.outdated.title',
    pointKeys: [
      'problem.outdated.point1',
      'problem.outdated.point2',
      'problem.outdated.point3',
    ],
  },
];

export function ProblemSolution() {
  const { t } = useTranslation();

  return (
    <section
      id="problem-solution"
      className="relative overflow-hidden bg-white py-16 dark:bg-gray-950 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(9,136,85,0.06),transparent_45%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(9,136,85,0.12),transparent_45%)]" />

      <div className="relative z-10 mx-auto w-[92%] max-w-[1100px]">
        {/* Section Header */}
        <div className="mb-10 text-center sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl"
          >
            From Interview Anxiety to{' '}
            <span className="text-[#FF541F]">Interview Success</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-3xl text-base text-gray-600 dark:text-gray-300 sm:text-lg"
          >
            {t('problemSolution.subtitle')}
          </motion.p>
        </div>

        {/* Comparison stage */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="relative mx-auto"
        >
          {/* Person centered above the card — full clear view */}
          <div className="relative z-30 mx-auto -mb-10 flex w-full justify-center sm:-mb-12 md:-mb-14">
            <div className="relative h-[160px] w-[240px] sm:h-[200px] sm:w-[300px] md:h-[240px] md:w-[380px] lg:h-[260px] lg:w-[420px]">
              <Image
                src="/images/confused-image.png"
                alt="Student comparing problems and solutions"
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                sizes="(max-width: 640px) 240px, (max-width: 768px) 300px, 420px"
                priority={false}
              />
            </div>
          </div>

          {/* White comparison card */}
          <div className="relative z-10 overflow-visible rounded-2xl border border-gray-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_16px_50px_rgba(0,0,0,0.35)] sm:rounded-3xl">
            {/* VS badge — sits between column headers, below portrait */}
            <div className="absolute left-1/2 top-[4.75rem] z-20 hidden -translate-x-1/2 md:flex lg:top-[5.25rem]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-xs font-extrabold tracking-wide text-white shadow-lg ring-4 ring-white dark:bg-white dark:text-gray-900 dark:ring-gray-900">
                VS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left — Our Solutions */}
              <div className="border-b border-gray-100 p-5 pt-8 dark:border-gray-800 sm:p-7 sm:pt-10 md:border-b-0 md:border-r md:p-8 md:pt-12">
                <div className="mb-6 text-center md:mb-8">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">
                    Clear path forward
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-[1.75rem]">
                    {t('problemSolution.tabSolutions')}
                  </h3>
                </div>

                <ul className="space-y-5">
                  {SOLUTIONS.map((item, index) => (
                    <CompareRow
                      key={item.id}
                      item={item}
                      index={index}
                      tone="solution"
                      t={t}
                    />
                  ))}
                </ul>
              </div>

              {/* Mobile VS */}
              <div className="flex items-center justify-center border-b border-gray-100 py-3 md:hidden dark:border-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-xs font-extrabold text-white dark:bg-white dark:text-gray-900">
                  VS
                </div>
              </div>

              {/* Right — Common Problems */}
              <div className="p-5 pt-8 sm:p-7 sm:pt-10 md:p-8 md:pt-12">
                <div className="mb-6 text-center md:mb-8">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#FF541F]">
                    What holds students back
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-[1.75rem]">
                    {t('problemSolution.tabProblems')}
                  </h3>
                </div>

                <ul className="space-y-5">
                  {PROBLEMS.map((item, index) => (
                    <CompareRow
                      key={item.id}
                      item={item}
                      index={index}
                      tone="problem"
                      t={t}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CompareRow({
  item,
  index,
  tone,
  t,
}: {
  item: CompareItem;
  index: number;
  tone: 'solution' | 'problem';
  t: (key: TranslationKey) => string;
}) {
  const isSolution = tone === 'solution';

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cn(
        'rounded-xl border px-4 py-3.5',
        isSolution
          ? 'border-brand-green/15 bg-brand-green/[0.04] dark:border-brand-green/20 dark:bg-brand-green/10'
          : 'border-[#FF541F]/15 bg-[#FF541F]/[0.04] dark:border-[#FF541F]/20 dark:bg-[#FF541F]/10',
      )}
    >
      <div className="mb-2.5 flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            isSolution ? 'bg-brand-green text-white' : 'bg-[#FF541F] text-white',
          )}
        >
          {isSolution ? (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </span>
        <h4 className="text-[15px] font-bold leading-snug text-gray-900 dark:text-white">
          {t(item.titleKey)}
        </h4>
      </div>

      <ul className="space-y-1.5 pl-7">
        {item.pointKeys.map((pointKey) => (
          <li
            key={pointKey}
            className="flex items-start gap-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
          >
            <span
              className={cn(
                'mt-[7px] h-1 w-1 shrink-0 rounded-full',
                isSolution ? 'bg-brand-green' : 'bg-[#FF541F]',
              )}
            />
            <span>{t(pointKey)}</span>
          </li>
        ))}
      </ul>
    </motion.li>
  );
}
