'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { getSimulationsPathForUser } from '@/lib/dashboardNavigation';

interface LandingNavbarProps {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

const primaryBtnClass = cn(
  'inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white',
  'bg-brand-green shadow-[0_4px_14px_rgba(9,136,85,0.35)] transition-all duration-200',
  'hover:bg-brand-green-dark hover:shadow-[0_6px_18px_rgba(9,136,85,0.42)]',
);

const ghostBtnClass = cn(
  'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium',
  'text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
);

const iconBtnClass = cn(
  'inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
  'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
);

export function LandingNavbar({
  className,
}: LandingNavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const syncHash = () => setActiveHash(window.location.hash || '#hero');
    syncHash();

    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', syncHash);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', syncHash);
    };
  }, []);

  const navigationItems = [
    { label: 'Home', href: '/#hero', hash: '#hero' },
    { label: 'Features', href: '/#features', hash: '#features' },
    { label: 'FAQ', href: '/#faq', hash: '#faq' },
    { label: 'Contact', href: '/#contact', hash: '#contact' },
  ];

  const simulationsHref = getSimulationsPathForUser(user?.user_type);

  const isNavActive = (item: (typeof navigationItems)[number]) => {
    if (pathname !== '/') return false;
    if (item.hash === '#hero') {
      return !activeHash || activeHash === '#hero' || activeHash === '';
    }
    return activeHash === item.hash;
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof navigationItems)[number],
  ) => {
    setMobileMenuOpen(false);
    if (pathname !== '/') return;

    e.preventDefault();
    const target = document.querySelector(item.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', item.hash);
      setActiveHash(item.hash);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenuProvider>
      {/* Desktop — reference-style full-width navbar */}
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 hidden transition-all duration-300 lg:block',
          scrolled
            ? 'border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/95'
            : 'border-b border-transparent bg-white dark:bg-gray-950',
          className,
        )}
      >
        <div className="mx-auto flex h-[76px] w-[92%] max-w-[1400px] items-center">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center">
            <div className="relative h-8 w-[108px] transition-transform group-hover:scale-[1.02]">
              <Image
                src={theme === 'dark' ? '/images/solviqdark.png' : '/images/solviqligt.png'}
                alt="SolviQ AI Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Center navigation */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {navigationItems.map((item) => {
              const active = isNavActive(item);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={cn(
                    'group relative px-4 py-2 text-[15px] font-medium transition-colors',
                    active
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                  )}
                >
                  <span
                    className={cn(
                      'absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-blue transition-opacity dark:bg-brand-cyan',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                    )}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={iconBtnClass}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            {!authLoading && (
              <>
                {!user ? (
                  <>
                    <Link href="/auth/login" className={ghostBtnClass}>
                      Sign in
                    </Link>
                    <Link href="/auth/register" className={primaryBtnClass}>
                      Get Started
                    </Link>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className={cn(primaryBtnClass, 'gap-2')}>
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
                      {(user.user_type === 'student' || user.user_type === 'admin') && (
                        <DropdownMenuItem asChild>
                          <Link href={simulationsHref} className="flex cursor-pointer items-center gap-2">
                            Job Prep Simulation
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/${user.user_type}/profile`}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          {t('common.profile') || 'Profile'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={logout}
                        className="flex cursor-pointer items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('common.logout') || 'Logout'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile navbar */}
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 lg:hidden',
          scrolled
            ? 'border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/95'
            : 'border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950',
        )}
      >
        <div className="mx-auto flex h-full w-[92%] max-w-[1400px] items-center justify-between">
          <Link href="/" className="group flex shrink-0 items-center">
            <div className="relative h-7 w-[96px] transition-transform group-hover:scale-[1.02]">
              <Image
                src={theme === 'dark' ? '/images/solviqdark.png' : '/images/solviqligt.png'}
                alt="SolviQ AI Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={iconBtnClass}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={iconBtnClass}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 top-full border-b border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="mx-auto w-[92%] max-w-[1400px] space-y-1 py-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isNavActive(item)
                      ? 'bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900',
                  )}
                >
                  {item.label}
                </Link>
              ))}

              {!authLoading && !user && (
                <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className={cn(ghostBtnClass, 'w-full')}>
                    Sign in
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className={cn(primaryBtnClass, 'w-full')}>
                    Get Started
                  </Link>
                </div>
              )}

              {!authLoading && user && (
                <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  {(user.user_type === 'student' || user.user_type === 'admin') && (
                    <Link href={simulationsHref} onClick={() => setMobileMenuOpen(false)} className={cn(ghostBtnClass, 'w-full')}>
                      Job Prep Simulation
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/${user.user_type}/profile`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(ghostBtnClass, 'w-full gap-2')}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(ghostBtnClass, 'w-full gap-2 text-red-600 dark:text-red-400')}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.header>
    </DropdownMenuProvider>
  );
};
