'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Clock,
    Target,
    Brain,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface Problem {
    id: string;
    icon: React.ReactNode;
    titleKey: keyof import('@/lib/i18n').TranslationKeys;
    descriptionKey: keyof import('@/lib/i18n').TranslationKeys;
    pointKeys: (keyof import('@/lib/i18n').TranslationKeys)[];
}

interface Solution {
    id: string;
    icon: React.ReactNode;
    titleKey: keyof import('@/lib/i18n').TranslationKeys;
    descriptionKey: keyof import('@/lib/i18n').TranslationKeys;
    benefitKeys: (keyof import('@/lib/i18n').TranslationKeys)[];
}

export function ProblemSolution() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'problems' | 'solutions'>('problems');

    const problems: Problem[] = [
        {
            id: 'unprepared',
            icon: <AlertCircle className="w-6 h-6" />,
            titleKey: 'problem.unprepared.title',
            descriptionKey: 'problem.unprepared.description',
            pointKeys: [
                'problem.unprepared.point1',
                'problem.unprepared.point2',
                'problem.unprepared.point3',
                'problem.unprepared.point4'
            ]
        },
        {
            id: 'time',
            icon: <Clock className="w-6 h-6" />,
            titleKey: 'problem.time.title',
            descriptionKey: 'problem.time.description',
            pointKeys: [
                'problem.time.point1',
                'problem.time.point2',
                'problem.time.point3',
                'problem.time.point4'
            ]
        },
        {
            id: 'feedback',
            icon: <Target className="w-6 h-6" />,
            titleKey: 'problem.feedback.title',
            descriptionKey: 'problem.feedback.description',
            pointKeys: [
                'problem.feedback.point1',
                'problem.feedback.point2',
                'problem.feedback.point3',
                'problem.feedback.point4'
            ]
        },
        {
            id: 'outdated',
            icon: <TrendingUp className="w-6 h-6" />,
            titleKey: 'problem.outdated.title',
            descriptionKey: 'problem.outdated.description',
            pointKeys: [
                'problem.outdated.point1',
                'problem.outdated.point2',
                'problem.outdated.point3',
                'problem.outdated.point4'
            ]
        }
    ];

    const solutions: Solution[] = [
        {
            id: 'ai-practice',
            icon: <Brain className="w-6 h-6" />,
            titleKey: 'solution.aiPractice.title',
            descriptionKey: 'solution.aiPractice.description',
            benefitKeys: [
                'solution.aiPractice.benefit1',
                'solution.aiPractice.benefit2',
                'solution.aiPractice.benefit3',
                'solution.aiPractice.benefit4'
            ]
        },
        {
            id: 'instant-feedback',
            icon: <CheckCircle2 className="w-6 h-6" />,
            titleKey: 'solution.instantFeedback.title',
            descriptionKey: 'solution.instantFeedback.description',
            benefitKeys: [
                'solution.instantFeedback.benefit1',
                'solution.instantFeedback.benefit2',
                'solution.instantFeedback.benefit3',
                'solution.instantFeedback.benefit4'
            ]
        },
        {
            id: 'comprehensive',
            icon: <Target className="w-6 h-6" />,
            titleKey: 'solution.comprehensive.title',
            descriptionKey: 'solution.comprehensive.description',
            benefitKeys: [
                'solution.comprehensive.benefit1',
                'solution.comprehensive.benefit2',
                'solution.comprehensive.benefit3',
                'solution.comprehensive.benefit4'
            ]
        },
        {
            id: 'smart-prep',
            icon: <Sparkles className="w-6 h-6" />,
            titleKey: 'solution.smartPrep.title',
            descriptionKey: 'solution.smartPrep.description',
            benefitKeys: [
                'solution.smartPrep.benefit1',
                'solution.smartPrep.benefit2',
                'solution.smartPrep.benefit3',
                'solution.smartPrep.benefit4'
            ]
        }
    ];

    return (
        <section id="problem-solution" className="section-container relative overflow-hidden bg-[#ffffff] dark:bg-[#004F5F]">
            <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#000000] dark:text-[#D5D5D5]"
                    >
                        From Interview Anxiety to Interview Success
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg text-[#1B1B1B] dark:text-[#FFFFFF] max-w-3xl mx-auto"
                    >
                        {t('problemSolution.subtitle')}
                    </motion.p>
                </div>

                {/* Tab Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex justify-center mb-12"
                >
                    <div className="inline-flex p-1 rounded-full border border-gray-300 bg-white dark:border-white/30 dark:bg-transparent">
                        <button
                            onClick={() => setActiveTab('problems')}
                            className={cn(
                                'px-8 py-3 rounded-full text-base font-semibold transition-all duration-300',
                                activeTab === 'problems'
                                    ? 'shadow-md bg-[#FF541F] text-white dark:bg-[#FF541F] dark:text-white dark:shadow-[0_0_20px_rgba(255,84,31,0.4)]'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white/80'
                            )}
                        >
                            {t('problemSolution.tabProblems')}
                        </button>
                        <button
                            onClick={() => setActiveTab('solutions')}
                            className={cn(
                                'px-8 py-3 rounded-full text-base font-semibold transition-all duration-300',
                                activeTab === 'solutions'
                                    ? 'shadow-md bg-[#1E7BFF] text-white dark:bg-[#FF541F] dark:text-white dark:shadow-[0_0_20px_rgba(255,84,31,0.4)]'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white/80'
                            )}
                        >
                            {t('problemSolution.tabSolutions')}
                        </button>
                    </div>
                </motion.div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
                    {activeTab === 'problems' ? (
                        <>
                            {problems.map((problem, index) => (
                                <ProblemCard key={problem.id} problem={problem} index={index} />
                            ))}
                        </>
                    ) : (
                        <>
                            {solutions.map((solution, index) => (
                                <SolutionCard key={solution.id} solution={solution} index={index} />
                            ))}
                        </>
                    )}
                </div>

            </div>
        </section>
    );
}

interface ProblemCardProps {
    problem: Problem;
    index: number;
}

function ProblemCard({ problem, index }: ProblemCardProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group"
        >
            <div className="bg-white dark:bg-[#00394A] rounded-2xl p-6 h-full transition-all duration-300 border border-[#1E7BFF]/30 dark:border-[#114A9A]/30 shadow-[0_4px_4px_0_rgba(255,84,31,0.25)]">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-[21.5px] h-[21.5px] mt-1 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-[#FC5420]">
                        {React.cloneElement(problem.icon as React.ReactElement, { size: 21.5, strokeWidth: 2 })}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t(problem.titleKey)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {t(problem.descriptionKey)}
                        </p>
                    </div>
                </div>

                {/* Pain Points */}
                <ul className="space-y-2">
                    {problem.pointKeys.map((pointKey, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <X className="w-4 h-4 text-[#FC5420] flex-shrink-0 mt-0.5" />
                            <span>{t(pointKey)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}

interface SolutionCardProps {
    solution: Solution;
    index: number;
}

function SolutionCard({ solution, index }: SolutionCardProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group"
        >
            <div className="bg-white dark:bg-[#00394A] rounded-2xl p-6 h-full transition-all duration-300 border border-[#0F428A]/30 dark:border-[#0F428A]/30 shadow-[0_4px_4px_0_rgba(30,123,255,0.25)]">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-[27.6px] h-[27.6px] mt-1 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-[#00B94B]">
                        {React.cloneElement(solution.icon as React.ReactElement, { size: 27.6, strokeWidth: 2 })}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t(solution.titleKey)}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {t(solution.descriptionKey)}
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-2">
                    {solution.benefitKeys.map((benefitKey, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-[#00B94B] flex-shrink-0 mt-0.5" />
                            <span>{t(benefitKey)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
}
