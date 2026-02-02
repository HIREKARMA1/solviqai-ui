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

    const errors: string[] = [];

    try {
      // Try student login first (default)
      await login(email, password, 'student');
      router.push('/dashboard/student');
      return;
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, '');
      if (errorMsg) errors.push(errorMsg);

      // If student login fails, try other user types
      try {
        await login(email, password, 'college');
        router.push('/dashboard/college');
        return;
      } catch (err2: any) {
        const errorMsg2 = getErrorMessage(err2, '');
        if (errorMsg2) errors.push(errorMsg2);

        try {
          await login(email, password, 'admin');
          router.push('/dashboard/admin');
          return;
        } catch (err3: any) {
          const errorMsg3 = getErrorMessage(err3, '');
          if (errorMsg3) errors.push(errorMsg3);
        }
      }
    } finally {
      setLoading(false);
    }

    // Determine the most relevant error message
    // Prioritize password errors over "user not found" errors
    const passwordError = errors.find(err =>
      err.toLowerCase().includes('password') ||
      err.toLowerCase().includes('incorrect password') ||
      err.toLowerCase().includes('invalid password')
    );

    const alreadyLoggedInError = errors.find(err =>
      err.toLowerCase().includes('already logged in')
    );

    const inactiveError = errors.find(err =>
      err.toLowerCase().includes('inactive')
    );

    // Show the most relevant error
    if (alreadyLoggedInError) {
      setError(alreadyLoggedInError);
    } else if (inactiveError) {
      setError(inactiveError);
    } else if (passwordError) {
      setError(passwordError);
    } else if (errors.length > 0) {
      // Use the first error (most likely to be the correct user type)
      setError(errors[0]);
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  // Don't render if user is logged in (will redirect)
  if (!authLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-[#0f172a]">
      {/* Navbar */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-24 md:pt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[519px]"
        >
          {/* Card Container */}
          <div
            className="w-full bg-white dark:bg-[#1C2938] rounded-lg border border-[#AEAEAE] dark:border-[#757575] p-[24px]"
            style={{
              boxShadow: '2px -2px 4px 0px rgba(0, 0, 0, 0.25), -2px 2px 4px 0px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-6 space-y-2">
              <h1 className="text-[32px] font-semibold text-black dark:text-white leading-[24px] mb-2 font-['Poppins']">
                Welcome back
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Login to your account to continue your journey
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-[50px] bg-white dark:bg-[#1C2938] border-[#AEAEAE] dark:border-[#757575] rounded-[8px] focus:ring-1 focus:ring-primary-500"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-[50px] bg-white dark:bg-[#1C2938] border-[#AEAEAE] dark:border-[#757575] rounded-[8px] focus:ring-1 focus:ring-primary-500"
                  disabled={loading}
                />
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end -mt-2">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-black dark:text-white hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-[50px] text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-[8px] transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Login
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              {/* Signup Link */}
              <div className="text-center">
                <p className="text-sm text-black dark:text-white font-medium">
                  Need an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Signup
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
