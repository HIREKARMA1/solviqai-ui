'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Code, Mic, Wrench, Users, ArrowRight } from 'lucide-react';
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
    component: React.ComponentType;
}

interface PracticeQuestionsProps {
    // Notify parent when the user has entered or exited an active practice mode
    onPracticeModeChange?: (inPractice: boolean) => void;
}

export default function PracticeQuestions({ onPracticeModeChange }: PracticeQuestionsProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
            icon: <BarChart3 className="w-6 h-6 text-white" />,
            component: AssessmentSkillsPractice,
        },
        {
            id: 'technical',
            number: '2',
            title: 'Technical Skills',
            description: 'Backend, Frontend, DevOps & more',
            icon: <Code className="w-6 h-6 text-white" />,
            component: TechnicalSkillsPractice,
        },
        {
            id: 'interview',
            number: '3',
            title: 'Interview Skills',
            description: 'Mock interview practice',
            icon: <Mic className="w-6 h-6 text-white" />,
            component: InterviewPractice,
        },
        {
            id: 'practical',
            number: '4',
            title: 'Practical Skills',
            description: 'Branchwise practical skill test',
            icon: <Wrench className="w-6 h-6 text-white" />,
            component: PracticalSkillsBranchSelection,
        },
        {
            id: 'gd',
            number: '5',
            title: 'Realtime Group Discussion',
            description: 'Voice-based GD simulation With AI Participants and Instant analytics',
            icon: <Users className="w-6 h-6 text-white" />,
            component: PracticeGroupDiscussion,
        },
    ];

    const selectedCat = categories.find(cat => cat.id === selectedCategory);

    if (selectedCategory && selectedCat) {
        const SelectedComponent = selectedCat.component;
        return (
            <div className="w-full pb-8">
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="group mb-2 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 rounded-lg shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-gray-700 font-medium"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Categories
                    </button>
                </div>
                <SelectedComponent />
            </div>
        );
    }

    // Category Selection
    return (
        <div className="w-full min-h-screen bg-white dark:bg-[#070c22] py-10 px-4 md:px-10">
            <div className="w-full max-w-6xl">
                {/* Header Section */}
                <div className="mb-8 text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Choose Practice Category
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Apply to multiple jobs automatically using AI-extracted skills
                    </p>
                </div>

                <div className="space-y-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="w-full h-[151px] bg-[#F2F8FF] dark:bg-[#0D1338] rounded-[16px] border border-[#C3C3C3] dark:border-[#767676] px-[20px] py-[16px] flex items-center gap-[10px] transition-all hover:shadow-md group"
                        >
                            {/* Icon Box */}
                            <div className="w-[44px] h-[44px] rounded-[8px] bg-[#1E7BFF] flex items-center justify-center shrink-0 shadow-sm">
                                {category.icon}
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    {category.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 font-medium">
                                    {category.description}
                                </p>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={() => setSelectedCategory(category.id)}
                                className="w-[112px] h-[44px] bg-[#1E7BFF] hover:bg-blue-600 text-white rounded-[8px] flex items-center justify-center gap-[8px] shrink-0 transition-colors"
                            >
                                <span className="text-[24px] font-semibold leading-none pb-1">Start</span>
                                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

