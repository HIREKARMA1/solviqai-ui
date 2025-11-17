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
            Product Release Notes
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              <span className="font-semibold">Version 1.0</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>November 2025</span>
            </div>
            <span>•</span>
            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
              Initial Release
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Release Overview */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Release Overview</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Version <strong>1.0 marks the first official release</strong> of SolviQ AI, an AI-powered placement simulator platform that replicates real company-style assessments and helps students and job seekers practice job-role-specific tests, interviews, and career journeys.
            </p>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              This release delivers the core foundation of the platform, enabling end-to-end functionality for early users and partners. It establishes the baseline architecture, workflows, and experience that subsequent versions will build upon.
            </p>
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-r-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Mission Statement:</p>
              <p className="text-gray-700 dark:text-gray-300">
                SolviQ AI empowers students and professionals to become truly placement-ready through intelligent, job-role-specific simulations, real-time feedback, and actionable analytics that drive continuous improvement.
              </p>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Target Audience:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Engineering students preparing for campus placements</li>
                <li>Job seekers preparing for technical and HR interviews</li>
                <li>Students practicing aptitude and soft skills assessments</li>
                <li>Career guidance seekers looking for personalized recommendations</li>
              </ul>
            </div>
          </motion.section>

          {/* Key Highlights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">2. Key Highlights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Launch of complete core module(s)</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>Assessment Skills Practice (Aptitude & Soft Skills)</li>
                    <li>Technical Skills Practice (Multi-branch engineering)</li>
                    <li>Interview Practice (Technical & HR)</li>
                    <li>Group Discussion Practice (AI-simulated)</li>
                    <li>Coding Round Practice (for software engineering roles)</li>
                    <li>Career Guidance Module</li>
                    <li>Resume ATS Scoring and Analysis</li>
                    <li>Job Application Automation</li>
                    <li>Playlist Generation for Skill Development</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure and scalable backend architecture</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>FastAPI-based RESTful API with async support</li>
                    <li>PostgreSQL database with Alembic migrations</li>
                    <li>JWT-based authentication and authorization</li>
                    <li>Role-based access control (Student, Admin, etc.)</li>
                    <li>Redis integration for caching and session management</li>
                    <li>Docker containerization for easy deployment</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Clean, intuitive user interface</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>Modern, responsive design with Tailwind CSS</li>
                    <li>Professional blue and white theme</li>
                    <li>Exam-style interface for realistic practice experience</li>
                    <li>Smooth animations and transitions</li>
                    <li>Mobile-first responsive design</li>
                    <li>Sliding indicator animations for enhanced UX</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Code className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Foundational API framework</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>RESTful API endpoints for all practice modules</li>
                    <li>AI-powered question generation using Cohere LLM and OpenAI GPT</li>
                    <li>Real-time audio transcription and analysis</li>
                    <li>Comprehensive evaluation and feedback system</li>
                    <li>OpenAPI/Swagger documentation</li>
                    <li>Rate limiting and request validation</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Compliance-ready design for future integrations</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>Modular architecture for easy feature additions</li>
                    <li>Extensible question generation system</li>
                    <li>Scalable user management and analytics</li>
                    <li>GDPR-compliant data handling</li>
                    <li>Secure authentication and authorization</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* New Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">3. New Features (Initial Feature Set)</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Assessment Skills Practice</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI-generated aptitude and soft skills questions with difficulty levels (Easy/Medium/Hard). Supports custom topics or AI-curated mix. Real-time scoring and detailed feedback.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Enables comprehensive assessment preparation with personalized question sets, improving confidence</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Technical Skills Practice</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Multi-branch engineering practice (CS, IT, Mechanical, Civil, Electrical, etc.) with topic-specific or mixed questions. MCQ format with instant feedback and explanations.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Provides targeted technical skill development for engineering students across 18+ branches</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Interview Practice</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Real-time interview simulation for Technical and HR interviews. Audio input via Web Speech API, live transcription, AI-powered feedback with actionable suggestions.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Offers realistic interview experience and detailed feedback on communication and technical depth</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Group Discussion Practice</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI-simulated GD sessions with 3 AI participants. Sequential dialogue via TTS, user audio recording, and comprehensive evaluation.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Simulates real GD scenarios for practice, accessible anytime</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Career Guidance</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI-powered career guidance and recommendations tailored to user profile, skills, and preferences. Personalized job role and career path suggestions.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Helps users make informed career decisions based on strengths and market opportunities</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">User Dashboard</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Real-time overview of practice history, scores, performance metrics, and visual progress tracking. Analytics and performance trends.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Improves visibility and decision-making with learning progress insights</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">User Onboarding</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Simple, guided onboarding with role selection (Student/Admin), profile setup, and preference configuration.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Faster activation for new users with intuitive setup</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Authentication Module</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Secure login, signup, password reset, session management with JWT tokens. Role-based access and secure password hashing.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Ensures safe and compliant access with enterprise-grade security</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">AI Feedback System</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Comprehensive feedback: mistakes, fixes, improved answers, scores, criteria breakdown (communication, relevance, technical depth), improvement suggestions.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Delivers actionable insights and specific skill recommendations</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Results Review</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Review page with explanations, correct/incorrect answers, statistics, and learning recommendations.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Detailed learning from mistakes and post-practice analysis</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Responsive Design</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Mobile-first approach, adaptive layouts, and touch-friendly interfaces for desktop, tablet, and mobile.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Ensures accessibility and seamless practice across all devices</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Resume ATS Scoring</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI-powered resume analysis with ATS (Applicant Tracking System) scoring, keyword analysis, and improvement recommendations. Supports PDF and DOCX formats.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Helps students optimize their resumes for better job application success rates</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Job Application Automation</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Automated job application submission on popular job portals (Naukri, FoundIt, LinkedIn, Unstop) with intelligent matching and application tracking.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Streamlines job search process and increases application efficiency</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Coding Round Practice</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Dedicated coding assessment rounds with code editor, real-time evaluation, and AI-powered feedback for software engineering roles.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Provides hands-on coding practice with instant feedback for technical roles</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Playlist Generation</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">AI-curated YouTube playlists for skill development based on job role requirements and identified skill gaps.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Offers personalized learning resources to bridge skill gaps</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">College Admin Dashboard</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Comprehensive dashboard for college administrators to monitor student performance, generate reports, and track department-wise analytics.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Enables institutions to track and improve student placement readiness</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">System Admin Panel</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Centralized administration panel for managing colleges, creating student accounts, and monitoring platform-wide analytics.</td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">Provides platform management and oversight capabilities</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Enhancements / Improvements */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Enhancements / Improvements</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 italic">(Since this is the first release, these represent refinements during development)</p>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  UI/UX Polishing
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• Implemented sliding indicator animations for assessment type and difficulty selection</li>
                  <li>• Added professional exam-style interface with gradient backgrounds and modern card designs</li>
                  <li>• Enhanced visual feedback with hover effects, scale transforms, and smooth transitions (500ms duration)</li>
                  <li>• Improved responsive design for mobile, tablet, and desktop views</li>
                  <li>• Added backdrop blur effects and glass-morphism design elements</li>
                  <li>• Color-coded difficulty indicators (Blue for Easy, Green for Medium, Dark for Hard)</li>
                  <li>• Professional question number badges with gradient backgrounds</li>
                  <li>• Enhanced option buttons with circular letter indicators and selection states</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Performance Tuning
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• Optimized API response times for question generation (reduced from 30s to 15-20s)</li>
                  <li>• Implemented caching for frequently accessed questions</li>
                  <li>• Reduced frontend bundle size with code splitting</li>
                  <li>• Optimized database queries with proper indexing</li>
                  <li>• Lazy loading for large question sets</li>
                  <li>• Efficient state management to reduce re-renders</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Basic Analytics Integrated
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• User practice session tracking</li>
                  <li>• Score history and performance trends</li>
                  <li>• Question difficulty analytics</li>
                  <li>• User engagement metrics</li>
                  <li>• Time spent per question tracking</li>
                  <li>• Practice completion rates</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-500" />
                  Improved API Response Structures
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• Standardized response formats across all endpoints</li>
                  <li>• Comprehensive error handling with detailed error messages</li>
                  <li>• Consistent data models for questions, feedback, and evaluations</li>
                  <li>• Proper HTTP status codes and error responses</li>
                  <li>• Request/response validation using Pydantic models</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Better Error Handling
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• User-friendly error messages for API failures</li>
                  <li>• Graceful fallbacks for browser compatibility issues</li>
                  <li>• Comprehensive validation for all user inputs</li>
                  <li>• Network error recovery mechanisms</li>
                  <li>• Database connection error handling</li>
                  <li>• Microphone permission error handling with clear instructions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Audio Input Enhancements
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• Web Speech API integration for live transcription</li>
                  <li>• Microphone permission handling with clear error messages</li>
                  <li>• Audio recording with MediaRecorder API</li>
                  <li>• Browser compatibility checks and fallbacks</li>
                  <li>• Real-time transcript display in textarea</li>
                  <li>• Clear response functionality that stops recording</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  AI Feedback Optimization
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• Enhanced LLM prompts for more detailed feedback</li>
                  <li>• Added "suggestions" field for what more users can say</li>
                  <li>• Improved scoring criteria (Communication, Relevance, Technical Depth)</li>
                  <li>• Better structured feedback with actionable tips</li>
                  <li>• Context-aware suggestions based on job role and topic</li>
                  <li>• Multi-criteria evaluation for comprehensive assessment</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-500" />
                  Code Quality Improvements
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-7">
                  <li>• TypeScript for type safety in frontend</li>
                  <li>• Pydantic models for data validation in backend</li>
                  <li>• Comprehensive error logging</li>
                  <li>• Code documentation and comments</li>
                  <li>• Consistent coding standards</li>
                  <li>• Modular component architecture</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Bug Fixes */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bug className="w-6 h-6 text-red-500" />
              5. Bug Fixes
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              All major blockers identified during internal QA and UAT have been resolved for Version 1.0, including:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Audio Input Issues</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved microphone permission handling with proper error messages</li>
                  <li>• Fixed speech recognition initialization errors</li>
                  <li>• Improved browser compatibility checks</li>
                  <li>• Fixed audio recording start/stop functionality</li>
                  <li>• Resolved textarea sync with live transcript</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Clear Response Functionality</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Now properly clears live transcript, interim transcript, and saved responses</li>
                  <li>• Stops recording when clearing response</li>
                  <li>• Resets all related state correctly</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed UI Responsiveness</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved layout issues on mobile devices</li>
                  <li>• Fixed sliding indicator positioning calculations</li>
                  <li>• Improved button touch targets for mobile</li>
                  <li>• Fixed grid layouts for different screen sizes</li>
                  <li>• Resolved text overflow issues</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Tailwind CSS Errors</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved `@apply` directive issues in globals.css</li>
                  <li>• Fixed custom CSS class definitions</li>
                  <li>• Corrected slider styling for range inputs</li>
                  <li>• Fixed animation keyframes</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed API Authentication</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved JWT token refresh issues</li>
                  <li>• Fixed session expiration handling</li>
                  <li>• Improved error messages for authentication failures</li>
                  <li>• Fixed password reset functionality</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Question Generation</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved timeout issues for large question sets</li>
                  <li>• Fixed caching problems</li>
                  <li>• Improved error handling for AI generation failures</li>
                  <li>• Fixed question format inconsistencies</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Database Connection Issues</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Improved connection pooling</li>
                  <li>• Better error messages for database failures</li>
                  <li>• Fixed migration issues</li>
                  <li>• Resolved connection timeout problems</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Fixed Frontend State Management</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Resolved state synchronization issues</li>
                  <li>• Fixed component re-rendering problems</li>
                  <li>• Improved data flow between components</li>
                  <li>• Fixed memory leaks in event listeners</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Performance & Security Updates */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              6. Performance & Security Updates
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Role-Based Access Controls</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Student role for practice access</li>
                  <li>• Admin role for system management</li>
                  <li>• Proper permission checks on all endpoints</li>
                  <li>• Secure route protection</li>
                  <li>• Token-based authentication</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ API Rate Limits & Validations</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Request validation using Pydantic models</li>
                  <li>• Input sanitization to prevent injection attacks</li>
                  <li>• Rate limiting on authentication endpoints</li>
                  <li>• Request size limits</li>
                  <li>• File upload validation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Optimized Backend Queries</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Database indexing on frequently queried fields</li>
                  <li>• Efficient joins and query optimization</li>
                  <li>• Caching for question generation results</li>
                  <li>• Connection pooling for better performance</li>
                  <li>• Query result pagination</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Logging & Monitoring</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Comprehensive logging for API requests and errors</li>
                  <li>• User activity tracking for analytics</li>
                  <li>• Performance monitoring for critical endpoints</li>
                  <li>• Error tracking and alerting</li>
                  <li>• Audit logs for security events</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Security Enhancements</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• JWT token-based authentication with refresh tokens</li>
                  <li>• Password hashing using secure algorithms (bcrypt)</li>
                  <li>• CORS configuration for frontend access</li>
                  <li>• Input validation and sanitization</li>
                  <li>• SQL injection prevention through ORM</li>
                  <li>• XSS protection in frontend</li>
                  <li>• CSRF protection measures</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Data Privacy</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Secure storage of user responses</li>
                  <li>• No storage of sensitive audio data</li>
                  <li>• GDPR-compliant data handling practices</li>
                  <li>• User data encryption at rest</li>
                  <li>• Secure API communication (HTTPS ready)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Performance Optimizations</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Lazy loading of components</li>
                  <li>• Code splitting for faster initial load</li>
                  <li>• Image optimization</li>
                  <li>• CSS minification</li>
                  <li>• JavaScript bundling and minification</li>
                  <li>• Database query optimization</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Technical Specifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">9. Technical Specifications</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Frontend Technology Stack
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Framework: Next.js 14+ (React 18+)</li>
                  <li>• Styling: Tailwind CSS 3+</li>
                  <li>• Language: TypeScript 5+</li>
                  <li>• State Management: React Hooks (useState, useEffect, useContext)</li>
                  <li>• API Communication: Fetch API with async/await</li>
                  <li>• Audio: Web Speech API (SpeechRecognition, SpeechSynthesis)</li>
                  <li>• Recording: MediaRecorder API</li>
                  <li>• Icons: Lucide React</li>
                  <li>• Build Tool: Next.js built-in bundler</li>
                  <li>• Package Manager: npm</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backend Technology Stack
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Framework: FastAPI (Python 3.10+)</li>
                  <li>• Database: PostgreSQL 14+</li>
                  <li>• ORM: SQLAlchemy 2.0+</li>
                  <li>• Migrations: Alembic</li>
                  <li>• Authentication: JWT (python-jose)</li>
                  <li>• Password Hashing: bcrypt (passlib)</li>
                  <li>• AI/LLM: Cohere API and OpenAI GPT-4/GPT-3.5</li>
                  <li>• API Documentation: OpenAPI/Swagger</li>
                  <li>• Validation: Pydantic V2</li>
                  <li>• Async Support: asyncio, aiofiles</li>
                  <li>• Caching: Redis</li>
                  <li>• Background Tasks: Celery with Redis</li>
                  <li>• File Storage: AWS S3 (boto3)</li>
                  <li>• Web Scraping: Playwright, Selenium, BeautifulSoup</li>
                  <li>• PDF Processing: PyPDF, python-docx, ReportLab</li>
                  <li>• Monitoring: Sentry SDK, Structlog</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Infrastructure
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Deployment: Docker containers</li>
                  <li>• Server: Production-ready ASGI server (Uvicorn)</li>
                  <li>• Database: Managed PostgreSQL instance</li>
                  <li>• File Storage: AWS S3</li>
                  <li>• CDN: CloudFront (AWS)</li>
                  <li>• Monitoring: Sentry SDK, Structlog for structured logging</li>
                  <li>• Environment: Environment-based configuration (.env)</li>
                  <li>• Background Jobs: Celery workers with Flower monitoring</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Development Tools
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Version Control: Git</li>
                  <li>• Code Quality: ESLint, Prettier (frontend)</li>
                  <li>• Code Quality: Black, Flake8 (backend)</li>
                  <li>• Testing: Jest (frontend), Pytest (backend) - planned</li>
                  <li>• Documentation: Markdown, Swagger/OpenAPI</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Installation & Setup */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Download className="w-6 h-6" />
              10. Installation & Setup
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Prerequisites</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Node.js 18+ and npm</li>
                  <li>• Python 3.10+</li>
                  <li>• PostgreSQL 14+</li>
                  <li>• Redis (optional, for caching)</li>
                  <li>• Docker (optional, for containerized deployment)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Start Guide</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backend Setup:</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
{`# Navigate to backend directory
cd saksham-server
# Create virtual environment
python -m venv venv
source venv/bin/activate # On Windows: venv\\Scripts\\activate
# Install dependencies
pip install -r requirements.txt
# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys
# Run database migrations
alembic upgrade head
# Start server
uvicorn main:app --reload`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Frontend Setup:</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
{`# Navigate to frontend directory
cd saksham-ui
# Install dependencies
npm install
# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL
# Start development server
npm run dev`}
                    </pre>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Environment Variables</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backend (.env):</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
{`DATABASE_URL=postgresql://user:password@localhost:5432/saksham_db
SECRET_KEY=your-secret-key-here
COHERE_API_KEY=your-cohere-api-key
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Frontend (.env.local):</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
{`NEXT_PUBLIC_API_URL=http://localhost:8000`}
                    </pre>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Docker Deployment (Optional):</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
{`# Build and run with Docker Compose
docker-compose up -d`}
                </pre>
              </div>
            </div>
          </motion.section>

          {/* Support & Documentation */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              11. Support & Documentation
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Documentation Resources</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>API Documentation:</strong> Available at `/docs` endpoint (Swagger UI) when server is running</li>
                  <li>• <strong>User Guide:</strong> Available in the application help section</li>
                  <li>• <strong>Developer Documentation:</strong> Available in repository README files</li>
                  <li>• <strong>Architecture Documentation:</strong> Available in `/documents` directory</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Support Channels</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Email Support:</strong> support@hirekarma.in</li>
                  <li>• <strong>Issue Tracker:</strong> GitHub Issues</li>
                  <li>• <strong>Community Forum:</strong> [Link to forum - to be added]</li>
                  <li>• <strong>Knowledge Base:</strong> [Link to KB - to be added]</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Training Resources</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Video tutorials for each practice module</li>
                  <li>• Best practices guide for interview preparation</li>
                  <li>• FAQ section addressing common questions</li>
                  <li>• Sample practice sessions</li>
                  <li>• Tips and tricks for maximizing practice effectiveness</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Getting Help</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Check the FAQ section first</li>
                  <li>• Review the user guide</li>
                  <li>• Search existing issues on GitHub</li>
                  <li>• Contact support for critical issues</li>
                  <li>• Join the community forum for discussions</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Acknowledgements */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              12. Acknowledgements
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Development Team</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Backend Developers:</strong> For building a robust, scalable API architecture</li>
                  <li>• <strong>Frontend Developers:</strong> For creating an intuitive and beautiful user interface</li>
                  <li>• <strong>AI/ML Engineers:</strong> For integrating advanced AI capabilities</li>
                  <li>• <strong>QA Team:</strong> For thorough testing and bug identification</li>
                  <li>• <strong>DevOps Team:</strong> For infrastructure and deployment support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Beta Testers</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• All early adopters who provided valuable feedback during the testing phase</li>
                  <li>• Engineering students who participated in beta testing and provided insights</li>
                  <li>• Career counselors who validated the career guidance features</li>
                  <li>• Interview coaches who reviewed the feedback quality</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Open Source Community</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Next.js Team:</strong> For the amazing React framework and developer experience</li>
                  <li>• <strong>FastAPI Team:</strong> For the high-performance Python framework</li>
                  <li>• <strong>Tailwind CSS Team:</strong> For the utility-first CSS framework</li>
                  <li>• <strong>Cohere:</strong> For the powerful LLM API that powers our AI features</li>
                  <li>• <strong>PostgreSQL Community:</strong> For the robust database system</li>
                  <li>• <strong>All Contributors:</strong> To the open source libraries that made this project possible</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Special Thanks</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• All early adopters who provided feedback during the development phase</li>
                  <li>• Engineering students who participated in beta testing across multiple branches</li>
                  <li>• Career counselors who validated the career guidance features</li>
                  <li>• University partners who provided testing environments</li>
                  <li>• Mentors and advisors who guided the product development</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Technology Partners</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Cohere for AI/LLM capabilities</li>
                  <li>• PostgreSQL for reliable data storage</li>
                  <li>• Redis for caching and performance</li>
                  <li>• AWS (if applicable) for cloud infrastructure</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Known Issues */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              7. Known Issues
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>No major known issues at launch.</strong> Minor cosmetic items will be addressed in Version 1.1:
            </p>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Browser Compatibility:</strong> Some browsers may require manual microphone permission grants. Chrome and Edge are recommended for best experience.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>TTS Quality:</strong> Text-to-Speech (TTS) quality varies by browser. Chrome provides the best TTS experience for Group Discussion practice.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Large Question Sets:</strong> Very large question sets (50+ questions) may take 20-30 seconds to generate. Progress indicators are shown during generation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Long Question Texts:</strong> Very long question texts may require scrolling on smaller screens. This is expected behavior.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Network Latency:</strong> In areas with slow internet, audio transcription may have slight delays. This is dependent on network speed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span><strong>Mobile Audio:</strong> Some mobile browsers may have limitations with audio recording. Desktop browsers are recommended for best audio experience.</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Workarounds:</h4>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li>• Use Chrome or Edge for best compatibility</li>
                <li>• Ensure stable internet connection for AI features</li>
                <li>• Grant microphone permissions when prompted</li>
                <li>• Use desktop for audio-intensive features</li>
              </ul>
            </div>
          </motion.section>

          {/* Roadmap */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">8. Roadmap (Next Release)</h2>
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Version 1.1 (Planned for Q1 2025)</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Feature Refinements:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Enhanced AI feedback with more personalized suggestions</li>
                      <li>• Additional question types (coding challenges, case studies, scenario-based)</li>
                      <li>• Practice history and analytics dashboard with detailed insights</li>
                      <li>• Performance comparison with peer averages</li>
                      <li>• Custom practice session creation</li>
                      <li>• Bookmark favorite questions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Workflow Automations:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Automated practice reminders via email</li>
                      <li>• Smart question recommendations based on weak areas</li>
                      <li>• Progress tracking and milestone achievements</li>
                      <li>• Email notifications for practice completion</li>
                      <li>• Weekly progress reports</li>
                      <li>• Personalized learning paths</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Advanced Reporting:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Detailed performance analytics with charts and graphs</li>
                      <li>• Skill gap analysis with visualizations</li>
                      <li>• Improvement trajectory charts over time</li>
                      <li>• Exportable practice reports (PDF)</li>
                      <li>• Comparative analysis with industry standards</li>
                      <li>• Career readiness score</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Third-Party Integrations:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Integration with popular job portals (Naukri, LinkedIn, etc.)</li>
                      <li>• LinkedIn profile analysis and recommendations</li>
                      <li>• Resume builder integration</li>
                      <li>• Calendar integration for practice scheduling</li>
                      <li>• Google Calendar sync for practice reminders</li>
                      <li>• Slack/Teams notifications for team practice sessions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Additional Features:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Mock interview scheduling with AI</li>
                      <li>• Video interview practice with webcam support</li>
                      <li>• Peer practice sessions (multi-user)</li>
                      <li>• Certification badges for completed modules</li>
                      <li>• Leaderboards and competitions</li>
                      <li>• Social sharing of achievements</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Version 1.2 (Planned for Q2 2025)</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Advanced AI Features:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Advanced AI coaching with personalized learning paths</li>
                      <li>• Adaptive difficulty adjustment based on performance</li>
                      <li>• AI-powered resume optimization</li>
                      <li>• Interview question prediction based on job role</li>
                      <li>• Personalized study plans</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Platform Expansion:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Multi-language support (Hindi, regional languages)</li>
                      <li>• Mobile app (iOS & Android)</li>
                      <li>• Offline practice mode</li>
                      <li>• Advanced analytics and insights</li>
                      <li>• AI-powered career path recommendations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enterprise Features:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Organization/college-level dashboards</li>
                      <li>• Bulk user management</li>
                      <li>• Custom branding</li>
                      <li>• Advanced reporting for institutions</li>
                      <li>• API access for integrations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Community Features:</h4>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• Discussion forums</li>
                      <li>• Peer review system</li>
                      <li>• Study groups</li>
                      <li>• Mentorship matching</li>
                      <li>• Success stories and testimonials</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">13. Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Product Team</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>Product Manager:</strong> [Name]</li>
                  <li>• <strong>Technical Lead:</strong> [Name]</li>
                  <li>• <strong>Design Lead:</strong> [Name]</li>
                  <li>• <strong>AI/ML Lead:</strong> [Name]</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Company Information</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>Company:</strong> HireKarma</li>
                  <li>• <strong>Website:</strong> https://hirekarma.in</li>
                  <li>• <strong>Email:</strong> info@hirekarma.in</li>
                  <li>• <strong>Support Email:</strong> support@hirekarma.in</li>
                  <li>• <strong>Sales Email:</strong> sales@hirekarma.in</li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Social Media</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>• <strong>LinkedIn:</strong> [Link]</li>
                <li>• <strong>Twitter:</strong> [Link]</li>
                <li>• <strong>GitHub:</strong> [Link]</li>
              </ul>
            </div>
          </motion.section>

          {/* Changelog Summary */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              14. Changelog Summary
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Version 1.0.0 (November 2025) - Initial Release</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Core Features:</h4>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>✅ Assessment Skills Practice (Aptitude & Soft Skills)</li>
                      <li>✅ Technical Skills Practice (18+ engineering branches)</li>
                      <li>✅ Interview Practice (Technical & HR)</li>
                      <li>✅ Group Discussion Practice (AI-simulated)</li>
                      <li>✅ Coding Round Practice (for software engineering roles)</li>
                      <li>✅ Career Guidance Module</li>
                      <li>✅ Resume ATS Scoring and Analysis</li>
                      <li>✅ Job Application Automation (Naukri, FoundIt, LinkedIn, Unstop)</li>
                      <li>✅ Playlist Generation for Skill Development</li>
                      <li>✅ User Authentication & Authorization</li>
                      <li>✅ AI-powered Question Generation (Cohere & OpenAI)</li>
                      <li>✅ Comprehensive Feedback System</li>
                      <li>✅ Results Review & Analytics</li>
                      <li>✅ College Admin Dashboard</li>
                      <li>✅ System Admin Panel</li>
                      <li>✅ Responsive UI/UX Design</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Technical Implementation:</h4>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>✅ FastAPI backend with PostgreSQL</li>
                    <li>✅ Next.js frontend with TypeScript</li>
                    <li>✅ JWT authentication</li>
                    <li>✅ Cohere LLM and OpenAI GPT integration</li>
                    <li>✅ Web Speech API integration</li>
                    <li>✅ Docker containerization</li>
                    <li>✅ Alembic migrations</li>
                    <li>✅ Redis caching and Celery background tasks</li>
                    <li>✅ AWS S3 file storage</li>
                    <li>✅ API documentation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">UI/UX Enhancements:</h4>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>✅ Professional exam-style interface</li>
                      <li>✅ Sliding indicator animations</li>
                      <li>✅ Responsive design (mobile, tablet, desktop)</li>
                      <li>✅ Modern gradient designs</li>
                      <li>✅ Smooth transitions and animations</li>
                      <li>✅ Color-coded status indicators</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Upgrade Instructions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Download className="w-6 h-6" />
              15. Upgrade Instructions
            </h2>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">From Development to Production</h3>
              <ol className="space-y-4 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>1. Backup Database:</strong>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-2 text-sm text-gray-800 dark:text-gray-200">
{`pg_dump -U postgres saksham_db > backup.sql`}
                  </pre>
                </li>
                <li>
                  <strong>2. Update Environment Variables:</strong>
                  <ul className="list-disc list-inside mt-2 ml-4">
                    <li>Set `APP_ENV=production`</li>
                    <li>Update `DATABASE_URL` for production database</li>
                    <li>Set secure `SECRET_KEY`</li>
                    <li>Configure production API keys</li>
                  </ul>
                </li>
                <li>
                  <strong>3. Run Migrations:</strong>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-2 text-sm text-gray-800 dark:text-gray-200">
{`alembic upgrade head`}
                  </pre>
                </li>
                <li>
                  <strong>4. Build Frontend:</strong>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-2 text-sm text-gray-800 dark:text-gray-200">
{`npm run build`}
                  </pre>
                </li>
                <li>
                  <strong>5. Deploy:</strong>
                  <ul className="list-disc list-inside mt-2 ml-4">
                    <li>Follow deployment guide in documentation</li>
                    <li>Use Docker for containerized deployment</li>
                    <li>Configure reverse proxy (nginx/Apache)</li>
                    <li>Set up SSL certificates</li>
                  </ul>
                </li>
              </ol>
            </div>
          </motion.section>

          {/* License & Legal */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              16. License & Legal
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <strong>License:</strong> Proprietary</li>
              <li>• <strong>Copyright:</strong> © 2024 HireKarma. All rights reserved.</li>
              <li>• <strong>Terms of Service:</strong> [Link to ToS]</li>
              <li>• <strong>Privacy Policy:</strong> [Link to Privacy Policy]</li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                <strong>End of Release Notes</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                For detailed technical documentation, please refer to the developer documentation in the repository.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                For user guides and tutorials, please visit our knowledge base.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Thank you for using AI Placement Simulator!
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

