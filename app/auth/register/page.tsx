'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getErrorMessage } from '@/lib/utils';
import { User, Mail, Lock, Phone, ArrowRight, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/dashboard/${user.user_type}`);
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const fullName = formData.lastName
        ? `${formData.name} ${formData.lastName}`
        : formData.name;

      await register({
        name: fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      
      router.push('/dashboard/student');
    } catch (err: any) {
      // Extract proper error message
      const errorMessage = getErrorMessage(err, 'Registration failed. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is logged in (will redirect)
  if (!authLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <AnimatedBackground variant="default" showGrid={true} showLines={true} />
      </div>

      {/* Navbar */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-24 md:pt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 shadow-2xl" />
            
            <div className="relative p-8 md:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2"
                >
                  {t('auth.register.title')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 dark:text-gray-400 mt-2"
                >
                  {t('auth.register.subtitle')}
                </motion.p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Fields */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      {t('auth.register.firstName')}
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('auth.register.lastName')}
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {t('auth.register.email')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Phone Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {t('auth.register.phone')}
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {t('auth.register.password')}
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {t('auth.register.confirmPassword')}
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Terms & Conditions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-start gap-3"
                >
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={() => setShowTermsModal(true)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    disabled={loading}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                    onClick={() => setShowTermsModal(true)}
                  >
                    {t('auth.register.agreeTerms')}{' '}
                    <span className="text-primary-600 dark:text-primary-400 hover:underline">
                      Terms & Conditions
                    </span>
                  </label>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading || !agreedToTerms}
                  >
                    {loading ? (
                      <Loader size="sm" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('auth.register.submit')}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>

                {/* Sign In Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center pt-4"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.register.haveAccount')}{' '}
                    <Link
                      href="/auth/login"
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      {t('auth.register.signIn')}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </p>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setShowTermsModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Terms & Conditions
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Please read and accept to continue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-5 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      1. Account Responsibility
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      You are responsible for keeping your account secure and all activities under your account.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      2. Service Usage
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Use our services only for lawful purposes. Do not misuse or harm the platform.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      3. Data Privacy
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We collect and use your data as described in our Privacy Policy to provide better services.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      4. Content Accuracy
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      You must provide accurate information. False information may result in account termination.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      5. Intellectual Property
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      All content on this platform is protected by copyright. Do not copy or distribute without permission.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      6. Service Changes
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We may modify or discontinue services at any time without prior notice.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      7. Limitation of Liability
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We are not liable for any indirect damages arising from use of our services.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      8. Account Termination
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We reserve the right to suspend or terminate accounts that violate these terms.
                    </p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      9. Changes to Terms
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      We may update these terms. Continued use means acceptance of changes.
                    </p>
                  </div>
                  
                  <div className="pb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      10. Contact
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      For questions about these terms, contact us at{' '}
                      <a href="mailto:support@hirekarma.in" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                        support@hirekarma.in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Accept Button */}
            <div className="px-8 py-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <Button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Check className="w-5 h-5 mr-2" />
                Accept Terms & Conditions
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
