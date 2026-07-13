'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Workflow } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSimulationsPathForUser } from '@/lib/dashboardNavigation';

export const HeroSection = memo(function HeroSection({
  onStartReadiness,
}: {
  onStartReadiness?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const simulationsHref = getSimulationsPathForUser(user?.user_type);

  const handlePrimaryCta = useCallback(() => {
    if (user) {
      router.push('/dashboard/student');
      return;
    }
    onStartReadiness?.();
    document.getElementById('guest-readiness')?.scrollIntoView({ behavior: 'smooth' });
  }, [user, router, onStartReadiness]);

  return (
    <section
      id="hero"
      className="relative min-h-0 sm:min-h-[70vh] md:min-h-screen flex items-start sm:items-center overflow-hidden bg-[#F7F5EA] dark:bg-black pt-32 pb-12 md:py-32 lg:pt-[160px]"
    >
      <div className="w-[90%] mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full order-1"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[78px] font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-gray-900 dark:text-white block">
                Know Your Job Readiness
              </span>
              <span className="text-[#FF541F] block">
                Before Placement Season
              </span>
            </h1>

            <p className="text-xl md:text-2xl lg:text-3xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed mb-8 tracking-tight">
              Upload your resume, take a 3-minute aptitude check, and get a free readiness score with specific gaps to fix
            </p>

            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF541F] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#e04a1a]"
              >
                <Target className="h-5 w-5" />
                Check Your Job Readiness Score — Free
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                href={simulationsHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#112C96] px-8 py-4 text-lg font-semibold text-[#112C96] transition hover:bg-[#112C96]/5 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                <Workflow className="h-5 w-5" />
                Job Prep Simulation
                <ArrowRight className="h-5 w-5" />
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/student')}
                  className="rounded-2xl border border-gray-300 px-6 py-4 text-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Go to Dashboard
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-8 md:gap-12">
              <div className="flex flex-col">
                <div className="text-[#FF541F] font-semibold text-lg mb-1">Free check</div>
                <div className="text-gray-900 dark:text-white font-bold text-3xl">3 min</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[#FF541F] font-semibold text-lg mb-1">Resume + Aptitude</div>
                <div className="text-gray-900 dark:text-white font-bold text-3xl">Instant</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[#FF541F] font-semibold text-lg mb-1">Gap analysis</div>
                <div className="text-gray-900 dark:text-white font-bold text-3xl">Actionable</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative w-full order-2 mt-8 md:mt-0"
          >
            <div className="relative w-full h-[40vh] sm:h-[52vh] md:h-[62vh] lg:h-[62vh] xl:h-[72vh]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <div className="relative w-full h-full mx-auto z-10">
                    <Image
                      src="/images/heroimg.png"
                      alt="Student preparing for placement"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
