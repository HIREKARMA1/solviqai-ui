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
      className="relative min-h-0 sm:min-h-[70vh] md:min-h-screen flex items-start sm:items-center overflow-hidden bg-[#F7F5EA] dark:bg-black py-32 sm:py-8 md:py-0"
    >
      <div className="container mx-auto w-full max-w-[95%] sm:max-w-[92%] md:max-w-[90%] lg:max-w-[88%] xl:max-w-[85%] 2xl:max-w-[80%]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-[4%] lg:gap-[3%] xl:gap-[2%] items-center w-full">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-[4%] sm:space-y-[3.5%] md:space-y-[3%] lg:space-y-[2.5%] w-full order-1"
          >
            {/* Main Heading */}
            <h1 className=" text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <span className="text-gray-900 dark:text-white block sm:inline">
                Find the Perfect Job.
                <br className="hidden sm:inline md:hidden lg:inline" />
                <span className="hidden sm:inline md:hidden lg:hidden"> </span>
                Apply Smarter with
              </span>
              <br className="block sm:hidden md:block" />
              <span className="text-[#FF541F] dark:text-[#FF541F] block sm:inline mt-1 sm:mt-0 md:mt-0">
                Solviq.AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[clamp(0.9375rem,3.5vw,1.375rem)] sm:text-[clamp(1rem,3vw,1.5rem)] md:text-[clamp(1.125rem,2.5vw,1.625rem)] lg:text-[clamp(1.125rem,1.8vw,1.25rem)] xl:text-[clamp(1.125rem,1.5vw,1.375rem)] text-gray-600 dark:text-white max-w-[95%] sm:max-w-[92%] md:max-w-[90%] leading-relaxed">
              AI-powered job matching, resume optimization, and one-click applications all in one platform
            </p>

            {/* Hero Search Bar – Fully Responsive Design */}
            <div className="w-full max-w-[100%]">
              <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-xl md:rounded-full shadow-xl overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center h-auto sm:h-[clamp(50px,8vh,70px)] md:h-[clamp(60px,8vh,75px)] border border-gray-100 dark:border-gray-800 px-[4%] sm:px-[3.5%] md:px-[3%] lg:px-[2.5%] py-[3.5%] sm:py-[2.5%] md:py-[1.5%] gap-0">

                {/* Job Title Input */}
                <div className="flex items-center gap-[3.5%] sm:gap-[2.5%] md:gap-[2%] px-[2%] sm:px-[1.5%] md:px-[1%] py-[3.5%] sm:py-[2%] md:py-0 flex-1 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] border-b sm:border-b-0 border-gray-100 dark:border-gray-800 sm:border-0">
                  <Search className="w-[clamp(1.125rem,4.5vw,1.5rem)] sm:w-[clamp(1.125rem,3.5vw,1.375rem)] md:w-[clamp(1.125rem,2.5vw,1.25rem)] h-[clamp(1.125rem,4.5vw,1.5rem)] sm:h-[clamp(1.125rem,3.5vw,1.375rem)] md:h-[clamp(1.125rem,2.5vw,1.25rem)] text-[#FF541F] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Job title, Keyword..."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-[clamp(0.9375rem,3.8vw,1.125rem)] sm:text-[clamp(0.9375rem,2.8vw,1.0625rem)] md:text-[clamp(0.9375rem,2vw,1rem)] lg:text-[clamp(0.9375rem,1.5vw,1.0625rem)] xl:text-[clamp(1rem,1.2vw,1.125rem)] font-normal
                   outline-none border-none ring-0 focus:ring-0 focus:outline-none
                   focus:border-transparent min-w-0"
                  />
                </div>

                {/* Thin Vertical Divider – visible only on sm+ */}
                <div className="hidden sm:block w-[1px] sm:w-[0.5px] md:w-[0.1vw] h-[50%] sm:h-[55%] md:h-[60%] bg-gray-300 dark:bg-gray-600 mx-[1%] md:mx-0" aria-hidden="true" />

                {/* Location Input */}
                <div className="flex items-center gap-[3.5%] sm:gap-[2.5%] md:gap-[2%] px-[2%] sm:px-[1.5%] md:px-[1%] py-[3.5%] sm:py-[2%] md:py-0 flex-1 min-w-[120px] sm:min-w-[140px] md:min-w-[160px] border-b sm:border-b-0 border-gray-100 dark:border-gray-800 sm:border-0">
                  <MapPin className="w-[clamp(1.125rem,4.5vw,1.5rem)] sm:w-[clamp(1.125rem,3.5vw,1.375rem)] md:w-[clamp(1.125rem,2.5vw,1.25rem)] h-[clamp(1.125rem,4.5vw,1.5rem)] sm:h-[clamp(1.125rem,3.5vw,1.375rem)] md:h-[clamp(1.125rem,2.5vw,1.25rem)] text-[#FF541F] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-[clamp(0.9375rem,3.8vw,1.125rem)] sm:text-[clamp(0.9375rem,2.8vw,1.0625rem)] md:text-[clamp(0.9375rem,2vw,1rem)] lg:text-[clamp(0.9375rem,1.5vw,1.0625rem)] xl:text-[clamp(1rem,1.2vw,1.125rem)] font-normal
                   outline-none border-none ring-0 focus:ring-0 focus:outline-none
                   focus:border-transparent min-w-0"
                  />
                </div>

                {/* Find Job Button – Fully Responsive */}
                <button
                  onClick={handleFindJob}
                  className="w-full sm:w-auto sm:ml-[2%] md:ml-[1.5%] bg-[#FF541F] hover:bg-[#f43e06] active:bg-[#e63905] text-white font-semibold px-[4%] sm:px-[3.5%] md:px-[2.5%] lg:px-[2%] py-[3.5%] sm:py-[2.5%] md:py-[1.5%] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm text-[clamp(1rem,4.2vw,1.25rem)] sm:text-[clamp(0.9375rem,2.8vw,1.125rem)] md:text-[clamp(0.9375rem,2vw,1.0625rem)] lg:text-[clamp(0.9375rem,1.5vw,1.0625rem)] xl:text-[clamp(1rem,1.2vw,1.125rem)] whitespace-nowrap mt-[2%] sm:mt-0"
                >
                  Find Job
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-[5%] sm:gap-[4%] md:gap-[3.5%] lg:gap-[3%] flex-wrap sm:flex-nowrap">
              {STATS.map((stat, index) => (
                <div key={index} className="text-center flex-1 sm:flex-none min-w-[30%] sm:min-w-0">
                  <div className="text-gray-900 dark:text-white font-bold text-[clamp(0.75rem,3.2vw,1rem)] sm:text-[clamp(0.8125rem,2.5vw,0.9375rem)] md:text-[clamp(0.875rem,1.8vw,1rem)] lg:text-[clamp(0.875rem,1.2vw,1rem)] xl:text-[clamp(0.875rem,1vw,1.0625rem)]">{stat.label}</div>
                  <div className="text-[#FF541F] dark:text-[#FF541F] font-bold text-[clamp(1rem,4.2vw,1.5rem)] sm:text-[clamp(1.125rem,3.5vw,1.375rem)] md:text-[clamp(1.25rem,2.5vw,1.5rem)] lg:text-[clamp(1.125rem,1.8vw,1.375rem)] xl:text-[clamp(1.125rem,1.5vw,1.25rem)]">
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
            <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh]">
              {/* Main Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[85%] sm:w-[80%] md:w-[75%] lg:w-[80%] h-[85%] sm:h-[80%] md:h-[75%] lg:h-[80%]">


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
