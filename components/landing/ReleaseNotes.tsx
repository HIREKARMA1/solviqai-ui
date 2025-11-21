'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Code, Database, Shield, Zap, CheckCircle, AlertCircle, Settings, Bug, TrendingUp, BookOpen, Users, FileText, Download } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/animated-background';

export function ReleaseNotes() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <AnimatedBackground variant="subtle" showGrid={true} showLines={false} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Solviq – Release Notes (Version 1.0)
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            Say hello to the smartest (and coolest) career practice app you'll ever try.
          </p>
          <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              <span className="font-semibold">Version 1.0</span>
            </div>
            <span>•</span>
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
              Demo Version
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to the first public drop of Solviq 1.0
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our demo version is officially live, and yes, it's ready to play.
            </p>
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-r-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">No installation.</p>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">No Docker.</p>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">No README.</p>
              <p className="text-gray-700 dark:text-gray-300">
                Just open → practice → improve. That's it. SaaS the way SaaS should be. 😎
              </p>
            </div>
          </motion.section>

          {/* What's Inside */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ✨ What's Inside? (AKA: Why You Should Try This Demo Right Now)
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🎮 Practice That Doesn't Feel Like Homework
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  Aptitude → Technical → HR → GD
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Everything you avoid… made surprisingly fun by AI.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🎤 Mock Interviews That Talk Back
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  Speak your answer → AI listens → AI evaluates → AI gives feedback.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  No awkward HR smile, we promise.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  📊 A Dashboard That Makes Your Progress Look Amazing
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Graphs, insights, streaks, strengths, weaknesses — all clean, all visual, all motivating.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🎯 SaaS For Everyone (Literally)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Students</li>
                  <li>College Admins</li>
                  <li>Training & Placement Cells</li>
                  <li>Investors who want to see "what's cooking"</li>
                  <li>Even professionals (we didn't expect this… but early testers loved it)</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Early Feedback */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">💬 Early Feedback?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              A team of QA with 8+ years of industry experience tested the platform and said:
            </p>
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-r-lg">
              <p className="text-gray-700 dark:text-gray-300 italic">
                "You can sell this to working professionals. This feels premium."
              </p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We blushed a little.
            </p>
          </motion.section>

          {/* Try Break Explore */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🧪 Try. Break. Explore. Repeat.</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              This demo is built for experimentation.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You can't break anything — but you might break your own limits.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you're a college, student, or investor… this is your chance to see Solviq in its raw, exciting, early-stage form.
            </p>
          </motion.section>

          {/* Core Team */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">👥 Core Team</h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2">
                <span className="font-semibold">🧭 Product Manager:</span>
                <span>Swapnajit Mohanty</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">🛠 Technical Lead:</span>
                <span>Lokanath Panda</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">🎨 Design Lead:</span>
                <span>Lokanath Panda</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold">🤖 AI/ML Lead:</span>
                <span>Lokanath Panda</span>
              </div>
            </div>
          </motion.section>

          {/* Ready To Experience */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🌟 Ready To Experience Solviq?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Just open the demo and dive in.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              One click. Zero friction. Maximum "damn, this is nice."
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

