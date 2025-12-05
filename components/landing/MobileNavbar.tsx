'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { sidebarFeatures, SidebarItem, studentSidebarFeatures, collegeSidebarFeatures, adminSidebarFeatures } from './LandingSidebar';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface MobileNavbarProps {
  activeFeature?: string | null;
  onFeatureChange?: (featureId: string | null) => void;
}

export function MobileNavbar({ activeFeature, onFeatureChange }: MobileNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Get sidebar features based on user type
  const getSidebarFeatures = (): SidebarItem[] => {
    if (!user) return studentSidebarFeatures; // Default to student features when not logged in

    switch (user.user_type) {
      case 'college':
        return collegeSidebarFeatures;
      case 'admin':
        return adminSidebarFeatures;
      case 'student':
      default:
        return studentSidebarFeatures;
    }
  };

  // Map feature IDs to dashboard routes based on user type
  const getFeatureRoute = (featureId: string): string | null => {
    if (!user) return null;
    const baseRoute = `/dashboard/${user.user_type}`;

    // Student routes
    if (user.user_type === 'student') {
      const routeMap: Record<string, string> = {
        'dashboard': baseRoute,
        'career-guidance': `${baseRoute}/career-guidance`,
        'resume': `${baseRoute}/resume`,
        'assessment': `${baseRoute}/assessment`,
        // 'jobs': `${baseRoute}/jobs`,
        // 'auto-apply': `${baseRoute}/auto-apply`,
        'analytics': `${baseRoute}/analytics`,
        'practice': `${baseRoute}/practice`,
      };
      return routeMap[featureId] || null;
    }

    // College routes
    if (user.user_type === 'college') {
      const routeMap: Record<string, string> = {
        'dashboard': `/dashboard/college`,
        'students': `/dashboard/college/students`,
        'analytics': `/dashboard/college/analytics`,
        'profile': `/dashboard/college/profile`,
      };
      return routeMap[featureId] || null;
    }

    // Admin routes
    if (user.user_type === 'admin') {
      const routeMap: Record<string, string> = {
        'dashboard': `/dashboard/admin`,
        'colleges': `/dashboard/admin/colleges`,
        'students': `/dashboard/admin/students`,
        'analytics': `/dashboard/admin/analytics`,
        'profile': `/dashboard/admin/profile`,
      };
      return routeMap[featureId] || null;
    }

    return null;
  };

  // Check if we're in dashboard context
  const isDashboardContext = pathname?.startsWith('/dashboard');

  const sidebarFeatures = getSidebarFeatures();
  const features = sidebarFeatures.map(item => ({
    ...item,
    onClick: () => {
      // If user is logged in, always navigate to dashboard route (regardless of current page)
      if (user) {
        const route = getFeatureRoute(item.id);
        if (route) {
          router.push(route);
          return;
        }
      }

      // If in dashboard context but no user/route, do nothing
      if (isDashboardContext) {
        return;
      }

      // For dashboard link when logged out, redirect to login
      if (item.id === 'dashboard') {
        router.push('/auth/login');
        return;
      }

      // On homepage without user, use feature change callback (show inline preview)
      onFeatureChange?.(item.id);
    },
  }));

  return (
    <motion.nav
      className="lg:hidden fixed top-16 sm:top-20 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-md"
    >
      <div
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="flex items-center justify-start gap-3 px-4 py-3">
          {features.map((item, index) => {
            // Determine active state based on context
            let isActive: boolean = false;
            if (isDashboardContext) {
              // In dashboard, check if current path matches the feature route
              const route = getFeatureRoute(item.id);
              if (route) {
                // For exact matches or nested routes
                isActive = pathname === route || (pathname?.startsWith(route + '/') ?? false);
                // Special case: dashboard route should match exactly or be the base dashboard
                if (item.id === 'dashboard') {
                  isActive = pathname === route || pathname === `/dashboard/${user?.user_type}`;
                }
              }
            } else {
              // On homepage, use activeFeature prop
              isActive = activeFeature === item.id;
            }
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 flex-shrink-0',
                  'min-w-[90px] max-w-[100px]',
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                )}
              >
                <div className={cn(
                  'transition-transform flex items-center justify-center',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  'text-xs font-medium text-center leading-tight',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
