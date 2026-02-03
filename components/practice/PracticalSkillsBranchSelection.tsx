'use client';

import { useState, useEffect } from 'react';
import { Building2, Zap, Cpu, Wrench, FileSpreadsheet } from 'lucide-react';
import PracticalSkillsPractice from './PracticalSkillsPractice';
import CodingChallengePractice from './CodingChallengePractice';
import CivilQuantityEstimation from './CivilQuantityEstimation';
import ElectricalCircuitPractice from './ElectricalCircuitPractice';
import AccountantAssessmentPractice from './AccountantAssessmentPractice';

interface Branch {
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
    component: React.ComponentType<any>;
    requiresBranch?: boolean;
}

interface PracticalSkillsBranchSelectionProps {
    isFreeUser?: boolean;
}

export default function PracticalSkillsBranchSelection({ isFreeUser = false }: PracticalSkillsBranchSelectionProps) {
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const branches: Branch[] = [
        {
            id: 'civil',
            number: '1',
            title: 'Civil Engineering',
            description: 'Quantity estimation, structural analysis, and infrastructure design',
            icon: <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-orange-500 to-red-500',
            iconGradient: 'from-orange-500 to-red-500',
            bgGradient: 'from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            hoverBorder: 'hover:border-orange-400',
            textColor: 'text-orange-700',
            component: CivilQuantityEstimation,
            requiresBranch: false,
        },
        {
            id: 'electrical',
            number: '2',
            title: 'Electrical Engineering',
            description: 'Circuit design, power systems, and electrical diagrams',
            icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-yellow-500 to-amber-500',
            iconGradient: 'from-yellow-500 to-amber-500',
            bgGradient: 'from-yellow-50 to-amber-50',
            borderColor: 'border-yellow-200',
            hoverBorder: 'hover:border-yellow-400',
            textColor: 'text-yellow-700',
            component: ElectricalCircuitPractice,
            requiresBranch: false,
        },
        {
            id: 'cse',
            number: '3',
            title: 'Computer Science',
            description: 'Coding challenges, algorithms, and programming problems',
            icon: <Cpu className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-blue-500 to-indigo-500',
            iconGradient: 'from-blue-500 to-indigo-500',
            bgGradient: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            hoverBorder: 'hover:border-blue-400',
            textColor: 'text-blue-700',
            component: CodingChallengePractice,
            requiresBranch: true,
        },
        {
            id: 'mechanical',
            number: '4',
            title: 'Mechanical Engineering',
            description: 'Thermodynamics, mechanics, and manufacturing processes',
            icon: <Wrench className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-gray-500 to-slate-500',
            iconGradient: 'from-gray-500 to-slate-500',
            bgGradient: 'from-gray-50 to-slate-50',
            borderColor: 'border-gray-200',
            hoverBorder: 'hover:border-gray-400',
            textColor: 'text-gray-700',
            component: PracticalSkillsPractice,
            requiresBranch: true,
        },
        {
            id: 'accountant',
            number: '5',
            title: 'Accountant Assessment',
            description: 'Excel skills practice with accounting scenarios',
            icon: <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7" />,
            gradient: 'from-green-500 to-emerald-500',
            iconGradient: 'from-green-500 to-emerald-500',
            bgGradient: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            hoverBorder: 'hover:border-green-400',
            textColor: 'text-green-700',
            component: AccountantAssessmentPractice,
            requiresBranch: false,
        },
    ];

    const selectedBranchData = branches.find(b => b.id === selectedBranch);

    if (selectedBranch && selectedBranchData) {
        const SelectedComponent = selectedBranchData.component;
        const branchName = selectedBranch === 'cse' ? 'Computer Science' :
            selectedBranch === 'civil' ? 'Civil' :
                selectedBranch === 'electrical' ? 'Electrical' :
                    selectedBranch === 'accountant' ? 'Accountant' : 'Mechanical';

        return (
            <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/30 pb-8">
                <SelectedComponent
                    {...(selectedBranchData.requiresBranch ? { branch: branchName } : {})}
                    onBack={() => setSelectedBranch(null)}
                    isFreeUser={isFreeUser}
                />
            </div>
        );
    }

    // Branch Selection
    return (
        <div className="w-full relative bg-gradient-to-br from-blue-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8 lg:p-12 pb-12">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>

            {/* Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-blue-400/10 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        Choose Your Branch
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                        Select your engineering branch to start practicing situation-based questions
                    </p>
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {branches.map((branch, index) => (
                        <button
                            key={branch.id}
                            onClick={() => setSelectedBranch(branch.id)}
                            className={`group relative text-left p-6 sm:p-8 rounded-2xl border-2 ${branch.borderColor} ${branch.hoverBorder} 
                                bg-gradient-to-br ${branch.bgGradient} backdrop-blur-sm
                                transition-all duration-500 ease-out
                                transform hover:scale-[1.02] hover:-translate-y-1
                                overflow-hidden
                                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                            }}
                        >
                            {/* Gradient Overlay on Hover */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${branch.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                            ></div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icon */}
                                        <div
                                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${branch.iconGradient} 
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
                                            {branch.icon}
                                        </div>
                                        <div className="group-hover:translate-x-1 transition-transform duration-300">
                                            <div className="text-xs sm:text-sm font-semibold text-gray-500 mb-1 group-hover:text-gray-700 transition-colors duration-300">
                                                Branch {branch.number}
                                            </div>
                                            <div
                                                className={`font-bold text-xl sm:text-2xl ${branch.textColor} 
                                                    group-hover:text-blue-800 
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
                                                {branch.title}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <svg
                                        className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-all duration-300"
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
                                {/* Description */}
                                <div className="text-gray-600 text-sm sm:text-base leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                                    {branch.description}
                                </div>
                            </div>

                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                        <span>Choose your branch to get started</span>
                        <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

