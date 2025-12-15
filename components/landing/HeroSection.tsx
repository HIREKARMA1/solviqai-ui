'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');

  const stats = [
    { label: 'Jobs', value: '120k+' },
    { label: 'Users', value: '150k+' },
    { label: 'Reviews', value: '32k+' },
  ];

  const handleFindJob = () => {
    if (user) {
      router.push(`/dashboard/${user.user_type}/jobs`);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F7F5EA] dark:bg-black"
      style={{
        paddingTop: '120px', // Space for navbar (56px navbar + 64px padding)
        paddingBottom: '60px',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 lg:ml-auto lg:mr-0 lg:max-w-[90%]">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">
                Find the Perfect Job.
                <br />
                Apply Smarter with
              </span>
              <br />
              <span className="text-[#FF541F] dark:text-[#FF541F]">
                Solviq.AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 dark:text-white max-w-xl">
              AI-powered job matching, resume optimization, and one-click applications all in one platform
            </p>

            {/* Hero Search Bar – No Input Borders + Pixel-Perfect */}
            <div className="w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-900 rounded-full shadow-xl overflow-hidden flex flex-col sm:flex-row items-center h-auto sm:h-[68px] border border-gray-100 dark:border-gray-800 px-10 py-2">

                {/* Job Title Input */}
                <div className="flex items-center gap-3 px-2 py-2 sm:py-0 flex-1 min-w-0">
                  <Search className="w-5 h-5 text-[#FF541F] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Job title, Keyword..."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-base font-light
                   outline-none border-none ring-0 focus:ring-0 focus:outline-none
                   focus:border-transparent"
                  />
                </div>

                {/* Thin Vertical Divider – visible only on sm+ */}
                <div className="hidden sm:block w-px h-10 bg-gray-300 dark:bg-gray-600" aria-hidden="true" />

                {/* Location Input */}
                <div className="flex items-center gap-3 px-2 py-2 sm:py-0 flex-1 min-w-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700">
                  <MapPin className="w-5 h-5 text-[#FF541F] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-gray-700 dark:text-gray-200 placeholder:text-gray-400 text-base font-light
                   outline-none border-none ring-0 focus:ring-0 focus:outline-none
                   focus:border-transparent"
                  />
                </div>

                {/* Find Job Button – matches your screenshot perfectly */}
                <button
                  onClick={handleFindJob}
                  className="m-3 sm:m-3 bg-[#FF541F] hover:bg-[#f43e06] text-white font-medium px-5 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-lg whitespace-nowrap"
                >
                  Find Job
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-gray-900 dark:text-white font-bold text-sm">{stat.label}</div>
                  <div className="text-[#FF541F] dark:text-[#FF541F] font-bold text-lg">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Decorative Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full h-[600px]">
              {/* Main Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[500px] h-[500px]">


                  {/* Hero Image - Woman with Laptop */}
                  <div className="relative w-full max-w-md mx-auto sm:mx-0 sm:absolute sm:top-1/2 sm:right-4 sm:-translate-y-1/2 sm:w-[420px] lg:w-[480px] sm:h-[500px] lg:h-[560px] z-10">
                    <Image
                      src="/images/heroimg.png"
                      alt="Woman working happily on laptop"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
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
}
