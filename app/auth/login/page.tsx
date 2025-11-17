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
import { Mail, Lock, ArrowRight, MailIcon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/dashboard/${user.user_type}`);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try student login first (default)
      await login(email, password, 'student');
      router.push('/dashboard/student');
    } catch (err: any) {
      // If student login fails, try other user types
      try {
        await login(email, password, 'college');
        router.push('/dashboard/college');
      } catch (err2: any) {
        try {
          await login(email, password, 'admin');
          router.push('/dashboard/admin');
        } catch (err3: any) {
          setError(err3?.response?.data?.detail || 'Invalid credentials. Please try again.');
        }
      }
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
                  {t('auth.login.title')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 dark:text-gray-400 mt-2"
                >
                  {t('auth.login.subtitle')}
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

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {t('auth.login.email')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {t('auth.login.password')}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400"
                    disabled={loading}
                  />
                </motion.div>

                {/* Forgot Password */}
                {/* <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-end"
                >
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </motion.div> */}

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader size="sm" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('auth.login.submit')}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>

                {/* Contact for Account */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center pt-4"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Need an account?{' '}
                    {/* <a
                      href="https://www.hirekarma.in/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <MailIcon className="w-3 h-3" />
                      Contact Us
                    </a> */}
                    <Link
                      href="/auth/register"
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Signup
                    </Link>
                  </p>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
