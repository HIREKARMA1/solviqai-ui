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
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F7F5EA] dark:bg-gray-900"
      style={{
        paddingTop: '120px', // Space for navbar (56px navbar + 64px padding)
        paddingBottom: '60px',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                Solviq.AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              AI-powered job matching, resume optimization, and one-click applications all in one platform
            </p>

            {/* Hero Search Bar – No Input Borders + Pixel-Perfect */}
            <div className="w-full max-w-4xl">
              <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl overflow-hidden flex flex-col sm:flex-row items-center h-auto sm:h-[68px] border border-gray-100 px-10 py-2">

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
                  <div className="text-orange-500 font-bold text-sm">{stat.label}</div>
                  <div className="text-gray-900 dark:text-white font-bold text-lg">
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


                  {/* Yellow Wavy/Curved Background Shape */}
                  <div className="absolute top-1/2 right-8 -translate-y-1/2 w-[320px] h-[320px] bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-100 shadow-lg"
                    style={{ borderRadius: '40% 60% 70% 30% / 60% 30% 70% 40%' }} />

                  {/* Light Mint/Teal Background Shape - Exact Figma Specs */}
                  <div
                    className="absolute shadow-sm"
                    style={{
                      width: '542.1px',
                      height: '410px',
                      left: '18.35px',
                      top: '5.9px',
                      backgroundColor: '#00A298',
                      opacity: 0.1,
                      borderRadius: '200px',
                      transform: 'rotate(-17.91deg)',
                    }}
                  />

                  {/* Yellow Dashed Curved Line */}
                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 500 500">
                    <path
                      d="M 100 60 Q 275 10 450 90"
                      stroke="#F59E0B"
                      strokeWidth="4"
                      strokeDasharray="10,10"
                      fill="none"
                    />
                  </svg>

                  {/* Orange/Yellow Stars */}
                  <div className="absolute top-4 left-16 w-16 h-16">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-400">
                      <polygon points="50,10 61,40 95,40 68,60 79,90 50,70 21,90 32,60 5,40 39,40" />
                    </svg>
                  </div>
                  <div className="absolute top-12 right-8 w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-orange-400">
                      <polygon points="50,10 61,40 95,40 68,60 79,90 50,70 21,90 32,60 5,40 39,40" />
                    </svg>
                  </div>

                  {/* Small Dark Blue/Purple Circles */}
                  <div className="absolute top-8 right-14 w-7 h-7 bg-indigo-900 rounded-full shadow" />
                  <div className="absolute bottom-24 right-4 w-9 h-9 bg-indigo-900 rounded-full shadow" />

                  {/* Large Teal/Cyan Circle (Left side) */}
                  <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-24 h-24 bg-teal-400 rounded-full shadow-lg" />


                  {/* Hero Image - Woman with Laptop */}
                  <div className="relative w-full max-w-md mx-auto sm:mx-0 sm:absolute sm:top-1/2 sm:right-4 sm:-translate-y-1/2 sm:w-[420px] lg:w-[480px] sm:h-[500px] lg:h-[560px] z-10">
                    <Image
                      src="/images/heroimg.png"
                      alt="Woman working happily on laptop"
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                    />

                    {/* Promotional Badge - Bottom Center of Image (Matches Screenshot Perfectly) */}
                    <motion.div
                      initial={{ scale: 0.8, y: 20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute bottom-4 left-1/3 -translate-x-1/3
                bg-white dark:bg-gray-800 
                px-4 py-2.5 rounded-full shadow-lg 
                flex items-center gap-3 
                border border-gray-100 
                whitespace-nowrap
                text-sm z-20"
                    >
                      {/* Teal Circle Icon with White Ring */}
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full border-2 border-teal-500" />
                        </div>
                      </div>

                      <div className="leading-tight">
                        <p className="font-semibold text-gray-900 dark:text-white text-xs">
                          Get 20% off all updates
                        </p>
                        <p className="text-xs text-gray-500">
                          15th - 27th sept, 2022
                        </p>
                      </div>
                    </motion.div>
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
