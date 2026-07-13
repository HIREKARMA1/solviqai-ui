'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  adminSidebarFeatures,
  collegeSidebarFeatures,
  enterpriseSidebarFeatures,
  SidebarItem,
  studentSidebarFeatures,
} from './LandingSidebar';
import { getDashboardFeatureRoute } from '@/lib/dashboardNavigation';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  activeFeature?: string | null;
  onFeatureChange?: (featureId: string | null) => void;
}

export function MobileSidebar({ isOpen, onClose, className, activeFeature, onFeatureChange }: MobileSidebarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Lock body scroll when sidebar is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Get sidebar features based on user type
  const getSidebarFeatures = (): SidebarItem[] => {
    if (!user) return studentSidebarFeatures;

    switch (user.user_type) {
      case 'college':
        return collegeSidebarFeatures;
      case 'enterprise':
        return enterpriseSidebarFeatures;
      case 'admin':
        return adminSidebarFeatures;
      case 'student':
      default:
        return studentSidebarFeatures;
    }
  };

  const getFeatureRoute = (featureId: string): string | null => {
    if (!user) return null;
    return getDashboardFeatureRoute(user.user_type, featureId);
  };

  // Check if we're in dashboard context
  const isDashboardContext = pathname?.startsWith('/dashboard');

  const sidebarFeatures = getSidebarFeatures();
  const features = sidebarFeatures.map(item => ({
    ...item,
    onClick: () => {
      // If user is logged in, navigate to dashboard route
      if (user) {
        const route = getFeatureRoute(item.id);
        if (route) {
          router.push(route);
          onClose(); // Close sidebar after navigation
          return;
        }
      }

      // If in dashboard context but no user/route, do nothing
      if (isDashboardContext) {
        onClose();
        return;
      }

      // For dashboard link when logged out, redirect to login
      if (item.id === 'dashboard') {
        router.push('/auth/login');
        onClose(); // Close sidebar after navigation
        return;
      }

      // On homepage without user, use feature change callback (show inline preview)
      if (onFeatureChange) {
        onFeatureChange(item.id);
        onClose(); // Close sidebar
        return;
      }

      onClose(); // Close sidebar
    },
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 right-0 z-50',
              'w-80 max-w-[85vw] h-full',
              'bg-brand-nav dark:bg-brand-nav-dark backdrop-blur-xl',
              'border-l border-brand-blue/10 dark:border-brand-blue/20',
              'shadow-2xl',
              'lg:hidden', // Only show on mobile
              className
            )}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
              <AnimatedBackground variant="subtle" showGrid={true} showLines={false} />
            </div>

            <div className="flex flex-col h-full relative z-10">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-brand-blue/10 dark:border-brand-blue/20">
                <h2 className="text-lg font-semibold text-brand-blue dark:text-brand-cyan">
                  Menu
                </h2>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10',
                    'text-gray-700 dark:text-gray-300'
                  )}
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-2">
                  {features.map((item) => {
                    // Determine active state
                    let isActive: boolean = false;
                    if (isDashboardContext) {
                      // In dashboard, check if current path matches the feature route
                      if (user) {
                        const route = getFeatureRoute(item.id);
                        if (route) {
                          isActive = pathname === route || (pathname?.startsWith(route + '/') ?? false);
                          if (item.id === 'dashboard') {
                            isActive = pathname === route || pathname === `/dashboard/${user.user_type}`;
                          }
                        }
                      }
                    } else {
                      // On homepage, use activeFeature prop
                      isActive = activeFeature === item.id;
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                          'text-left',
                          'text-gray-700 dark:text-gray-300',
                          'hover:bg-orange-500/5 dark:hover:bg-orange-500/10',
                          'hover:text-orange-500 dark:hover:text-orange-400',
                          isActive && 'bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-l-2 border-orange-500'
                        )}
                      >
                        <div className="flex-shrink-0 transition-transform hover:scale-110">
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

