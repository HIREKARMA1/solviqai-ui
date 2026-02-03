'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart3, Code, Mic, Wrench, Users } from 'lucide-react';
import AssessmentSkillsPractice from './practice/AssessmentSkillsPractice';
import TechnicalSkillsPractice from './practice/TechnicalSkillsPractice';
import InterviewPractice from './practice/InterviewPractice';
import PracticalSkillsBranchSelection from './practice/PracticalSkillsBranchSelection';
import PracticeGroupDiscussion from './practice/PracticeGroupDiscussion';

interface Category {
    id: string;
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    bgGradient: string;
    borderColor: string;
    hoverBorder: string;
    textColor: string;
    iconGradient: string;
    component: React.ComponentType<{ isFreeUser?: boolean }>;
    fullWidth?: boolean;
}

interface PracticeQuestionsProps {
    // Notify parent when the user has entered or exited an active practice mode
    onPracticeModeChange?: (inPractice: boolean) => void;
    // New prop for subscription gating
    isFreeUser?: boolean;
}

export default function PracticeQuestions({ onPracticeModeChange, isFreeUser = false }: PracticeQuestionsProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        // Check initial theme
        setIsDark(document.documentElement.classList.contains('dark'));

        // Watch for theme changes
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    // Inform parent whenever we enter/exit a specific practice category
    useEffect(() => {
        if (onPracticeModeChange) {
            onPracticeModeChange(Boolean(selectedCategory));
        }
    }, [selectedCategory, onPracticeModeChange]);

    const categories: Category[] = [
        {
            id: 'assessment',
            number: '1',
            title: 'Assessment Skills',
            description: 'Aptitude & soft-skill practice',
            icon: <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-blue-500 to-blue-600',
            iconGradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100/50',
            borderColor: 'border-blue-200',
            hoverBorder: 'hover:border-blue-400',
            textColor: 'text-blue-700',
            component: AssessmentSkillsPractice,
        },
        {
            id: 'technical',
            number: '2',
            title: 'Technical Skills',
            description: 'Backend, Frontend, DevOps & more',
            icon: <Code className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-cyan-500 to-blue-500',
            iconGradient: 'from-cyan-500 to-blue-500',
            bgGradient: 'from-cyan-50 to-blue-50',
            borderColor: 'border-cyan-200',
            hoverBorder: 'hover:border-cyan-400',
            textColor: 'text-cyan-700',
            component: TechnicalSkillsPractice,
        },
        {
            id: 'interview',
            number: '3',
            title: 'Interview Skills',
            description: 'Mock interview practice',
            icon: <Mic className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-indigo-500 to-blue-600',
            iconGradient: 'from-indigo-500 to-blue-600',
            bgGradient: 'from-indigo-50 to-blue-50',
            borderColor: 'border-indigo-200',
            hoverBorder: 'hover:border-indigo-400',
            textColor: 'text-indigo-700',
            component: InterviewPractice,
        },
        {
            id: 'practical',
            number: '4',
            title: 'Practical Skills',
            description: 'Branchwise practical skill test',
            icon: <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-sky-500 to-blue-500',
            iconGradient: 'from-sky-500 to-blue-500',
            bgGradient: 'from-sky-50 to-blue-50',
            borderColor: 'border-sky-200',
            hoverBorder: 'hover:border-sky-400',
            textColor: 'text-sky-700',
            component: PracticalSkillsBranchSelection,
        },
        {
            id: 'gd',
            number: '5',
            title: 'Realtime Group Discussion',
            description: 'Voice-based GD simulation with AI participants and instant analytics',
            icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-blue-600 to-indigo-600',
            iconGradient: 'from-blue-600 to-indigo-600',
            bgGradient: 'from-blue-50 via-indigo-50 to-blue-50',
            borderColor: 'border-blue-300',
            hoverBorder: 'hover:border-blue-500',
            textColor: 'text-blue-800',
            component: PracticeGroupDiscussion,
            fullWidth: true,
        },
    ];

    const selectedCat = categories.find(cat => cat.id === selectedCategory);

    if (selectedCategory && selectedCat) {
        const SelectedComponent = selectedCat.component;
        return (
            <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
                <div className="p-4 sm:p-6 lg:p-8">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="group mb-6 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 rounded-lg shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-gray-700 font-medium"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Categories
                    </button>
                </div>
                <SelectedComponent isFreeUser={isFreeUser} />
            </div>
        );
    }

    // Category Selection
    return (
        <div className="w-full relative bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 lg:p-12 pb-12">
            {/* Background Effects */}
            {/* Mesh Gradient at corners */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-200/20 dark:bg-cyan-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-200/10 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

            {/* Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-blue-400/10 dark:from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section with Pulsing Dots */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-400 bg-clip-text text-transparent">
                        Choose Practice Category
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
                        Select one of the practice areas to begin your skill development journey
                    </p>
                </div>

                {/* Categories Grid with Staggered Animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {categories.map((category, index) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`group relative text-left p-6 sm:p-8 rounded-2xl border-2 ${category.borderColor} dark:border-gray-700 ${category.hoverBorder} dark:hover:border-gray-600
                                bg-gradient-to-br ${category.bgGradient} dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800 backdrop-blur-sm
                                transition-all duration-500 ease-out
                                transform hover:scale-[1.02] hover:-translate-y-1
                                overflow-hidden
                                ${category.fullWidth ? 'md:col-span-2' : ''}
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                boxShadow: isDark
                                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = isDark
                                    ? '0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)'
                                    : '0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = isDark
                                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                            }}
                        >
                            {/* Gradient Overlay on Hover */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                            ></div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icon with Scale and Glow */}
                                        <div
                                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${category.iconGradient} 
                                                flex items-center justify-center text-white
                                                shadow-lg group-hover:scale-110 group-hover:shadow-xl
                                                transition-all duration-500 ease-out`}
                                            style={{
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `0 10px 20px -5px rgba(37, 99, 235, 0.5)`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                            }}
                                        >
                                            {category.icon}
                                        </div>
                                        <div className="group-hover:translate-x-1 transition-transform duration-300">
                                            <div className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                                                Category {category.number}
                                            </div>
                                            {/* Title with Slide Effect */}
                                            <div
                                                className={`font-bold text-xl sm:text-2xl ${category.textColor} dark:text-gray-200
                                                    group-hover:text-blue-800 dark:group-hover:text-blue-400 
                                                    transition-all duration-300`}
                                                style={{
                                                    transform: 'translateX(0)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                {category.title}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Arrow with Slide Animation */}
                                    <svg
                                        className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{
                                            transform: 'translateX(0)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateX(8px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                {/* Description with Color Transition */}
                                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
                                    {category.description}
                                </div>
                            </div>

                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>
                        </button>
                    ))}
                </div>

                {/* Footer decorative element */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-600 to-transparent"></div>
                        <span>Choose any category to get started</span>
                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-600 to-transparent"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

