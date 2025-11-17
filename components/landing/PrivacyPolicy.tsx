'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, User, Database, Globe, AlertCircle, CheckCircle, Mail, Calendar } from 'lucide-react';
import { AnimatedBackground } from '@/components/ui/animated-background';

export function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Last Updated: November 2025</span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Welcome to <strong>HireKarma</strong> (also referred to as "SolviQ AI", "we", "us", or "our"). 
              We are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our AI Placement Simulator platform.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              By using our platform, you agree to the collection and use of information in accordance with this 
              Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-r-lg">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Our Commitment:</p>
              <p className="text-gray-700 dark:text-gray-300">
                We are dedicated to maintaining the confidentiality of your personal information and providing you 
                with transparency about how we handle your data.
              </p>
            </div>
          </motion.section>

          {/* Information We Collect */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              2. Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.1. Personal Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  When you register for an account, we collect the following personal information:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Account Information:</strong> Name, email address, phone number, password (hashed)</li>
                  <li>• <strong>Profile Information:</strong> Profile picture, bio, date of birth, gender</li>
                  <li>• <strong>Location Data:</strong> Country, state, city</li>
                  <li>• <strong>Contact Information:</strong> Email and phone number for communication</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.2. Academic Information</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  To provide personalized assessment experiences, we collect academic details:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Institutional Data:</strong> Institution name, degree, branch, major, graduation year</li>
                  <li>• <strong>Academic Performance:</strong> 10th grade percentage, 12th grade percentage, CGPA, overall percentage</li>
                  <li>• <strong>Skills:</strong> Technical skills, soft skills, certifications, language proficiency</li>
                  <li>• <strong>Career Preferences:</strong> Preferred industry, job roles of interest, location preferences</li>
                  <li>• <strong>Extracurricular Activities:</strong> Activities and achievements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.3. Assessment Data</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  When you use our assessment features, we collect:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Assessment Responses:</strong> Answers to aptitude, technical, and soft skills questions</li>
                  <li>• <strong>Performance Scores:</strong> Test scores, round-wise performance, overall readiness index</li>
                  <li>• <strong>Interview Data:</strong> Audio recordings (if enabled), transcripts, AI-generated feedback</li>
                  <li>• <strong>Group Discussion Data:</strong> Participation records, evaluation scores, feedback</li>
                  <li>• <strong>Coding Submissions:</strong> Code solutions, execution results, evaluation metrics</li>
                  <li>• <strong>Time Tracking:</strong> Time spent on questions, assessment duration, completion rates</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.4. Resume and Job Application Data</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  When you upload resumes or use job application features:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Resume Files:</strong> PDF or DOCX resume documents uploaded to our platform</li>
                  <li>• <strong>ATS Analysis:</strong> Resume content, ATS scores, keyword analysis, improvement recommendations</li>
                  <li>• <strong>Job Application Records:</strong> Job applications submitted through our platform, application status</li>
                  <li>• <strong>Job Portal Data:</strong> Data synced from job portals (Naukri, FoundIt, LinkedIn, Unstop) when using automation features</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.5. Usage and Analytics Data</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We automatically collect certain information when you use our platform:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                  <li>• <strong>Usage Patterns:</strong> Pages visited, features used, session duration, click patterns</li>
                  <li>• <strong>Technical Data:</strong> IP address, browser cookies, log files, error reports</li>
                  <li>• <strong>Performance Metrics:</strong> Load times, API response times, feature usage statistics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">2.6. Audio and Media Data</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  For interview and group discussion features:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Audio Recordings:</strong> Voice recordings during mock interviews and group discussions (with your explicit consent)</li>
                  <li>• <strong>Transcripts:</strong> Text transcripts generated from audio recordings for evaluation</li>
                  <li>• <strong>Note:</strong> We do not permanently store raw audio files. Only transcripts and evaluation data are retained.</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* How We Use Your Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              3. How We Use Your Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Service Delivery</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To provide, maintain, and improve our AI Placement Simulator platform, including assessment generation, 
                    evaluation, feedback, and analytics services.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalization</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To personalize your experience by providing job recommendations, customized assessment questions, 
                    career guidance, and skill development playlists based on your profile and performance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assessment and Evaluation</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To conduct assessments, evaluate responses, generate AI-powered feedback, calculate scores, 
                    and provide detailed performance analytics and readiness reports.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Communication</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To send you service-related notifications, assessment results, performance reports, 
                    job recommendations, updates about your account, and respond to your inquiries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics and Improvement</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To analyze usage patterns, platform performance, user engagement, and effectiveness of our 
                    services to improve features, fix bugs, and enhance user experience.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Job Application Services</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To facilitate job applications on external job portals, analyze resumes for ATS compatibility, 
                    and provide job matching recommendations based on your profile.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">College and Institutional Reporting</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    For college administrators and institutions: to generate aggregate analytics, department-wise 
                    performance reports, student progress tracking, and placement readiness insights (with appropriate 
                    permissions and data anonymization where applicable).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Security and Compliance</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    To ensure platform security, prevent fraud, detect unauthorized access, comply with legal 
                    obligations, enforce our terms of service, and protect the rights and safety of our users.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Data Sharing and Disclosure */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6" />
              4. Data Sharing and Disclosure
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We respect your privacy and do not sell your personal information. We may share your information 
              only in the following circumstances:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.1. Service Providers</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  We may share data with trusted third-party service providers who assist us in operating our platform:
                </p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>AI/LLM Providers:</strong> Cohere and OpenAI for question generation, evaluation, and feedback</li>
                  <li>• <strong>Cloud Storage:</strong> AWS S3 for secure file storage (resumes, documents)</li>
                  <li>• <strong>Database Services:</strong> Managed PostgreSQL for data storage</li>
                  <li>• <strong>Analytics Services:</strong> For usage analytics and performance monitoring</li>
                  <li>• <strong>Email Services:</strong> For sending notifications and communications</li>
                  <li>• <strong>Payment Processors:</strong> For processing subscription payments (when applicable)</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm italic">
                  All service providers are contractually obligated to maintain confidentiality and use data only 
                  for specified purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.2. College Administrators</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  If you are a student associated with a college account, your performance data and analytics may 
                  be accessible to authorized college administrators for institutional monitoring, reporting, and 
                  placement preparation purposes. This access is limited to aggregate performance data and does not 
                  include sensitive personal information unless explicitly authorized.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.3. Job Portal Integrations</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  When you use our job application automation features, we may share your resume and profile 
                  information with job portals (Naukri, FoundIt, LinkedIn, Unstop) to facilitate job applications. 
                  This sharing is done only with your explicit consent when you initiate a job application.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.4. Legal Requirements</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  We may disclose your information if required by law, legal process, or government request, or to:
                </p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Comply with applicable laws, regulations, or court orders</li>
                  <li>• Respond to government or law enforcement requests</li>
                  <li>• Protect our rights, privacy, safety, or property</li>
                  <li>• Prevent or investigate fraud, security issues, or violations of our terms</li>
                  <li>• Enforce our terms of service or other agreements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.5. Business Transfers</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  In the event of a merger, acquisition, reorganization, or sale of assets, your information may 
                  be transferred as part of the transaction. We will notify you of any such change in ownership 
                  or control of your personal information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4.6. Aggregated and Anonymized Data</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We may share aggregated, anonymized, or de-identified data that cannot reasonably be used to 
                  identify you for research, analytics, industry insights, or marketing purposes.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Data Security */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              5. Data Security
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement industry-standard security measures to protect your personal information from unauthorized 
              access, alteration, disclosure, or destruction:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Encryption</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Data transmitted between your browser and our servers is encrypted using SSL/TLS protocols. 
                    Sensitive data stored in our databases is encrypted at rest.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authentication and Access Control</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We use JWT-based authentication with secure password hashing (bcrypt). Access to personal data 
                    is restricted to authorized personnel only, with role-based access controls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Infrastructure</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our platform is hosted on secure cloud infrastructure (AWS) with regular security updates, 
                    firewall protection, and intrusion detection systems.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Regular Security Audits</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We conduct regular security assessments, vulnerability scans, and code reviews to identify and 
                    address potential security risks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Data Backup and Recovery</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Regular automated backups ensure data availability and recovery in case of system failures or 
                    data loss incidents.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Important Note:</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  While we implement strong security measures, no method of transmission over the internet or 
                  electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed 
                  to protecting your data to the best of our ability.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Data Retention */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Database className="w-6 h-6" />
              6. Data Retention
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We retain your personal information for as long as necessary to provide our services and fulfill 
              the purposes outlined in this Privacy Policy:
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Data</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We retain your account information and profile data for as long as your account is active. 
                  If you delete your account, we will delete or anonymize your personal information within 
                  30 days, except where we are required to retain it for legal or legitimate business purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assessment Data</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Assessment responses, scores, and performance data are retained to provide you with historical 
                  progress tracking and analytics. You can request deletion of specific assessment records, but 
                  aggregate analytics may be retained in anonymized form.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Audio Recordings</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We do not permanently store raw audio recordings. Only transcripts and evaluation data derived 
                  from recordings are retained, and only for as long as necessary to provide feedback and analytics.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resume Files</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Uploaded resume files are retained for ATS analysis and job application purposes. You can 
                  delete your resumes at any time through your account settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Legal and Compliance</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We may retain certain information longer if required by law, regulation, or to resolve disputes, 
                  enforce our agreements, or protect our legal rights.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Your Rights and Choices */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              7. Your Rights and Choices
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You have the following rights regarding your personal information:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.1. Access and Portability</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  You can access, review, and export your personal information and assessment data through your 
                  account dashboard. You may request a copy of your data in a structured, machine-readable format.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.2. Correction and Update</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  You can update your profile information, academic details, and preferences at any time through 
                  your account settings. You are responsible for keeping your information accurate and up-to-date.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.3. Deletion</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  You can request deletion of your account and personal information by contacting us. We will 
                  process your request within 30 days, subject to legal and contractual obligations that may 
                  require us to retain certain information.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.4. Opt-Out and Preferences</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  You can manage your communication preferences and opt-out of:
                </p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• Marketing emails and promotional communications</li>
                  <li>• Job recommendation notifications</li>
                  <li>• Performance report emails (you can still access reports in your dashboard)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.5. Audio Recording Consent</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Audio recording for interviews and group discussions requires your explicit consent. You can 
                  control recording permissions through your browser settings and can choose to disable recording 
                  features. Note that disabling recording may limit certain evaluation capabilities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7.6. Data Processing Objection</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  You can object to certain types of data processing, such as automated decision-making or 
                  profiling, where applicable under applicable data protection laws.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How to Exercise Your Rights:</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  To exercise any of these rights, please contact us at:
                </p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Email:</strong> <a href="mailto:privacy@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">privacy@hirekarma.in</a></li>
                  <li>• <strong>Support Email:</strong> <a href="mailto:support@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">support@hirekarma.in</a></li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">
                  We will respond to your request within 30 days and may require verification of your identity 
                  for security purposes.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Cookies and Tracking Technologies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">8. Cookies and Tracking Technologies</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies and similar tracking technologies to enhance your experience on our platform:
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Essential Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Required for platform functionality, authentication, and security. These cannot be disabled 
                  without affecting core features.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Help us understand how users interact with our platform, identify usage patterns, and improve 
                  our services. These are optional and can be managed through your browser settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Session Management</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We use session tokens (JWT) stored securely to maintain your login session and provide 
                  seamless access to your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cookie Controls</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  You can control cookies through your browser settings. However, disabling certain cookies 
                  may limit platform functionality. Most browsers allow you to refuse or delete cookies.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Third-Party Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">9. Third-Party Services</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our platform integrates with third-party services. This Privacy Policy does not apply to third-party 
              services, and we are not responsible for their privacy practices:
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Service Providers</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>• <strong>Cohere:</strong> For LLM-based question generation and evaluation</li>
                  <li>• <strong>OpenAI (GPT):</strong> For AI-powered feedback, analysis, and career guidance</li>
                  <li>• Please review their privacy policies: <a href="https://cohere.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">Cohere Privacy Policy</a>, <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">OpenAI Privacy Policy</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Job Portals</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  When using job application automation, you interact with external job portals (Naukri, FoundIt, 
                  LinkedIn, Unstop). Their privacy policies govern the data you share with them directly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cloud Services</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We use AWS (Amazon Web Services) for infrastructure, storage, and hosting. Data stored on AWS 
                  is subject to AWS security and privacy practices.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics Services</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We may use analytics services to monitor platform performance and usage. These services may 
                  collect anonymized usage data.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Children's Privacy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">10. Children's Privacy</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our platform is designed for college students and job seekers who are typically 16 years or older. 
              We do not knowingly collect personal information from children under 16 years of age without 
              parental consent.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-gray-700 dark:text-gray-300">
                If you are a parent or guardian and believe that your child has provided us with personal 
                information, please contact us immediately. We will delete such information from our records 
                upon verification.
              </p>
            </div>
          </motion.section>

          {/* International Data Transfers */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">11. International Data Transfers</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than your country of 
              residence. These countries may have data protection laws that differ from those in your country.
            </p>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We ensure that appropriate safeguards are in place to protect your data when it is transferred 
              internationally, including:
            </p>

            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>• Standard contractual clauses approved by data protection authorities</li>
              <li>• Compliance with applicable data protection regulations</li>
              <li>• Regular security assessments of our international service providers</li>
              <li>• Encryption and security measures for data in transit and at rest</li>
            </ul>
          </motion.section>

          {/* Changes to This Privacy Policy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">12. Changes to This Privacy Policy</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or for other operational, legal, or regulatory reasons.
            </p>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When we make material changes, we will:
            </p>

            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4 mb-4">
              <li>• Update the "Last Updated" date at the top of this Privacy Policy</li>
              <li>• Notify you via email or through a prominent notice on our platform</li>
              <li>• Provide advance notice for significant changes (typically 30 days)</li>
            </ul>

            <p className="text-gray-700 dark:text-gray-300">
              Your continued use of our platform after the effective date of any changes constitutes your 
              acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy 
              periodically.
            </p>
          </motion.section>

          {/* Contact Us */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              13. Contact Us
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data 
              practices, please contact us:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Privacy Inquiries</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>Email:</strong> <a href="mailto:privacy@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">privacy@hirekarma.in</a></li>
                  <li>• <strong>Subject Line:</strong> Privacy Policy Inquiry</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">General Contact</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>Company:</strong> HireKarma Pvt Ltd</li>
                  <li>• <strong>Email:</strong> <a href="mailto:info@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">info@hirekarma.in</a></li>
                  <li>• <strong>Support:</strong> <a href="mailto:support@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">support@hirekarma.in</a></li>
                  <li>• <strong>Phone:</strong> +91 90786 83876</li>
                  <li>• <strong>Address:</strong> Room No: 109, 1st Floor, Tower A, O-HUB, Bhubaneswar</li>
                  <li>• <strong>Website:</strong> <a href="https://www.hirekarma.in" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">www.hirekarma.in</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data Protection Officer</h4>
              <p className="text-gray-700 dark:text-gray-300">
                For inquiries related to data protection, GDPR compliance, or data subject rights, please 
                contact our Data Protection Officer at <a href="mailto:privacy@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline">privacy@hirekarma.in</a>.
              </p>
            </div>
          </motion.section>

          {/* Governing Law */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">14. Governing Law</h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This Privacy Policy is governed by the laws of India. Any disputes arising from or relating to 
              this Privacy Policy or our data practices will be subject to the exclusive jurisdiction of the 
              courts in Bhubaneswar, Odisha, India.
            </p>

            <p className="text-gray-700 dark:text-gray-300">
              If you are located outside India, please note that you are transferring your information to India. 
              By using our platform, you consent to the transfer of information to India and the application of 
              Indian law to this Privacy Policy.
            </p>
          </motion.section>

          {/* Acknowledgment */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 shadow-sm"
          >
            <div className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-6 rounded-r-lg">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">Your Acknowledgment</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By using our AI Placement Simulator platform, you acknowledge that you have read, understood, 
                and agree to this Privacy Policy. You consent to the collection, use, and disclosure of your 
                information as described in this policy.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you do not agree with any part of this Privacy Policy, please discontinue use of our 
                platform and contact us if you have any questions or concerns.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                <strong>End of Privacy Policy</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                This Privacy Policy was last updated on January 2025. We reserve the right to update this 
                policy at any time. Please review this page periodically for any changes.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Thank you for trusting HireKarma with your privacy!
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

