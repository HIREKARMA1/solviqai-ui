'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { VideoModal } from '@/components/ui/video-modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const fullText = t('hero.title');
  
  const DEMO_VIDEO_URL = 'https://solviqai.s3.ap-south-1.amazonaws.com/SolviqDemo.mp4';

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80); // Speed of typing (80ms per character)

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  const stats = [
    {
      label: t('stats.jobsSecured'),
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: t('stats.usersActive'),
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      label: t('stats.rating'),
      icon: null
    },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-12"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-bg -z-10">
        <AnimatedBackground variant="default" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-20">
        <div className="text-center max-w-5xl mx-auto">
          {/* Stats Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="badge-primary flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm"
              >
                {stat.icon}
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Heading with Typewriter Effect */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="gradient-text">
              {displayedText}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-1 h-[0.9em] bg-primary-500 ml-1 align-middle"
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary-500 hover:bg-primary-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => {
                if (user) {
                  // If logged in, navigate to assessment page
                  router.push(`/dashboard/${user.user_type}/assessment`);
                } else {
                  // If not logged in, navigate to login
                  router.push('/auth/login');
                }
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('hero.cta.primary')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-lg px-8 py-6 rounded-xl transition-all"
              onClick={() => setIsVideoModalOpen(true)}
            >
              {t('hero.cta.secondary')}
            </Button>
          </motion.div>

          {/* Launch Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800"
          >
            <p className="text-base text-gray-600 dark:text-gray-300 mb-2 font-medium">
              🚀 New Platform Launch
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Join us as we revolutionize interview preparation with AI-powered insights and comprehensive practice tools. Start your journey today!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={DEMO_VIDEO_URL}
        title="Solviq AI Demo"
      />
    </section>
  );
}

