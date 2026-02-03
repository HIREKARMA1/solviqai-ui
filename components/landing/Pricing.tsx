'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Sparkles,
    Shield,
    Check,
    Crown
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    icon: React.ReactNode;
    features: string[];
    isHighlighted?: boolean;
    badge?: string;
    subtext?: string;
}

export function Pricing() {
    const { t } = useTranslation();

    const plans: Plan[] = [
        {
            id: 'starter',
            name: 'Starter Plan',
            price: '₹0',
            period: '/ month',
            icon: <Zap className="w-6 h-6" />,
            features: [
                '2 AI-Generated Questions per practice session',
                '3 Job Searches per day in Job Market',
                '1 Free ATS Resume Analysis per month',
                'Access to Basic Skill Development Modules'
            ],
            subtext: 'Essential tools for students to explore.'
        },
        {
            id: 'professional',
            name: 'Professional Plan',
            price: '₹999',
            period: '/ month',
            badge: 'Most Popular',
            isHighlighted: true,
            icon: <Sparkles className="w-6 h-6" />,
            features: [
                'Unlimited AI Interview Practice',
                '15 High-Volume Job Searches per day',
                'Unlimited ATS Score Calculations',
                'Advanced Practice Modules (Coding, Civil, etc.)',
                'Deep AI Feedback on every session'
            ],
            subtext: 'For active job seekers needing deep insights.'
        },
        {
            id: 'elite',
            name: 'Elite Plan',
            price: '₹5,499',
            period: '/ 6 months',
            badge: 'Best Value',
            icon: <Crown className="w-6 h-6" />,
            features: [
                'Everything in Professional Plan',
                '24/7 Priority Support & Mentorship',
                'Exclusive Question Banks (Tier-1)',
                'Verified Skill Certificates for LinkedIn',
                'Unlimited Resume & Portfolio Versions',
                'Early Access to new AI tools'
            ],
            subtext: '~₹916 / month (Save ~₹500)'
        }
    ];

    return (
        <section
            id="pricing"
            className="section-container relative overflow-hidden lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#FFE6DE] dark:bg-[#815f5f]"
        >
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
                        style={{ color: '#1A1A1A' }}
                    >
                        {t('pricing.title')}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg max-w-3xl mx-auto"
                        style={{ color: '#1A1A1A' }}
                    >
                        {t('pricing.subtitle')}
                    </motion.p>
                </div>

                {/* Pricing Cards */}
                <div className="grid text-white grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan, index) => (
                        <PlanCard key={plan.id} plan={plan} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface PlanCardProps {
    plan: Plan;
    index: number;
}

function PlanCard({ plan, index }: PlanCardProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
        >
            {plan.badge && (
                <div className="absolute -top-3 right-4 z-10">
                    <div className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#FF541F' }}>
                        {plan.badge}
                    </div>
                </div>
            )}

            <div
                className={`rounded-xl p-8 min-h-[520px] flex flex-col items-center ${plan.isHighlighted
                    ? 'text-white'
                    : 'bg-white text-gray-900'
                    }`}
                style={
                    plan.isHighlighted
                        ? {
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #383838 100%)'
                        }
                        : {}
                }
            >
                {/* Icon */}
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 flex-shrink-0 ${plan.isHighlighted ? 'bg-white' : ''
                        }`}
                    style={
                        plan.isHighlighted
                            ? {}
                            : { backgroundColor: '#FF541F', color: '#FFFFFF' }
                    }
                >
                    <div style={plan.isHighlighted ? { color: '#1A1A1A' } : { color: '#FFFFFF' }}>
                        {plan.icon}
                    </div>
                </div>

                {/* Plan Name */}
                <h3
                    className={`text-xl font-bold mb-2 text-center ${plan.isHighlighted ? 'text-white' : ''
                        }`}
                    style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                >
                    {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-2 text-center">
                    <span
                        className={`text-4xl font-bold ${plan.isHighlighted ? 'text-white' : ''
                            }`}
                        style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                    >
                        {plan.price}
                    </span>
                    <span
                        className={`text-base ml-1 ${plan.isHighlighted ? 'text-white/80' : 'text-gray-600'
                            }`}
                    >
                        {plan.period}
                    </span>
                </div>

                {/* Subtext / Goal */}
                <p
                    className={`text-sm mb-6 text-center ${plan.isHighlighted ? 'text-white/80' : 'text-gray-600'
                        }`}
                >
                    {plan.subtext}
                </p>

                {/* Features */}
                <ul className="space-y-4 flex-1 mb-8 w-full">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <div className={`mt-1 rounded-full p-0.5 ${plan.isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                                <Check
                                    className={`w-4 h-4 flex-shrink-0 ${plan.isHighlighted ? 'text-white' : ''
                                        }`}
                                    style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                                />
                            </div>
                            <span
                                className={`text-sm ${plan.isHighlighted ? 'text-white/90' : ''
                                    }`}
                                style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                            >
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* Button */}
                <button
                    className={`w-full py-3.5 rounded-full font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${plan.isHighlighted
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-900'
                        }`}
                    style={
                        plan.isHighlighted
                            ? {}
                            : {
                                color: '#1A1A1A'
                            }
                    }
                >
                    {t('pricing.cta')}
                </button>
            </div>
        </motion.div>
    );
}

