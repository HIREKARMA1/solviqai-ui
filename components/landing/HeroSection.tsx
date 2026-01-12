'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Memoize stats to prevent recreation on each render
const STATS = [
  { label: 'Jobs', value: '120k+' },
  { label: 'Users', value: '150k+' },
  { label: 'Reviews', value: '32k+' },
] as const;

export const HeroSection = memo(function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');

  const handleFindJob = useCallback(() => {
    if (user) {
      router.push(`/dashboard/${user.user_type}/jobs`);
    } else {
      router.push('/auth/login');
    }
  }, [user, router]);

  return (
    <section
      id="hero"
      className="relative min-h-0 sm:min-h-[70vh] md:min-h-screen flex items-start sm:items-center overflow-hidden bg-[#F7F5EA] dark:bg-black py-32 sm:py-8 md:py-10 lg:py-32"
    >
      <div className="w-[90%] mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center w-full">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full order-1"
          >
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[78px] font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-gray-900 dark:text-white block whitespace-normal lg:whitespace-nowrap">
                Find the Perfect Job.
              </span>
              <span className="text-gray-900 dark:text-white block whitespace-normal lg:whitespace-nowrap">
                Apply Smarter with
              </span>
              <span className="text-[#FF541F] block">
                Solviq.AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl lg:text-3xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed mb-8 tracking-tight leading-[1.1]">
              AI-powered job matching, resume optimization, and one-click applications all in one platform
            </p>

            {/* Hero Search Bar */}
            <div className="w-full max-w-2xl mb-10">
              <div className="bg-white dark:bg-gray-900 rounded-full shadow-sm p-3 flex items-center px-5">

                {/* Job Title Input */}
                <div className="flex-1 flex items-center px-4 border-r border-gray-200 dark:border-gray-700">
                  <Search className="w-5 h-5 text-[#FF541F] mr-3" />
                  <input
                    type="text"
                    placeholder="Job title, Keyword..."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-gray-700 dark:text-200 placeholder-gray-400"
                  />
                </div>

                {/* Location Input */}
                <div className="flex-1 flex items-center px-4">
                  <MapPin className="w-5 h-5 text-[#FF541F] mr-3" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-gray-700 dark:text-200 placeholder-gray-400"
                  />
                </div>

                {/* Find Job Button */}
                <button
                  onClick={handleFindJob}
                  className="bg-[#FF541F] hover:bg-[#f43e06] text-white font-semibold px-8 py-3 rounded-md transition-colors whitespace-nowrap text-lg"
                >
                  Find Job
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-12">
              {STATS.map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <div className="text-[#FF541F] font-semibold text-lg mb-1">{stat.label}</div>
                  <div className="text-gray-900 dark:text-white font-bold text-3xl">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Decorative Illustration - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative hidden md:block w-full order-2"
          >
            <div className="relative w-full h-[52vh] sm:h-[52vh] md:h-[62vh] lg:h-[62vh] xl:h-[72vh]">
              {/* Main Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">


                  {/* Hero Image - Woman with Laptop */}
                  <div className="relative w-full h-full mx-auto z-10">
                    <Image
                      src="/images/heroimg.png"
                      alt="Woman working happily on laptop"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                      sizes="(max-width: 768px) 0vw, (max-width: 1024px) 50vw, 40vw"
                      loading="eager"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgwIiBoZWlnaHQ9IjU2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjdGNUVBIi8+PC9zdmc+"
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
