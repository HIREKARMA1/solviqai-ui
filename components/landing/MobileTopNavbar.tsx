'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AnimatedBackground } from '@/components/ui/animated-background';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MobileTopNavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  className?: string;
}

export function MobileTopNavbar({ onToggleSidebar, isSidebarOpen, className }: MobileTopNavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <motion.nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden',
        'h-16 sm:h-20', // Responsive height for navbar
        'lg:hidden', // Only show on small screens
        scrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
          : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-800/30',
        className
      )}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <AnimatedBackground variant="subtle" showGrid={true} showLines={false} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <div className="relative w-[120px] h-12 sm:w-[160px] sm:h-[64px] transition-transform group-hover:scale-105">
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

          {/* Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'text-gray-700 dark:text-gray-300'
            )}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

