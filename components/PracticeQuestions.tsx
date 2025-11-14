'use client';

import { useState } from 'react';
import AssessmentSkillsPractice from './practice/AssessmentSkillsPractice';
import TechnicalSkillsPractice from './practice/TechnicalSkillsPractice';
import InterviewPractice from './practice/InterviewPractice';
import PracticalSkillsPractice from './practice/PracticalSkillsPractice';
import PracticeGroupDiscussion from './practice/PracticeGroupDiscussion';
export default function PracticeQuestions() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    if (selectedCategory === 'assessment') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Categories
                </button>
                <AssessmentSkillsPractice />
            </div>
        );
    }

    if (selectedCategory === 'technical') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Categories
                </button>
                <TechnicalSkillsPractice />
            </div>
        );
    }

    if (selectedCategory === 'interview') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Categories
                </button>
                <InterviewPractice />
            </div>
        );
    }

    if (selectedCategory === 'practical') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Categories
                </button>
                <PracticalSkillsPractice />
            </div>
        );
    }

    if (selectedCategory === 'gd') {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Categories
                </button>
                <PracticeGroupDiscussion />
            </div>
        );
    }

    // Category Selection
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Practice Category</h1>
            <p className="text-gray-600 mb-6">Select one of the practice areas to begin.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => setSelectedCategory('assessment')}
                    className="text-left p-6 border-2 border-blue-200 rounded-lg hover:shadow-lg transition hover:border-blue-400 bg-blue-50"
                >
                    <div className="font-semibold text-lg text-blue-700">1. Assessment Skills</div>
                    <div className="text-gray-600 text-sm mt-1">Aptitude & soft-skill practice</div>
                </button>

                <button
                    onClick={() => setSelectedCategory('technical')}
                    className="text-left p-6 border-2 border-green-200 rounded-lg hover:shadow-lg transition hover:border-green-400 bg-green-50"
                >
                    <div className="font-semibold text-lg text-green-700">2. Technical Skills</div>
                    <div className="text-gray-600 text-sm mt-1">Backend, Frontend, DevOps & more</div>
                </button>

                <button
                    onClick={() => setSelectedCategory('interview')}
                    className="text-left p-6 border-2 border-purple-200 rounded-lg hover:shadow-lg transition hover:border-purple-400 bg-purple-50"
                >
                    <div className="font-semibold text-lg text-purple-700">3. Interview Skills</div>
                    <div className="text-gray-600 text-sm mt-1">Mock interview practice</div>
                </button>

                <button
                    onClick={() => setSelectedCategory('practical')}
                    className="text-left p-6 border-2 border-orange-200 rounded-lg hover:shadow-lg transition hover:border-orange-400 bg-orange-50"
                >
                    <div className="font-semibold text-lg text-orange-700">4. Practical Skills</div>
                    <div className="text-gray-600 text-sm mt-1">Mechanical, Civil, Electrical situation-based tests</div>
                </button>

                <button
                    onClick={() => setSelectedCategory('gd')}
                    className="text-left p-6 border-2 border-emerald-200 rounded-lg hover:shadow-lg transition hover:border-emerald-400 bg-emerald-50 md:col-span-2"
                >
                    <div className="font-semibold text-lg text-emerald-700">5. Realtime Group Discussion</div>
                    <div className="text-gray-600 text-sm mt-1">
                        Voice-based GD simulation with AI participants and instant analytics.
                    </div>
                </button>
            </div>
        </div>
    );
}

