'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Layers,
    Check
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Plan {
    id: string;
    name: string;
    nameKey: keyof import('@/lib/i18n').TranslationKeys;
    price: string;
    priceKey: keyof import('@/lib/i18n').TranslationKeys;
    billingKey: keyof import('@/lib/i18n').TranslationKeys;
    icon: React.ReactNode;
    features: (keyof import('@/lib/i18n').TranslationKeys)[];
    isHighlighted?: boolean;
    badgeKey?: keyof import('@/lib/i18n').TranslationKeys;
}

export function Pricing() {
    const { t } = useTranslation();

    const plans: Plan[] = [
        {
            id: 'basic',
            name: 'Basic plan',
            nameKey: 'pricing.basic.name',
            price: '$10/month',
            priceKey: 'pricing.basic.price',
            billingKey: 'pricing.billing',
            icon: <Zap className="w-6 h-6" />,
            features: [
                'pricing.basic.feature1',
                'pricing.basic.feature2',
                'pricing.basic.feature3',
                'pricing.basic.feature4',
                'pricing.basic.feature5'
            ]
        },
        {
            id: 'business',
            name: 'Business plan',
            nameKey: 'pricing.business.name',
            price: '$20/month',
            priceKey: 'pricing.business.price',
            billingKey: 'pricing.billing',
            icon: <Layers className="w-6 h-6" />,
            features: [
                'pricing.business.feature1',
                'pricing.business.feature2',
                'pricing.business.feature3',
                'pricing.business.feature4',
                'pricing.business.feature5'
            ],
            isHighlighted: true,
            badgeKey: 'pricing.badge'
        },
        {
            id: 'enterprise',
            name: 'Enterprise plan',
            nameKey: 'pricing.enterprise.name',
            price: '$40/month',
            priceKey: 'pricing.enterprise.price',
            billingKey: 'pricing.billing',
            icon: <Layers className="w-6 h-6" />,
            features: [
                'pricing.enterprise.feature1',
                'pricing.enterprise.feature2',
                'pricing.enterprise.feature3',
                'pricing.enterprise.feature4',
                'pricing.enterprise.feature5'
            ]
        }
    ];

    return (
        <section
            id="pricing"
            className="section-container relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 bg-[#FFE6DE] dark:bg-[#815f5f]"
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
            {plan.isHighlighted && plan.badgeKey && (
                <div className="absolute -top-3 right-4 z-10">
                    <div className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#FF541F' }}>
                        {t(plan.badgeKey)}
                    </div>
                </div>
            )}
            
            <div
                className={`rounded-xl p-6 h-full flex flex-col ${
                    plan.isHighlighted
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 flex-shrink-0 ${
                        plan.isHighlighted ? 'bg-white' : ''
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
                    className={`text-xl font-bold mb-2 ${
                        plan.isHighlighted ? 'text-white' : ''
                    }`}
                    style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                >
                    {t(plan.nameKey)}
                </h3>

                {/* Price */}
                <div className="mb-2">
                    <span
                        className={`text-3xl font-bold ${
                            plan.isHighlighted ? 'text-white' : ''
                        }`}
                        style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                    >
                        {t(plan.priceKey).includes('/') ? t(plan.priceKey).split('/')[0] : t(plan.priceKey)}
                    </span>
                    {t(plan.priceKey).includes('/') && (
                        <span
                            className={`text-base ml-1 ${
                                plan.isHighlighted ? 'text-white/80' : 'text-gray-600'
                            }`}
                        >
                            /{t(plan.priceKey).split('/')[1]}
                        </span>
                    )}
                </div>

                {/* Billing */}
                <p
                    className={`text-sm mb-6 ${
                        plan.isHighlighted ? 'text-white/80' : 'text-gray-600'
                    }`}
                >
                    {t(plan.billingKey)}
                </p>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((featureKey, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Check
                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    plan.isHighlighted ? 'text-white' : ''
                                }`}
                                style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                            />
                            <span
                                className={`text-sm ${
                                    plan.isHighlighted ? 'text-white' : ''
                                }`}
                                style={plan.isHighlighted ? {} : { color: '#1A1A1A' }}
                            >
                                {t(featureKey)}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* Button */}
                <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:opacity-90 ${
                        plan.isHighlighted
                            ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900'
                            : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                    style={
                        plan.isHighlighted
                            ? {}
                            : {
                                  borderColor: '#1A1A1A',
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

