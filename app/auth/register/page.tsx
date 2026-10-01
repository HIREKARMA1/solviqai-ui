'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FieldMessage, RequiredMark } from '@/components/ui/field-message';
import { Loader } from '@/components/ui/loader';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getErrorMessage, sanitizePhoneInput, validatePhone } from '@/lib/utils';
import {
  AUTH_MESSAGES,
  classifyAuthServerError,
  getRegisterErrors,
  hasDisallowedNameChars,
  publicAuthError,
  type AuthField,
} from '@/lib/authValidation';
import { getGuestSessionToken, clearGuestSessionToken } from '@/lib/guestReadiness';
import { User, Mail, Lock, Phone, ArrowRight, Check, X } from 'lucide-react';

const inputClassName =
  'h-[50px] bg-white dark:bg-[#1C2938] border-[#AEAEAE] dark:border-[#757575] rounded-[8px] focus:ring-1 focus:ring-primary-500';

const FIELD_ORDER: AuthField[] = [
  'name',
  'lastName',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'terms',
];

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
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Partial<Record<AuthField, string>>>({});
  const [phoneRejected, setPhoneRejected] = useState(false);
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/dashboard/${user.user_type}`);
    }
  }, [user, authLoading, router]);

  const clientErrors = getRegisterErrors({ ...formData, agreedToTerms });

  const shownError = (field: AuthField): string => {
    if (serverErrors[field]) return serverErrors[field] || '';
    if (field === 'phone' && phoneRejected) {
      return AUTH_MESSAGES.phoneInvalid;
    }

    const message = clientErrors[field];
    if (!message) return '';
    if (submitted || touched[field]) return message;
    if ((field === 'name' || field === 'lastName') && hasDisallowedNameChars(formData[field])) {
      return message;
    }
    if (field === 'phone' && formData.phone.replace(/\D/g, '').length > 15) return message;
    if (field === 'password' && formData.password.length >= 8) return message;
    if (
      field === 'confirmPassword' &&
      formData.confirmPassword.length > 0 &&
      formData.confirmPassword.length >= formData.password.length
    ) {
      return message;
    }
    return '';
  };

  const clearServerError = (field: AuthField) => {
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as AuthField;
    const next = { ...formData, [name]: value };

    if (name === 'phone') {
      const sanitized = sanitizePhoneInput(value);
      const rejectedChars = sanitized !== value;
      next.phone = sanitized;

      setPhoneRejected(rejectedChars && !validatePhone(sanitized));
    }

    setFormData(next);
    setError('');
    clearServerError(field);
    if (field === 'password') clearServerError('confirmPassword');
  };

  const handleBlur = (field: AuthField) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    const errors = getRegisterErrors({ ...formData, agreedToTerms });
    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPhoneRejected(false);
    setLoading(true);

    try {
      const fullName = formData.lastName.trim()
        ? `${formData.name.trim()} ${formData.lastName.trim()}`
        : formData.name.trim();

      await register({
        name: fullName,
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        guest_session_token: getGuestSessionToken() || undefined,
      });

      clearGuestSessionToken();

      router.push('/dashboard/student');
    } catch (err: any) {
      const rawMessage = getErrorMessage(err, 'Registration failed. Please try again.');
      const message = publicAuthError(rawMessage, 'Registration failed. Please try again.');
      const field = classifyAuthServerError(message);

      if (field === 'form') {
        setError(message);
      } else {
        setServerErrors({ [field]: message });
        document.getElementById(field)?.focus();
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-[#0f172a]">
      {/* Navbar */}
      <Navbar />

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
                {t('auth.register.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('auth.register.subtitle')}
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

            {/* Register Form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[20px]">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>
                      {t('auth.register.firstName')}
                      <RequiredMark />
                    </span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John"
                    autoComplete="given-name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    onPaste={() => handleBlur('name')}
                    aria-required="true"
                    aria-invalid={Boolean(shownError('name'))}
                    aria-describedby={shownError('name') ? 'name-error' : undefined}
                    error={Boolean(shownError('name'))}
                    maxLength={255}
                    className={inputClassName}
                    disabled={loading}
                  />
                  <FieldMessage id="name-error" message={shownError('name')} />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-black dark:text-white"
                  >
                    {t('auth.register.lastName')}
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    onPaste={() => handleBlur('lastName')}
                    aria-invalid={Boolean(shownError('lastName'))}
                    aria-describedby={shownError('lastName') ? 'lastName-error' : undefined}
                    error={Boolean(shownError('lastName'))}
                    maxLength={255}
                    className={inputClassName}
                    disabled={loading}
                  />
                  <FieldMessage id="lastName-error" message={shownError('lastName')} />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>
                    {t('auth.register.email')}
                    <RequiredMark />
                  </span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  onPaste={() => handleBlur('email')}
                  aria-required="true"
                  aria-invalid={Boolean(shownError('email'))}
                  aria-describedby={shownError('email') ? 'email-error' : undefined}
                  error={Boolean(shownError('email'))}
                  className={inputClassName}
                  disabled={loading}
                />
                <FieldMessage id="email-error" message={shownError('email')} />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {t('auth.register.phone')}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  onPaste={() => handleBlur('phone')}
                  aria-invalid={Boolean(shownError('phone'))}
                  aria-describedby={shownError('phone') ? 'phone-error' : undefined}
                  error={Boolean(shownError('phone'))}
                  maxLength={20}
                  className={inputClassName}
                  disabled={loading}
                />
                <FieldMessage id="phone-error" message={shownError('phone')} />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {t('auth.register.password')}
                    <RequiredMark />
                  </span>
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  onPaste={() => handleBlur('password')}
                  aria-required="true"
                  aria-invalid={Boolean(shownError('password'))}
                  aria-describedby={shownError('password') ? 'password-error' : undefined}
                  error={Boolean(shownError('password'))}
                  className={inputClassName}
                  disabled={loading}
                />
                <FieldMessage id="password-error" message={shownError('password')} />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-black dark:text-white flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {t('auth.register.confirmPassword')}
                    <RequiredMark />
                  </span>
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  onPaste={() => handleBlur('confirmPassword')}
                  aria-required="true"
                  aria-invalid={Boolean(shownError('confirmPassword'))}
                  aria-describedby={shownError('confirmPassword') ? 'confirmPassword-error' : undefined}
                  error={Boolean(shownError('confirmPassword'))}
                  className={inputClassName}
                  disabled={loading}
                />
                <FieldMessage id="confirmPassword-error" message={shownError('confirmPassword')} />
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={() => setShowTermsModal(true)}
                    onBlur={() => handleBlur('terms')}
                    aria-required="true"
                    aria-invalid={Boolean(shownError('terms'))}
                    aria-describedby={shownError('terms') ? 'terms-error' : undefined}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    disabled={loading}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                    onClick={() => setShowTermsModal(true)}
                  >
                    {t('auth.register.agreeTerms')}{' '}
                    <span className="text-blue-600 dark:text-blue-400 hover:underline">
                      Terms & Conditions
                    </span>
                    <RequiredMark />
                  </label>
                </div>
                <FieldMessage id="terms-error" message={shownError('terms')} />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-[50px] text-base font-medium bg-[#00BAE8] hover:bg-[#009bc2] text-white rounded-[8px] transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t('auth.register.submit')}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-black dark:text-white font-medium">
                  {t('auth.register.haveAccount')}{' '}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {t('auth.register.signIn')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              </div>
            </form>
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
