'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuProvider,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LandingNavbarProps {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function LandingNavbar({
  className,
  onToggleSidebar,
  isSidebarCollapsed,
  onToggleMobileSidebar,
  isMobileSidebarOpen
}: LandingNavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'HOME', href: '/' },
    { label: 'FEATURES', href: '#features' },
    { label: 'INTERNSHIPS', href: '#internships' },
    { label: 'ABOUT', href: '#about' },
    { label: 'CONTACT', href: '#contact' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenuProvider>
      <motion.nav
        className={cn(
          'fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
          'hidden lg:block',
          className
        )}
        style={{
          width: '1168px',
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        {/* Navbar Container with Gradient Border */}
        <div
          className={cn(
            'relative rounded-[24px] h-[72px] px-8',
            'bg-white/80 dark:bg-[#191818]/80 backdrop-blur-xl',
            'transition-all duration-300',
            scrolled && 'shadow-xl'
          )}
          style={{
            border: '1px solid rgba(25, 24, 24, 0.1)',
          }}
        >
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <div className="relative w-[100px] h-8 transition-transform group-hover:scale-105">
                {theme === 'dark' ? (
                  <Image
                    src="/images/solviqdark.png"
                    alt="SolviQ AI Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src="/images/solviqligt.png"
                    alt="SolviQ AI Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                )}
              </div>
            </Link>

            {/* Center Navigation - Desktop */}
            <div className="flex items-center gap-1">
              {navigationItems.map((item, index) => (
                <React.Fragment key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      'text-sm font-medium tracking-wide transition-colors px-5 py-2',
                      'text-gray-700 dark:text-gray-300',
                      'hover:text-primary-600 dark:hover:text-primary-400',
                      'relative group'
                    )}
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all group-hover:w-full" />
                  </Link>

                </React.Fragment>
              ))}
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'text-gray-700 dark:text-gray-300'
                )}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Auth Actions - Desktop */}
              {!authLoading && (
                <>
                  {!user ? (
                    <div className="flex items-center gap-2">
                      <Link href="/auth/login">
                        <button
                          className={cn(
                            'px-5 py-2 rounded-lg transition-colors text-sm font-medium',
                            'text-gray-700 dark:text-gray-300',
                            'hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          Sign in
                        </button>
                      </Link>
                      <Link href="/auth/register">
                        <button
                          className={cn(
                            'px-5 py-2 rounded-lg transition-all text-sm font-medium',
                            'bg-gradient-to-r from-orange-500 to-red-500',
                            'hover:from-orange-600 hover:to-red-600',
                            'text-white shadow-md hover:shadow-lg',
                            'transform hover:scale-105'
                          )}
                        >
                          Get Started
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                            'bg-gradient-to-r from-orange-500 to-red-500',
                            'hover:from-orange-600 hover:to-red-600',
                            'text-white shadow-md hover:shadow-lg'
                          )}
                          aria-label="Profile menu"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Profile</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48"
                        sideOffset={8}
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/${user.user_type}/profile`}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            {t('common.profile') || 'Profile'}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={logout}
                          className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('common.logout') || 'Logout'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navbar - Full width for small screens */}
      <motion.nav
        className={cn(
          'lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          'h-16',
          scrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-800/30'
        )}
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <div className="relative w-[100px] h-8 transition-transform group-hover:scale-105">
                {theme === 'dark' ? (
                  <Image
                    src="/images/solviqdark.png"
                    alt="SolviQ AI Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src="/images/solviqligt.png"
                    alt="SolviQ AI Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                )}
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'text-gray-700 dark:text-gray-300'
                )}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'text-gray-700 dark:text-gray-300'
                )}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'lg:hidden absolute top-full left-0 right-0',
              'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
              'border-b border-gray-200/50 dark:border-gray-800/50',
              'shadow-lg'
            )}
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-2 rounded-lg text-sm font-medium',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'transition-colors'
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth Actions - Mobile */}
              {!authLoading && !user && (
                <div className="pt-2 space-y-2 border-t border-gray-200 dark:border-gray-800">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      className={cn(
                        'w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                        'text-gray-700 dark:text-gray-300',
                        'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      Login
                    </button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <button
                      className={cn(
                        'w-full px-4 py-2 rounded-lg transition-all text-sm font-medium',
                        'bg-gradient-to-r from-orange-500 to-red-500',
                        'hover:from-orange-600 hover:to-red-600',
                        'text-white shadow-md'
                      )}
                    >
                      Get Started
                    </button>
                  </Link>
                </div>
              )}

              {/* Logged in user - Mobile */}
              {!authLoading && user && (
                <div className="pt-2 space-y-2 border-t border-gray-200 dark:border-gray-800">
                  <Link
                    href={`/dashboard/${user.user_type}/profile`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button
                      className={cn(
                        'w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2',
                        'text-gray-700 dark:text-gray-300',
                        'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2',
                      'text-red-600 dark:text-red-400',
                      'hover:bg-red-50 dark:hover:bg-red-900/20'
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>
    </DropdownMenuProvider>
  );
}
