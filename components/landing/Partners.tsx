'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Partner {
  id: string;
  name: string;
  logo?: string;
}

export function Partners() {
  const { t } = useTranslation();

  const partners: Partner[] = [
    { id: '1', name: 'Netflix' },
    { id: '2', name: 'Microsoft' },
    { id: '3', name: 'Google' },
    { id: '4', name: 'TATA' },
    { id: '5', name: 'IBM' },
    { id: '6', name: 'Meta' },
  ];

  return (
    <section 
      id="partners" 
      className="section-container relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900"
    >
      {/* Subtle gradient overlay for dark mode */}
      <div 
        className="absolute inset-0 dark:block hidden opacity-50"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(139, 69, 19, 0.1) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-8 sm:p-12 mb-16 text-center"
          style={{ backgroundColor: '#1A4A8A' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
            {t('partners.cta.title')}
          </h2>
          
          <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            {t('partners.cta.description')}
          </p>

          <button
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: '#FF541F' }}
          >
            {t('partners.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Partners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            {t('partners.label')}
          </p>

          {/* Partners Logos Grid */}
          <div className="flex flex-wrap items-center justify-start gap-8 sm:gap-12 lg:gap-16">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center"
              >
                <PartnerLogo name={partner.name} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface PartnerLogoProps {
  name: string;
}

function PartnerLogo({ name }: PartnerLogoProps) {
  // Styled text logos for each partner
  const getLogoStyle = (name: string) => {
    switch (name) {
      case 'Netflix':
        return (
          <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#E50914' }}>
            NETFLIX
          </span>
        );
      case 'Microsoft':
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 grid grid-cols-2 gap-0.5">
              <div style={{ backgroundColor: '#F25022' }} />
              <div style={{ backgroundColor: '#7FBA00' }} />
              <div style={{ backgroundColor: '#00A4EF' }} />
              <div style={{ backgroundColor: '#FFB900' }} />
            </div>
            <span className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">
              Microsoft
            </span>
          </div>
        );
      case 'Google':
        return (
          <div className="flex items-center gap-1">
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#4285F4' }}>G</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#EA4335' }}>o</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#FBBC05' }}>o</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#4285F4' }}>g</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#34A853' }}>l</span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#EA4335' }}>e</span>
          </div>
        );
      case 'TATA':
        return (
          <span className="text-xl sm:text-2xl font-bold" style={{ color: '#0066B2' }}>
            TATA
          </span>
        );
      case 'IBM':
        return (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {['#006699', '#006699', '#006699', '#006699', '#006699', '#006699', '#006699', '#006699'].map((color, i) => (
                <div key={i} className="w-1 h-6 sm:h-8" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span className="text-xl sm:text-2xl font-bold ml-2" style={{ color: '#006699' }}>
              IBM
            </span>
          </div>
        );
      case 'Meta':
        return (
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="sm:w-10 sm:h-10">
              <path
                d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16Z"
                fill="#0084FF"
              />
              <path
                d="M22 16C22 12.6863 19.3137 10 16 10C12.6863 10 10 12.6863 10 16C10 19.3137 12.6863 22 16 22C19.3137 22 22 19.3137 22 16Z"
                fill="#0084FF"
              />
            </svg>
            <span className="text-xl sm:text-2xl font-semibold text-white dark:text-white">
              Meta
            </span>
          </div>
        );
      default:
        return (
          <span className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {name}
          </span>
        );
    }
  };

  return (
    <div className="opacity-70 hover:opacity-100 transition-opacity duration-300">
      {getLogoStyle(name)}
    </div>
  );
}
