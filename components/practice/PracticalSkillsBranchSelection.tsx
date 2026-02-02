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

export default function PracticalSkillsBranchSelection({ onBack }: { onBack?: () => void }) {
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
                />
            </div>
        );
    }

    // Branch Selection
    return (
        <div className="w-full relative min-h-screen bg-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto relative z-10">
                {onBack && (
                    <div className="mb-6 sm:mb-0 sm:absolute sm:top-0 sm:left-0 z-20">
                        <button
                            onClick={onBack}
                            className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    </div>
                )}

                {/* Header Section */}
                <div className="text-center mb-12 mt-4">
                    <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
                        Choose Your Branch
                    </h1>
                    <p className="text-gray-800 text-lg font-medium">
                        Select your engineering branch to start practicing situation-based questions
                    </p>
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {branches.map((branch, index) => {
                        // Define precise styles based on branch ID
                        let bgHex = '#FFFFFF';
                        let borderHex = '#E5E7EB';
                        let iconBgHex = '#3B82F6';

                        switch (branch.id) {
                            case 'civil':
                                bgHex = '#FFF5EE'; // Use provided Figma value
                                borderHex = '#F7A66C'; // Use provided Figma value
                                iconBgHex = '#F97316'; // Orange-500
                                break;
                            case 'electrical':
                                bgHex = '#FFFCF2'; // Ivory/Light Yellow
                                borderHex = '#FBBF24'; // Amber-400
                                iconBgHex = '#EAB308'; // Yellow-500
                                break;
                            case 'cse':
                                bgHex = '#EEF4FF'; // Use provided Figma value
                                borderHex = '#95BAFF'; // Use provided Figma value
                                iconBgHex = '#3B82F6'; // Blue-500
                                break;
                            case 'mechanical':
                                bgHex = '#F8FAFC'; // Slate-50
                                borderHex = '#94A3B8'; // Slate-400
                                iconBgHex = '#64748B'; // Slate-500
                                break;
                            case 'accountant':
                                bgHex = '#F0FDF4'; // Green-50
                                borderHex = '#4ADE80'; // Green-400
                                iconBgHex = '#10B981'; // Emerald-500
                                break;
                        }

                        return (
                            <button
                                key={branch.id}
                                onClick={() => setSelectedBranch(branch.id)}
                                className={`w-full text-left p-6 transition-all duration-300 hover:shadow-lg flex items-start gap-5`}
                                style={{
                                    backgroundColor: bgHex,
                                    borderColor: borderHex,
                                    borderWidth: '1px',
                                    borderRadius: '16px', // Fixed 16px radius
                                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)' // Specific shadow
                                }}
                            >
                                {/* Icon Box */}
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white`}
                                    style={{
                                        backgroundColor: iconBgHex,
                                        borderRadius: '16px'
                                    }}
                                >
                                    {branch.icon}
                                </div>

                                {/* Text Content */}
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 font-medium mb-1">
                                        Branch {branch.number}
                                    </span>
                                    <h3
                                        className="text-2xl font-bold mb-2"
                                        style={{ color: iconBgHex === '#F97316' ? '#C2410C' : iconBgHex === '#EAB308' ? '#A16207' : iconBgHex }} // Darker text for readability
                                    >
                                        {branch.title}
                                    </h3>
                                    <p className="text-black/80 text-sm leading-relaxed font-medium">
                                        {branch.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
